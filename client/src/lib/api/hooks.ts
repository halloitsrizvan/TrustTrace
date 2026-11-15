"use client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, get, patch, post } from "./client";
import {
  MAX_ATTEMPTS, COOLDOWN_MINUTES, toAdminDetail, toAdminRow, toAuditRow, toClaim, toEligibility, toLeaders, toMatch,
  toNotification, toPoints, toProfile, toTip, toWallet,
} from "./adapt";
import type {
  AdminClaimDetail, AdminClaimRow, AdminStats, AppNotification, AuditRow, Claim, ClaimStart, ClaimSubmitResult,
  CreateItemInput, CreateItemResponse, HandoverResult, ItemMatch, ItemPage, LeaderRow, OwnerItem, Paged,
  PublicItem, PublicProfile, PublicStats, QrToken, Tip, TipEligibility, User, Wallet,
} from "./types";

export const keys = {
  me: ["me"] as const,
  items: (f: object) => ["items", f] as const,
  item: (id: string) => ["item", id] as const,
  matches: (id: string) => ["matches", id] as const,
  mine: ["items", "mine"] as const,
  claims: ["claims", "mine"] as const,
  claim: (id: string) => ["claim", id] as const,
  notifs: ["notifications"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => get<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
}

export interface ItemFilters {
  type?: "LOST" | "FOUND";
  category?: string;
  zone?: string;
  eventTag?: string;
  q?: string;
}
export function useItemsFeed(f: ItemFilters) {
  return useInfiniteQuery({
    queryKey: keys.items(f),
    queryFn: ({ pageParam }) => get<ItemPage>("/items", { ...f, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export const useItem = (id: string) =>
  useQuery({ queryKey: keys.item(id), queryFn: () => get<PublicItem | OwnerItem>(`/items/${id}`) });
type Raw = Record<string, unknown>;
export const fetchMatches = async (id: string): Promise<ItemMatch[]> => (await get<Raw[]>(`/items/${id}/matches`)).map(toMatch);
export const useItemMatches = (id: string, enabled = true) =>
  useQuery({ queryKey: keys.matches(id), queryFn: () => fetchMatches(id), enabled });
export const useMyItems = () => useQuery({ queryKey: keys.mine, queryFn: () => get<OwnerItem[]>("/items/mine") });
// Claim endpoints return foundItemId only, so the item is fetched alongside.
const fetchClaim = async (id: string): Promise<Claim> => {
  const c = await get<Raw>(`/claims/${id}`);
  return toClaim(c, await get<PublicItem>(`/items/${String(c.foundItemId)}`));
};
export const useMyClaims = () =>
  useQuery({
    queryKey: keys.claims,
    queryFn: async () => {
      const rows = await get<Raw[]>("/claims/mine");
      return Promise.all(rows.map(async (c) => toClaim(c, await get<PublicItem>(`/items/${String(c.foundItemId)}`))));
    },
  });
export const useClaim = (id: string) => useQuery({ queryKey: keys.claim(id), queryFn: () => fetchClaim(id) });

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: CreateItemInput): Promise<CreateItemResponse> => {
      const r = await post<Raw>("/items", b);
      return { ...(r as unknown as OwnerItem), matches: ((r.matches as Raw[]) ?? []).map(toMatch) };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}
export function useCloseItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<OwnerItem>(`/items/${id}/close`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });
}

export const startClaim = (foundItemId: string, lostItemId?: string) =>
  post<ClaimStart>("/claims/start", { foundItemId, lostItemId });
export const submitClaim = async (id: string, answers: { promptId: string; answer: string }[]): Promise<ClaimSubmitResult> => {
  const r = await post<Raw>(`/claims/${id}/submit`, { answers: answers.map((a) => ({ promptId: a.promptId, text: a.answer })) });
  // Attempt count and token expiry come from the claim itself.
  const c = await get<Raw>(`/claims/${id}`).catch(() => ({}) as Raw);
  const attemptNo = Number(c.attemptNo ?? 1);
  const rejected = r.decision === "REJECTED";
  return {
    decision: r.decision as ClaimSubmitResult["decision"],
    trustScore: Number(r.trustScore),
    breakdown: toPoints(r.breakdown),
    handoverToken: r.handoverToken as string | undefined,
    tokenExpiresAt: (c.tokenExpiresAt as string | undefined) ?? undefined,
    attemptsLeft: rejected ? Math.max(0, MAX_ATTEMPTS - attemptNo) : undefined,
    retryAfter: rejected ? new Date(Date.now() + COOLDOWN_MINUTES * 60_000).toISOString() : null,
  };
};
export const fetchQr = async (id: string): Promise<QrToken> => {
  const q = await get<{ token: string; expiresAt: string }>(`/claims/${id}/qr`);
  return { handoverToken: q.token, tokenExpiresAt: q.expiresAt };
};

export const useNotifications = () =>
  useQuery({
    queryKey: keys.notifs,
    queryFn: async (): Promise<AppNotification[]> => (await get<{ notifications: Raw[] }>("/notifications")).notifications.map(toNotification),
    refetchInterval: 60_000,
  });
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifs }),
  });
}

export const useTipEligibility = (claimId: string, enabled = true) =>
  useQuery({
    queryKey: ["tip-elig", claimId],
    queryFn: async (): Promise<TipEligibility> => toEligibility(await get<Raw>(`/tips/eligibility/${claimId}`)),
    enabled,
    retry: false,
  });
export const createTip = async (b: { claimId: string; amount: number; note?: string; anonymous: boolean }, key: string): Promise<Tip> =>
  toTip(await post<Raw>("/tips", { claimId: b.claimId, amountMinor: b.amount, message: b.note, anonymous: b.anonymous }, { "Idempotency-Key": key }));
export const confirmTip = async (id: string): Promise<Tip> => toTip(await post<Raw>(`/tips/${id}/confirm`));
export const useTipsGiven = () =>
  useQuery({ queryKey: ["tips", "given"], queryFn: async () => (await get<{ items: Raw[] }>("/tips/mine/given")).items.map(toTip) });
export const useTipsReceived = () =>
  useQuery({ queryKey: ["tips", "received"], queryFn: async () => (await get<{ items: Raw[] }>("/tips/mine/received")).items.map(toTip) });
export const useWallet = () => useQuery({ queryKey: ["wallet"], queryFn: async (): Promise<Wallet> => toWallet(await get<Raw>("/wallet")) });

export const useProfile = (id: string) =>
  useQuery({ queryKey: ["profile", id], queryFn: async (): Promise<PublicProfile> => toProfile(await get<Raw>(`/users/${id}/public-profile`)), retry: false, enabled: !!id });
export const useLeaderboard = (period: "week" | "month" | "all") =>
  useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async (): Promise<LeaderRow[]> => toLeaders(await get<Raw[]>("/leaderboard/finders", { period })),
  });
export const usePublicStats = () =>
  useQuery({ queryKey: ["public-stats"], queryFn: () => get<PublicStats>("/public/stats"), retry: false });

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async (): Promise<AdminStats> => {
      const r = await get<Raw>("/admin/stats");
      return {
        itemsReturned: Number(r.reunitedCount), avgHoursToReturn: Number(r.avgHoursToReunite), fraudBlocked: Number(r.fraudBlockedCount),
        openReviews: Number(r.openFlagged), tipConversion: Math.round(Number(r.tipConversionRate) * 100),
        zones: r.zones as AdminStats["zones"], hours: r.hours as AdminStats["hours"],
        topFinders: (r.topFinders as Raw[]).map((f) => ({ id: String(f.id), name: String(f.name), returns: Number(f.returnsCount) })),
      };
    },
  });
// One list feeds both the queue and the review panel; the backend has no single-claim admin endpoint.
const adminClaimsRaw = () => ({ queryKey: ["admin", "claims"], queryFn: () => get<Raw[]>("/admin/claims") });
export const useAdminClaims = () =>
  useQuery({
    ...adminClaimsRaw(),
    select: (rows): AdminClaimRow[] =>
      rows.map(toAdminRow).sort((a, b) => Number(b.status === "FLAGGED") - Number(a.status === "FLAGGED")),
  });
export const useAdminClaim = (id: string | null) =>
  useQuery({
    ...adminClaimsRaw(),
    select: (rows): AdminClaimDetail | null => {
      const c = rows.find((x) => x.id === id);
      return c ? toAdminDetail(c) : null;
    },
    enabled: !!id,
  });
export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: "APPROVED" | "REJECTED"; note: string }) =>
      post(`/admin/claims/${v.id}/decision`, { decision: v.decision === "APPROVED" ? "APPROVE" : "REJECT", note: v.note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
/** Maps the backend handover errors to the three plain failures the desk sees. */
export const scanToken = async (token: string): Promise<HandoverResult> => {
  try {
    const r = await post<{ claimId: string }>("/handover/scan", { token });
    return { ok: true, claimId: r.claimId };
  } catch (e) {
    if (e instanceof ApiError && e.status < 500) {
      const m = e.message.toLowerCase();
      return { ok: false, code: m.includes("already used") ? "USED" : m.includes("expired") ? "EXPIRED" : "INVALID" };
    }
    throw e;
  }
};
export const useAdminTips = (page: string | undefined, status: string) =>
  useQuery({
    queryKey: ["admin", "tips", page, status],
    queryFn: async (): Promise<Paged<Tip>> => {
      const r = await get<{ tips: Raw[]; nextCursor: string | null }>("/admin/tips", { cursor: page, status });
      return { rows: r.tips.map(toTip), nextCursor: r.nextCursor };
    },
  });
export const useAdminAudit = (page: string | undefined, entity: string) =>
  useQuery({
    queryKey: ["admin", "audit", page, entity],
    queryFn: async (): Promise<Paged<AuditRow>> => {
      const r = await get<{ logs: Raw[]; nextCursor: string | null }>("/admin/audit", { cursor: page, entity });
      return { rows: r.logs.map(toAuditRow), nextCursor: r.nextCursor };
    },
  });
