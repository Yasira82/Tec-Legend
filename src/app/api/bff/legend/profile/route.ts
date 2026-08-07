import { NextRequest, NextResponse } from 'next/server';
import { resolveOwnProfile } from '@/lib/legend/server';

// GET /api/bff/legend/profile — the caller's OWN reputation profile (C-126).
// Legend is the READ layer of economic achievement: it records OUTCOMES, not claims.
// Identity is derived from the `tec_user` session cookie server-side — NEVER a query
// param or body (P6). The owner is passed to the backend; on no session / no live
// profile, the curated sample is served so the page is never blank. Scores are
// computed by Analytics and only served here; transaction truth is never re-derived.
function ownerFromSession(req: NextRequest): string | null {
  try {
    const raw = req.cookies.get('tec_user')?.value ?? '';
    if (!raw) return null;
    let u: Record<string, unknown>;
    try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
    const owner = (u.piUsername ?? u.username) as string | undefined;
    return owner && owner.trim() ? owner : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const owner = ownerFromSession(req);
  // Own-view: the caller sees their OWN profile even when it is PRIVATE (the public API
  // would 404 it). `source` is 'live' (has a record) · 'empty' (signed in, none yet) ·
  // 'unavailable' (no session / backend down) — the page shows the honest state.
  const { profile, source } = await resolveOwnProfile(owner);
  return NextResponse.json(
    { source, profile },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  );
}
