import { describe, it, expect } from 'vitest';
import {
  PROFILE, SCORE_DIMENSIONS, SOURCE_META, getAchievement,
} from '@/lib/legend/profile';

describe('TEC Legend — Reputation Runtime (C-126), read-only V1', () => {
  it('exposes composite + dimensional scores in 0-100 range', () => {
    const s = PROFILE.scores;
    for (const key of ['merchant', 'creator', 'investor', 'collaborator', 'builder', 'overall'] as const) {
      expect(s[key]).toBeGreaterThanOrEqual(0);
      expect(s[key]).toBeLessThanOrEqual(100);
    }
    expect(SCORE_DIMENSIONS.length).toBe(5);   // overall is composite, shown separately
  });

  it('READ LAYER (C-126): every achievement is attributed to a source app (a write layer)', () => {
    // Legend records OUTCOMES not claims — each record must name the source app
    // that produced it (Commerce/Assets/FundX/Epic/Connection/Zone).
    expect(PROFILE.achievements.length).toBeGreaterThan(0);
    for (const a of PROFILE.achievements) {
      expect(SOURCE_META[a.source], a.source).toBeTruthy();
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.earnedAt.length).toBeGreaterThan(0);
    }
  });

  it('verified achievements exist and are marked (Zone-verified milestones)', () => {
    const verified = PROFILE.achievements.filter((a) => a.verified);
    expect(verified.length).toBeGreaterThan(0);
  });

  it('badges carry a label + tone for display', () => {
    for (const b of PROFILE.badges) {
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.tone.length).toBeGreaterThan(0);
    }
  });

  it('getAchievement resolves by id and fails closed for an unknown id', () => {
    expect(getAchievement('ach-500-sales')?.source).toBe('commerce');
    expect(getAchievement('nope')).toBeNull();
  });

  it('covers a spread of evidence sources (commerce · epic · fundx · connection · zone)', () => {
    const sources = new Set(PROFILE.achievements.map((a) => a.source));
    for (const src of ['commerce', 'epic', 'fundx', 'connection', 'zone'] as const) {
      expect(sources.has(src), src).toBe(true);
    }
  });
});
