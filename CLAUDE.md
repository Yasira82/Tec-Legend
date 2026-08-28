# TEC Legend — Claude Code Instructions

> ⚡ **SESSION START:** اقرأ `knowledge-base/C-02___CURRENT_STATE_.md` + **app charter
> `knowledge-base/C-126___LEGEND_REPUTATION_RUNTIME.md`** من `yasira82/tec-knowledge-base` (branch: `main`).

## What This App Is

**The Reputation Runtime** of the Pi economy (C-126) — the **System of
Evidence**. Legend answers one question:

```
"What have you achieved?"
```

Legend transforms verified economic activity into a **permanent, portable,
evidence-based reputation** that follows every Pi user across the ecosystem. It is
the base of the value chain **Legend (evidence) → Elite (recognition) → VIP
(experience)**.

Built from `tec-template-base` (Next.js 15 frontend).

**Current Phase: Legend V0/V1 — Reputation preview (read-only).** Identity /
domain / slug / legal + a themed **reputation profile** (overall + dimensional
scores · achievements with evidence source · Zone-verified flags · badges) +
a `/achievement/[id]` detail page + **Legend Pro** (the Pi Portal "Process a
Transaction" gate). Real profiles (Analytics scores + source-app records) are
Phase 2. Deployed (Mainnet) · Pi App ID registered · env set · payment live · referral growth loop wired (C-133).

---

## Pi App Identity

| Field | Value |
|-------|-------|
| **App** | TEC Legend |
| **Domain** | `https://legend.tecosystem.app` |
| **Pi App ID** | ✅ Registered (Mainnet) · Vercel `NEXT_PUBLIC_PI_APP_ID` |
| **APP_SOURCE slug** | `legend` (payment-service resolves `PI_API_KEY_LEGEND`) |
| **PI_SANDBOX** | `false` (Mainnet) |

---

## Legend-Specific Rules (C-126)

### 🔴 Constitutional rule — Legend records OUTCOMES, not CLAIMS
A user can **NEVER** add an achievement manually. Every Legend record originates
from **verified activity** in Commerce/Assets/FundX/Epic/Connection + Zone-verified
milestones, and scores are **computed by Analytics**. Legend is the **READ layer**
of economic achievement; every other app is the **write layer**. This is what
prevents gaming, fraud, and self-promotion — Legend is only as trustworthy as the
sources that feed it.

### The ownership boundary
Legend **OWNS**: achievement records (read), reputation dimensions, the Pi
Professional CV, badges, public profile. Legend does **NOT OWN**:
- **Score computation** → Analytics computes scores from raw data.
- **Verification** → Zone verifies before Legend records.
- **Identity** → Hub. **Recognition** → Elite (C-127). **Benefits** → VIP (C-128).
- **Live activity** → Commerce/Assets/FundX own live data (Legend references by ID).

### Immutability + privacy
Achievement records are **append-only** (immutable — a scored can be hidden, a
record never modified). Profile visibility is user-controlled (PUBLIC / CONNECTIONS
/ PRIVATE). Identity from the `tec_user` session cookie server-side — **never** a
query param or body (P6). No session → own-scope fails closed.

**Reference of record:** `yasira82/tec-knowledge-base` —
`C-126___LEGEND_REPUTATION_RUNTIME.md` (charter) + `C-12_Dual_Mode_Payment.md`
(payment anti-regression) + `C-123` (session/cookies).

---

## Stack

- Next.js 15 App Router + TypeScript strict · React 18
- `@yasser172/tec-ui` (design system) · `@yasser172/tec-auth` · `@yasser172/tec-sdk`
- Vitest (unit) + Playwright (e2e) · Deployment: Vercel

---

## Architecture Rules (non-negotiable)

### CSRF — middleware ONLY (P2 single source of truth)
CSRF is enforced in **`middleware.ts`** and **nowhere else**: a request is trusted
if the double-submit token matches **OR** it is first-party (Origin host === Host /
`*.tecosystem.app`).
- ❌ **NEVER** add a CSRF check inside a route handler (`csrfCookie !== csrfHeader`
  → 403). It 403's legit Mode-2 payments in Pi Browser (drops `sameSite=None`
  cookies). The CI `payment-policy` job fails the build if you do. (KB C-12 §11)
- ✅ A route may *forward* `x-csrf-token` to a downstream call; it must never *validate* it.

### ADR-007 — Dual-mode payment (Pi foreign session)
Every buy handler MUST guard before touching `window.Pi`:
```typescript
const isHubNavigation = () =>
  document.referrer.toLowerCase().includes('hub.tecosystem.app');
if (isHubNavigation() || !(window as any).Pi || !piReady) {
  redirectToHubPayment(...);   // Mode 1: Hub modal → /hub?pay=1&...
  return;
}
// Mode 2: standalone — createPaymentRecord() then createU2APayment() (src/lib/pi-payment.ts)
```
> Legend Pro (subscription) is the only buy flow. Approve under `PI_API_KEY_LEGEND`
> (never the default Hub key — the Analytics approve→502 lesson, C-12 §11).

### ADR-009 — Unified payment contract
`amount` is a **number**; gateway path is **`/api/payment/*`** (singular); the only
inter-service header is **`x-internal-key`** + `INTERNAL_SECRET`. Don't re-declare
payment Zod locally — shapes live in `@yasser172/tec-sdk`.

### Two-SDK boundary
```
Client components → src/lib-client/*  (browser state, Pi hooks)
API routes (BFF)  → @yasser172/tec-sdk via /api/bff/*  (server-only)
```

### Auth / cookies (LOCKED)
SSO via Hub cookies `tec_access_token`, `tec_csrf`, `tec_user`. Never localStorage.
Identity is derived from the `tec_user` cookie server-side — **never from the request body**.

---

## Setup status + Roadmap (C-126)

```
Legend V0/V1 — Reputation preview (customized from template):
  ✅ package.json name = tec-legend · APP_SOURCE = 'legend'
  ✅ sso-callback ALLOWED_AUDIENCES → legend.tecosystem.app + tec-legend.vercel.app
  ✅ privacy + terms → TEC Legend / legend.tecosystem.app
  ✅ NEW-A: no NEXT_PUBLIC_API_GATEWAY_URL / Railway host in the client bundle
  ✅ /app themed: reputation profile (scores + achievements + badges) + Legend Pro (real Pi U2A)
  ✅ /achievement/[id] detail (evidence source + Zone-verified) + BFF /api/bff/legend/profile

Live on Mainnet — all complete (SSoT: architecture/app-fleet.yaml):
  ✅ Register Pi App ID (Pi Developer Portal) → Vercel NEXT_PUBLIC_PI_APP_ID +
    API_GATEWAY_URL · INTERNAL_SECRET · SSO_SECRET · PI_SANDBOX=false.
  ✅ payment-service: set PI_API_KEY_LEGEND on Railway (approve→502 otherwise, C-12 §11).
  ✅ Hub SSO: add legend.tecosystem.app + tec-legend.vercel.app to Hub /api/auth/sso
    ALLOWED_TARGETS + Hub domain registry.
  ✅ Deploy (Vercel) + runtime-verify login (C-123) + a real Legend Pro payment
    Mode 1 (Hub) AND Mode 2 (standalone).

Legend V1+ (post-Portal — C-126): consume Redis Streams (payment.completed.v1,
  epic.project.completed.v1, fundx.investment.closed.v1, zone.badge.issued.v1,
  connection.milestone.v1) → Analytics-computed scores → Pi Professional CV export
  → embeddable badges. Gated on Analytics + Zone operational + 1k users.
```

---

## What NOT To Do

- Do NOT let a user add/edit achievements — Legend records outcomes only (READ layer, C-126)
- Do NOT compute scores in Legend — Analytics computes; Legend serves
- Do NOT mint verification — present Zone's verified flag, never create it
- Do NOT modify a record — achievements are append-only (immutable)
- Do NOT validate CSRF in a route handler — middleware only (CI blocks it)
- Do NOT send `amount` as a string, or use `/payments` / `x-service-secret`
- Do NOT skip the ADR-007 `isHubNavigation()` guard before `window.Pi`
- Do NOT store tokens in localStorage; do NOT derive identity from the body
- Do NOT add `NEXT_PUBLIC_*` for internal service URLs or `INTERNAL_SECRET`

---

## Commit Convention

```
feat(legend):  new reputation feature   fix(payment): payment flow fix (test carefully)
fix(legend):   bug fix                   chore(scope):  build/config
```

---

## Skills

Available via plugin — invoke automatically when the situation matches:

| Situation | Skill |
|-----------|-------|
| Writing new feature or fixing a bug → use TDD | `/tdd` |
| Bug, regression, or unexpected behavior | `/diagnose` |
| Writing or modifying tests | `/test-guard` |
| Writing or modifying BFF routes, payment handlers, or API contracts | `/clean-code-guard` |
| Updating docs, CLAUDE.md, or knowledge-base entries | `/docs-guard` |
| Planning a new feature or architectural decision | `/grill-with-docs` |
| Breaking down a roadmap item into GitHub Issues | `/to-issues` |
| Session is getting long or context is filling up | `/handoff` |
| Adding pre-commit hooks to this repo | `/setup-pre-commit` |
