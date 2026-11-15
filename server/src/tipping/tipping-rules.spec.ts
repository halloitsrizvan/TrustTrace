import { sanitizeTipMessage } from './message-sanitizer.js';
import { TIPPING_CONFIG } from './tipping.config.js';

describe('tipping rules', () => {
  it('sanitizes HTML, controls, whitespace, and length', () => {
    const value = `<b>Thanks</b>\u0000   ${'x'.repeat(200)}`;
    const result = sanitizeTipMessage(value)!;
    expect(result).not.toContain('<');
    expect(result).not.toContain('\u0000');
    expect(result.length).toBeLessThanOrEqual(140);
  });

  it('defines every monetary constant as integer minor units', () => {
    expect(Number.isInteger(TIPPING_CONFIG.minTipMinor)).toBe(true);
    expect(Number.isInteger(TIPPING_CONFIG.maxTipMinor)).toBe(true);
    expect(Number.isInteger(TIPPING_CONFIG.dailyTipCapMinor)).toBe(true);
    for (const amount of TIPPING_CONFIG.suggestedTipsMinor) {
      expect(Number.isInteger(amount)).toBe(true);
    }
  });
});
