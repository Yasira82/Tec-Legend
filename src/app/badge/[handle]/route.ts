import { NextRequest } from 'next/server';
import { resolvePublicProfile } from '@/lib/legend/server';

// GET /badge/<handle>.svg — a public, embeddable "Pi reputation" badge (SVG) for a
// Legend member, reading the LIVE profile (C-126 — never a static claim). This is
// Legend's outward reach into the whole Pi ecosystem: a member drops
// <img src="https://legend.tecosystem.app/badge/<handle>.svg"> on their site / store /
// marketplace listing and it always reflects the current reputation.
//
// Legend Pro gate (C-126 §Revenue): the reputation segment renders ONLY when the profile
// is PUBLIC *and* the owner has enabled SHOWCASE (a live-Pro entitlement). This gates the
// MARKETING SURFACE only — it never changes the underlying records or Analytics scores
// (reputation stays earned, C-126). Otherwise the badge degrades to a neutral wordmark
// that leaks no score. Public read, no auth; fail-safe; cached briefly at the edge.
export const dynamic = 'force-dynamic';

// Shields-style two-segment badge. Width is derived from the message text so it never
// clips. A drawn trophy mark carries the meaning (emoji in <img>-embedded SVG is
// unreliable). `live` gives the reputation segment the gold treatment; the neutral
// fallback stays gray.
function badgeSvg(message: string, live: boolean): string {
  const CH = 6.6;                                  // approx px per char at 11px font
  const labelText = 'Legend';
  const labelW = Math.round(10 + labelText.length * CH + 16); // + room for the trophy mark
  const msgW   = Math.round(14 + message.length * CH);
  const w = labelW + msgW;
  const h = 20;
  const labelMid = (labelW + 16) / 2 + 2;          // shift right past the trophy glyph
  const msgMid   = labelW + msgW / 2;
  const msgColor = live ? '#B7791F' : '#6b7280';   // gold when a real reputation; gray otherwise
  const msgText  = live ? '#fff' : '#fff';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="Legend: ${message}">
  <title>Legend: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="#0B1020"/>
    <rect x="${labelW}" width="${msgW}" height="${h}" fill="${msgColor}"/>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
  </g>
  <g transform="translate(6,3.4)" aria-hidden="true">
    <path d="M2 1 H12 V4 C12 7 10 9 7 9.4 C4 9 2 7 2 4 Z" fill="#FBBF24" opacity="0.95"/>
    <path d="M2 1 H0.4 V2.4 C0.4 4 1.4 5 3 5" fill="none" stroke="#FBBF24" stroke-width="1.2"/>
    <path d="M12 1 H13.6 V2.4 C13.6 4 12.6 5 11 5" fill="none" stroke="#FBBF24" stroke-width="1.2"/>
    <rect x="6" y="9.2" width="2" height="3" fill="#FBBF24"/>
    <rect x="4" y="12" width="6" height="1.8" rx="0.6" fill="#FBBF24"/>
  </g>
  <g fill="${msgText}" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelMid}" y="14" fill="#010101" fill-opacity=".3">${labelText}</text>
    <text x="${labelMid}" y="13" fill="#fff">${labelText}</text>
    <text x="${msgMid}" y="14" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${msgMid}" y="13">${message}</text>
  </g>
</svg>`;
}

const svgResponse = (svg: string) =>
  new Response(svg, {
    headers: {
      'content-type':  'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const id = handle.replace(/\.svg$/i, '').trim();

  // Neutral fallback (no score leaked): not found · not public · not Pro (showcase off) ·
  // backend unreachable all render the same generic wordmark.
  let message = 'Pi reputation';
  let live = false;

  try {
    const { profile, source } = await resolvePublicProfile(id);
    // Reputation renders ONLY for a PUBLIC profile with SHOWCASE enabled (live Pro gate).
    if (source === 'live' && profile && profile.showcase) {
      const scored = profile.scores.overall > 0;
      if (scored) {
        message = `score ${profile.scores.overall}`;
      } else {
        // Records exist but Analytics scores are still pending — show the earned count.
        const n = profile.achievements.length;
        message = n > 0 ? `${n} achievement${n === 1 ? '' : 's'}` : 'Pi reputation';
      }
      live = message !== 'Pi reputation';
    }
  } catch { /* unreachable → neutral wordmark, fail-safe */ }

  return svgResponse(badgeSvg(message, live));
}
