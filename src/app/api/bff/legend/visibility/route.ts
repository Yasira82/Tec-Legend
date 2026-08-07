import { NextRequest, NextResponse } from 'next/server';
import { setVisibility } from '@/lib/legend/server';
import { isE2eMode, e2eStub } from '@/lib/server/e2e-mode';

// PATCH /api/bff/legend/visibility — set the caller's OWN profile visibility
// (C-126 — the one user-controlled setting). Identity is derived from the `tec_user`
// session cookie server-side — NEVER the request body (P6). The body carries only the
// visibility value; the backend re-enforces owner-scope and refuses to create a profile
// (a Legend profile is earned via outcomes, not a toggle). Honest statuses flow back
// (401 no session · 404 no profile yet · 400 invalid · 503 unreachable).
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

export async function PATCH(req: NextRequest) {
  if (isE2eMode()) return e2eStub(200, { visibility: 'PRIVATE' });

  const body = (await req.json().catch(() => ({}))) as { visibility?: unknown };
  const visibility = typeof body.visibility === 'string' ? body.visibility : '';
  if (!visibility) return NextResponse.json({ ok: false, error: 'visibility required' }, { status: 400 });

  const owner = ownerFromSession(req);
  const result = await setVisibility(owner, visibility);
  return NextResponse.json(
    { ok: result.ok, visibility: result.visibility ?? null, error: result.error },
    { status: result.ok ? 200 : result.status },
  );
}
