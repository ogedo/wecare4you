# WeCare4You — Technical Specification

**Version:** 1.0
**Date:** March 2026
**Status:** Implemented

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Reference](#6-api-reference)
7. [Payments & Payouts](#7-payments--payouts)
8. [Video Sessions](#8-video-sessions)
9. [Real-Time Messaging](#9-real-time-messaging)
10. [Mobile App](#10-mobile-app)
11. [Web App](#11-web-app)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [NDPR Compliance](#13-ndpr-compliance)
14. [Environment Variables](#14-environment-variables)
15. [Local Development Guide](#15-local-development-guide)

---

## 1. System Overview

WeCare4You is a tele mental health platform connecting patients with licensed therapists and volunteer Talk Buddies through video/audio sessions, appointment booking, and asynchronous messaging. The platform operates on a commission model: WeCare4You collects 20% on therapy sessions and 25% on Talk Buddy sessions, with provider payouts handled automatically via Paystack Transfer API.

### User Roles

| Role | Description |
|---|---|
| **Patient** | Discovers providers, books sessions, pays via Paystack, joins video sessions |
| **Therapist** | Licensed professional; sets availability, conducts sessions, receives 80% of session fee |
| **Talk Buddy** | Volunteer peer support; receives 75% of session fee |
| **Admin** | Approves providers, monitors revenue, triggers manual payouts |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌──────────────────┐  ┌───────────────────────────┐   │
│  │  Expo Mobile App  │  │   Next.js Web Portal       │   │
│  │  (iOS + Android)  │  │   (Admin + Providers)      │   │
│  └────────┬─────────┘  └────────────┬──────────────┘   │
└───────────┼──────────────────────────┼───────────────────┘
            │  REST + Socket.io        │  REST
            ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Fastify API (Node.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │ Sessions │ │Payments  │ │  Admin   │   │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└────────────┬──────────────────┬────────────────────────┘
             │                  │
    ┌────────▼────┐    ┌────────▼──────┐
    │ PostgreSQL  │    │     Redis      │
    │     16      │    │   (cache +     │
    │  + Prisma   │    │  Socket.io     │
    └─────────────┘    │   adapter)     │
                        └───────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │           Third-Party APIs             │
    │  Paystack  │  Daily.co  │  Termii      │
    └────────────────────────────────────────┘
```

---

## 2. Monorepo Structure

The project uses **pnpm workspaces** with **Turborepo** for build orchestration.

```
wecare4you/
├── package.json               # Workspace root — pnpm + Turborepo scripts
├── pnpm-workspace.yaml        # Declares apps/* and packages/*
├── turbo.json                 # Turborepo pipeline (build, dev, lint)
├── docker-compose.yml         # Full production stack
├── docker-compose.dev.yml     # Dev: PostgreSQL + Redis only
├── .env.example               # All required environment variables
│
├── apps/
│   ├── api/                   # Fastify backend (port 3001)
│   │   ├── prisma/
│   │   │   ├── schema.prisma  # Database schema (single source of truth)
│   │   │   └── seed.ts        # Initial admin user seed
│   │   └── src/
│   │       ├── index.ts       # App entry — registers plugins, routes, Socket.io
│   │       ├── lib/           # env, prisma, redis, paystack, daily, termii
│   │       ├── plugins/       # Fastify plugins: cors, jwt, cookie, rate-limit, socket
│   │       ├── routes/        # Route registration aggregator
│   │       └── modules/       # auth, users, therapists, buddies, patients,
│   │                          # appointments, sessions, messages, payments, admin
│   │
│   ├── web/                   # Next.js 14 App Router (port 3000)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/         # Login page
│   │       │   ├── admin/          # Dashboard, users, therapists, buddies, reports, payouts
│   │       │   ├── therapist/      # Dashboard, appointments, patients, earnings, bank-setup
│   │       │   ├── buddy/          # Dashboard, sessions, earnings
│   │       │   ├── payment/verify/ # Paystack redirect callback
│   │       │   └── privacy/        # NDPR Privacy Policy
│   │       ├── components/         # AdminSidebar, ProviderSidebar
│   │       └── lib/                # api.ts (axios + token interceptor), store.ts (zustand)
│   │
│   └── mobile/                # Expo SDK 52 + Expo Router
│       ├── app/
│       │   ├── (auth)/        # Phone, OTP, Register, Login
│       │   ├── (patient)/     # Home, Therapists, Buddies, Appointments, Messages, Settings
│       │   ├── (therapist)/   # Home, Schedule, Patients, Earnings, Session
│       │   └── (buddy)/       # Home, Sessions, Earnings, Session
│       └── lib/               # api.ts, store.ts (SecureStore), notifications.ts
│
└── packages/
    ├── types/                 # Shared Zod schemas + TypeScript interfaces
    ├── ui/                    # Shared React components (Button, Input, Card, Badge)
    └── config/                # Shared ESLint, TypeScript, Tailwind configs
```

---

## 3. Tech Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Mobile | React Native + Expo | SDK 52 | Single iOS/Android codebase; Expo managed workflow |
| Mobile routing | Expo Router | 4.x | File-based routing, deep linking |
| Mobile styling | NativeWind | 4.x | Tailwind classes in React Native |
| Web framework | Next.js (App Router) | 14.x | Server Components, SSR, TypeScript-native |
| Web styling | Tailwind CSS | 3.x | Utility-first, consistent with mobile |
| Backend | Fastify | 4.x | Low overhead, schema-validated routes, TypeScript |
| ORM | Prisma | 5.x | Type-safe queries, migrations, Prisma Client |
| Database | PostgreSQL | 16 | ACID, JSON columns, robust indexing |
| Cache / Pub-Sub | Redis (ioredis) | 7 | Session store, rate-limiting, Socket.io adapter |
| Real-time | Socket.io | 4.x | WebSocket with Redis adapter for horizontal scale |
| Video | Daily.co | REST API | Adaptive WebRTC, low-bandwidth modes, African PoPs |
| Auth | JWT + Refresh Tokens | — | Short-lived access (15 min) + long-lived refresh (7 days) |
| OTP / SMS | Termii | — | Nigerian-first SMS gateway, cheapest local rates |
| Payments | Paystack | — | Market leader in Nigeria; cards, bank transfer, USSD |
| File storage | Cloudinary | — | CDN with African PoPs, generous free tier |
| State (web) | Zustand | 4.x | Lightweight, persist middleware for auth |
| State (mobile) | Zustand + SecureStore | — | Encrypted token storage on device |
| Data fetching | TanStack Query | 5.x | Cache, background refetch, optimistic updates |
| Monorepo | Turborepo + pnpm | 1.x / 9.x | Fast, incremental builds; disk-efficient installs |

---

## 4. Database Schema

All monetary values are stored in **kobo** (1 NGN = 100 kobo) to avoid floating-point arithmetic errors.

### Enums

```prisma
enum Role              { PATIENT | THERAPIST | TALK_BUDDY | ADMIN }
enum AppointmentStatus { PENDING | CONFIRMED | CANCELLED | COMPLETED }
enum AppointmentType   { VIDEO | AUDIO }
enum PaymentStatus     { PENDING | COMPLETED | REFUNDED | FAILED }
```

### Core Models

#### User
The central identity record. Phone is the primary identifier; email is optional.

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `phone` | `String` (unique) | Nigerian format: `+234XXXXXXXXXX` |
| `email` | `String?` (unique) | Optional; used for email/password login |
| `passwordHash` | `String?` | bcrypt (12 rounds); null for OTP-only users |
| `role` | `Role` | Enum |
| `isVerified` | `Boolean` | True after OTP verification |
| `isActive` | `Boolean` | Set false on account deletion (NDPR) |
| `paystackRecipientCode` | `String?` | Created via Paystack Transfer Recipient API |
| `bankAccountNumber` | `String?` | 10-digit Nigerian NUBAN |
| `bankCode` | `String?` | Paystack bank code |
| `bvnVerified` | `Boolean` | Reserved for future BVN verification |

#### PatientProfile / TherapistProfile / BuddyProfile
Role-specific extension of User via 1-to-1 relation.

**TherapistProfile** key fields:
- `licenseNumber` / `licenseBody` — e.g., MDCN, ICAN
- `specializations` — `String[]` array (PostgreSQL text array)
- `sessionRate` — integer in kobo
- `isApproved` — toggled by Admin before therapist is publicly listed
- `availability` — `Json` — weekly schedule (`{ Monday: ["09:00","10:00"], ... }`)
- `state` — Nigerian state for geographic filtering

#### Appointment
Links a patient to either a therapist or a buddy (mutually exclusive, enforced at API level).

```
Appointment ──── PatientProfile
             ├── TherapistProfile?
             └── BuddyProfile?
             ├── Session?          (Daily.co room)
             └── Payment?          (Paystack transaction)
```

#### Payment

| Field | Type | Notes |
|---|---|---|
| `paystackReference` | `String` (unique) | Generated as `MC_PAY_{timestamp}_{random}` |
| `amount` | `Int` | Total charged to patient (kobo) |
| `platformFee` | `Int` | WeCare4You commission (kobo) |
| `providerAmount` | `Int` | `amount - platformFee` — sent to provider |
| `paystackTransferId` | `String?` | Populated after Transfer is initiated |
| `payoutSentAt` | `DateTime?` | Set when Transfer webhook confirms |

#### AuditLog
NDPR-required record of data access operations.

| Field | Type |
|---|---|
| `userId` | `String?` |
| `action` | `String` (e.g., `"READ_PROFILE"`) |
| `resource` | `String` (e.g., `"PatientProfile"`) |
| `resourceId` | `String?` |
| `ipAddress` | `String?` |
| `createdAt` | `DateTime` |

---

## 5. Authentication & Authorization

### Phone OTP Flow (Primary)

```
Client                         API                         Termii / Redis
  │                             │                               │
  │── POST /auth/send-otp ─────▶│── generate 6-digit code       │
  │                             │── store in Redis (10 min TTL) │
  │                             │── rate-limit: 3/phone/10min   │
  │                             │── POST /api/sms/send ────────▶│
  │                             │                               │── deliver SMS
  │                             │◀──────────────────────────────│
  │◀── 200 OK ─────────────────│
  │
  │── POST /auth/verify-otp ───▶│── compare code (Redis → DB)
  │                             │── mark OTP used
  │                             │── issue short-lived otpToken (5 min, stored in Redis)
  │◀── { otpToken } ───────────│
  │
  │── POST /auth/register ─────▶│── validate otpToken from Redis
  │   { phone, otpToken, role } │── create User + role profile
  │                             │── issue JWT access token (15 min)
  │                             │── issue JWT refresh token (7 days) → Redis
  │◀── { accessToken }         │── Set-Cookie: refreshToken (httpOnly)
```

### Email / Password Flow (Fallback)

```
POST /auth/login { email, password }
  → lookup User by email
  → bcrypt.compare(password, user.passwordHash)
  → issue tokens (same as above)
```

### Token Architecture

| Token | Storage | Expiry | Transport |
|---|---|---|---|
| Access token | Client memory / localStorage (web) / SecureStore (mobile) | 15 minutes | `Authorization: Bearer` header |
| Refresh token | Redis (`refresh:{userId}` key) | 7 days | `HttpOnly` cookie (web) / SecureStore (mobile) |

**Token rotation:** On each `POST /auth/refresh`, the old refresh token is revoked in Redis and a new one is issued.

### Role-Based Access Control

All protected routes use one of two Fastify preHandlers:

```typescript
// Any authenticated user
authenticate(req, reply)

// Specific roles only
requireRole("ADMIN")
requireRole("THERAPIST")
requireRole("PATIENT", "THERAPIST")  // multiple allowed
```

---

## 6. API Reference

Base URL: `http://localhost:3001` (dev) / `https://api.wecare4you.ng` (prod)

All responses follow:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Human-readable message" }
```

Paginated responses include:
```json
{ "success": true, "data": [...], "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 } }
```

---

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/send-otp` | None | Send 6-digit SMS OTP via Termii |
| `POST` | `/auth/verify-otp` | None | Verify OTP → returns `otpToken` |
| `POST` | `/auth/register` | None | Complete registration with `otpToken` |
| `POST` | `/auth/login` | None | Email + password login |
| `POST` | `/auth/refresh` | Cookie | Rotate refresh token, return new access token |
| `POST` | `/auth/logout` | Bearer | Revoke refresh token |

**POST /auth/send-otp**
```json
// Request
{ "phone": "+2348012345678" }

// Response
{ "success": true, "message": "OTP sent successfully" }
```

**POST /auth/verify-otp**
```json
// Request
{ "phone": "+2348012345678", "code": "483920" }

// Response
{ "success": true, "data": { "otpToken": "otpv_+2348012345678_1741000000_a3b9z" } }
```

**POST /auth/register**
```json
// Request
{
  "phone": "+2348012345678",
  "otpToken": "otpv_...",
  "role": "PATIENT",          // PATIENT | THERAPIST | TALK_BUDDY
  "email": "jane@example.com", // optional
  "password": "SecurePass8!"  // optional
}

// Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": { "id": "clx...", "phone": "+2348012345678", "role": "PATIENT" }
  }
}
```

---

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Bearer | Get own profile including role-specific sub-profile |
| `PATCH` | `/users/me` | Bearer | Update email or password |
| `DELETE` | `/users/me` | Bearer | NDPR data deletion — anonymises PII |

---

### Therapists

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/therapists` | None | List approved therapists. Query: `?state=Lagos&specialization=Anxiety&page=1&limit=20` |
| `GET` | `/therapists/:id` | None | Therapist detail |
| `GET` | `/therapists/:id/availability` | None | Weekly availability schedule |
| `PATCH` | `/therapists/me/profile` | THERAPIST | Update profile (bio, rate, specializations, state) |
| `PUT` | `/therapists/me/availability` | THERAPIST | Replace availability schedule |

**GET /therapists** — Query parameters:

| Param | Type | Example |
|---|---|---|
| `state` | string | `Lagos`, `Abuja`, `Rivers` |
| `specialization` | string | `Anxiety`, `Depression`, `Couples` |
| `page` | number | `1` |
| `limit` | number | `20` (max 50) |

---

### Buddies

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/buddies` | None | List approved Talk Buddies |
| `GET` | `/buddies/:id` | None | Buddy detail |
| `GET` | `/buddies/:id/availability` | None | Availability |
| `PATCH` | `/buddies/me/profile` | TALK_BUDDY | Update profile |
| `PUT` | `/buddies/me/availability` | TALK_BUDDY | Update availability |

---

### Appointments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/appointments` | PATIENT | Book a session |
| `GET` | `/appointments` | Any | List own appointments (role-filtered). Query: `?status=CONFIRMED` |
| `GET` | `/appointments/:id` | Any | Appointment detail |
| `PATCH` | `/appointments/:id/status` | Any | Update status (CONFIRMED / CANCELLED / COMPLETED) |
| `DELETE` | `/appointments/:id` | Any | Cancel appointment |

**POST /appointments**
```json
// Request
{
  "therapistId": "clx_abc123",   // OR
  "buddyId": "clx_def456",       // (one required)
  "scheduledAt": "2026-03-15T10:00:00.000Z",
  "duration": 60,                // minutes: 30 or 60
  "type": "VIDEO"                // VIDEO | AUDIO
}
```

---

### Sessions (Video)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/sessions/:appointmentId/start` | Any | Create Daily.co room (idempotent) |
| `GET` | `/sessions/:appointmentId/token` | Any | Get Daily.co meeting token for caller |
| `PATCH` | `/sessions/:id/end` | Any | End session, mark appointment COMPLETED |

**GET /sessions/:appointmentId/token** — Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",       // Daily.co meeting token
    "roomUrl": "https://your-domain.daily.co/mc_a1b2c3d4_...",
    "roomName": "mc_a1b2c3d4_1741000000",
    "startedAt": "2026-03-15T10:00:12.000Z"
  }
}
```

Providers (`THERAPIST`, `TALK_BUDDY`) receive `is_owner: true` tokens granting meeting control.

---

### Messages

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/conversations` | Any | List own conversations with last message |
| `POST` | `/conversations` | PATIENT | Start conversation with a provider |
| `GET` | `/conversations/:id/messages` | Any | Paginated message history |
| `POST` | `/conversations/:id/messages` | Any | Send a message (also available via Socket.io) |

---

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/initialize` | Bearer | Initialise Paystack transaction → returns payment URL |
| `GET` | `/payments/verify/:reference` | Bearer | Verify after Paystack redirect |
| `POST` | `/payments/webhook` | None* | Paystack webhook (verified by HMAC-SHA512) |
| `POST` | `/payments/payout/:appointmentId` | ADMIN | Trigger Paystack Transfer to provider |
| `GET` | `/payments/banks` | Bearer | List Nigerian banks from Paystack |
| `POST` | `/payments/onboard-bank` | Bearer | Provider adds bank account (resolves account name) |

*Webhook endpoint verifies the `x-paystack-signature` header before processing.

**POST /payments/initialize**
```json
// Request
{ "appointmentId": "clx_xyz789" }

// Response
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "...",
    "reference": "MC_PAY_1741000000_a3b9z",
    "payment": { "id": "...", "amount": 2000000, "platformFee": 400000, "providerAmount": 1600000 }
  }
}
```

**POST /payments/webhook** — Handled events:
- `charge.success` → marks Payment COMPLETED, confirms Appointment
- `transfer.success` → sets `payoutSentAt` on Payment

---

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | ADMIN | Platform KPIs |
| `GET` | `/admin/users` | ADMIN | User list. Query: `?role=THERAPIST` |
| `PATCH` | `/admin/therapists/:id/approve` | ADMIN | Approve therapist → makes them publicly listed |
| `PATCH` | `/admin/buddies/:id/approve` | ADMIN | Approve Talk Buddy |
| `GET` | `/admin/revenue` | ADMIN | Revenue report. Query: `?from=2026-01-01&to=2026-03-31` |
| `GET` | `/admin/payouts` | ADMIN | Payout history |

**GET /admin/stats** — Response:
```json
{
  "totalUsers": 1240,
  "totalPatients": 1100,
  "totalTherapists": 87,
  "totalBuddies": 53,
  "pendingApprovals": 4,
  "todaySessions": 22,
  "totalRevenueKobo": 48500000,
  "totalCommissionKobo": 9200000
}
```

---

## 7. Payments & Payouts

### Commission Calculation

```
therapySessionRate  = TherapistProfile.sessionRate   (kobo)
therapistPayout     = sessionRate × (1 − 0.20)       (80%)
mindCareCommission  = sessionRate × 0.20              (20%)

buddySessionRate    = BuddyProfile.sessionRate        (kobo)
buddyPayout         = sessionRate × (1 − 0.25)        (75%)
mindCareCommission  = sessionRate × 0.25              (25%)
```

Commission rates are configurable via environment variables:
- `THERAPIST_COMMISSION_RATE` (default: `0.20`)
- `BUDDY_COMMISSION_RATE` (default: `0.25`)

### Full Payment Flow

```
1. Patient books appointment  →  Appointment created (PENDING)
2. POST /payments/initialize  →  Paystack transaction created
                                  Payment record created (PENDING)
3. Patient redirected to      →  Paystack Checkout (card / bank transfer / USSD)
   Paystack payment page
4. Paystack redirect callback →  GET /payments/verify/:reference
                                  Payment → COMPLETED
                                  Appointment → CONFIRMED
   [Also]: Paystack webhook    →  POST /payments/webhook (charge.success)
                                  Idempotent: same outcome as redirect
5. Session completes           →  PATCH /sessions/:id/end
                                  Appointment → COMPLETED
6. Admin triggers payout       →  POST /payments/payout/:appointmentId
                                  Paystack Transfer initiated to provider's recipient code
7. Paystack transfer webhook   →  POST /payments/webhook (transfer.success)
                                  Payment.payoutSentAt set
```

### Provider Bank Onboarding

Providers link their Nigerian bank account without exposing their BVN:

```
POST /payments/onboard-bank
{ "accountNumber": "0123456789", "bankCode": "058" }

→ Paystack resolve account: verifies account name
→ Paystack create transfer recipient: returns recipient_code
→ User.paystackRecipientCode saved

Response: { "accountName": "JANE DOE", "recipientCode": "RCP_xyz..." }
```

### Payout Threshold

Minimum payout: **₦5,000** (500,000 kobo). Configurable via `MINIMUM_PAYOUT_KOBO`.

---

## 8. Video Sessions

WeCare4You uses [Daily.co](https://daily.co) for WebRTC video. Daily.co was chosen for its adaptive bitrate streaming, which degrades gracefully on low-bandwidth Nigerian mobile networks.

### Room Lifecycle

```
1. POST /sessions/:appointmentId/start
   → Daily.co API: create private room
   → Room name format: mc_{appointmentId_prefix}_{timestamp}
   → Session record saved in DB

2. GET /sessions/:appointmentId/token   (called by each participant)
   → Daily.co API: create meeting token
   → is_owner: true  for providers (therapist / buddy)
   → is_owner: false for patients
   → Token expiry: appointment duration + 10 min buffer

3. Client joins room
   → Web: Daily.co SDK (@daily-co/daily-js)
   → Mobile: WebView pointing to roomUrl?t={token}

4. PATCH /sessions/:id/end
   → Session.endedAt set
   → Appointment status → COMPLETED
   → Payout flow begins
```

### Daily.co Room Configuration

```json
{
  "privacy": "private",
  "max_participants": 4,
  "enable_screenshare": false,
  "enable_chat": true,
  "start_video_off": false,
  "start_audio_off": false
}
```

---

## 9. Real-Time Messaging

Socket.io with Redis adapter enables horizontal scaling across multiple API instances.

### Connection

```javascript
const socket = io("https://api.wecare4you.ng", {
  auth: { token: accessToken }   // JWT access token
});
```

The server-side middleware verifies the JWT on connection. Unauthenticated connections are rejected.

### Events

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join:conversation` | `conversationId: string` | Subscribe to conversation channel |
| `leave:conversation` | `conversationId: string` | Unsubscribe |
| `message:send` | `{ conversationId, content }` | Send message (saved to DB + broadcast) |
| `message:read` | `{ conversationId, messageId }` | Mark message read |
| `typing:start` | `conversationId: string` | Broadcast typing indicator |
| `typing:stop` | `conversationId: string` | Stop typing indicator |

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `message:new` | `Message` object | New message in subscribed conversation |
| `message:read` | `{ conversationId, messageId }` | Read receipt |
| `typing:start` | `{ userId }` | Another user is typing |
| `typing:stop` | `{ userId }` | Typing stopped |
| `error` | `{ message }` | Server-side error |

### Channel Naming

```
user:{userId}           # Personal notifications
conv:{conversationId}   # Conversation room
```

---

## 10. Mobile App

### Navigation Structure (Expo Router)

```
app/
├── index.tsx                     # Auth gate → redirects based on role
├── _layout.tsx                   # Root: QueryClient, token hydration
│
├── (auth)/
│   ├── phone.tsx                 # Phone number entry
│   ├── otp.tsx                   # 6-digit OTP verification
│   ├── register.tsx              # Role selection + NDPR consent
│   └── login.tsx                 # Email/password fallback
│
├── (patient)/                    # Tab navigator
│   ├── home/index.tsx            # Upcoming sessions + featured providers
│   ├── therapists/
│   │   ├── index.tsx             # Filtered list (state, specialization)
│   │   └── [id].tsx              # Detail + booking + Paystack init
│   ├── buddies/index.tsx         # Talk Buddy list
│   ├── appointments/index.tsx    # All sessions with status
│   ├── session/
│   │   ├── payment.tsx           # Paystack WebView
│   │   └── [appointmentId].tsx   # Daily.co video (WebView)
│   ├── messages/index.tsx        # Conversations + real-time chat
│   └── settings/index.tsx        # Account, NDPR deletion
│
├── (therapist)/                  # Tab navigator
│   ├── home/index.tsx
│   ├── schedule/index.tsx        # Weekly availability grid
│   ├── patients/index.tsx
│   ├── earnings/index.tsx
│   └── session/[appointmentId].tsx
│
└── (buddy)/                      # Tab navigator
    ├── home/index.tsx
    ├── sessions/index.tsx
    ├── earnings/index.tsx
    └── session/[appointmentId].tsx
```

### Token Storage

```typescript
// Write
await SecureStore.setItemAsync("accessToken", token);
await SecureStore.setItemAsync("user", JSON.stringify(user));

// Read (on app start — hydrate() in Zustand store)
const token = await SecureStore.getItemAsync("accessToken");
```

`expo-secure-store` uses the iOS Keychain and Android Keystore — hardware-backed encrypted storage.

### API Client

`lib/api.ts` wraps axios with:
1. Request interceptor — attaches `Authorization: Bearer {token}` from SecureStore
2. Response interceptor — on 401, calls `POST /auth/refresh`, retries original request

### Push Notifications

`lib/notifications.ts` uses `expo-notifications`:
1. Requests permission on first launch
2. Registers Expo push token with backend (`PATCH /users/me`)
3. `setNotificationHandler` ensures alerts show while app is foregrounded

---

## 11. Web App

### Page Map

```
/                              # Landing → links to portals
/(auth)/login                  # Provider + admin login (email/password)
/admin/dashboard               # KPI summary cards
/admin/users                   # All users table
/admin/therapists              # Therapist approvals
/admin/talk-buddies            # Talk Buddy approvals
/admin/reports                 # Revenue with date filter
/admin/payouts                 # Payout management + trigger transfers
/therapist/dashboard           # Upcoming sessions + total earnings
/therapist/appointments        # Full appointment table with confirm action
/therapist/patients            # Unique patient list from completed sessions
/therapist/earnings            # Payout history
/therapist/bank-setup          # Bank account onboarding (Paystack resolve)
/buddy/dashboard
/buddy/sessions
/buddy/earnings
/payment/verify                # Paystack redirect callback
/privacy                       # NDPR Privacy Policy (public)
```

### State Management

```typescript
// Zustand store (persisted to localStorage)
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      logout: () => { set({ accessToken: null, user: null }); localStorage.removeItem("accessToken"); }
    }),
    { name: "wecare4you-auth" }
  )
);
```

### API Client (web)

`src/lib/api.ts` — axios instance with:
- Base URL from `NEXT_PUBLIC_API_URL`
- Request interceptor: reads token from `localStorage`
- Response interceptor: 401 → `POST /auth/refresh` → retry

---

## 12. Infrastructure & Deployment

### Docker Compose (Production)

```yaml
services:
  postgres:   postgres:16-alpine   # port 5432
  redis:      redis:7-alpine       # port 6379
  api:        ./apps/api           # port 3001
  web:        ./apps/web           # port 3000
```

API container runs `prisma migrate deploy` before starting.

### API Dockerfile (multi-stage)

```
Stage 1 (deps):    pnpm install --frozen-lockfile
Stage 2 (builder): tsc compile
Stage 3 (runner):  node dist/index.js (production-only deps)
```

### Web Dockerfile (multi-stage)

```
Stage 1 (deps):    pnpm install
Stage 2 (builder): next build (standalone output)
Stage 3 (runner):  node server.js (Next.js standalone)
```

### GitHub Actions CI

Three jobs run in parallel after `lint-and-typecheck`:

| Job | Trigger | Steps |
|---|---|---|
| `lint-and-typecheck` | All PRs | `tsc --noEmit` for API + Web |
| `test-api` | All PRs | Spin up PG16 + Redis, `db:push`, `db:seed` |
| `build-api` | After lint passes | `tsc` compile |
| `build-web` | After lint passes | `next build` |

### EAS Build (Mobile)

```json
{
  "development": { "developmentClient": true, "distribution": "internal" },
  "preview":     { "distribution": "internal", "android": { "buildType": "apk" } },
  "production":  {}
}
```

---

## 13. NDPR Compliance

The Nigeria Data Protection Regulation (NDPR) and NDPA 2023 requirements are addressed as follows:

| Requirement | Implementation |
|---|---|
| **Consent** | `/(auth)/register` screen displays data usage notice; user must proceed to consent |
| **Lawful basis** | Contractual necessity (service delivery) + explicit consent (marketing SMS) |
| **Right to erasure** | `DELETE /users/me` — anonymises phone (→ `DELETED_{userId}`), email, passwordHash; `isActive = false` |
| **Data minimisation** | Phone is required; all other fields optional |
| **Audit trail** | `AuditLog` table records `userId`, `action`, `resource`, `ipAddress`, `createdAt` |
| **Data security** | TLS in transit; bcrypt passwords; JWT short-lived; Redis refresh token revocation; httpOnly cookies |
| **Message encryption** | `Message.content` stored; field-level encryption recommended for production (AES-256) |
| **Privacy policy** | `/privacy` page (web) covering data controller, rights, third-party processors, retention |
| **Third-party processors** | Paystack (NDPR compliant), Daily.co, Termii, Cloudinary — all listed in Privacy Policy |
| **Data retention** | 5 years after last activity; anonymised stats retained indefinitely |
| **DPO contact** | `dpo@wecare4you.ng` published in Privacy Policy |

---

## 14. Environment Variables

Full reference — copy `.env.example` to `.env` and populate.

```bash
# ─── Database ─────────────────────────────────────────────────
DATABASE_URL="postgresql://wecare4you:wecare4you@localhost:5432/wecare4you_db"

# ─── Redis ────────────────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ─── JWT ──────────────────────────────────────────────────────
JWT_SECRET="<min 32 chars — generate with: openssl rand -hex 32>"
JWT_REFRESH_SECRET="<min 32 chars — different from JWT_SECRET>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# ─── Termii (SMS OTP) ────────────────────────────────────────
TERMII_API_KEY="<from termii.com dashboard>"
TERMII_SENDER_ID="WeCare4You"
TERMII_BASE_URL="https://api.ng.termii.com/api"

# ─── Paystack ─────────────────────────────────────────────────
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_WEBHOOK_SECRET="<set in Paystack dashboard → Webhooks>"

# ─── Daily.co ─────────────────────────────────────────────────
DAILY_API_KEY="<from daily.co dashboard>"
DAILY_DOMAIN="<your-subdomain>.daily.co"

# ─── Cloudinary ───────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# ─── App settings ─────────────────────────────────────────────
NODE_ENV="development"
API_PORT=3001
API_HOST="0.0.0.0"
FRONTEND_URL="http://localhost:3000"

# ─── Business logic ───────────────────────────────────────────
THERAPIST_COMMISSION_RATE=0.20    # 20%
BUDDY_COMMISSION_RATE=0.25        # 25%
MINIMUM_PAYOUT_KOBO=500000        # ₦5,000
```

---

## 15. Local Development Guide

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9: `npm install -g pnpm`
- Docker Desktop

### Steps

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Start PostgreSQL 16 + Redis 7
docker compose -f docker-compose.dev.yml up -d

# 4. Generate Prisma client + run migrations
pnpm --filter @wecare4you/api db:generate
pnpm --filter @wecare4you/api db:migrate

# 5. Seed the database (creates admin user)
pnpm --filter @wecare4you/api db:seed
# Default admin: admin@wecare4you.ng / WeCare4You@2024!

# 6. Start API + Web in parallel (Turborepo)
pnpm dev
# API:  http://localhost:3001
# Web:  http://localhost:3000
# Health check: http://localhost:3001/health

# 7. Start mobile app
cd apps/mobile
cp .env.example .env
npx expo start
# Press 'a' → Android emulator
# Press 'i' → iOS simulator
# Scan QR → Expo Go on physical device
```

### Useful Commands

```bash
# Database
pnpm --filter @wecare4you/api db:studio    # Prisma Studio GUI on :5555
pnpm --filter @wecare4you/api db:push      # Push schema without migration (dev only)

# Code quality
pnpm lint                                # ESLint across all packages
pnpm format                              # Prettier format

# Build validation
pnpm build                               # Build all apps via Turborepo
```

### Verification Checklist

After setup, verify the complete flow:

- [ ] `GET http://localhost:3001/health` returns `{ "status": "ok" }`
- [ ] `POST /auth/send-otp` with a valid Nigerian number sends SMS (or logs in dev)
- [ ] Full OTP → register → JWT flow completes
- [ ] `GET /therapists` returns empty list (no approved therapists yet)
- [ ] Admin login at `http://localhost:3000/auth/login` works
- [ ] Admin dashboard shows correct counts
- [ ] Therapist registration + admin approval flow completes
- [ ] Patient books session → Paystack URL generated
- [ ] Paystack webhook simulation confirms appointment
- [ ] `POST /sessions/:appointmentId/start` creates Daily.co room
- [ ] Both parties can join video session
- [ ] Real-time message sent from patient received by provider (Socket.io)
