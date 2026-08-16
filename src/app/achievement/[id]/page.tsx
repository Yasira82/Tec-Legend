// TEC Legend — achievement detail (C-126), read-only. Rendered dynamically from
// the live Legend read-layer (identity-service) — real data end-to-end (C-135 §4):
// a live 404 is "not found"; an unreachable backend is an honest "couldn't load".
// Never a fabricated sample record.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { SOURCE_META } from '@/lib/legend/profile';
import { resolveAchievement } from '@/lib/legend/server';

export const dynamic = 'force-dynamic';

export default async function AchievementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { achievement: a, source } = await resolveAchievement(id);

  // Live 404 → not found (authoritative). Unreachable backend → honest error panel.
  if (!a) {
    if (source === 'live') notFound();
    return (
      <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <Link href="/app" style={{ color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>← Back</Link>
          <div style={{ marginTop: 40, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>🏅</div>
            <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8 }}>Couldn&apos;t load this record</div>
            <p style={{ opacity: 0.65, fontSize: 13.5, marginTop: 6 }}>The Legend read-layer is unavailable right now. Please try again.</p>
          </div>
        </div>
      </main>
    );
  }

  const s = SOURCE_META[a.source];

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href="/app" style={{ color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>← Back</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <span style={{ fontSize: 30 }}>{s.icon}</span>
          <h1 style={{ color: TEC_COLORS.gold, margin: 0, fontSize: 23 }}>{a.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: a.verified ? '#22C55E' : '#9ca3af', border: `1px solid ${a.verified ? '#22C55E' : '#9ca3af'}55`, borderRadius: 20, padding: '3px 10px' }}>{a.verified ? '✓ Zone verified' : 'Unverified'}</span>
          <span style={{ fontSize: 12, opacity: 0.7, border: '1px solid #ffffff22', borderRadius: 20, padding: '3px 10px' }}>Source: {s.label}</span>
          <span style={{ fontSize: 12, opacity: 0.7, border: '1px solid #ffffff22', borderRadius: 20, padding: '3px 10px' }}>Earned {a.earnedAt}</span>
        </div>

        <p style={{ marginTop: 16, lineHeight: 1.6, opacity: 0.9 }}>{a.description}</p>

        {a.piValue != null && (
          <p style={{ color: TEC_COLORS.gold, fontWeight: 700, marginTop: 8 }}>Economic value: π {a.piValue.toLocaleString()}</p>
        )}

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.55, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
          This record was <strong>written by {s.label}</strong> from real activity and{' '}
          {a.verified? 'verified by Zone': 'is not yet Zone-verified'} — Legend never authors it.
          Every achievement here comes from your real activity in another TEC app.
        </p>
      </div>
    </main>
  );
}
