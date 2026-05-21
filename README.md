# Messcord - A Discord Clone

A full-featured Discord clone built with Next.js 14, featuring real-time messaging, voice channels with WebRTC, screen sharing, and direct messages.

## Features

- **Text Channels** - Real-time messaging with Socket.io
- **Voice Channels** - WebRTC mesh audio/video calls
- **Screen Share** - Share your screen in voice channels via getDisplayMedia
- **Direct Messages** - Private 1-on-1 conversations
- **Real-time Presence** - See who is online in each server
- **Multiple Servers** - Create and join different servers with their own channels
- **Credentials Auth** - Email/password authentication with NextAuth

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with SQLite (development)
- **Auth**: NextAuth.js (Credentials provider)
- **Real-time**: Socket.io
- **Voice/Video**: WebRTC (peer mesh)

## Quick Start

```bash
git clone <repo-url> && cd messcord
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> `npm install` runs a `postinstall` script that auto-creates `.env` from
> `.env.example` if it does not already exist (so the steps above work on
> Windows, macOS, and Linux without `cp`). You can re-run it manually with
> `npm run setup`. Edit `.env` to set a real `NEXTAUTH_SECRET` before
> deploying anywhere other than your local machine.

## Demo Credentials

| User  | Email           | Password      |
|-------|-----------------|---------------|
| Alice | alice@demo.dev  | password123   |
| Bob   | bob@demo.dev    | password123   |
| Carol | carol@demo.dev  | password123   |

## Manual Testing Guide

1. Open two private/incognito browser windows
2. In window 1, log in as **alice@demo.dev** (password: `password123`)
3. In window 2, log in as **bob@demo.dev** (password: `password123`)
4. Both users join **#general** in the Demo Server
5. Alice sends a message - Bob should receive it in real time without refreshing
6. Both users join the **Lounge** voice channel to test voice chat
7. Click the screen share button to test screen sharing (requires HTTPS in production)

## Architecture Overview

```
+------------------+         +------------------+
|    Browser A     |         |    Browser B     |
|  (Next.js SPA)  |         |  (Next.js SPA)  |
+--------+---------+         +--------+---------+
         |                            |
         |  HTTP / WebSocket          |  HTTP / WebSocket
         |                            |
+--------v----------------------------v---------+
|            server.ts                          |
|   +----------------+  +------------------+   |
|   |   Next.js      |  |   Socket.io      |   |
|   |   (App Router) |  |   (signaling,    |   |
|   |                |  |    presence,      |   |
|   |                |  |    messages)      |   |
|   +-------+--------+  +--------+---------+   |
|           |                     |             |
|           +----------+----------+             |
|                      |                        |
|              +-------v--------+               |
|              |  Prisma ORM    |               |
|              |  (SQLite dev)  |               |
|              +----------------+               |
+-----------------------------------------------+

+------------------+         +------------------+
|    Browser A     |<------->|    Browser B     |
|  (WebRTC peer)   | Direct  |  (WebRTC peer)   |
+------------------+  Mesh   +------------------+
```

Browser <-> HTTP/WS -> server.ts (Next.js + Socket.io) -> Prisma/SQLite

Browser <-> WebRTC (peer mesh) <-> Browser

## Design Decisions and Tradeoffs

- **WebRTC mesh over SFU**: No extra infrastructure needed. Each peer connects directly to every other peer. This eliminates the need for a media server but limits scalability.
- **SQLite for development**: Zero configuration database that works out of the box. Swap to PostgreSQL for production.
- **Signaling auth via NextAuth JWT cookie**: The Socket.io handshake forwards the NextAuth session cookie, so signaling connections are authenticated without a separate auth flow.
- **STUN-only (no TURN)**: Reduces infrastructure requirements. Peers use Google's public STUN servers for NAT traversal. However, peers behind symmetric NAT may fail to connect without a TURN server.

## Known Limitations

- No message edit/delete UI
- No file uploads
- No roles/permissions UI
- WebRTC mesh does not scale past ~6 voice peers
- No TURN server (peers behind symmetric NAT may not connect)

## Docker

Build and run with Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

This is a development convenience. For production, use PostgreSQL and a proper orchestration setup.

See [Production Notes](#production-notes) for deployment guidance.

## Production Notes

- Swap `DATABASE_URL` to a PostgreSQL connection string
- Set a strong, random `NEXTAUTH_SECRET`
- Run behind HTTPS (required for `getUserMedia` and `getDisplayMedia` to work in browsers)
- Consider adding a TURN server for NAT traversal in restrictive network environments
- Use a process manager or container orchestrator for reliability

## License

MIT
