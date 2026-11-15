"use client";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch, post } from "./client";
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
export const useItemMatches = (id: string, enabled = true) =>
  useQuery({ queryKey: keys.matches(id), queryFn: () => get<ItemMatch[]>(`/items/${id}/matches`), enabled });
export const useMyItems = () => useQuery({ queryKey: keys.mine, queryFn: () => get<OwnerItem[]>("/items/mine") });
export const useMyClaims = () => useQuery({ queryKey: keys.claims, queryFn: () => get<Claim[]>("/claims/mine") });
export const useClaim = (id: string) =>
  useQuery({ queryKey: keys.claim(id), queryFn: () => get<Claim>(`/claims/${id}`) });

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: CreateItemInput) => post<CreateItemResponse>("/items", b),
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
export const submitClaim = (id: string, answers: { promptId: string; answer: string }[]) =>
  post<ClaimSubmitResult>(`/claims/${id}/submit`, { answers });
export const fetchQr = (id: string) => get<QrToken>(`/claims/${id}/qr`);

export const useNotifications = () =>
  useQuery({ queryKey: keys.notifs, queryFn: () => get<AppNotification[]>("/notifications"), refetchInterval: 60_000 });
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
    queryFn: () => get<TipEligibility>(`/tips/eligibility/${claimId}`),
    enabled,
    retry: false,
  });
export const createTip = (b: { claimId: string; amount: number; note?: string; anonymous: boolean }, key: string) =>
  post<Tip>("/tips", b, { "Idempotency-Key": key });
export const confirmTip = (id: string) => post<Tip>(`/tips/${id}/confirm`);
export const useTipsGiven = () => useQuery({ queryKey: ["tips", "given"], queryFn: () => get<Tip[]>("/tips/mine/given") });
export const useTipsReceived = () =>
  useQuery({ queryKey: ["tips", "received"], queryFn: () => get<Tip[]>("/tips/mine/received") });
export const useWallet = () => useQuery({ queryKey: ["wallet"], queryFn: () => get<Wallet>("/wallet") });

export const useProfile = (id: string) =>
  useQuery({ queryKey: ["profile", id], queryFn: () => get<PublicProfile>(`/users/${id}/public-profile`), retry: false, enabled: !!id });
export const useLeaderboard = (period: "week" | "month" | "all") =>
  useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => get<LeaderRow[]>("/leaderboard/finders", { period }),
  });
export const usePublicStats = () =>
  useQuery({ queryKey: ["public-stats"], queryFn: () => get<PublicStats>("/public/stats"), retry: false });

export const useAdminStats = () => useQuery({ queryKey: ["admin", "stats"], queryFn: () => get<AdminStats>("/admin/stats") });
export const useAdminClaims = () =>
  useQuery({ queryKey: ["admin", "claims"], queryFn: () => get<AdminClaimRow[]>("/admin/claims") });
export const useAdminClaim = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "claim", id],
    queryFn: () => get<AdminClaimDetail>(`/admin/claims/${id}`),
    enabled: !!id,
  });
export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; decision: "APPROVED" | "REJECTED"; note: string }) =>
      post(`/admin/claims/${v.id}/decision`, { decision: v.decision, note: v.note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}
export const scanToken = (token: string) => post<HandoverResult>("/handover/scan", { token });
export const useAdminTips = (page: string | undefined, status: string) =>
  useQuery({
    queryKey: ["admin", "tips", page, status],
    queryFn: () => get<Paged<Tip>>("/admin/tips", { cursor: page, status }),
  });
export const useAdminAudit = (page: string | undefined, q: string) =>
  useQuery({
    queryKey: ["admin", "audit", page, q],
    queryFn: () => get<Paged<AuditRow>>("/admin/audit", { cursor: page, q }),
  });
