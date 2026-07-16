// TEC Legend — Reputation Runtime (C-126) — read-only V1 data.
//
// Legend = System of Evidence: permanent, verifiable, portable reputation from
// real Pi economic activity ("What have you achieved?").
//
// CONSTITUTIONAL RULE (C-126): Legend records OUTCOMES, not CLAIMS. A user can
// NEVER add achievements manually. Every record originates from verified activity
// in Commerce/Assets/FundX/Epic/Connection + Zone-verified milestones, and scores
// are computed by Analytics. Legend is the READ layer of economic achievement;
// every other app is the write layer. This V1 is a curated read-only SAMPLE;
// when live it serves the caller's OWN profile (identity from the session cookie,
// never a param — P6) and never re-derives transaction truth.

export type EvidenceSource =
  | 'commerce' | 'assets' | 'fundx' | 'epic' | 'connection' | 'zone';

export interface ScoreSet {
  merchant:     number;   // 0-100 — from Commerce
  creator:      number;   // from Epic + Assets
  investor:     number;   // from FundX
  collaborator: number;   // from Connection
  builder:      number;   // from Epic + DX
  overall:      number;   // composite (computed by Analytics)
}

export interface Achievement {
  id:            string;
  title:         string;
  description:   string;
  source:        EvidenceSource;   // which app produced the underlying record
  verified:      boolean;          // Zone-verified?
  earnedAt:      string;           // ISO date
  piValue?:      number;           // economic value, when applicable
}

export interface Badge {
  id:    string;
  label: string;
  tone:  string;
}

export interface Profile {
  displayName: string;
  joinedAt:    string;
  scores:      ScoreSet;
  achievements: Achievement[];
  badges:       Badge[];
  totalPiVolume: number;
  yearsActive:   number;
}

// ── Sample profile (when live: scores computed by Analytics, records written by source apps) ──
export const PROFILE: Profile = {
  displayName: 'pioneer',
  joinedAt: '2025-03-01',
  totalPiVolume: 4820,
  yearsActive: 1,
  scores: {
    merchant: 82,
    creator: 74,
    investor: 61,
    collaborator: 88,
    builder: 70,
    overall: 79,
  },
  achievements: [
    { id: 'ach-500-sales',   title: '500 completed sales',       description: '500 Commerce transactions completed with a 96% completion rate.', source: 'commerce',   verified: true,  earnedAt: '2026-05-12', piValue: 3100 },
    { id: 'ach-epic-legend', title: 'First Legend project',      description: 'Completed an Epic initiative that graduated to LEGEND status.',    source: 'epic',       verified: true,  earnedAt: '2026-06-20' },
    { id: 'ach-fundx-win',   title: 'Profitable investor',       description: '95% success rate across FundX educational pools participated in.',  source: 'fundx',      verified: true,  earnedAt: '2026-04-30', piValue: 620 },
    { id: 'ach-collab-10',   title: '10 collaborations',         description: 'Ten completed collaborations recorded in Connection.',              source: 'connection', verified: false, earnedAt: '2026-06-01' },
    { id: 'ach-zone-early',  title: 'Zone early verifier',       description: 'Among the first verified entities in Zone.',                        source: 'zone',       verified: true,  earnedAt: '2026-02-15' },
  ],
  badges: [
    { id: 'top-merchant',      label: 'Top Merchant',      tone: '#FBBF24' },
    { id: 'verified-creator',  label: 'Verified Creator',  tone: '#8B5CF6' },
    { id: 'community-builder', label: 'Community Builder', tone: '#22C55E' },
    { id: 'zone-pioneer',      label: 'Zone Pioneer',      tone: '#06B6D4' },
  ],
};

export const SOURCE_META: Record<EvidenceSource, { label: string; icon: string }> = {
  commerce:   { label: 'Commerce',   icon: '🛒' },
  assets:     { label: 'Assets',     icon: '🖼️' },
  fundx:      { label: 'FundX',      icon: '💠' },
  epic:       { label: 'Epic',       icon: '🚀' },
  connection: { label: 'Connection', icon: '🤝' },
  zone:       { label: 'Zone',       icon: '✓' },
};

// The reputation dimensions, in display order, mapped to their score key.
export const SCORE_DIMENSIONS: { key: keyof ScoreSet; label: string; from: string }[] = [
  { key: 'merchant',     label: 'Merchant',     from: 'Commerce' },
  { key: 'creator',      label: 'Creator',      from: 'Epic + Assets' },
  { key: 'investor',     label: 'Investor',     from: 'FundX' },
  { key: 'collaborator', label: 'Collaborator', from: 'Connection' },
  { key: 'builder',      label: 'Builder',      from: 'Epic + DX' },
];

export function getAchievement(id: string): Achievement | null {
  return PROFILE.achievements.find((a) => a.id === id) ?? null;
}
