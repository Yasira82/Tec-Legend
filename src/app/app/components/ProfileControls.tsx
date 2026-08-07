'use client';

// TEC Legend — profile controls (C-126). Visibility is the ONE thing a user controls
// on their own reputation (they never author achievements or scores). Set it here; when
// PUBLIC, the profile is shareable as a "Pi Professional CV" at /u/<handle>. Identity is
// enforced server-side — the BFF derives the owner from the session and the backend
// refuses to create a profile from a toggle (P6). Reputation stays earned, not declared.
import { useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import type { Visibility } from '@/lib/legend/profile';

const OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: 'PUBLIC',      label: '🌍 Public',      hint: 'Anyone with the link can view your reputation.' },
  { value: 'CONNECTIONS', label: '🤝 Connections', hint: 'Only your Connection graph can view it.' },
  { value: 'PRIVATE',     label: '🔒 Private',     hint: 'Only you can see it.' },
];

export default function ProfileControls({ handle, initial }: { handle?: string; initial: Visibility }) {
  const [vis, setVis]     = useState<Visibility>(initial);
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState('');
  const [copied, setCopied] = useState(false);

  async function choose(next: Visibility) {
    if (next === vis || busy) return;
    setBusy(true); setMsg('');
    const prev = vis;
    setVis(next); // optimistic
    try {
      const res = await fetch('/api/bff/legend/visibility', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; visibility?: Visibility; error?: string };
      if (!res.ok || !json.ok) { setVis(prev); setMsg(json.error ?? 'Could not update visibility.'); }
      else if (json.visibility) setVis(json.visibility);
    } catch { setVis(prev); setMsg('Network error. Please try again.'); }
    setBusy(false);
  }

  async function copyShare() {
    if (!handle) return;
    const url = `${window.location.origin}/u/${encodeURIComponent(handle)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { setMsg(url); }
  }

  const hint = OPTIONS.find((o) => o.value === vis)?.hint ?? '';

  return (
    <section style={{ marginTop: 20, padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e7e7ea' }}>Who can see your Legend?</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {OPTIONS.map((o) => {
          const active = o.value === vis;
          return (
            <button key={o.value} onClick={() => choose(o.value)} disabled={busy} style={{
              background: active ? TEC_COLORS.gold : 'transparent',
              color: active ? '#0a0800' : '#e7e7ea',
              border: `1px solid ${active ? TEC_COLORS.gold : '#ffffff22'}`,
              borderRadius: 20, padding: '6px 12px', fontSize: 12.5, fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
            }}>
              {o.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11.5, opacity: 0.6, margin: '8px 0 0', lineHeight: 1.5 }}>{hint}</p>

      {vis === 'PUBLIC' && handle && (
        <button onClick={copyShare} style={{
          marginTop: 12, background: 'transparent', color: TEC_COLORS.gold,
          border: `1px solid ${TEC_COLORS.gold}66`, borderRadius: 10, padding: '8px 14px',
          fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>
          {copied ? '✅ Link copied' : `🔗 Copy share link — /u/${handle}`}
        </button>
      )}
      {msg && <div style={{ marginTop: 8, fontSize: 12, color: TEC_COLORS.error, wordBreak: 'break-all' }}>{msg}</div>}
    </section>
  );
}
