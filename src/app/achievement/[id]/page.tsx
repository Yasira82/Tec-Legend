// TEC Legend — achievement detail (C-126), read-only, statically generated.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { PROFILE, SOURCE_META } from '@/lib/legend/profile';
import { resolveAchievement } from '@/lib/legend/server';

// Pre-render the curated sample slugs; allow live-only backend records to render on
// demand (Legend is the read layer of record — C-126).
export function generateStaticParams() {
  return PROFILE.achievements.map((a) => ({ id: a.id }));
}
export const dynamicParams = true;

export default async function AchievementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Resolve from the live Legend read-layer; fall back to the curated sample.
  const { achievement: a } = await resolveAchievement(id);
  if (!a) notFound();

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
          {a.verified ? 'verified by Zone' : 'is not yet Zone-verified'} — Legend never authors it (C-126).
          Legend is the read layer; the source app is the write layer. Read-only sample.
        </p>
      </div>
    </main>
  );
}
