'use client';

import type { Socket } from 'socket.io-client';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' }
];

export type RemoteStreamHandler = (peer: {
  socketId: string;
  userId: string;
  stream: MediaStream;
}) => void;

export type PeerLeftHandler = (peer: { socketId: string }) => void;

type PeerEntry = {
  pc: RTCPeerConnection;
  userId: string;
  // The video sender slot is created up front so that screen-share replaceTrack
  // works without renegotiation.
  videoSender: RTCRtpSender;
  remoteStream: MediaStream;
};

type PeerListPayload = {
  channelId: string;
  peers: { userId: string; socketId: string }[];
};

type PeerJoinedPayload = {
  channelId: string;
  userId: string;
  socketId: string;
};

type PeerLeftPayload = {
  channelId: string;
  userId: string;
  socketId: string;
};

type SignalPayload = {
  from: string;
  fromUserId?: string;
  description?: RTCSessionDescriptionInit | null;
  candidate?: RTCIceCandidateInit | null;
};

/**
 * Full-mesh WebRTC client backed by Socket.io signaling.
 *
 * Each remote peer in the same voice channel becomes one RTCPeerConnection.
 * The local audio track from `localStream` is shared with every peer.
 * `replaceVideoTrack(track)` swaps the outbound video track on every peer
 * connection; pass `null` to remove screen-share.
 */
export class MeshClient {
  private readonly socket: Socket;
  private readonly channelId: string;
  private readonly localStream: MediaStream;
  private readonly onRemoteStream: RemoteStreamHandler;
  private readonly onPeerLeft: PeerLeftHandler;
  private readonly peers = new Map<string, PeerEntry>();
  private currentVideoTrack: MediaStreamTrack | null = null;
  private started = false;

  constructor(
    socket: Socket,
    channelId: string,
    localStream: MediaStream,
    onRemoteStream: RemoteStreamHandler,
    onPeerLeft: PeerLeftHandler
  ) {
    this.socket = socket;
    this.channelId = channelId;
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
    this.onPeerLeft = onPeerLeft;
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.socket.on('voice:peer-list', this.handlePeerList);
    this.socket.on('voice:peer-joined', this.handlePeerJoined);
    this.socket.on('voice:peer-left', this.handlePeerLeft);
    this.socket.on('voice:signal', this.handleSignal);

    this.socket.emit('voice:join', { channelId: this.channelId });
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;

    this.socket.off('voice:peer-list', this.handlePeerList);
    this.socket.off('voice:peer-joined', this.handlePeerJoined);
    this.socket.off('voice:peer-left', this.handlePeerLeft);
    this.socket.off('voice:signal', this.handleSignal);

    for (const [, entry] of this.peers) {
      entry.pc.close();
    }
    this.peers.clear();

    this.socket.emit('voice:leave', { channelId: this.channelId });
  }

  /**
   * Replace the outbound video track on every peer connection. Pass `null` to
   * stop sending video (e.g. when toggling screen-share off).
   */
  replaceVideoTrack(track: MediaStreamTrack | null): void {
    this.currentVideoTrack = track;
    for (const [, entry] of this.peers) {
      // eslint-disable-next-line no-console
      console.debug('replacetrack', track ? track.kind : 'null');
      void entry.videoSender.replaceTrack(track);
    }
  }

  private createPeer(socketId: string, userId: string): PeerEntry {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local audio tracks.
    for (const track of this.localStream.getAudioTracks()) {
      pc.addTrack(track, this.localStream);
    }

    // Pre-create a video sender so we can swap screen share in/out cheaply.
    const videoSender = pc.addTransceiver('video', { direction: 'sendrecv' })
      .sender;
    if (this.currentVideoTrack) {
      void videoSender.replaceTrack(this.currentVideoTrack);
    }

    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
      this.onRemoteStream({ socketId, userId, stream: remoteStream });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('voice:signal', {
          to: socketId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    const entry: PeerEntry = { pc, userId, videoSender, remoteStream };
    this.peers.set(socketId, entry);
    return entry;
  }

  private handlePeerList = (payload: PeerListPayload): void => {
    if (payload.channelId !== this.channelId) return;
    for (const peer of payload.peers) {
      void this.initiatePeer(peer.socketId, peer.userId);
    }
  };

  private handlePeerJoined = (payload: PeerJoinedPayload): void => {
    if (payload.channelId !== this.channelId) return;
    if (this.peers.has(payload.socketId)) return;
    // We just create the peer entry and wait for the offer from the joiner.
    this.createPeer(payload.socketId, payload.userId);
  };

  private handlePeerLeft = (payload: PeerLeftPayload): void => {
    if (payload.channelId !== this.channelId) return;
    const entry = this.peers.get(payload.socketId);
    if (entry) {
      entry.pc.close();
      this.peers.delete(payload.socketId);
    }
    this.onPeerLeft({ socketId: payload.socketId });
  };

  private handleSignal = async (payload: SignalPayload): Promise<void> => {
    const { from, description, candidate } = payload;
    let entry = this.peers.get(from);
    if (!entry) {
      entry = this.createPeer(from, payload.fromUserId ?? '');
    }

    try {
      if (description) {
        await entry.pc.setRemoteDescription(description);
        if (description.type === 'offer') {
          const answer = await entry.pc.createAnswer();
          await entry.pc.setLocalDescription(answer);
          this.socket.emit('voice:signal', {
            to: from,
            description: entry.pc.localDescription
          });
        }
      } else if (candidate) {
        await entry.pc.addIceCandidate(candidate);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('voice:signal handling failed', err);
    }
  };

  private async initiatePeer(socketId: string, userId: string): Promise<void> {
    const entry = this.createPeer(socketId, userId);
    try {
      const offer = await entry.pc.createOffer();
      await entry.pc.setLocalDescription(offer);
      this.socket.emit('voice:signal', {
        to: socketId,
        description: entry.pc.localDescription
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('createOffer failed', err);
    }
  }
}
