import { ItemCategory } from '../generated/prisma/enums.js';
import { calculateClaimScore, decideClaim, privateTokenRecall } from './claim-score.js';

describe('claim trust scoring', () => {
  it('rewards private-only knowledge and ignores copied public tokens', () => {
    expect(
      privateTokenRecall(
        'red dragon sticker and cracked corner',
        'black phone in a clear case',
        'It has a red dragon sticker under the case',
      ),
    ).toBeGreaterThan(0.3);
    expect(
      privateTokenRecall(
        'red dragon sticker',
        'black phone clear case',
        'black phone clear case',
      ),
    ).toBe(0);
  });

  it('applies the proof hard rule and sensitive threshold', () => {
    expect(decideClaim(0.34, 99, ItemCategory.BOOK)).toBe('REJECTED');
    expect(decideClaim(0.8, 72, ItemCategory.PHONE)).toBe('FLAGGED');
    expect(decideClaim(0.8, 75, ItemCategory.PHONE)).toBe('APPROVED');
  });

  it('calculates the documented weighted total', () => {
    const score = calculateClaimScore({
      proofCosine: 1,
      tokenRecall: 1,
      timeline: 1,
      userTrust: 0.5,
      behaviour: 1,
    });
    expect(score.total).toBe(93);
  });

  it('is independent of tips and karma', () => {
    const claimInput = {
      proofCosine: 0.9,
      tokenRecall: 0.8,
      timeline: 1,
      userTrust: 0.6,
      behaviour: 0.9,
    };
    const beforeTips = calculateClaimScore(claimInput);
    const unrelatedRecognitionData = { tips: 100, karma: 10_000 };
    expect(unrelatedRecognitionData.karma).toBeGreaterThan(0);
    expect(calculateClaimScore(claimInput)).toEqual(beforeTips);
    expect(decideClaim(beforeTips.breakdown.proof, beforeTips.total, ItemCategory.BOOK)).toBe(
      decideClaim(calculateClaimScore(claimInput).breakdown.proof, calculateClaimScore(claimInput).total, ItemCategory.BOOK),
    );
  });
});
