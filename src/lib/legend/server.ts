import {
  type Profile, type Achievement, type EvidenceSource, type Visibility,
} from './profile';

// Server-only Legend backend access (C-126). Calls the real Legend read-layer
// (identity-service) via the gateway with the inter-service key, and maps the
// backend rows to the frontend shape. Real data end-to-end (C-135 §4): an
// unreachable backend / no session resolves to `unavailable` (no profile) — it
// NEVER serves a fabricated sample to the screen. NEW-A: the gateway URL is
// server-only (API_GATEWAY_URL) — never shipped to the client.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = () => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

// Header set for a user-scoped upstream read (commerce subscription status) — the
// session JWT as Bearer, so the owner is resolved server-side (never a client field).
const gwHeadersWithToken = (token: string) => ({
  ...gwHeaders(),
  Authorization: `Bearer ${token}`,
});

const day = (v: unknown) => String(v ?? '').slice(0, 10); // ISO datetime → YYYY-MM-DD

function achievementFromBackend(a: Record<string, unknown>): Achievement {
  return {
    id:          String(a.slug ?? ''),
    title:       String(a.title ?? ''),
    description: String(a.description ?? ''),
    source:      String(a.source ?? '').toLowerCase() as EvidenceSource,
    verified:    Boolean(a.verified),
    earnedAt:    day(a.earned_at),
    piValue:     a.pi_value == null ? undefined : Number(a.pi_value),
  };
}

function profileFromBackend(p: Record<string, unknown>): Profile {
  const ach = Array.isArray(p.achievements) ? (p.achievements as Record<string, unknown>[]) : [];
  const bdg = Array.isArray(p.badges) ? (p.badges as Record<string, unknown>[]) : [];
  const n = (v: unknown) => Number(v ?? 0);
  return {
    handle:        p.owner ? String(p.owner) : undefined,
    displayName:   String(p.display_name ?? p.owner ?? ''),
    joinedAt:      day(p.joined_at),
    visibility:    p.visibility ? (String(p.visibility).toUpperCase() as Visibility) : undefined,
    showcase:      Boolean(p.showcase),
    totalPiVolume: n(p.total_pi_volume),
    yearsActive:   n(p.years_active),
    scores: {
      merchant:     n(p.score_merchant),
      creator:      n(p.score_creator),
      investor:     n(p.score_investor),
      collaborator: n(p.score_collaborator),
      builder:      n(p.score_builder),
      overall:      n(p.score_overall),
    },
    achievements: ach.map(achievementFromBackend),
    badges:       bdg.map((b) => ({ id: String(b.slug ?? ''), label: String(b.label ?? ''), tone: String(b.tone ?? '#FBBF24') })),
  };
}

export interface ResolvedProfile { profile: Profile | null; source: 'live' | 'unavailable'; }

// The caller's OWN reputation profile — live backend only. `owner` is derived from
// the session by the BFF (never a client param, P6). No session or an unreachable
// backend resolves to (profile: null, source: 'unavailable') so the page shows an
// honest empty state — never a fabricated sample profile (C-135 §4).
export async function resolveProfile(owner: string | null): Promise<ResolvedProfile> {
  if (GW && owner) {
    try {
      const res = await fetch(`${GW}/api/identity/legend/profile/${encodeURIComponent(owner)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const p = data?.data?.profile;
        if (p) return { profile: profileFromBackend(p as Record<string, unknown>), source: 'live' };
      }
    } catch { /* unreachable → unavailable below */ }
  }
  return { profile: null, source: 'unavailable' };
}

// The caller's OWN profile — including a PRIVATE / CONNECTIONS one (so a user always
// sees their own reputation + can control its visibility). `owner` is derived from the
// session by the BFF (never a client param, P6). Three honest states:
//   'live'        → a profile exists (may be private) → returned with its visibility;
//   'empty'       → signed in, but no reputation earned yet (no profile);
//   'unavailable' → no session / backend down.
export interface ResolvedOwnProfile { profile: Profile | null; source: 'live' | 'empty' | 'unavailable'; }

export async function resolveOwnProfile(owner: string | null): Promise<ResolvedOwnProfile> {
  if (!GW || !owner) return { profile: null, source: 'unavailable' };
  try {
    const res = await fetch(`${GW}/api/identity/legend/own/${encodeURIComponent(owner)}`, {
      headers: gwHeaders(), cache: 'no-store',
    });
    if (res.ok) {
      const p = (await res.json().catch(() => ({})))?.data?.profile;
      if (p) return { profile: profileFromBackend(p as Record<string, unknown>), source: 'live' };
      return { profile: null, source: 'empty' };   // signed in, no record yet
    }
  } catch { /* unreachable → unavailable below */ }
  return { profile: null, source: 'unavailable' };
}

// Set the caller's OWN profile visibility (C-126 — the one user-controlled setting).
// `owner` is derived from the session by the BFF (P6). Honest statuses (401 no session ·
// 404 no profile earned yet · 400 invalid · 503 unreachable).
export interface VisibilityResult { ok: boolean; status: number; visibility?: Visibility; error?: string }

export async function setVisibility(owner: string | null, visibility: string): Promise<VisibilityResult> {
  if (!owner) return { ok: false, status: 401, error: 'Sign in to change visibility.' };
  if (!GW)    return { ok: false, status: 503, error: 'Legend is unavailable right now.' };
  try {
    const res = await fetch(`${GW}/api/identity/legend/own/${encodeURIComponent(owner)}/visibility`, {
      method: 'PATCH', headers: gwHeaders(), body: JSON.stringify({ visibility }), cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      const v = (json?.data as Record<string, unknown> | undefined)?.visibility;
      return { ok: true, status: 200, visibility: (String(v ?? visibility).toUpperCase() as Visibility) };
    }
    const msg = res.status === 404 ? 'You haven’t earned a reputation record yet.'
      : res.status === 400 ? 'Invalid visibility.'
      : 'Could not update visibility. Please try again.';
    return { ok: false, status: res.status, error: msg };
  } catch {
    return { ok: false, status: 503, error: 'Legend is unavailable right now.' };
  }
}

// The caller's LIVE Pro entitlement (Legend Pro — C-126 §Revenue). Read from the
// commerce subscription status with the session JWT — Legend never STORES billing
// truth (P5, commerce-owned); it only reflects it. Pro only while the period is live
// (active + not expired + a real paid plan). Any failure → false (fail closed).
export async function resolveProStatus(token: string): Promise<boolean> {
  if (!GW || !token) return false;
  try {
    const res = await fetch(`${GW}/api/commerce/subscriptions/status`, {
      headers: gwHeadersWithToken(token), cache: 'no-store',
    });
    if (!res.ok) return false;
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const root = (d.data ?? d) as Record<string, unknown>;
    // commerce returns { data: { subscription: {...} } } — unwrap the subscription
    // (a flat shape is also tolerated). Missing this returned FREE for real Pro users.
    const s = ((root.subscription ?? root) ?? {}) as Record<string, unknown>;
    const plan = String(s.plan ?? s.tier ?? '').toUpperCase();
    const active  = s.isActive === true || s.active === true || (plan !== '' && plan !== 'FREE');
    const expired = s.isExpired === true;
    const end     = s.current_period_end ?? s.currentPeriodEnd ?? s.expires_at;
    const notExpired = !expired && (!end || new Date(String(end)).getTime() > Date.now());
    return active && notExpired && plan !== '' && plan !== 'FREE';
  } catch { return false; }
}

// Sync the owner's SHOWCASE flag (Legend Pro — the embeddable badge gate) to match
// their LIVE subscription. `owner` is derived from the session by the BFF (P6). Like
// visibility, the backend never CREATES a profile from this (reputation is earned) →
// a no-profile owner is a harmless no-op. Best-effort: a failure never blocks the read.
export async function setShowcase(owner: string | null, on: boolean): Promise<boolean> {
  if (!GW || !owner) return false;
  try {
    const res = await fetch(`${GW}/api/identity/legend/own/${encodeURIComponent(owner)}/showcase`, {
      method: 'PATCH', headers: gwHeaders(), body: JSON.stringify({ showcase: on }), cache: 'no-store',
    });
    return res.ok;
  } catch { return false; }
}

// A PUBLIC reputation profile by username — the shareable "Pi Professional CV"
// (/u/<username>). Public read: the backend only returns a PUBLIC profile; a private
// or missing one both resolve to 'not-found' (indistinguishable by design — a private
// profile must not be discoverable). An unreachable backend → 'unavailable'.
export type PublicProfileSource = 'live' | 'not-found' | 'unavailable';

export async function resolvePublicProfile(
  username: string,
): Promise<{ profile: Profile | null; source: PublicProfileSource }> {
  if (!GW || !username.trim()) return { profile: null, source: 'unavailable' };
  try {
    const res = await fetch(`${GW}/api/identity/legend/profile/${encodeURIComponent(username.trim())}`, {
      headers: gwHeaders(), cache: 'no-store',
    });
    if (res.ok) {
      const p = (await res.json().catch(() => ({})))?.data?.profile;
      if (p) return { profile: profileFromBackend(p as Record<string, unknown>), source: 'live' };
    }
    if (res.status === 404) return { profile: null, source: 'not-found' };
  } catch { /* unreachable → unavailable below */ }
  return { profile: null, source: 'unavailable' };
}

export interface ResolvedAchievement { achievement: Achievement | null; source: 'live' | 'unavailable'; }

// One achievement by slug — live backend only. A live 404 is authoritative
// (achievement: null, source: 'live'); an unreachable backend resolves to
// (achievement: null, source: 'unavailable'). Never a fabricated sample record.
export async function resolveAchievement(id: string): Promise<ResolvedAchievement> {
  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/legend/achievement/${encodeURIComponent(id)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const a = data?.data?.achievement;
        if (a) return { achievement: achievementFromBackend(a as Record<string, unknown>), source: 'live' };
      }
      if (res.status === 404) return { achievement: null, source: 'live' };
    } catch { /* unreachable → unavailable below */ }
  }
  return { achievement: null, source: 'unavailable' };
}
