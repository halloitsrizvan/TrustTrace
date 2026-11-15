export const TIPPING_CONFIG = {
  minTipMinor: 1_000,
  maxTipMinor: 50_000,
  suggestedTipsMinor: [2_000, 5_000, 10_000] as const,
  tipWindowDays: 7,
  dailyTipCapMinor: 100_000,
  pendingTipTtlMinutes: 30,
  karma: { finderReturn: 20, finderTipReceived: 5, tipperTipGiven: 5 },
  pairCooldownDays: 30,
  badges: { firstReturn: 1, campusHero: 5, guardian: 10, gratefulSoul: 1, generous: 5 },
} as const;
