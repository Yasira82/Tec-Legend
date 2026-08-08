import { NextRequest, NextResponse } from 'next/server';
import { resolveOwnProfile, resolveProStatus, setShowcase } from '@/lib/legend/server';

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

  // Legend Pro — SHOWCASE sync (C-126). The embeddable reputation badge is gated by the
  // owner's LIVE subscription (commerce-owned truth, P5). Read Pro from the session token
  // and reconcile the persisted flag when it has drifted (a lapsed Pro → badge falls back).
  // This ONLY moves the marketing gate — records + scores are untouched. Best-effort:
  // never blocks the read, and only runs when the owner actually has a profile.
  if (profile) {
    const token = req.cookies.get('tec_access_token')?.value ?? '';
    const isPro = await resolveProStatus(token);
    if (Boolean(profile.showcase) !== isPro) {
      await setShowcase(owner, isPro);   // reconcile persisted flag with live entitlement
      profile.showcase = isPro;          // reflect immediately in this response
    }
  }

  return NextResponse.json(
    { source, profile },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  );
}
