import { MATCHING_CONFIG, ZONE_ADJACENCY } from './scoring.config.js';

export const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function semanticScore(cosine: number): number {
  return clamp(
    (cosine - MATCHING_CONFIG.semanticFloor) /
      (1 - MATCHING_CONFIG.semanticFloor),
  );
}

export function placeScore(left: string, right: string): number {
  if (left === right) return 1;
  if (ZONE_ADJACENCY[left]?.includes(right)) return 0.5;
  return 0.2;
}

export function timeScore(lostAt: Date, foundAt: Date): number {
  const hours = Math.abs(foundAt.getTime() - lostAt.getTime()) / 3_600_000;
  if (foundAt.getTime() < lostAt.getTime() - 3_600_000) return 0.3;
  return Math.exp(-hours / 24);
}

export function matchingScore(input: {
  cosine: number;
  lostZone: string;
  foundZone: string;
  lostAt: Date;
  foundAt: Date;
}) {
  const breakdown = {
    sem: semanticScore(input.cosine),
    place: placeScore(input.lostZone, input.foundZone),
    time: timeScore(input.lostAt, input.foundAt),
  };
  return {
    score:
      MATCHING_CONFIG.weights.semantic * breakdown.sem +
      MATCHING_CONFIG.weights.place * breakdown.place +
      MATCHING_CONFIG.weights.time * breakdown.time,
    breakdown,
  };
}

export function tokenJaccard(left: string, right: string): number {
  const tokenize = (value: string) =>
    new Set(value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
}
