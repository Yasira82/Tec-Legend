// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// TEC Legend — embeddable reputation badge (C-126 §Revenue, Legend Pro). These tests
// lock the CONSTITUTIONAL gate: the badge renders a reputation ONLY for a PUBLIC profile
// with SHOWCASE enabled (a live-Pro entitlement). Every other case — not Pro, not public,
// not found, backend down — degrades to a neutral wordmark that LEAKS NO SCORE. The badge
// gates the marketing surface only; it never asserts or changes the earned reputation.

const GW = 'https://api.example.com';

const profileJson = (profile: unknown, status = 200) => ({
  ok: status >= 200 && status < 300, status, json: async () => ({ data: { profile } }),
});

async function render(handle: string) {
  const { GET } = await import('@/app/badge/[handle]/route');
  const res = await GET({} as never, { params: Promise.resolve({ handle }) });
  return res.text();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /badge/:handle.svg (Legend Pro embeddable badge)', () => {
  it('renders the overall score for a PUBLIC + SHOWCASE (Pro) profile', async () => {
    global.fetch = vi.fn().mockResolvedValue(profileJson({
      owner: 'pioneer', visibility: 'PUBLIC', showcase: true,
      score_overall: 79, achievements: [{ slug: 'a1' }],
    }));
    const svg = await render('pioneer.svg');
    expect(svg).toContain('score 79');
    expect(svg).toContain('Legend');
  });

  it('shows the earned COUNT (not a fake score) when Analytics scores are still pending', async () => {
    global.fetch = vi.fn().mockResolvedValue(profileJson({
      owner: 'newbie', visibility: 'PUBLIC', showcase: true,
      score_overall: 0, achievements: [{ slug: 'a1' }, { slug: 'a2' }],
    }));
    const svg = await render('newbie');
    expect(svg).toContain('2 achievements');
    expect(svg).not.toContain('score 0');
  });

  it('degrades to a neutral wordmark (no score) when SHOWCASE is off (not Pro)', async () => {
    global.fetch = vi.fn().mockResolvedValue(profileJson({
      owner: 'pioneer', visibility: 'PUBLIC', showcase: false,
      score_overall: 79, achievements: [{ slug: 'a1' }],
    }));
    const svg = await render('pioneer.svg');
    expect(svg).toContain('Pi reputation');
    expect(svg).not.toContain('79');   // no score leaked without a live Pro entitlement
  });

  it('degrades to a neutral wordmark when the profile is not found (private/unknown)', async () => {
    global.fetch = vi.fn().mockResolvedValue(profileJson(null, 404));
    const svg = await render('ghost');
    expect(svg).toContain('Pi reputation');
  });

  it('fails safe (neutral wordmark) when the backend is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('down'));
    const svg = await render('pioneer');
    expect(svg).toContain('Pi reputation');
    expect(svg.startsWith('<svg')).toBe(true);   // a real SVG body, always
  });
});
