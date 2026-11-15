import { ItemCategory } from '../generated/prisma/enums.js';
import { clamp, semanticScore } from './matching-score.js';
import { CLAIM_CONFIG } from './scoring.config.js';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in',
  'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with',
]);

const tokens = (value: string) =>
  new Set(
    (value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
      (token) => !STOP_WORDS.has(token),
    ),
  );

export function privateTokenRecall(
  privateDetails: string,
  publicText: string,
  answers: string,
): number {
  const publicTokens = tokens(publicText);
  const answerTokens = tokens(answers);
  const privateOnly = [...tokens(privateDetails)].filter(
    (token) => !publicTokens.has(token),
  );
  if (!privateOnly.length) return 0;
  return privateOnly.filter((token) => answerTokens.has(token)).length / privateOnly.length;
}

export function calculateClaimScore(input: {
  proofCosine: number;
  tokenRecall: number;
  timeline: number;
  userTrust: number;
  behaviour: number;
}) {
  const semProof = semanticScore(input.proofCosine);
  const proof =
    CLAIM_CONFIG.proofSemanticWeight * semProof +
    CLAIM_CONFIG.proofTokenWeight * clamp(input.tokenRecall);
  const total = Math.round(
    100 *
      (CLAIM_CONFIG.weights.proof * proof +
        CLAIM_CONFIG.weights.timeline * clamp(input.timeline) +
        CLAIM_CONFIG.weights.userTrust * clamp(input.userTrust) +
        CLAIM_CONFIG.weights.behaviour * clamp(input.behaviour)),
  );
  return {
    total,
    breakdown: {
      proof,
      timeline: clamp(input.timeline),
      userTrust: clamp(input.userTrust),
      behaviour: clamp(input.behaviour),
    },
  };
}

export function decideClaim(
  proof: number,
  total: number,
  category: ItemCategory,
): 'APPROVED' | 'FLAGGED' | 'REJECTED' {
  if (proof < CLAIM_CONFIG.proofHardReject) return 'REJECTED';
  const sensitive = new Set<ItemCategory>([
    ItemCategory.PHONE,
    ItemCategory.GADGET,
    ItemCategory.ID_CARD,
    ItemCategory.WALLET,
  ]).has(category);
  const threshold = sensitive
    ? CLAIM_CONFIG.sensitiveApprovalThreshold
    : CLAIM_CONFIG.approvalThreshold;
  if (total >= threshold) return 'APPROVED';
  return total >= 40 ? 'FLAGGED' : 'REJECTED';
}
