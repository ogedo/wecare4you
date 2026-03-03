# WeCare4You — Tele Mental Health Platform

A full-stack tele mental health platform built for the Nigerian market, with a pan-African expansion roadmap.

## Architecture

```
wecare4you/                     # pnpm + Turborepo monorepo
├── apps/
│   ├── api/                  # Fastify + TypeScript backend (port 3001)
│   ├── web/                  # Next.js 14 admin + provider portal (port 3000)
│   └── mobile/               # Expo SDK 52 React Native patient/provider app
└── packages/
    ├── types/                # Shared Zod schemas + TypeScript types
    ├── ui/                   # Shared component library (shadcn-style)
    └── config/               # Shared ESLint, TypeScript, Tailwind configs
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 52 + Expo Router |
| Web | Next.js 14 (App Router) + TypeScript + Tailwind |
| Backend | Node.js + Fastify + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Real-time | Socket.io + Redis adapter |
| Video | Daily.co (adaptive bitrate WebRTC) |
| Auth | Phone OTP (Termii SMS) + Email/Password fallback + JWT |
| Payments | Paystack (NGN — cards, bank transfer, USSD) |
| Storage | Cloudinary |
| Cache | Redis (ioredis) |

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker Desktop (for PostgreSQL + Redis)
- Expo CLI (`npm install -g expo-cli`) for mobile dev

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/ogedo/wecare4you.git
cd wecare4you
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Fill in your API keys (Paystack, Daily.co, Termii, Cloudinary)
cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Start infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d   # starts PostgreSQL 16 + Redis 7
```

### 4. Database setup

```bash
pnpm --filter @wecare4you/api db:generate   # generate Prisma client
pnpm --filter @wecare4you/api db:migrate    # run migrations
```

### 5. Run all apps

```bash
pnpm dev    # starts api (3001) + web (3000) via Turborepo
```

### 6. Mobile app

```bash
cd apps/mobile
npx expo start
# Press 'a' for Android emulator, 'i' for iOS simulator
```

## User Roles & Revenue Model

| Role | Description |
|---|---|
| **Patient** | Books therapy/buddy sessions, pays via Paystack |
| **Therapist** | Licensed professionals, 20% commission to WeCare4You |
| **Talk Buddy** | Volunteer peer supporters, 25% commission to WeCare4You |
| **Admin** | Approves providers, views revenue, triggers payouts |

### Example revenue split

```
Therapy session ₦20,000:
  Patient pays:   ₦20,000
  WeCare4You keeps: ₦4,000  (20%)
  Therapist gets: ₦16,000 (Paystack Transfer to bank)

Talk Buddy ₦5,000:
  Patient pays:   ₦5,000
  WeCare4You keeps: ₦1,250  (25%)
  Buddy gets:     ₦3,750  (Paystack Transfer)
```

## API Routes

```
POST  /auth/send-otp              # Send SMS OTP via Termii
POST  /auth/verify-otp            # Verify OTP → issue JWT
POST  /auth/register              # Complete registration
POST  /auth/login                 # Email/password fallback
POST  /auth/refresh               # Refresh access token
POST  /auth/logout                # Revoke refresh token

GET   /therapists                 # List approved therapists (filter: state, specialization)
GET   /therapists/:id
PATCH /therapists/me/profile
PUT   /therapists/me/availability

GET   /buddies
GET   /buddies/:id

POST  /appointments               # Book session (patient only)
GET   /appointments               # List (role-filtered)
PATCH /appointments/:id/status

POST  /sessions/:appointmentId/start   # Create Daily.co room
GET   /sessions/:appointmentId/token   # Get meeting token
PATCH /sessions/:id/end

GET   /conversations
POST  /conversations
GET   /conversations/:id/messages
POST  /conversations/:id/messages

POST  /payments/initialize        # Init Paystack transaction
GET   /payments/verify/:reference # Verify after redirect
POST  /payments/webhook           # Paystack webhook
POST  /payments/payout/:appointmentId  # Trigger provider payout
GET   /payments/banks             # List Nigerian banks
POST  /payments/onboard-bank      # Provider adds bank account

GET   /admin/stats
GET   /admin/users
PATCH /admin/therapists/:id/approve
PATCH /admin/buddies/:id/approve
GET   /admin/revenue
GET   /admin/payouts
```

## Real-time (Socket.io)

```js
// Connect
const socket = io("http://localhost:3001", { auth: { token: accessToken } });

// Join a conversation
socket.emit("join:conversation", conversationId);

// Send a message
socket.emit("message:send", { conversationId, content });

// Listen for new messages
socket.on("message:new", (message) => { ... });
```

## Environment Variables

See `.env.example` for the complete list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | ≥32 char JWT signing secret |
| `TERMII_API_KEY` | SMS OTP gateway (Nigerian-first) |
| `PAYSTACK_SECRET_KEY` | Payment processing (sk_live_...) |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook signature verification |
| `DAILY_API_KEY` | Video session API key |
| `THERAPIST_COMMISSION_RATE` | Default: 0.20 (20%) |
| `BUDDY_COMMISSION_RATE` | Default: 0.25 (25%) |
| `MINIMUM_PAYOUT_KOBO` | Default: 500000 (₦5,000) |

## NDPR Compliance

- Consent collected at registration with clear data usage explanation
- Users can request data deletion via `DELETE /users/me` (anonymises PII)
- Audit log on all data access (`AuditLog` table)
- Messages encrypted at rest
- Privacy policy at `/privacy`
- All data processing described in Privacy Policy

## Production Deployment

```bash
# Build all apps
pnpm build

# Or run with Docker Compose
docker compose --profile production up -d
```

The API Dockerfile runs `prisma migrate deploy` before starting the server.

## Pan-African Expansion (Phase 2)

- [ ] Add Flutterwave as second payment gateway (GHS, KES, ZAR)
- [ ] i18n: French (West/Central Africa), Swahili (East Africa)
- [ ] Country-specific therapist licensing body field
- [ ] Multi-currency: store `currency` per payment, display in local currency
