# WeCare4You — Product Overview

## What is WeCare4You?

WeCare4You is a tele mental health platform designed for the African market, launching first in Nigeria. It connects patients with licensed therapists and volunteer Talk Buddies through video and audio sessions, enabling access to mental health support from the comfort of any smartphone.

Mental health services in Nigeria are underserved — fewer than 1 psychiatrist per 100,000 people, compounded by stigma, geography, and cost. WeCare4You lowers these barriers by bringing care online, using familiar payment methods like bank transfer and USSD, and adopting UX language that reduces stigma ("Talk to someone" instead of "See a therapist").

---

## Who Is WeCare4You For?

### Patients
Individuals seeking mental health support. They can browse therapists or Talk Buddies, book sessions, pay securely via Paystack, and join video or audio calls — all from their phone.

### Therapists
Licensed mental health professionals (psychologists, counsellors, psychiatrists) who want to offer remote sessions. They set their own rates, manage their availability, receive patient bookings, and get paid automatically after each session.

### Talk Buddies
Trained volunteer listeners who offer lower-cost, non-clinical peer support sessions. Ideal for patients who are not yet ready for formal therapy, or who need more frequent, affordable check-ins.

### Admins
WeCare4You staff who review and approve therapist and Talk Buddy applications, monitor platform activity, manage users, and view revenue and payout reports.

---

## Core Features

### For Patients
- **Phone OTP onboarding** — Sign up with your Nigerian phone number; no email required
- **Browse providers** — Filter therapists by state, specialization, and price; filter Talk Buddies by availability
- **Book sessions** — Pick a date and time slot, choose video or audio, select session length
- **Pay securely** — Paystack integration supports debit cards, bank transfer, and USSD (*737#, *901#)
- **Join video/audio sessions** — Low-bandwidth adaptive video via Daily.co; works on 3G networks
- **Secure messaging** — Chat with your provider between sessions
- **Appointment history** — View past and upcoming sessions

### For Therapists & Talk Buddies
- **Profile & onboarding** — License details (therapists), bio, specializations, rate setting
- **Bank account setup** — BVN-adjacent account verification via Paystack; verified account name displayed for confirmation
- **Availability management** — Set weekly recurring schedules
- **Session management** — View patient queue, join sessions, review past appointments
- **Earnings dashboard** — Track completed sessions, pending payouts, payout history

### For Admins
- **Dashboard KPIs** — Daily sessions, total revenue, WeCare4You commission earned, active user count
- **User management** — Search, view, and deactivate users
- **Provider approvals** — Review and approve therapist and Talk Buddy applications before they go live
- **Revenue reports** — Session-by-session breakdown of fees and commissions
- **Payout management** — Monitor and trigger provider payouts

---

## How Payments Work

All payments are processed in Nigerian Naira (₦) via **Paystack**, Nigeria's leading payment gateway.

### Patient Payment Flow
1. Patient books a session and is redirected to a Paystack payment page
2. Patient pays using their preferred method (card, bank transfer, USSD)
3. Paystack confirms payment via webhook
4. Appointment is confirmed; the session room is created
5. Provider receives their share automatically after the session ends

### Revenue Split

| Session Type | Example Rate | WeCare4You Keeps | Provider Receives |
|---|---|---|---|
| Therapist session | ₦20,000 | ₦4,000 (20%) | ₦16,000 (80%) |
| Talk Buddy session | ₦5,000 | ₦1,250 (25%) | ₦3,750 (75%) |

Provider payouts are sent directly to their Nigerian bank account via **Paystack Transfer API**. Payouts are triggered automatically after each completed session. Providers must have a verified bank account on file (minimum payout: ₦5,000).

### Supported Payment Methods (via Paystack)
- Debit and credit cards (Visa, Mastercard, Verve)
- Bank transfer (dedicated virtual account)
- USSD (*737#, *901#, and others)
- Mobile money (future)

---

## Technology Highlights

WeCare4You is built mobile-first, reflecting how Nigerians use the internet.

| What | How |
|---|---|
| Mobile app | React Native (iOS + Android from one codebase) |
| Web portal | Next.js 14 (admin and provider dashboards) |
| Video calls | Daily.co — adaptive bitrate, works on 3G |
| Payments | Paystack (cards, bank transfer, USSD) |
| SMS OTP | Termii (Nigerian gateway, ~₦4/SMS) |
| Real-time chat | Socket.io |

All monetary values are stored internally in **kobo** (₦1 = 100 kobo) to avoid floating-point errors, and displayed to users in ₦.

---

## Nigerian Market Fit

### Phone-first authentication
Most Nigerians don't use email as their primary communication channel. WeCare4You uses phone number + SMS OTP as the primary sign-up method, with email/password as an optional fallback.

### Local payment infrastructure
Paystack is the market-leading gateway in Nigeria, trusted by millions. USSD payment support means patients without smartphones or internet access can still pay — a critical inclusion for Tier 2/3 cities.

### Low-bandwidth video
Daily.co's adaptive bitrate streaming automatically reduces video quality on poor connections, ensuring sessions can run even on crowded 3G networks common outside Lagos and Abuja.

### Affordable SMS
Termii is a Nigerian-first SMS gateway with significantly lower per-SMS rates than international providers like Twilio, reducing operational costs for OTP delivery.

### State-based provider search
Therapists are listed by Nigerian state, so patients can find practitioners familiar with their local context or who may offer in-person follow-ups.

### Stigma-aware UX language
Patient-facing copy uses soft, approachable language:
- "Talk to someone" instead of "Book a therapy session"
- "Support sessions" instead of "Mental health appointments"
- "Talk Buddy" for volunteer listeners — less clinical than "peer counsellor"

---

## Compliance

WeCare4You is designed to comply with the **Nigeria Data Protection Regulation (NDPR)**, which governs how personal data of Nigerian citizens must be handled.

| Requirement | Implementation |
|---|---|
| Informed consent | Consent checkbox during registration; NDPR notice displayed |
| Data access rights | Users can view all their data via their profile |
| Right to erasure | `DELETE /users/me` anonymises all personal data |
| Data minimisation | Only necessary data collected at each stage |
| Audit trail | All admin data access actions are logged |
| Privacy policy | Accessible in-app and at `/privacy` |

---

## Pan-African Expansion (Phase 2)

WeCare4You is architected to expand across Africa after Nigeria launch:

| Feature | Plan |
|---|---|
| Additional payment gateway | Flutterwave (supports GHS, KES, ZAR, XOF, and 30+ African currencies) |
| Multi-currency | Payments and earnings tracked per-currency |
| Localisation | French (West/Central Africa), Swahili (East Africa) |
| Country-specific licensing | Therapist profiles extended with country-specific licensing body fields |
| Regional phone OTP | Expand to local SMS gateways per country for cost efficiency |

Target markets after Nigeria: Ghana, Kenya, South Africa, with West Africa francophone markets as a longer-term goal.

---

## User Journey: Patient Booking a Session

```
1. Download app → Enter phone number → Receive SMS OTP → Verify
2. Complete profile (name, state, date of birth)
3. Browse therapists → Filter by Lagos, Anxiety/Depression
4. View therapist profile → Read bio, see rate (₦15,000/hr), check availability
5. Pick a slot → Select VIDEO, 60 minutes
6. Redirected to Paystack → Pay ₦15,000 via Verve card
7. Appointment confirmed → Push notification sent
8. Session day: Open app → Join video session → Talk to therapist
9. Session ends → Therapist receives ₦12,000 automatically
10. Patient receives post-session notification → Option to rebook or message
```

---

## User Journey: Therapist Onboarding

```
1. Download app → Register with phone number
2. Select role: Therapist
3. Fill in profile: license number (MDCN), specializations, bio, session rate
4. Set weekly availability
5. Add bank account: select bank, enter 10-digit account number
   → Paystack verifies account name (e.g. "JOHN ADEYEMI")
   → Confirm and save
6. Submit for review
7. Admin approves application
8. Profile goes live → patients can find and book
9. Booking received → Push notification
10. Join session → see patient
11. Session ends → earnings recorded → payout sent within 24 hours
```

---

## Metrics & KPIs

| Metric | Description |
|---|---|
| Sessions per day | Total completed video/audio sessions |
| Gross revenue (₦) | Total amount paid by patients |
| Platform commission (₦) | WeCare4You's 20%/25% share |
| Active patients | Patients with at least one session in past 30 days |
| Active providers | Approved therapists/buddies with at least one completed session |
| Avg. session rating | Post-session feedback score (planned Phase 2) |
| Payout success rate | Percentage of provider payouts delivered without failure |

---

## Competitive Positioning

| Platform | Geography | Focus | WeCare4You Advantage |
|---|---|---|---|
| BetterHelp | USA | Text therapy | Built for Nigeria (USSD, Naira, SMS OTP) |
| Woebot | Global | AI chatbot | Human connection; licensed therapists |
| Sprout | Nigeria | Corporate wellness | Consumer-facing; includes Talk Buddies |
| Therapist Finder NG | Nigeria | Directory only | Full booking + payment + sessions in one app |

WeCare4You's primary differentiator is being a **full-stack, end-to-end platform** — discovery, booking, payment, video session, and messaging — optimised for Nigerian network conditions and payment infrastructure, not just a directory or chat tool.

---

## Roadmap Summary

| Phase | Focus |
|---|---|
| Phase 1 (Nigeria Launch) | Mobile app (patient + therapist + buddy), web admin portal, Paystack payments, Daily.co video, Termii OTP |
| Phase 2 (Pan-Africa) | Flutterwave multi-currency, French/Swahili localisation, expand to Ghana and Kenya |
| Phase 3 (Growth) | AI-powered therapist matching, group sessions, corporate wellness packages, in-app assessments (PHQ-9, GAD-7) |
| Phase 4 (Ecosystem) | Medication management reminders, partner pharmacy integrations, insurance billing |
