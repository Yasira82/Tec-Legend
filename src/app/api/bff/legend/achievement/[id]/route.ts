import { NextRequest, NextResponse } from 'next/server';
import { resolveAchievement } from '@/lib/legend/server';

// GET /api/bff/legend/achievement/:id — one achievement record (C-126).
// Server-only: resolves via the real Legend read-layer (identity-service) through
// the gateway, falling back to the curated sample. Achievement records are public,
// append-only outcomes — there is no write surface. Fails closed on a missing
// record → 404, never a throw.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { achievement, source } = await resolveAchievement(id);

  if (!achievement) {
    return NextResponse.json(
      { id, found: false, source },
      { status: 404, headers: { 'Cache-Control': 'public, max-age=300' } },
    );
  }
  return NextResponse.json(
    { found: true, source, achievement },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
}
