// TEC Legend — public reputation profile (C-126). The shareable "Pi Professional CV":
// a portable, evidence-based reputation anyone can view IF the owner set it PUBLIC.
// Real data end-to-end — the backend returns only a PUBLIC profile; a private or
// missing one both resolve to "not available" (a private profile must not be
// discoverable). Legend serves; it never authors achievements or computes scores.
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { SCORE_DIMENSIONS, SOURCE_META } from '@/lib/legend/profile';
import { resolvePublicProfile } from '@/lib/legend/server';

export const dynamic = 'force-dynamic';

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { profile: p, source } = await resolvePublicProfile(username);

  const shell = (children: React.ReactNode) => (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>{children}</div>
    </main>
  );

  if (!p) {
    return shell(
      <div style={{ marginTop: 40, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 30 }}>🏅</div>
        <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8, fontSize: 16 }}>
          {source === 'unavailable' ? 'Couldn’t load this profile' : 'No public reputation here'}
        </div>
        <p style={{ opacity: 0.65, fontSize: 13.5, lineHeight: 1.6, maxWidth: 440, margin: '8px auto 0' }}>
          {source === 'unavailable'
            ? 'Legend is unavailable right now. Please try again shortly.'
            : `@${username} either hasn’t made their Legend public, or doesn’t have a reputation record yet. Reputation is earned from verified activity — and each person controls who can see it.`}
        </p>
        <Link href="/app" style={{ display: 'inline-block', marginTop: 16, color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>← TEC Legend</Link>
      </div>,
    );
  }

  return shell(<>
    <header style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 34 }}>🏅</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ color: TEC_COLORS.gold, margin: '4px 0 2px', fontSize: 26 }}>@{p.displayName}</h1>
        <span style={{ fontSize: 11, color: '#22C55E', border: '1px solid #22C55E55', borderRadius: 999, padding: '2px 10px' }}>public reputation</span>
      </div>
      <p style={{ opacity: 0.7, margin: 0, fontSize: 14 }}>
        A Pi Professional CV — reputation from verified activity, not claims (TEC Legend · C-126).
      </p>
    </header>

    {/* Overall + identity */}
    <section style={{ marginTop: 24, padding: 20, background: TEC_COLORS.surface, borderRadius: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: TEC_COLORS.gold, lineHeight: 1 }}>{p.scores.overall}</div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Overall</div>
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Joined {p.joinedAt} · {p.yearsActive}y active · π {p.totalPiVolume.toLocaleString()} lifetime volume</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {p.badges.map((b) => (
            <span key={b.id} style={{ fontSize: 11, color: b.tone, border: `1px solid ${b.tone}66`, borderRadius: 20, padding: '2px 9px' }}>{b.label}</span>
          ))}
        </div>
      </div>
    </section>

    {/* Reputation dimensions */}
    <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 28, marginBottom: 12 }}>Reputation scores</h2>
    <div style={{ display: 'grid', gap: 10, padding: 18, background: TEC_COLORS.surface, borderRadius: 12 }}>
      {SCORE_DIMENSIONS.map((d) => {
        const v = p.scores[d.key];
        return (
          <div key={d.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
              <span style={{ opacity: 0.85 }}>{d.label} <span style={{ opacity: 0.5, fontSize: 11 }}>· from {d.from}</span></span>
              <span style={{ color: TEC_COLORS.gold }}>{v}</span>
            </div>
            <div style={{ height: 6, background: '#ffffff14', borderRadius: 6 }}>
              <div style={{ height: 6, width: `${v}%`, background: TEC_COLORS.goldDark, borderRadius: 6 }} />
            </div>
          </div>
        );
      })}
    </div>

    {/* Achievements */}
    <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 28, marginBottom: 12 }}>Achievements</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
      {p.achievements.map((a) => {
        const s = SOURCE_META[a.source];
        return (
          <div key={a.id} style={{ padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{s?.icon} <span style={{ fontSize: 11, opacity: 0.7 }}>{s?.label}</span></span>
              <span style={{ fontSize: 11, color: a.verified ? '#22C55E' : '#9ca3af' }}>{a.verified ? '✓ verified' : 'unverified'}</span>
            </div>
            <div style={{ color: '#e7e7ea', fontWeight: 700, marginTop: 10 }}>{a.title}</div>
            <div style={{ opacity: 0.65, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{a.description}</div>
            <div style={{ opacity: 0.5, fontSize: 11, marginTop: 10 }}>{a.earnedAt}{a.piValue != null ? ` · π ${a.piValue.toLocaleString()}` : ''}</div>
          </div>
        );
      })}
    </div>

    <p style={{ opacity: 0.55, fontSize: 12, marginTop: 20, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
      Every record here originates from verified activity across the TEC ecosystem and is confirmed by Zone;
      scores are computed by Analytics. Legend records outcomes, never claims (C-126).
    </p>
    <Link href="/app" style={{ display: 'inline-block', marginTop: 16, color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>Build your own Legend →</Link>
  </>);
}
