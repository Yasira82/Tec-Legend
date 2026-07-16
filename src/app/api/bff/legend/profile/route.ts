import { NextResponse } from 'next/server';
import { PROFILE } from '@/lib/legend/profile';

// GET /api/bff/legend/profile — the reputation profile (C-126), read-only.
// Legend is the READ layer of economic achievement: it records OUTCOMES, not
// claims. Records originate from verified activity (Commerce/Assets/FundX/Epic/
// Connection) + Zone milestones; scores are computed by Analytics. This V1 serves
// a curated SAMPLE (source:'sample'); when live it serves the caller's OWN
// profile (identity from the session cookie, never a param — P6) and never
// re-derives transaction truth.
export function GET() {
  return NextResponse.json(
    { source: 'sample', profile: PROFILE },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
