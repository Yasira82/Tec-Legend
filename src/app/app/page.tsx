'use client';

// TEC Legend — Reputation home (C-126), read-only V1.
// The reputation profile: scores (Analytics-computed) + achievements (records
// written by the source apps) + badges. Legend records OUTCOMES, not claims —
// it is the READ layer; you can never add achievements manually. App shell:
// Profile / Records / Pro / Settings bottom nav.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { useTranslation } from '@/lib/i18n';
import { SCORE_DIMENSIONS, SOURCE_META, type Profile } from '@/lib/legend/profile';
import LegendPro from './components/LegendPro';
import ProfileControls from './components/ProfileControls';
import ShowcaseCard from './components/ShowcaseCard';
import { BottomNav, type LegendTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';

export default function LegendHome() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<LegendTab>('profile');

  // Real data end-to-end (C-135 §4): the caller's OWN live profile, or an honest
  // empty state — never a fabricated sample. Identity is derived from the session
  // by the BFF (never a client param, P6).
  const [p, setP]           = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'unavailable'>('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/legend/profile', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d && d.source === 'live' && d.profile) {
          setP(d.profile as Profile);
          setStatus('ready');
        } else if (d && d.source === 'empty') {
          setStatus('empty');         // signed in, but no reputation earned yet
        } else {
          setStatus('unavailable');   // no session / backend down — honest, no sample
        }
      })
      .catch(() => { if (alive) setStatus('unavailable'); });
    return () => { alive = false; };
  }, []);

  // A profile can have real achievements while its numeric scores are still 0 —
  // Legend records the OUTCOME immediately, but the SCORES are computed by Analytics
  // (C-126), which runs separately. Detect that state so the page reads as "earned,
  // scores pending" instead of looking empty/broken.
  const achievementCount = p?.achievements.length ?? 0;
  const verifiedCount    = p?.achievements.filter((a) => a.verified).length ?? 0;
  const scoresPending    = !!p && p.scores.overall === 0
    && SCORE_DIMENSIONS.every((d) => p.scores[d.key] === 0);

  const headerTitle =
    tab === 'achievements' ? t.legend.nav.achievements
    : tab === 'pro' ? t.legend.nav.pro
    : tab === 'settings' ? t.legend.nav.settings
    : t.legend.brand;

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 22px calc(96px + env(safe-area-inset-bottom))' }}>
        <header style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 34 }}>🏅</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ color: TEC_COLORS.gold, margin: '4px 0 2px', fontSize: 26 }}>{headerTitle}</h1>
            {tab === 'profile' && status === 'ready' && (
              <span style={{ fontSize: 11, color: '#22C55E', border: '1px solid #22C55E55', borderRadius: 999, padding: '2px 10px' }}>
                live profile
              </span>
            )}
          </div>
          {tab === 'profile' && (
            <p style={{ opacity: 0.7, margin: 0, fontSize: 14 }}>{t.legend.tagline}</p>
          )}
        </header>

        {/* ── PROFILE ─────────────────────────────────────────────── */}
        {tab === 'profile' && (<>
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

          {status === 'empty' && (
            <section style={{ marginTop: 28, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 30 }}>🌱</div>
              <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8, fontSize: 16 }}>Your Legend starts with your first outcome</div>
              <p style={{ opacity: 0.65, fontSize: 13.5, lineHeight: 1.6, maxWidth: 460, margin: '8px auto 0' }}>
                You&apos;re signed in, but you haven&apos;t earned a reputation record yet. Legend records
                <strong> outcomes, never claims</strong> — so do something real: complete an Epic project, get
                Zone-verified, make a sale in Commerce. Each verified outcome writes a permanent achievement here.
              </p>
            </section>
          )}

          {status === 'ready' && p && (<>
          {/* Overall + identity. When Analytics hasn't scored yet, lead with the real,
              earned achievement count instead of a bare "0" (which reads as broken). */}
          <section style={{ marginTop: 24, padding: 20, background: TEC_COLORS.surface, borderRadius: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', minWidth: 92 }}>
              {scoresPending ? (
                <>
                  <div style={{ fontSize: 44, fontWeight: 900, color: TEC_COLORS.gold, lineHeight: 1 }}>{achievementCount}</div>
                  <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>{achievementCount === 1 ? 'achievement' : 'achievements'}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 44, fontWeight: 900, color: TEC_COLORS.gold, lineHeight: 1 }}>{p.scores.overall}</div>
                  <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Overall</div>
                </>
              )}
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

          {scoresPending && achievementCount > 0 && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#22C55E14', border: '1px solid #22C55E44', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55, color: '#e7e7ea' }}>
              🎉 You&apos;ve earned <strong>{achievementCount}</strong> {achievementCount === 1 ? 'achievement' : 'achievements'}
              {verifiedCount > 0 ? ` (${verifiedCount} verified)` : ''} — that&apos;s your real reputation evidence, in the Records tab.
              The numeric <strong>scores</strong> are calculated from your verified activity;
              they stay 0 until your history is processed. Legend records what actually
              happened — it never invents a score.
            </div>
          )}

          {/* Visibility + share — the one thing the user controls (C-126). */}
          <ProfileControls handle={p.handle} initial={p.visibility ?? 'PRIVATE'} />

          {/* Legend Pro — the embeddable reputation badge (marketing surface only). */}
          <ShowcaseCard handle={p.handle} showcase={p.showcase} visibility={p.visibility} />

          {/* Reputation dimensions */}
          <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 28, marginBottom: scoresPending ? 4 : 12 }}>{t.legend.reputationScores}</h2>
          {scoresPending && (
            <p style={{ opacity: 0.6, fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
              Calculated from your verified activity — these fill in as your history builds.
            </p>
          )}
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
          </>)}
        </>)}

        {/* ── RECORDS (achievements) ──────────────────────────────── */}
        {tab === 'achievements' && (<>
          {status === 'loading' && (
            <div style={{ marginTop: 28, padding: 40, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>Loading your records…</div>
          )}
          {(status === 'unavailable' || status === 'empty') && (
            <section style={{ marginTop: 24, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 30 }}>🏆</div>
              <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8, fontSize: 16 }}>No records yet</div>
              <p style={{ opacity: 0.65, fontSize: 13.5, lineHeight: 1.6, maxWidth: 460, margin: '8px auto 0' }}>
                Legend records <strong>outcomes, never claims</strong>. Complete an Epic project, get Zone-verified,
                or make a sale in Commerce — each verified outcome writes a permanent achievement here.
              </p>
            </section>
          )}
          {status === 'ready' && p && (<>
            <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 12, marginBottom: 12 }}>{t.legend.achievements}</h2>
            {p.achievements.length === 0 ? (
              <div style={{ padding: '36px 24px', background: TEC_COLORS.surface, borderRadius: 12, textAlign: 'center', opacity: 0.7, fontSize: 13.5 }}>
                No achievements recorded yet.
              </div>
            ) : (
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
            )}
            <p style={{ opacity: 0.55, fontSize: 12, marginTop: 20, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
              <strong>Earned, not claimed.</strong> You can&apos;t add an achievement manually.
              Everything here comes from your real, verified activity across TEC — that&apos;s
              what makes it trustworthy.
            </p>
          </>)}
        </>)}

        {/* ── PRO ─────────────────────────────────────────────────── */}
        {tab === 'pro' && (<>
          <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 12, marginBottom: 12 }}>{t.legend.upgrade}</h2>
          <LegendPro />
        </>)}

        {/* ── SETTINGS ────────────────────────────────────────────── */}
        {tab === 'settings' && <SettingsView />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
