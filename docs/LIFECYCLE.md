# WeCare4You — Platform Lifecycle Guide

End-to-end journey for every actor: from onboarding through session delivery to payout.

---

## Actors

| Actor | Primary Interface | Role |
|---|---|---|
| **Patient** | Mobile app (Expo) | Books and attends sessions |
| **Therapist** | Web portal + Mobile | Delivers licensed therapy sessions |
| **Talk Buddy** | Web portal + Mobile | Delivers peer support sessions |
| **Admin** | Web portal | Approves providers, monitors platform, triggers payouts |

---

## Actor 1 — Patient

### 1. Onboarding
1. Downloads the WeCare4You mobile app (iOS / Android)
2. Enters phone number → OTP sent via **Termii**
3. Enters 6-digit OTP → `POST /auth/verify-otp` → receives `otpToken`
4. Completes registration → `POST /auth/register` → patient profile created automatically
5. `wc4y_session` cookie + JWT access token issued

### 2. Discovery
1. Opens **Therapists** tab → `GET /therapists` → browse list with name, state, specializations, rate
2. Taps a card → detail screen: bio, license info, specialization chips, session rate
3. Or opens **Talk Buddies** tab → `GET /buddies` → same browse/detail flow (no license info)

### 3. Booking
1. Taps **Book a Session** on a therapist/buddy detail screen
2. Selects:
   - **Date & time slot** (next 14 days)
   - **Duration** — 30, 60, or 90 minutes
   - **Type** — Video or Audio
3. Taps **Book & Pay ₦X** → `POST /appointments`
4. Appointment created with status `PENDING`

### 4. Payment
1. App initialises payment → `POST /payments/initialize`
2. Paystack `authorizationUrl` returned → Paystack WebView opens in-app
3. Patient pays via card / bank transfer / USSD
4. Paystack sends `charge.success` webhook → `POST /payments/webhook`
5. Payment record → `COMPLETED`; appointment → `CONFIRMED`

### 5. Session
1. At scheduled time → **Appointments** screen shows **Join Session** button
2. Taps **Join Session** → `GET /sessions/:appointmentId/token` → Daily.co token obtained
3. Daily.co video/audio room opens in-app (WebRTC, adaptive bitrate)
4. Session ends when provider clicks End Session
5. Appointment → `COMPLETED`

### 6. Messaging
- **Messages** tab → real-time chat with provider via Socket.io
- `GET /conversations` → conversation list
- `POST /conversations/:id/messages` → send message
- `message:new` socket event → incoming messages pushed in real time

### 7. History
- All past appointments visible in **Appointments** tab with status badges
- `PENDING` → Pay Now button (if payment not yet completed)
- `CONFIRMED` → Join Session button
- `COMPLETED` / `CANCELLED` → read-only record

---

## Actor 2 — Therapist

### 1. Registration (Web)
1. Visits `wecare4you.ng` → clicks **Join as Provider** → `/register`
2. **Step 1 — Phone:** enters phone number → `POST /auth/send-otp` → OTP via Termii
3. **Step 2 — OTP:** enters 6-digit code → `POST /auth/verify-otp` → `otpToken` received
4. **Step 3 — Credentials:** selects role **Therapist**, enters email + password
5. `POST /auth/register` → account created, `wc4y_session` cookie set
6. Redirected to `/onboarding`

### 2. Profile Setup (`/onboarding`)
| Field | Description |
|---|---|
| License number | e.g. `MDCN/2024/12345` |
| License body | MDCN, ICAN, APA, NIMHP, CCPA |
| Specializations | Multi-select chips: Anxiety, Depression, Trauma, etc. |
| Bio | Free-text description of approach and experience |
| Session rate | Amount in ₦ (stored internally in kobo) |
| State | Nigerian state of practice |

- Submits → `PATCH /therapists/me/profile`
- Redirected to `/therapist/dashboard` (pending approval)

### 3. Admin Approval
- Account is **not visible to patients** until approved
- Admin reviews profile → `PATCH /admin/therapists/:id/approve`
- Therapist now appears in patient search

### 4. Appointment Management (`/therapist/appointments`)
| Status | Action available |
|---|---|
| `PENDING` | Click **Confirm** → `PATCH /appointments/:id/status` → `CONFIRMED` |
| `CONFIRMED` | Click **Join Session** → navigate to session page |
| `COMPLETED` | Read-only |
| `CANCELLED` | Read-only |

### 5. Session Delivery (`/therapist/session/:appointmentId`)
1. Clicks **Join Session** on a confirmed appointment row
2. `POST /sessions/:appointmentId/start` → Daily.co room created
3. `GET /sessions/:appointmentId/token` → meeting token issued (therapist is room owner)
4. Daily.co iframe loads with camera + microphone access
5. Conducts session
6. Clicks **End Session** → `PATCH /sessions/:id/end`
   - `endedAt` recorded on session
   - Appointment → `COMPLETED`
   - Daily.co room deleted (`DELETE /rooms/:name`)

### 6. Messaging (`/therapist/messages`)
- ConversationView component: left panel (conversation list) + right panel (message thread)
- Real-time via Socket.io — new messages pushed without polling
- `POST /conversations/:id/messages` to send; `message:new` event to receive

### 7. Bank Setup (`/therapist/bank-setup`)
1. Enters **account number** + selects **bank** from `GET /payments/banks`
2. Account name resolved → `POST /payments/banks/resolve`
3. Paystack Transfer recipient created → `POST /payments/onboard-bank`
4. `paystackRecipientCode` stored on user record — required before payout

### 8. Payout
- Admin triggers `POST /payments/:appointmentId/payout`
- Paystack Transfer API sends NGN to therapist's registered bank account
- **Take-home: 80%** of session rate (platform keeps 20%)
- Minimum payout threshold: **₦5,000**
- `payoutSentAt` recorded; `transfer.success` webhook confirms delivery

---

## Actor 3 — Talk Buddy

Flow is identical to Therapist with the following differences:

| | Therapist | Talk Buddy |
|---|---|---|
| Registration role | `THERAPIST` | `TALK_BUDDY` |
| License fields | Required | Not required |
| Commission rate | 20% to platform | 25% to platform |
| Take-home | **80%** | **75%** |
| Web portal prefix | `/therapist/*` | `/buddy/*` |
| Session join (web) | `/therapist/session/:id` | `/buddy/session/:id` |
| Earnings screen | `/therapist/earnings` | `/buddy/earnings` |

---

## Actor 4 — Admin

### 1. Login
- `admin@wecare4you.ng` → `/login` → redirected to `/admin/dashboard`
- Dashboard metrics: total users, therapists, buddies, patients, today's sessions, total revenue, total commission

### 2. Provider Approvals
- **`/admin/therapists`** — lists all therapist profiles with approval status
- **`/admin/talk-buddies`** — lists all buddy profiles
- Click **Approve** → `PATCH /admin/therapists/:id/approve` or `PATCH /admin/buddies/:id/approve`
- Provider becomes visible in patient search immediately

### 3. User Management (`/admin/users`)
- Full user list: ID, phone, email, role, registration date
- NDPR-compliant: `DELETE /users/me` anonymises PII on request

### 4. Revenue & Reports (`/admin/reports`)
- Total session value transacted
- Platform commission earned (20% therapy / 25% buddy)
- Outstanding provider balances pending payout

### 5. Payout Management (`/admin/payouts`)
1. Reviews completed sessions with `payoutSentAt = null`
2. Verifies provider has bank account set up (`paystackRecipientCode` present)
3. Clicks **Trigger Payout** → `POST /payments/:appointmentId/payout`
4. Paystack Transfer API executes → funds leave platform wallet
5. `transfer.success` webhook received → `payoutSentAt` stamped on payment record

---

## Status State Machine

### Appointment
```
PENDING ──(payment completes)──► CONFIRMED ──(session ends)──► COMPLETED
   │                                  │
   └──(patient/provider cancels)──► CANCELLED
```

### Payment
```
PENDING ──(Paystack webhook: charge.success)──► COMPLETED
```

### Session
```
(created on POST /sessions/:id/start)
startedAt set ──────────────────────────► endedAt set  (PATCH /sessions/:id/end)
                                               │
                                        Daily.co room deleted
```

### Payout
```
payoutSentAt = null ──(admin triggers)──► Paystack transfer initiated
                                               │
                                     transfer.success webhook
                                               │
                                       payoutSentAt = timestamp
```

---

## Money Flow

```
Patient pays session rate (e.g. ₦20,000)
          │
          ├── Therapist: ₦16,000  (80%)
          │   Buddy:     ₦15,000  (75%)
          │
          └── Platform:  ₦4,000   (20% therapy)
                         ₦5,000   (25% buddy)
```

### Payout conditions (all must be true)
| Condition | Check |
|---|---|
| Payment completed | `payment.status = COMPLETED` |
| Session delivered | `session.endedAt IS NOT NULL` |
| Bank account set up | `user.paystackRecipientCode IS NOT NULL` |
| Minimum amount met | `providerAmount ≥ 500,000 kobo (₦5,000)` |
| Not already paid | `payment.payoutSentAt IS NULL` |

---

## API Reference Summary

| Action | Endpoint |
|---|---|
| Send OTP | `POST /auth/send-otp` |
| Verify OTP | `POST /auth/verify-otp` |
| Register | `POST /auth/register` |
| Login | `POST /auth/login` |
| Logout | `POST /auth/logout` |
| List therapists | `GET /therapists` |
| List buddies | `GET /buddies` |
| Update therapist profile | `PATCH /therapists/me/profile` |
| Update buddy profile | `PATCH /buddies/me/profile` |
| Create appointment | `POST /appointments` |
| Update appointment status | `PATCH /appointments/:id/status` |
| Cancel appointment | `DELETE /appointments/:id` |
| Initialise payment | `POST /payments/initialize` |
| Verify payment | `GET /payments/verify/:reference` |
| Paystack webhook | `POST /payments/webhook` |
| Set up bank account | `POST /payments/onboard-bank` |
| Trigger payout | `POST /payments/:appointmentId/payout` |
| Start session | `POST /sessions/:appointmentId/start` |
| Get session token | `GET /sessions/:appointmentId/token` |
| End session | `PATCH /sessions/:id/end` |
| List conversations | `GET /conversations` |
| Send message | `POST /conversations/:id/messages` |
| Approve therapist | `PATCH /admin/therapists/:id/approve` |
| Approve buddy | `PATCH /admin/buddies/:id/approve` |
| Admin stats | `GET /admin/stats` |
| Admin payouts | `GET /admin/payouts` |
| Trigger payout (admin) | `POST /payments/:appointmentId/payout` |
