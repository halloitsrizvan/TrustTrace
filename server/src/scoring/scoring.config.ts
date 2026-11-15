export const MATCHING_CONFIG = {
  candidateLimit: 20,
  semanticFloor: 0.5,
  weights: { semantic: 0.6, place: 0.25, time: 0.15 },
  storeThreshold: 0.45,
  notifyThreshold: 0.6,
} as const;

export const ZONE_ADJACENCY: Readonly<Record<string, readonly string[]>> = {
  MAIN_GATE: ['ADMIN_BLOCK', 'FEST_GROUNDS'],
  ACADEMIC_BLOCK: ['LIBRARY', 'ADMIN_BLOCK', 'AUDITORIUM'],
  LIBRARY: ['ACADEMIC_BLOCK', 'CAFETERIA'],
  HOSTELS: ['CAFETERIA', 'SPORTS_COMPLEX'],
  CAFETERIA: ['LIBRARY', 'HOSTELS', 'FEST_GROUNDS'],
  SPORTS_COMPLEX: ['HOSTELS', 'FEST_GROUNDS'],
  AUDITORIUM: ['ACADEMIC_BLOCK', 'FEST_GROUNDS'],
  FEST_GROUNDS: ['MAIN_GATE', 'CAFETERIA', 'SPORTS_COMPLEX', 'AUDITORIUM'],
  ADMIN_BLOCK: ['MAIN_GATE', 'ACADEMIC_BLOCK'],
};

export const CLAIM_CONFIG = {
  weights: { proof: 0.55, timeline: 0.2, userTrust: 0.15, behaviour: 0.1 },
  proofSemanticWeight: 0.7,
  proofTokenWeight: 0.3,
  proofHardReject: 0.35,
  approvalThreshold: 70,
  sensitiveApprovalThreshold: 75,
  copycatCosine: 0.85,
  tokenTtlHours: 24,
  maxAttempts: 3,
  cooldownMinutes: 10,
  maxActiveClaims: 5,
} as const;
