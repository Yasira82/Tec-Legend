'use client';

// TEC Legend — Reputation home (C-126), read-only V1.
// The reputation profile: scores (Analytics-computed) + achievements (records
// written by the source apps) + badges. Legend records OUTCOMES, not claims —
// it is the READ layer; you can never add achievements manually.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { SCORE_DIMENSIONS, SOURCE_META, type Profile } from '@/lib/legend/profile';
import LegendPro from './components/LegendPro';

export default function LegendHome() {
  // Real data end-to-end (C-135 §4): the caller's OWN live profile, or an honest
  // empty state — never a fabricated sample. Identity is derived from the session
  // by the BFF (never a client param, P6).
  const [p, setP]           = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/legend/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d && d.source === 'live' && d.profile) {
          setP(d.profile as Profile);
          setStatus('ready');
        } else {
          setStatus('unavailable');   // no session / backend down — honest, no sample
        }
      })
      .catch(() => { if (alive) setStatus('unavailable'); });
    return () => { alive = false; };
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <header style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 34 }}>🏅</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ color: TEC_COLORS.gold, margin: '4px 0 2px', fontSize: 26 }}>TEC Legend</h1>
            {status === 'ready' && (
              <span style={{ fontSize: 11, color: '#22C55E', border: '1px solid #22C55E55', borderRadius: 999, padding: '2px 10px' }}>
                live profile
              </span>
            )}
          </div>
          <p style={{ opacity: 0.7, margin: 0, fontSize: 14 }}>
            Reputation Runtime — your Legend is not what you say you did; it&apos;s what the ecosystem confirms.
          </p>
        </header>

        {status === 'loading' && (
          <div style={{ marginTop: 28, padding: 40, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
            Loading your reputation…
          </div>
        )}

        {status === 'unavailable' && (
          <section style={{ marginTop: 28, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 30 }}>🏅</div>
            <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8, fontSize: 16 }}>No reputation profile yet</div>
            <p style={{ opacity: 0.65, fontSize: 13.5, lineHeight: 1.6, maxWidth: 420, margin: '8px auto 0' }}>
              Sign in with Pi to see your Legend. Your reputation is built from verified activity across the
              ecosystem (Commerce · Epic · FundX · Connection · Assets) — it appears here once you have records.
            </p>
          </section>
        )}

        {status === 'ready' && p && (<>
        {/* Overall + identity */}
        <section style={{ marginTop: 24, padding: 20, background: TEC_COLORS.surface, borderRadius: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: TEC_COLORS.gold, lineHeight: 1 }}>{p.scores.overall}</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Overall</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700 }}>@{p.displayName}</div>
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
              <Link key={a.id} href={`/achievement/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{s.icon} <span style={{ fontSize: 11, opacity: 0.7 }}>{s.label}</span></span>
                    <span style={{ fontSize: 11, color: a.verified ? '#22C55E' : '#9ca3af' }}>{a.verified ? '✓ verified' : 'unverified'}</span>
                  </div>
                  <div style={{ color: '#e7e7ea', fontWeight: 700, marginTop: 10 }}>{a.title}</div>
                  <div style={{ opacity: 0.65, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{a.description}</div>
                  <div style={{ opacity: 0.5, fontSize: 11, marginTop: 10 }}>{a.earnedAt}{a.piValue != null ? ` · π ${a.piValue.toLocaleString()}` : ''}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <p style={{ opacity: 0.55, fontSize: 12, marginTop: 20, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
          <strong>Read layer (C-126).</strong> Legend records outcomes, never claims — you can&apos;t add an
          achievement manually. Records are written by the source apps (Commerce · Epic · FundX · Connection ·
          Assets) and verified by Zone; scores are computed by Analytics. Legend serves — read-only.
        </p>
        </>)}

        {/* Legend Pro */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 32, marginBottom: 12 }}>Upgrade</h2>
        <LegendPro />
      </div>
    </main>
  );
}
