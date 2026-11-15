// Domain types. They follow the backend OpenAPI contract; where Swagger differs, Swagger wins
// (run `npm run gen:api` and compare with schema.d.ts).
export type Role = "STUDENT" | "ADMIN";
export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "OPEN" | "MATCHED" | "CLAIM_PENDING" | "RETURNED" | "CLOSED" | "EXPIRED";
export type ItemCategory = "ID_CARD" | "PHONE" | "BOOK" | "GADGET" | "WALLET" | "KEYS" | "BAG" | "OTHER";
export type ClaimStatus = "PENDING" | "APPROVED" | "FLAGGED" | "REJECTED" | "EXPIRED" | "COLLECTED";
export type Zone =
  | "MAIN_GATE" | "ACADEMIC_BLOCK" | "LIBRARY" | "HOSTELS" | "CAFETERIA"
  | "SPORTS_COMPLEX" | "AUDITORIUM" | "FEST_GROUNDS" | "ADMIN_BLOCK";
export type BadgeCode = "FIRST_RETURN" | "CAMPUS_HERO" | "GUARDIAN" | "GRATEFUL_SOUL" | "GENEROUS";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  trustScore: number;
}
export interface AuthResponse {
  accessToken?: string;
  user: User;
}
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface PublicItem {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: ItemCategory;
  title: string;
  publicDescription: string;
  zone: Zone | string;
  eventTag: string | null;
  occurredAt: string;
  imageUrl: string | null;
  reporterId: string;
  holdLocation: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; name: string };
}
export interface OwnerItem extends PublicItem {
  private: { privateDetails: string | null; privateImageUrl: string | null };
}
export interface ItemPage {
  items: PublicItem[];
  nextCursor: string | null;
}
export interface MatchBreakdown {
  looks: number; // 0..1
  area: number;
  time: number;
}
export interface ItemMatch {
  item: PublicItem;
  score: number; // 0..100
  breakdown: MatchBreakdown;
}
export interface CreateItemInput {
  type: ItemType;
  category: ItemCategory;
  title: string;
  publicDescription: string;
  zone: string;
  eventTag?: string;
  occurredAt: string;
  imageUrl?: string;
  privateDetails?: string;
  holdLocation?: string;
}
export interface CreateItemResponse extends OwnerItem {
  matches: ItemMatch[];
}
export interface SignedUpload {
  signedUrl: string;
  path: string;
  token: string;
  maxBytes: number;
  publicUrl?: string;
}

export interface ClaimPrompt {
  id: string;
  text: string;
  hint?: string;
  allowPhoto?: boolean;
}
export interface ClaimStart {
  claimId: string;
  prompts: ClaimPrompt[];
}
export interface ScoreBreakdown {
  proof: number;
  timeline: number;
  history: number;
  behaviour: number;
}
export type ClaimDecision = "APPROVED" | "FLAGGED" | "REJECTED";
export interface ClaimSubmitResult {
  decision: ClaimDecision;
  trustScore: number;
  breakdown: ScoreBreakdown;
  handoverToken?: string;
  tokenExpiresAt?: string;
  attemptsLeft?: number;
  retryAfter?: string | null;
}
export interface Claim {
  id: string;
  status: ClaimStatus;
  foundItem: PublicItem;
  createdAt: string;
  trustScore?: number | null;
  prompts?: ClaimPrompt[];
  attemptsLeft?: number;
  retryAfter?: string | null;
  tokenExpiresAt?: string | null;
  decision?: ClaimDecision | null;
  breakdown?: ScoreBreakdown | null;
}
export interface QrToken {
  handoverToken: string;
  tokenExpiresAt: string;
}

export interface AppNotification {
  id: string;
  type:
    | "STRONG_MATCH" | "CLAIM_STARTED" | "CLAIM_DECISION" | "HANDOVER_COMPLETED" | "RETURN_COMPLETED"
    | "TIP_PROMPT" | "TIP_RECEIVED" | "BADGE_EARNED";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  data?: { itemId?: string; claimId?: string; badge?: BadgeCode };
}

export interface TipEligibility {
  eligible: boolean;
  reason?: string;
  suggestedAmounts: number[];
  minAmount: number;
  maxAmount: number;
  finderFirstName?: string;
}
export interface Tip {
  id: string;
  amount: number;
  note: string | null;
  anonymous: boolean;
  status: string;
  createdAt: string;
  claimId: string;
  fromName?: string | null;
  toName?: string | null;
}
export interface WalletEntry {
  id: string;
  amount: number;
  kind: string;
  label: string;
  createdAt: string;
}
export interface Wallet {
  balance: number;
  ledger: WalletEntry[];
}

export interface PublicProfile {
  id: string;
  name: string;
  karma: number;
  returns: number;
  badges: BadgeCode[];
}
export interface LeaderRow extends PublicProfile {
  rank: number;
}

export interface AdminClaimRow {
  id: string;
  status: ClaimStatus;
  trustScore: number;
  createdAt: string;
  claimantName: string;
  itemTitle: string;
}
export interface AdminClaimDetail extends AdminClaimRow {
  foundItem: PublicItem;
  privateDetails: string | null;
  answers: { prompt: string; answer: string }[];
  components: { key: keyof ScoreBreakdown; value: number; max: number; reason: string }[];
  history: { id: string; itemTitle: string; status: ClaimStatus; createdAt: string }[];
}
export interface AdminStats {
  itemsReturned: number;
  avgHoursToReturn: number;
  fraudBlocked: number;
  openReviews: number;
  tipConversion: number; // percent
  zones: { key: string; count: number }[];
  hours: { key: string; count: number }[];
  topFinders: { id: string; name: string; returns: number }[];
}
export interface HandoverResult {
  ok: boolean;
  itemTitle?: string;
  ownerFirstName?: string;
  code?: "USED" | "EXPIRED" | "INVALID";
  claimId?: string;
}
export interface AuditRow {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
}
export interface Paged<T> {
  rows: T[];
  nextCursor: string | null;
}
export interface PublicStats {
  itemsReturned: number;
  avgHoursToReturn: number;
}
