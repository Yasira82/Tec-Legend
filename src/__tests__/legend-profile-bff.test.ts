// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Legend — profile BFF (C-126). Legend Pro = SHOWCASE (the embeddable badge gate).
// The showcase flag is reconciled with the caller's LIVE subscription (P5). Identity is
// the session (P6). Regression guard: commerce returns { data: { subscription: {...} } };
// resolveProStatus must unwrap `.subscription` — reading `.data.plan` returned FREE and
// the badge stayed locked for real Pro users.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const maya = JSON.stringify({ piUsername: 'maya' });
const makeReq = (cookies?: Record<string, string>) => {
  const cookieStr = cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ') : '';
  const headers: Record<string, string> = {};
  if (cookieStr) headers['Cookie'] = cookieStr;
  return new NextRequest('http://localhost/api/bff/legend/profile', { method: 'GET', headers });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/legend/profile (showcase sync, Legend Pro)', () => {
  it('lights up SHOWCASE for a live Pro owner (unwraps { data: { subscription } })', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { profile: { owner: 'maya', visibility: 'PUBLIC', showcase: false } } })) // own profile
      .mockResolvedValueOnce(ok({ data: { subscription: { plan: 'PRO', isActive: true, isExpired: false } } }))    // sub = Pro
      .mockResolvedValueOnce(ok({ data: { ok: true } }));                                                          // setShowcase
    const { GET } = await import('@/app/api/bff/legend/profile/route');
    const res  = await GET(makeReq({ tec_user: maya, tec_access_token: 'tok' }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.profile.showcase).toBe(true);   // was false → lit by live Pro
    const setCall = fetchSpy.mock.calls.find(([u]) => String(u).includes('/showcase'));
    expect(setCall).toBeDefined();
    fetchSpy.mockRestore();
  });
});
