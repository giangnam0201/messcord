# Messcord

A full-featured Discord clone built with Next.js 14, featuring real-time messaging, voice/video chat, screen sharing, and more.

## Features

### Core Communication
- **Real-time messaging** via Pusher (instant delivery, typing indicators)
- **Voice & Video chat** via LiveKit (WebRTC, multi-user rooms)
- **Screen sharing** with high-quality stream support
- **Direct messages** between users
- **Server channels** (text, voice, video)

### Discord-like Features
- **Roles & Permissions** - Full bitfield permission system (Administrator, Manage Server, etc.)
- **Custom Emoji** - Server-specific custom emojis
- **GIF Support** - Integrated Tenor GIF picker
- **Emoji Picker** - Full Unicode emoji support with search
- **Custom Avatars** - Profile pictures and banners
- **User Profiles** - Bio, status, custom status, badges
- **Nitro** - Subscription concept with perks (larger uploads, custom emojis everywhere)
- **Message Reactions** - React to messages with emoji
- **File Attachments** - Upload images and files via UploadThing
- **Message Replies** - Reply to specific messages
- **Rich Embeds** - Link previews and image embeds
- **Member List** - Online/offline status with role badges

### Technical
- **Vercel-ready** - Optimized for serverless deployment
- **PostgreSQL** - Production database (Neon/Supabase/Vercel Postgres)
- **NextAuth.js** - Secure JWT-based authentication
- **Prisma ORM** - Type-safe database access
- **Responsive UI** - Mobile-friendly dark theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js v4 (JWT) |
| Real-time | Pusher |
| Voice/Video | LiveKit |
| File Upload | UploadThing |
| GIFs | Tenor API |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use [Neon](https://neon.tech) free tier)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

Required services (all have free tiers):
- **Database**: [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- **Pusher**: [pusher.com](https://pusher.com) (200k messages/day free)
- **LiveKit**: [livekit.io](https://livekit.io) (free tier available)
- **Tenor**: [Google Tenor API](https://developers.google.com/tenor)

### 3. Set Up Database
```bash
npx prisma db push
npx prisma db seed  # Optional: seed with sample data
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npx vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing |
| `NEXTAUTH_URL` | Yes* | Your app URL (auto-set on Vercel) |
| `NEXT_PUBLIC_PUSHER_APP_KEY` | Yes | Pusher app key |
| `PUSHER_APP_ID` | Yes | Pusher app ID |
| `PUSHER_SECRET` | Yes | Pusher secret |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Yes | Pusher cluster region |
| `LIVEKIT_API_KEY` | For voice | LiveKit API key |
| `LIVEKIT_API_SECRET` | For voice | LiveKit API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | For voice | LiveKit WebSocket URL |
| `NEXT_PUBLIC_TENOR_API_KEY` | For GIFs | Tenor/Google API key |

*`NEXTAUTH_URL` is automatically set by Vercel in production.

## License

MIT

## Contributing

Made with ❤️ by giangnam0201 & kiro-agent
