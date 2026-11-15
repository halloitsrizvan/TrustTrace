import { copy } from "@/lib/copy";
import type {
  AdminClaimDetail, AdminClaimRow, AppNotification, AuditRow, BadgeCode, Claim, ClaimPrompt, ClaimStatus, ItemMatch,
  LeaderRow, PublicItem, PublicProfile, ScoreBreakdown, Tip, TipEligibility, Wallet, WalletEntry,
} from "./types";

// Backend claim scoring (server/src/scoring/scoring.config.ts). Used to turn 0..1 components into points out of 100.
export const CLAIM_WEIGHTS = { proof: 0.55, timeline: 0.2, userTrust: 0.15, behaviour: 0.1 } as const;
export const MAX_ATTEMPTS = 3;
export const COOLDOWN_MINUTES = 10;

type Raw = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" ? v : 0);

/** Backend breakdown is four 0..1 fractions; the UI shows points that add up to the score. */
export function toPoints(b: unknown): ScoreBreakdown {
  const r = (b ?? {}) as Raw;
  const pts = (k: keyof typeof CLAIM_WEIGHTS) => Math.round(num(r[k]) * CLAIM_WEIGHTS[k] * 100);
  return { proof: pts("proof"), timeline: pts("timeline"), history: pts("userTrust"), behaviour: pts("behaviour") };
}

export function toMatch(m: Raw): ItemMatch {
  const b = (m.breakdown ?? {}) as Raw;
  return {
    item: m.item as PublicItem,
    score: Math.round(num(m.score) * 100),
    breakdown: { looks: num(b.sem), area: num(b.place), time: num(b.time) },
  };
}

const notifTitle: Record<string, (p: Raw) => [string, string]> = {
  STRONG_MATCH: () => [copy.notif.types.STRONG_MATCH, copy.notif.types.STRONG_MATCH_BODY],
  CLAIM_STARTED: () => [copy.notif.types.CLAIM_STARTED, copy.notif.types.CLAIM_STARTED_BODY],
  CLAIM_DECISION: (p) => [
    p.decision === "APPROVED" ? copy.notif.types.CLAIM_APPROVED : p.decision === "FLAGGED" ? copy.notif.types.CLAIM_FLAGGED : copy.notif.types.CLAIM_REJECTED,
    copy.notif.types.CLAIM_DECISION_BODY,
  ],
  HANDOVER_COMPLETED: () => [copy.notif.types.HANDOVER_COMPLETED, copy.notif.types.HANDOVER_COMPLETED_BODY],
  RETURN_COMPLETED: () => [copy.notif.types.RETURN_COMPLETED, copy.notif.types.RETURN_COMPLETED_BODY],
  TIP_PROMPT: () => [copy.notif.types.TIP_PROMPT, copy.notif.types.TIP_PROMPT_BODY],
  TIP_RECEIVED: () => [copy.notif.types.TIP_RECEIVED, copy.notif.types.TIP_RECEIVED_BODY],
  BADGE_EARNED: (p) => [copy.notif.types.BADGE_EARNED, copy.badge[String(p.badge)]?.name ?? ""],
};

export function toNotification(n: Raw): AppNotification {
  const payload = (n.payload ?? {}) as Raw;
  const [title, body] = (notifTitle[String(n.type)] ?? (() => [String(n.type), ""]))(payload);
  return {
    id: String(n.id),
    type: String(n.type) as AppNotification["type"],
    title,
    body,
    readAt: (n.readAt as string | null) ?? null,
    createdAt: String(n.createdAt),
    data: {
      itemId: (payload.itemId ?? payload.foundItemId) as string | undefined,
      claimId: payload.claimId as string | undefined,
      badge: payload.badge as BadgeCode | undefined,
    },
  };
}

const MY_STATUS: ClaimStatus[] = ["PENDING", "APPROVED", "FLAGGED", "REJECTED", "EXPIRED", "COLLECTED"];

/** The claim endpoints return foundItemId only, so the caller supplies the item. */
export function toClaim(c: Raw, item: PublicItem): Claim {
  const status = (MY_STATUS.includes(c.status as ClaimStatus) ? c.status : "PENDING") as ClaimStatus;
  const attemptNo = num(c.attemptNo) || 1;
  const rejectedAt = status === "REJECTED" ? new Date(String(c.submittedAt ?? c.createdAt)).getTime() + COOLDOWN_MINUTES * 60_000 : 0;
  return {
    id: String(c.id),
    status,
    foundItem: item,
    createdAt: String(c.createdAt ?? c.startedAt),
    trustScore: c.submittedAt ? num(c.trustScore) : null,
    prompts: (c.prompts as ClaimPrompt[] | undefined) ?? [],
    attemptsLeft: status === "REJECTED" ? Math.max(0, MAX_ATTEMPTS - attemptNo) : undefined,
    retryAfter: rejectedAt > Date.now() ? new Date(rejectedAt).toISOString() : null,
    tokenExpiresAt: (c.tokenExpiresAt as string | null) ?? null,
    decision: status === "APPROVED" || status === "FLAGGED" || status === "REJECTED" ? status : null,
    breakdown: c.submittedAt ? toPoints(c.breakdown) : null,
  };
}

export function toEligibility(e: Raw): TipEligibility {
  const reason = e.reason as string | undefined;
  return {
    eligible: !!e.eligible,
    reason: reason && /already exists/i.test(reason) ? "ALREADY_TIPPED" : reason,
    suggestedAmounts: (e.suggestedAmountsMinor as number[]) ?? [],
    minAmount: num(e.minMinor),
    maxAmount: num(e.maxMinor),
  };
}

export function toTip(t: Raw): Tip {
  const finder = t.finder as { name?: string } | undefined;
  const tipper = t.tipper as { name?: string } | undefined;
  return {
    id: String(t.id ?? t.tipId),
    amount: num(t.amountMinor),
    note: (t.message as string | null) ?? null,
    anonymous: !!t.anonymous,
    status: String(t.status),
    createdAt: String(t.createdAt ?? ""),
    claimId: String(t.claimId ?? ""),
    fromName: t.anonymous ? null : (tipper?.name ?? null),
    toName: finder?.name ?? null,
  };
}

export function toWallet(w: Raw): Wallet {
  const entries = ((w.entries as Raw[]) ?? []).map(
    (e): WalletEntry => ({
      id: String(e.id),
      amount: num(e.amountMinor),
      kind: String(e.type),
      label: copy.profile.reasons[String(e.reason)] ?? String(e.reason),
      createdAt: String(e.createdAt),
    }),
  );
  return { balance: num(w.balanceMinor), ledger: entries };
}

export function toProfile(p: Raw): PublicProfile {
  const badges = ((p.badges as unknown[]) ?? []).map((b) => (typeof b === "string" ? b : (b as Raw).badge)) as BadgeCode[];
  return { id: String(p.id), name: String(p.name), karma: num(p.karma), returns: num(p.returnsCount), badges };
}

export function toLeaders(rows: Raw[]): LeaderRow[] {
  return rows.map((r, i) => ({ ...toProfile(r), rank: i + 1 }));
}

export function toAuditRow(l: Raw): AuditRow {
  return {
    id: String(l.id),
    action: String(l.action),
    actor: l.actorId ? String(l.actorId).slice(0, 8) : copy.admin.system,
    target: `${l.entity} ${String(l.entityId).slice(0, 8)}`,
    createdAt: String(l.createdAt),
  };
}

/** Admin queue rows and review detail both come from GET /admin/claims. */
export function toAdminRow(c: Raw): AdminClaimRow {
  const item = c.foundItem as Raw;
  const claimant = c.claimant as Raw;
  return {
    id: String(c.id),
    status: c.status as ClaimStatus,
    trustScore: num(c.trustScore),
    createdAt: String(c.createdAt),
    claimantName: String(claimant?.name ?? ""),
    itemTitle: String(item?.title ?? ""),
  };
}

export function toAdminDetail(c: Raw): AdminClaimDetail {
  const item = c.foundItem as Raw & { private?: { privateDetails?: string | null } };
  const prompts = (c.prompts as ClaimPrompt[]) ?? [];
  const answers = ((c.answers as { promptId: string; text: string }[]) ?? []).map((a) => ({
    prompt: prompts.find((p) => p.id === a.promptId)?.text ?? a.promptId,
    answer: a.text,
  }));
  const b = (c.breakdown ?? {}) as Raw;
  const pts = toPoints(b);
  const cmp = (key: keyof ScoreBreakdown, max: number, reason: string) => ({ key, value: pts[key], max, reason });
  return {
    ...toAdminRow(c),
    foundItem: item as unknown as PublicItem,
    privateDetails: item.private?.privateDetails ?? null,
    answers,
    components: [
      cmp("proof", 55, copy.admin.reasons.proof),
      cmp("timeline", 20, copy.admin.reasons.timeline),
      cmp("history", 15, copy.admin.reasons.history),
      cmp("behaviour", 10, copy.admin.reasons.behaviour),
    ],
    history: [],
  };
}
