import {
  matchingScore,
  placeScore,
  semanticScore,
  timeScore,
  tokenJaccard,
} from './matching-score.js';

describe('matching scoring', () => {
  it('applies the documented semantic floor', () => {
    expect(semanticScore(0.5)).toBe(0);
    expect(semanticScore(0.75)).toBe(0.5);
    expect(semanticScore(1)).toBe(1);
  });

  it('scores zones and impossible found-before-lost timelines', () => {
    expect(placeScore('LIBRARY', 'LIBRARY')).toBe(1);
    expect(placeScore('LIBRARY', 'ACADEMIC_BLOCK')).toBe(0.5);
    expect(placeScore('LIBRARY', 'SPORTS_COMPLEX')).toBe(0.2);
    expect(
      timeScore(new Date('2026-01-02T12:00:00Z'), new Date('2026-01-02T10:00:00Z')),
    ).toBe(0.3);
  });

  it('combines semantic, place and time signals', () => {
    const result = matchingScore({
      cosine: 1,
      lostZone: 'LIBRARY',
      foundZone: 'LIBRARY',
      lostAt: new Date('2026-01-01T10:00:00Z'),
      foundAt: new Date('2026-01-01T10:00:00Z'),
    });
    expect(result.score).toBe(1);
  });

  it('provides a deterministic lexical fallback', () => {
    expect(tokenJaccard('black phone red case', 'phone with red case')).toBe(0.6);
  });
});
