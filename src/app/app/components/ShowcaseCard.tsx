'use client';

// TEC Legend — ShowcaseCard (Legend Pro, C-126 §Revenue). The embeddable reputation
// badge is the Pro benefit: a live SVG the member drops on their own site / Pi store /
// marketplace listing so their earned reputation travels with them across the Pi economy.
//
// This gates only the MARKETING SURFACE (the badge) — reputation records + scores stay
// earned + Analytics-computed (C-126). `showcase` is the LIVE-Pro flag (synced by the BFF
// from the subscription; Legend never stores billing, P5). The badge renders publicly only
// when the profile is PUBLIC *and* Pro is live — so the copy nudges the user to satisfy both.
import { useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import type { Visibility } from '@/lib/legend/profile';

export default function ShowcaseCard(
  { handle, showcase, visibility }: { handle?: string; showcase?: boolean; visibility?: Visibility },
) {
  const [copied, setCopied] = useState<'' | 'html' | 'md'>('');

  // Without a handle we can't build a badge URL. (Own-view always has one once a record
  // exists; guard anyway.)
  if (!handle) return null;

  const origin  = typeof window !== 'undefined' ? window.location.origin : 'https://legend.tecosystem.app';
  const badgeUrl = `${origin}/badge/${encodeURIComponent(handle)}.svg`;
  const cvUrl    = `${origin}/u/${encodeURIComponent(handle)}`;
  const htmlSnippet = `<a href="${cvUrl}"><img src="${badgeUrl}" alt="TEC Legend reputation" /></a>`;
  const mdSnippet   = `[![TEC Legend](${badgeUrl})](${cvUrl})`;

  async function copy(kind: 'html' | 'md', text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind); setTimeout(() => setCopied(''), 2000);
    } catch { /* clipboard blocked — the snippet is visible to select manually */ }
  }

  // Not Pro → an honest upsell (no badge preview, since it won't render publicly anyway).
  if (!showcase) {
    return (
      <section style={card}>
        <div style={title}>🔖 Embeddable reputation badge</div>
        <p style={body}>
          A <strong style={{ color: TEC_COLORS.gold }}>Legend Pro</strong> benefit — a live badge you can
          embed on your own website, Pi store, or marketplace listing. It always reflects your current,
          earned reputation. Subscribe to Pro to unlock it.
        </p>
      </section>
    );
  }

  // Pro, but the profile is not public → the badge would render neutral. Nudge to Public.
  const isPublic = visibility === 'PUBLIC' || visibility === undefined;

  return (
    <section style={card}>
      <div style={title}>🔖 Your embeddable badge <span style={proTag}>PRO</span></div>

      {!isPublic ? (
        <p style={body}>
          Your badge is ready. Set your profile to <strong style={{ color: TEC_COLORS.gold }}>Public</strong> above
          so it renders your reputation publicly (a non-public profile shows a neutral wordmark that leaks no score).
        </p>
      ) : (
        <>
          <p style={{ ...body, marginBottom: 12 }}>
            A live badge that always reflects your current reputation. Drop it anywhere on the web:
          </p>
          {/* Live preview — the real SVG endpoint, so what you see is what embeds. */}
          <img src={badgeUrl} alt="TEC Legend reputation badge" style={{ height: 20, display: 'block', marginBottom: 14 }} />

          <Snippet label="HTML"     value={htmlSnippet} on={() => copy('html', htmlSnippet)} copied={copied === 'html'} />
          <Snippet label="Markdown" value={mdSnippet}   on={() => copy('md', mdSnippet)}     copied={copied === 'md'} />
        </>
      )}
    </section>
  );
}

function Snippet({ label, value, on, copied }: { label: string; value: string; on: () => void; copied: boolean }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e7ea', opacity: 0.7 }}>{label}</span>
        <button onClick={on} style={{
          background: 'transparent', color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}66`,
          borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>
          {copied ? '✅ Copied' : 'Copy'}
        </button>
      </div>
      <code style={{
        display: 'block', background: '#0a0d18', border: '1px solid #ffffff12', borderRadius: 8,
        padding: '8px 10px', fontSize: 11, color: '#c8c8d0', wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace',
      }}>{value}</code>
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 16, padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10',
};
const title: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#e7e7ea', display: 'flex', alignItems: 'center', gap: 8 };
const body:  React.CSSProperties = { fontSize: 12, opacity: 0.7, margin: '8px 0 0', lineHeight: 1.6 };
const proTag: React.CSSProperties = {
  fontSize: 10, fontWeight: 800, color: '#0a0800', background: TEC_COLORS.gold,
  borderRadius: 6, padding: '1px 6px', letterSpacing: 0.4,
};
