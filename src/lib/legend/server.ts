import {
  type Profile, type Achievement, type EvidenceSource,
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
    displayName:   String(p.display_name ?? p.owner ?? ''),
    joinedAt:      day(p.joined_at),
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
