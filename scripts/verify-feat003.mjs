// FEAT-003 end-to-end verification.
// 1. Login alice + bob via NextAuth credentials provider, capture session cookies.
// 2. Open Socket.io connections for each, channel:join, alice POSTs to HTTP message API.
//    Expect bob's socket to receive message:new for the same channel.
// 3. Both sockets emit voice:join for the Lounge VOICE channel; verify peer-list/peer-joined wiring.
// 4. Open a third socket without any cookie and verify the server disconnects it.

import { io as ioClient } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';

const ORIGIN = process.env.ORIGIN ?? 'http://localhost:3000';
const prisma = new PrismaClient();

function getSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  if (headers.raw) return headers.raw()['set-cookie'] ?? [];
  const v = headers.get('set-cookie');
  return v ? [v] : [];
}

function pickCookie(cookies, name) {
  for (const c of cookies) {
    const head = c.split(';')[0];
    const eq = head.indexOf('=');
    if (eq > 0 && head.slice(0, eq) === name) return head;
  }
  return null;
}

function mergeCookies(...cookies) {
  return cookies.filter(Boolean).join('; ');
}

async function login(email, password) {
  const csrfRes = await fetch(`${ORIGIN}/api/auth/csrf`, { redirect: 'manual' });
  const csrfBody = await csrfRes.json();
  const csrfSet = getSetCookies(csrfRes.headers);
  const csrfCookie = pickCookie(csrfSet, 'next-auth.csrf-token');
  const callbackCookie = pickCookie(csrfSet, 'next-auth.callback-url');

  const body = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
    json: 'true'
  }).toString();
  const loginRes = await fetch(`${ORIGIN}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: mergeCookies(csrfCookie, callbackCookie)
    },
    body
  });
  const loginSet = getSetCookies(loginRes.headers);
  const sessionCookie = pickCookie(loginSet, 'next-auth.session-token');
  if (!sessionCookie) {
    throw new Error(
      `login(${email}) failed: no session-token cookie. status=${loginRes.status}`
    );
  }
  return mergeCookies(csrfCookie, callbackCookie, sessionCookie);
}

function connectSocket(cookie) {
  return new Promise((resolve, reject) => {
    const sock = ioClient(ORIGIN, {
      path: '/socket.io',
      transports: ['websocket'],
      extraHeaders: cookie ? { Cookie: cookie } : {},
      reconnection: false,
      timeout: 5000
    });
    let settled = false;
    sock.on('connect', () => {
      if (settled) return;
      settled = true;
      resolve(sock);
    });
    sock.on('connect_error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    sock.on('disconnect', (reason) => {
      sock.__disconnectReason = reason;
    });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('socket connect timed out'));
      }
    }, 6000);
  });
}

function waitFor(sock, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      sock.off(event, handler);
      reject(new Error(`timed out waiting for ${event}`));
    }, timeout);
    function handler(payload) {
      clearTimeout(t);
      sock.off(event, handler);
      resolve(payload);
    }
    sock.on(event, handler);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('= FEAT-003 verification =');

  const general = await prisma.channel.findFirst({
    where: { name: 'general', server: { name: 'Messcord HQ' } },
    select: { id: true }
  });
  const lounge = await prisma.channel.findFirst({
    where: { name: 'Lounge', server: { name: 'Messcord HQ' } },
    select: { id: true }
  });
  if (!general || !lounge) throw new Error('seed data missing');
  console.log('general channel id:', general.id);
  console.log('Lounge channel id :', lounge.id);

  console.log('\n[1] connecting socket with no cookie (should be rejected)');
  let unauthRejected = false;
  let noCookieSock;
  try {
    noCookieSock = await connectSocket('');
  } catch (err) {
    unauthRejected = true;
    console.log('   no-cookie connect_error:', err.message);
  }
  if (noCookieSock) {
    // Wait briefly for server-side disconnect.
    for (let i = 0; i < 20 && noCookieSock.connected; i++) await sleep(100);
    if (!noCookieSock.connected) unauthRejected = true;
    if (noCookieSock.__disconnectReason) unauthRejected = true;
    if (noCookieSock.connected) noCookieSock.disconnect();
  }
  console.log('   unauthRejected:', unauthRejected);
  if (!unauthRejected) throw new Error('socket without cookie was NOT rejected');

  console.log('\n[2] logging in alice and bob');
  const aliceCookie = await login('alice@demo.dev', 'password123');
  const bobCookie = await login('bob@demo.dev', 'password123');
  console.log('   got both session cookies');

  console.log('\n[3] opening authenticated sockets');
  const aliceSock = await connectSocket(aliceCookie);
  const bobSock = await connectSocket(bobCookie);
  console.log('   alice socket id:', aliceSock.id);
  console.log('   bob   socket id:', bobSock.id);

  console.log('\n[4] both join #general, alice POSTs HTTP, bob expects message:new');
  aliceSock.emit('channel:join', { channelId: general.id });
  bobSock.emit('channel:join', { channelId: general.id });
  await sleep(150);

  const messagePromise = waitFor(bobSock, 'message:new', 5000);
  const httpRes = await fetch(`${ORIGIN}/api/channels/${general.id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: aliceCookie
    },
    body: JSON.stringify({
      content: 'hello from feat-003 verification ' + Date.now()
    })
  });
  if (!httpRes.ok) {
    const txt = await httpRes.text();
    throw new Error('HTTP POST message failed: ' + httpRes.status + ' ' + txt);
  }
  const persisted = (await httpRes.json()).message;
  console.log('   POST persisted message id:', persisted.id);
  const msg = await messagePromise;
  console.log('   bob received message:new id:', msg.id);
  if (msg.id !== persisted.id) throw new Error('bob received unexpected id');
  if (msg.channelId !== general.id) throw new Error('channelId mismatch');

  console.log('\n[5] voice signaling for Lounge');
  const alicePeerListPromise = waitFor(aliceSock, 'voice:peer-list', 4000);
  aliceSock.emit('voice:join', { channelId: lounge.id });
  const aliceList = await alicePeerListPromise;
  console.log('   alice voice:peer-list peers count:', aliceList.peers.length);
  if (aliceList.peers.length !== 0) throw new Error('alice should see 0 peers');

  const bobPeerListPromise = waitFor(bobSock, 'voice:peer-list', 4000);
  const alicePeerJoinedPromise = waitFor(aliceSock, 'voice:peer-joined', 4000);
  bobSock.emit('voice:join', { channelId: lounge.id });
  const bobList = await bobPeerListPromise;
  const alicePeerJoined = await alicePeerJoinedPromise;
  console.log(
    '   bob   voice:peer-list peers:',
    bobList.peers.map((p) => p.socketId)
  );
  console.log('   alice voice:peer-joined socketId:', alicePeerJoined.socketId);
  if (bobList.peers.length !== 1) throw new Error('bob should see 1 peer');
  if (bobList.peers[0].socketId !== aliceSock.id)
    throw new Error('bob peer-list socketId mismatch');
  if (alicePeerJoined.socketId !== bobSock.id)
    throw new Error('alice peer-joined socketId mismatch');

  console.log('\n[6] voice:signal forwarding');
  const bobSignalPromise = waitFor(bobSock, 'voice:signal', 3000);
  aliceSock.emit('voice:signal', {
    to: bobSock.id,
    description: { type: 'offer', sdp: 'v=0' }
  });
  const sig = await bobSignalPromise;
  console.log(
    '   bob received voice:signal from:',
    sig.from,
    'descType:',
    sig.description?.type
  );
  if (sig.from !== aliceSock.id) throw new Error('signal forwarding mismatch');

  console.log('\n[7] disconnect cleanup -> voice:peer-left');
  const peerLeftPromise = waitFor(bobSock, 'voice:peer-left', 4000);
  aliceSock.disconnect();
  const left = await peerLeftPromise;
  console.log('   bob received voice:peer-left socketId:', left.socketId);
  if (left.socketId !== aliceSock.id) throw new Error('peer-left mismatch');

  bobSock.disconnect();
  await prisma.$disconnect();
  console.log('\n== ALL CHECKS PASSED ==');
}

main().catch(async (err) => {
  console.error('VERIFICATION FAILED:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
