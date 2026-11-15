import { http, HttpResponse, delay } from "msw";
import type {
  AdminClaimDetail, AdminStats, AppNotification, Claim, ItemMatch, LeaderRow, OwnerItem, PublicItem, ScoreBreakdown,
} from "@/lib/api/types";
import { HIGH_VALUE, ZONES } from "@/lib/utils";
import { getDb, IDS, log, resetDb, save, uid, type MClaim, type MItem, type MUser } from "./db";

const P = "*/api/proxy";
const MIN = 60_000;
const PAGE = 8;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MIN = 10;
const TOKEN_MIN = 15;

const err = (status: number, message: string) =>
  HttpResponse.json({ statusCode: status, message, error: "Error" }, { status });

function cookieId() {
  const m = document.cookie.match(/(?:^|; )tt_mock=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function me(): MUser | null {
  const id = cookieId();
  return id ? (getDb().users.find((u) => u.id === id) ?? null) : null;
}
const pub = (u: MUser) => ({ id: u.id, email: u.email, name: u.name, role: u.role, trustScore: u.trustScore });
const name = (id: string) => getDb().users.find((u) => u.id === id)?.name ?? "Unknown";

function toPublic(i: MItem): PublicItem {
  return {
    id: i.id, type: i.type, status: i.status, category: i.category, title: i.title, publicDescription: i.publicDescription,
    zone: i.zone, eventTag: i.eventTag, occurredAt: i.occurredAt, imageUrl: i.imageUrl, reporterId: i.reporterId,
    holdLocation: i.holdLocation, createdAt: i.createdAt, updatedAt: i.updatedAt,
    reporter: { id: i.reporterId, name: name(i.reporterId) },
  };
}
function toOwner(i: MItem): OwnerItem {
  return { ...toPublic(i), private: { privateDetails: i.privateDetails, privateImageUrl: null } };
}

const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
function score(a: MItem, b: MItem): ItemMatch["breakdown"] & { total: number } {
  const ta = tokens(a.title + " " + a.publicDescription);
  const tb = tokens(b.title + " " + b.publicDescription);
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const jac = inter / Math.max(1, new Set([...ta, ...tb]).size);
  const looks = a.category === b.category ? 0.55 + 0.45 * Math.min(1, jac * 2.2) : 0.12 * jac;
  const area = a.zone === b.zone ? 1 : 0.3;
  const dh = Math.abs(new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()) / 3_600_000;
  const time = 1 - Math.min(dh / 72, 1);
  return { looks, area, time, total: Math.round(100 * (0.5 * looks + 0.25 * area + 0.25 * time)) };
}
function matchesFor(i: MItem): ItemMatch[] {
  return getDb()
    .items.filter((o) => o.type !== i.type && o.status === "OPEN" && o.id !== i.id)
    .map((o) => ({ o, s: score(i, o) }))
    .filter((x) => x.s.total >= 35)
    .sort((a, b) => b.s.total - a.s.total)
    .slice(0, 5)
    .map(({ o, s }) => ({ item: toPublic(o), score: s.total, breakdown: { looks: s.looks, area: s.area, time: s.time } }));
}

function notify(userId: string, n: Omit<AppNotification, "id" | "readAt" | "createdAt">) {
  getDb().notifs.unshift({ ...n, id: uid(), userId, readAt: null, createdAt: new Date().toISOString() });
}

function toClaim(c: MClaim): Claim {
  const item = getDb().items.find((i) => i.id === c.foundItemId)!;
  const mine = getDb().claims.filter((x) => x.userId === c.userId && x.foundItemId === c.foundItemId && x.status === "REJECTED");
  const lastRej = mine.at(-1);
  const retry = lastRej ? new Date(new Date(lastRej.createdAt).getTime() + COOLDOWN_MIN * MIN) : null;
  return {
    id: c.id, status: c.status, foundItem: toPublic(item), createdAt: c.createdAt, trustScore: c.trustScore,
    prompts: item.prompts, attemptsLeft: Math.max(0, MAX_ATTEMPTS - mine.length),
    retryAfter: retry && retry.getTime() > Date.now() ? retry.toISOString() : null,
    tokenExpiresAt: c.tokenExpiresAt, decision: c.decision, breakdown: c.breakdown,
  };
}

function issueToken(c: MClaim) {
  c.token = `TT-${uid().replace(/-/g, "").slice(0, 20).toUpperCase()}`;
  c.tokenExpiresAt = new Date(Date.now() + TOKEN_MIN * MIN).toISOString();
}

function scoreClaim(user: MUser, item: MItem, answers: MClaim["answers"]): { total: number; b: ScoreBreakdown; decision: "APPROVED" | "FLAGGED" | "REJECTED" } {
  const text = answers.map((a) => a.answer).join(" ").toLowerCase();
  const kws = item.keywords.length ? item.keywords : [...tokens(item.privateDetails ?? "")];
  const hits = kws.filter((k) => text.includes(k)).length;
  const proof = Math.min(50, hits * (item.keywords.length > 6 ? 10 : 17));
  const lost = getDb().items.find((l) => l.type === "LOST" && l.reporterId === user.id && l.category === item.category);
  const timeline = lost && new Date(lost.createdAt) < new Date(item.createdAt) ? 20 : 0;
  const history = Math.round((user.trustScore / 100) * 20);
  const behaviour = answers.every((a) => a.answer.trim().length >= 5) ? 10 : 4;
  const total = proof + timeline + history + behaviour;
  const threshold = HIGH_VALUE.includes(item.category) ? 75 : 70;
  const decision = total >= threshold ? "APPROVED" : total >= 40 ? "FLAGGED" : "REJECTED";
  return { total, b: { proof, timeline, history, behaviour }, decision };
}

function award(userId: string) {
  const d = getDb();
  const u = d.users.find((x) => x.id === userId);
  if (!u) return;
  const count = d.returns.filter((r) => r.finderId === userId).length;
  const add = (b: MUser["badges"][number]) => {
    if (!u.badges.includes(b)) {
      u.badges.push(b);
      notify(userId, { type: "BADGE_EARNED", title: "You earned a badge", body: b.replace("_", " ").toLowerCase(), data: { badge: b } });
    }
  };
  if (count >= 1) add("FIRST_RETURN");
  if (count >= 5) add("CAMPUS_HERO");
}

function paged<T>(rows: T[], cursor: string | null) {
  const start = cursor ? parseInt(cursor, 10) : 0;
  const slice = rows.slice(start, start + PAGE);
  return { rows: slice, nextCursor: start + PAGE < rows.length ? String(start + PAGE) : null };
}

export const handlers = [
  // ---- auth (BFF routes in real mode; here the browser answers itself)
  http.post("*/api/auth/login", async ({ request }) => {
    const b = (await request.json()) as { email: string; password: string };
    const u = getDb().users.find((x) => x.email.toLowerCase() === b.email.toLowerCase());
    if (!u || u.password !== b.password) return err(401, "Invalid credentials");
    document.cookie = `tt_mock=${u.id}; path=/; samesite=lax`;
    log("login", u.name, "session");
    save();
    return HttpResponse.json({ user: pub(u) });
  }),
  http.post("*/api/auth/register", async ({ request }) => {
    const b = (await request.json()) as { email: string; password: string; name: string };
    const d = getDb();
    if (d.users.some((x) => x.email.toLowerCase() === b.email.toLowerCase())) return err(409, "Email already registered");
    const u: MUser = { id: uid(), email: b.email, name: b.name, password: b.password, role: "STUDENT", trustScore: 50, karma: 0, badges: [], wallet: 0 };
    d.users.push(u);
    document.cookie = `tt_mock=${u.id}; path=/; samesite=lax`;
    save();
    return HttpResponse.json({ user: pub(u) }, { status: 201 });
  }),
  http.post("*/api/auth/logout", () => {
    document.cookie = "tt_mock=; path=/; max-age=0";
    return HttpResponse.json({ ok: true });
  }),
  http.get(`${P}/auth/me`, () => {
    const u = me();
    return u ? HttpResponse.json(pub(u)) : err(401, "Unauthorized");
  }),

  // ---- uploads
  http.post(`${P}/uploads/sign`, async ({ request }) => {
    const b = (await request.json()) as { contentType: string; purpose: string };
    const path = `${b.purpose}/${cookieId()}/${uid()}.jpg`;
    return HttpResponse.json({ signedUrl: `https://mock.local/upload/${path}`, path, token: "mock", maxBytes: 5_242_880 });
  }),
  http.put("https://mock.local/upload/*", () => new HttpResponse(null, { status: 200 })),

  // ---- items
  http.get(`${P}/items/mine`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json(getDb().items.filter((i) => i.reporterId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toOwner));
  }),
  http.get(`${P}/items/:id/matches`, ({ params }) => {
    const i = getDb().items.find((x) => x.id === params.id);
    if (!i) return err(404, "Item not found");
    return HttpResponse.json(matchesFor(i));
  }),
  http.get(`${P}/items/:id`, ({ params }) => {
    const i = getDb().items.find((x) => x.id === params.id);
    if (!i) return err(404, "Item not found");
    return HttpResponse.json(me()?.id === i.reporterId ? toOwner(i) : toPublic(i));
  }),
  http.get(`${P}/items`, async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const q = url.searchParams;
    let rows = getDb().items.filter((i) => i.status !== "CLOSED");
    if (q.get("type")) rows = rows.filter((i) => i.type === q.get("type"));
    if (q.get("category")) rows = rows.filter((i) => i.category === q.get("category"));
    if (q.get("zone")) rows = rows.filter((i) => i.zone === q.get("zone"));
    if (q.get("eventTag")) rows = rows.filter((i) => i.eventTag === q.get("eventTag"));
    const text = q.get("q")?.trim();
    if (text) {
      const t = tokens(text);
      rows = rows
        .map((i) => ({ i, s: [...tokens(i.title + " " + i.publicDescription + " " + i.category)].filter((w) => t.has(w)).length }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.i);
    } else rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const limit = Number(q.get("limit") ?? 20);
    const start = q.get("cursor") ? rows.findIndex((r) => r.id === q.get("cursor")) + 1 : 0;
    const slice = rows.slice(start, start + limit);
    return HttpResponse.json({ items: slice.map(toPublic), nextCursor: start + limit < rows.length ? slice.at(-1)!.id : null });
  }),
  http.post(`${P}/items`, async ({ request }) => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    const b = (await request.json()) as Partial<MItem> & { type: MItem["type"] };
    const now = new Date().toISOString();
    const base = getDb().items.find((i) => i.category === b.category && i.type === "FOUND" && i.keywords.length);
    const it: MItem = {
      id: uid(), type: b.type, status: "OPEN", category: b.category!, title: b.title!, publicDescription: b.publicDescription!,
      zone: b.zone!, eventTag: b.eventTag ?? null, occurredAt: b.occurredAt ?? now, imageUrl: b.imageUrl ?? null, reporterId: u.id,
      holdLocation: b.holdLocation ?? null, createdAt: now, updatedAt: now, privateDetails: b.privateDetails ?? null, keywords: [],
      prompts: base?.prompts ?? [
        { id: "p1", text: "Describe any marks, damage or stickers on it.", hint: "Think about the front, back and edges." },
        { id: "p2", text: "What is inside it, attached to it, or saved on it?", hint: "Contents, charms or saved items.", allowPhoto: true },
        { id: "p3", text: "When did you last use it, and where were you?", hint: "Say what you were doing." },
      ],
    };
    getDb().items.unshift(it);
    log("item.create", u.name, it.title);
    const matches = matchesFor(it);
    if (it.type === "FOUND") {
      for (const m of matches) {
        if (m.item.reporterId !== u.id) notify(m.item.reporterId, { type: "MATCH_FOUND", title: "A possible match for your report", body: it.title, data: { itemId: it.id } });
      }
    }
    save();
    return HttpResponse.json({ ...toOwner(it), matches }, { status: 201 });
  }),
  http.patch(`${P}/items/:id/close`, ({ params }) => {
    const u = me();
    const it = getDb().items.find((i) => i.id === params.id);
    if (!u || !it) return err(404, "Item not found");
    if (it.reporterId !== u.id) return err(403, "Not your item");
    it.status = "CLOSED";
    log("item.close", u.name, it.title);
    save();
    return HttpResponse.json(toOwner(it));
  }),

  // ---- claims
  http.post(`${P}/claims/start`, async ({ request }) => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    const b = (await request.json()) as { foundItemId: string };
    const d = getDb();
    const it = d.items.find((i) => i.id === b.foundItemId);
    if (!it || it.type !== "FOUND" || it.status !== "OPEN") return err(404, "This item can't be claimed");
    if (it.reporterId === u.id) return err(403, "You reported this item");
    const rejected = d.claims.filter((c) => c.userId === u.id && c.foundItemId === it.id && c.status === "REJECTED");
    if (rejected.length >= MAX_ATTEMPTS) return err(429, "No attempts left on this item");
    const last = rejected.at(-1);
    if (last && Date.now() - new Date(last.createdAt).getTime() < COOLDOWN_MIN * MIN) {
      return err(429, `Try again after ${new Date(new Date(last.createdAt).getTime() + COOLDOWN_MIN * MIN).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`);
    }
    let c = d.claims.find((x) => x.userId === u.id && x.foundItemId === it.id && x.status === "PENDING");
    if (!c) {
      c = { id: uid(), userId: u.id, foundItemId: it.id, status: "PENDING", createdAt: new Date().toISOString(), answers: [], trustScore: null, breakdown: null, decision: null, token: null, tokenExpiresAt: null };
      d.claims.push(c);
      log("claim.start", u.name, it.title);
    }
    save();
    return HttpResponse.json({ claimId: c.id, prompts: it.prompts });
  }),
  http.post(`${P}/claims/:id/submit`, async ({ params, request }) => {
    const u = me();
    const d = getDb();
    const c = d.claims.find((x) => x.id === params.id);
    if (!u || !c || c.userId !== u.id) return err(404, "Claim not found");
    if (c.status !== "PENDING") return err(409, "This claim already has a result");
    const b = (await request.json()) as { answers: MClaim["answers"] };
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    await delay(500);
    const r = scoreClaim(u, it, b.answers);
    c.answers = b.answers;
    c.trustScore = r.total;
    c.breakdown = r.b;
    c.decision = r.decision;
    c.status = r.decision;
    if (r.decision === "APPROVED") {
      issueToken(c);
      it.status = "CLAIM_PENDING";
    }
    if (r.decision === "FLAGGED") it.status = "CLAIM_PENDING";
    log(`claim.${r.decision.toLowerCase()}`, u.name, `${it.title} (score ${r.total})`);
    notify(u.id, { type: "CLAIM_RESULT", title: r.decision === "APPROVED" ? "Claim verified" : r.decision === "FLAGGED" ? "Claim with the desk" : "Claim not verified", body: it.title, data: { claimId: c.id } });
    save();
    const mine = d.claims.filter((x) => x.userId === u.id && x.foundItemId === it.id && x.status === "REJECTED");
    return HttpResponse.json({
      decision: r.decision, trustScore: r.total, breakdown: r.b,
      handoverToken: c.token ?? undefined, tokenExpiresAt: c.tokenExpiresAt ?? undefined,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - mine.length),
      retryAfter: r.decision === "REJECTED" ? new Date(Date.now() + COOLDOWN_MIN * MIN).toISOString() : null,
    });
  }),
  http.get(`${P}/claims/mine`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json(getDb().claims.filter((c) => c.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toClaim));
  }),
  http.get(`${P}/claims/:id/qr`, ({ params }) => {
    const u = me();
    const c = getDb().claims.find((x) => x.id === params.id);
    if (!u || !c || c.userId !== u.id) return err(404, "Claim not found");
    if (c.status !== "APPROVED") return err(409, "This claim has no active code");
    issueToken(c);
    save();
    return HttpResponse.json({ handoverToken: c.token, tokenExpiresAt: c.tokenExpiresAt });
  }),
  http.get(`${P}/claims/:id`, ({ params }) => {
    const u = me();
    const c = getDb().claims.find((x) => x.id === params.id);
    if (!u || !c || (c.userId !== u.id && u.role !== "ADMIN")) return err(404, "Claim not found");
    return HttpResponse.json(toClaim(c));
  }),

  // ---- handover
  http.post(`${P}/handover/scan`, async ({ request }) => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const b = (await request.json()) as { token: string };
    const d = getDb();
    const c = d.claims.find((x) => x.token === b.token?.trim());
    if (!c) {
      const used = d.claims.some((x) => x.status === "COLLECTED");
      return HttpResponse.json({ ok: false, code: used && b.token?.startsWith("USED-") ? "USED" : "INVALID" });
    }
    if (c.status === "COLLECTED") return HttpResponse.json({ ok: false, code: "USED" });
    if (c.tokenExpiresAt && new Date(c.tokenExpiresAt).getTime() < Date.now()) return HttpResponse.json({ ok: false, code: "EXPIRED" });
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    c.status = "COLLECTED";
    it.status = "RETURNED";
    d.items.filter((i) => i.type === "LOST" && i.reporterId === c.userId && i.category === it.category).forEach((i) => (i.status = "RETURNED"));
    d.returns.push({ finderId: it.reporterId, at: new Date().toISOString() });
    const finder = d.users.find((x) => x.id === it.reporterId);
    if (finder) finder.karma += 40;
    const owner = d.users.find((x) => x.id === c.userId)!;
    log("handover", u.name, `${it.title} to ${owner.name}`);
    notify(c.userId, { type: "HANDOVER_DONE", title: "Handed over", body: it.title, data: { claimId: c.id } });
    notify(c.userId, { type: "TIP_PROMPT", title: "Say thanks to the finder", body: "A small tip is optional.", data: { claimId: c.id } });
    award(it.reporterId);
    save();
    return HttpResponse.json({ ok: true, itemTitle: it.title, ownerFirstName: owner.name.split(" ")[0] });
  }),

  // ---- notifications
  http.get(`${P}/notifications`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json(getDb().notifs.filter((n) => n.userId === u.id).map(({ userId: _u, ...n }) => n));
  }),
  http.patch(`${P}/notifications/:id/read`, ({ params }) => {
    const n = getDb().notifs.find((x) => x.id === params.id);
    if (n && !n.readAt) n.readAt = new Date().toISOString();
    save();
    return HttpResponse.json({ ok: true });
  }),

  // ---- tips
  http.get(`${P}/tips/eligibility/:claimId`, ({ params }) => {
    const u = me();
    const d = getDb();
    const c = d.claims.find((x) => x.id === params.claimId);
    if (!u || !c || c.userId !== u.id) return err(404, "Claim not found");
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    const base = { suggestedAmounts: [2000, 5000, 10000], minAmount: 1000, maxAmount: 100000, finderFirstName: it.reporterId ? name(it.reporterId).split(" ")[0] : undefined };
    if (c.status !== "COLLECTED") return HttpResponse.json({ ...base, eligible: false, reason: "NOT_COLLECTED" });
    if (d.tips.some((t) => t.claimId === c.id && t.fromId === u.id)) return HttpResponse.json({ ...base, eligible: false, reason: "ALREADY_TIPPED" });
    return HttpResponse.json({ ...base, eligible: true });
  }),
  http.post(`${P}/tips`, async ({ request }) => {
    const u = me();
    const d = getDb();
    if (!u) return err(401, "Unauthorized");
    const key = request.headers.get("idempotency-key") ?? "";
    const b = (await request.json()) as { claimId: string; amount: number; note?: string; anonymous: boolean };
    const prev = d.tips.find((t) => t.key === key);
    if (prev) return HttpResponse.json(tipOut(prev.id));
    if (d.tips.some((t) => t.claimId === b.claimId && t.fromId === u.id)) return err(409, "You already sent thanks for this claim");
    const c = d.claims.find((x) => x.id === b.claimId);
    if (!c || c.userId !== u.id || c.status !== "COLLECTED") return err(422, "Not eligible");
    if (b.amount < 1000 || b.amount > 100000) return err(400, "Amount out of range");
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    const t = { id: uid(), claimId: c.id, fromId: u.id, toId: it.reporterId, amount: b.amount, note: b.note?.slice(0, 140) || null, anonymous: !!b.anonymous, status: "PENDING" as const, createdAt: new Date().toISOString(), key };
    d.tips.push(t);
    save();
    return HttpResponse.json(tipOut(t.id), { status: 201 });
  }),
  http.post(`${P}/tips/:id/confirm`, ({ params }) => {
    const d = getDb();
    const t = d.tips.find((x) => x.id === params.id);
    if (!t) return err(404, "Tip not found");
    if (t.status === "PENDING") {
      t.status = "CONFIRMED";
      const finder = d.users.find((x) => x.id === t.toId);
      if (finder) {
        finder.wallet += t.amount;
        finder.karma += 15;
      }
      const giver = d.users.find((x) => x.id === t.fromId);
      if (giver && !giver.badges.includes("GRATEFUL_SOUL")) {
        giver.badges.push("GRATEFUL_SOUL");
        notify(giver.id, { type: "BADGE_EARNED", title: "You earned a badge", body: "Grateful soul", data: { badge: "GRATEFUL_SOUL" } });
      }
      d.ledger.push({ id: uid(), userId: t.toId, amount: t.amount, kind: "TIP", label: "Thanks received", createdAt: new Date().toISOString() });
      notify(t.toId, { type: "TIP_RECEIVED", title: "Thanks received", body: t.anonymous ? "From a grateful owner" : `From ${name(t.fromId)}`, data: { claimId: t.claimId } });
      log("tip.confirm", name(t.fromId), `${t.amount} paise`);
      save();
    }
    return HttpResponse.json(tipOut(t.id));
  }),
  http.get(`${P}/tips/mine/given`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json(getDb().tips.filter((t) => t.fromId === u.id).map((t) => tipOut(t.id, true)));
  }),
  http.get(`${P}/tips/mine/received`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json(getDb().tips.filter((t) => t.toId === u.id && t.status === "CONFIRMED").map((t) => tipOut(t.id, true)));
  }),
  http.get(`${P}/wallet`, () => {
    const u = me();
    if (!u) return err(401, "Unauthorized");
    return HttpResponse.json({ balance: u.wallet, ledger: getDb().ledger.filter((l) => l.userId === u.id).map(({ userId: _u, ...l }) => l).reverse() });
  }),

  // ---- recognition
  http.get(`${P}/users/:id/public-profile`, ({ params }) => {
    const u = getDb().users.find((x) => x.id === params.id);
    if (!u) return err(404, "Not found");
    return HttpResponse.json({ id: u.id, name: u.name, karma: u.karma, badges: u.badges, returns: getDb().returns.filter((r) => r.finderId === u.id).length });
  }),
  http.get(`${P}/leaderboard/finders`, ({ request }) => {
    const period = new URL(request.url).searchParams.get("period") ?? "all";
    const span = period === "week" ? 7 : period === "month" ? 30 : 100000;
    const d = getDb();
    const rows = d.users
      .map((u) => ({ id: u.id, name: u.name, karma: u.karma, badges: u.badges, returns: d.returns.filter((r) => r.finderId === u.id && Date.now() - new Date(r.at).getTime() < span * 86_400_000).length }))
      .filter((r) => r.returns > 0)
      .sort((a, b) => b.returns - a.returns || b.karma - a.karma)
      .map((r, i): LeaderRow => ({ ...r, rank: i + 1 }));
    return HttpResponse.json(rows);
  }),
  http.get(`${P}/public/stats`, () => {
    const d = getDb();
    return HttpResponse.json({ itemsReturned: d.returns.length, avgHoursToReturn: 14 });
  }),

  // ---- admin
  http.get(`${P}/admin/stats`, () => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const d = getDb();
    const hotspots: AdminStats["hotspots"] = [];
    ZONES.forEach((z, zi) => {
      for (let h = 8; h <= 20; h++) {
        const n = ((zi * 7 + h * 3) % 6) + (z === "LIBRARY" && h >= 14 && h <= 17 ? 5 : 0) + (z === "FEST_GROUNDS" && h >= 16 ? 4 : 0);
        hotspots.push({ zone: z, hour: h, count: n });
      }
    });
    const top = [...d.users].map((x) => ({ id: x.id, name: x.name, returns: d.returns.filter((r) => r.finderId === x.id).length })).filter((x) => x.returns > 0).sort((a, b) => b.returns - a.returns).slice(0, 5);
    const stats: AdminStats = {
      itemsReturned: d.returns.length, avgHoursToReturn: 14.2,
      fraudBlocked: 4 + d.claims.filter((c) => c.status === "REJECTED").length,
      openReviews: d.claims.filter((c) => c.status === "FLAGGED").length,
      tipConversion: d.tips.length ? Math.round((d.tips.filter((t) => t.status === "CONFIRMED").length / Math.max(1, d.returns.length)) * 100) : 31,
      hotspots, topFinders: top,
    };
    return HttpResponse.json(stats);
  }),
  http.get(`${P}/admin/claims`, () => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const d = getDb();
    const rank = (s: string) => (s === "FLAGGED" ? 0 : s === "PENDING" ? 1 : 2);
    return HttpResponse.json(
      [...d.claims]
        .filter((c) => c.trustScore !== null)
        .sort((a, b) => rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt))
        .map((c) => ({ id: c.id, status: c.status, trustScore: c.trustScore!, createdAt: c.createdAt, claimantName: name(c.userId), itemTitle: d.items.find((i) => i.id === c.foundItemId)!.title })),
    );
  }),
  http.get(`${P}/admin/claims/:id`, ({ params }) => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const d = getDb();
    const c = d.claims.find((x) => x.id === params.id);
    if (!c) return err(404, "Claim not found");
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    const b = c.breakdown!;
    const detail: AdminClaimDetail = {
      id: c.id, status: c.status, trustScore: c.trustScore!, createdAt: c.createdAt, claimantName: name(c.userId), itemTitle: it.title,
      foundItem: toPublic(it), privateDetails: it.privateDetails,
      answers: it.prompts.map((p) => ({ prompt: p.text, answer: c.answers.find((a) => a.promptId === p.id)?.answer ?? "" })),
      components: [
        { key: "proof", value: b.proof, max: 50, reason: b.proof >= 35 ? "Answers match several of the finder's notes" : b.proof > 0 ? "Answers match some of the finder's notes" : "Answers do not match the finder's notes" },
        { key: "timeline", value: b.timeline, max: 20, reason: b.timeline ? "Claimant reported a lost item before this was found" : "No earlier lost report in this category" },
        { key: "history", value: b.history, max: 20, reason: "Based on the claimant's account trust score" },
        { key: "behaviour", value: b.behaviour, max: 10, reason: b.behaviour >= 10 ? "Answers were complete" : "Some answers were very short" },
      ],
      history: d.claims.filter((x) => x.userId === c.userId && x.id !== c.id).map((x) => ({ id: x.id, itemTitle: d.items.find((i) => i.id === x.foundItemId)!.title, status: x.status, createdAt: x.createdAt })),
    };
    return HttpResponse.json(detail);
  }),
  http.post(`${P}/admin/claims/:id/decision`, async ({ params, request }) => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const b = (await request.json()) as { decision: "APPROVED" | "REJECTED"; note: string };
    const d = getDb();
    const c = d.claims.find((x) => x.id === params.id);
    if (!c) return err(404, "Claim not found");
    if (!b.note?.trim()) return err(400, "A note is required");
    c.status = b.decision;
    c.decision = b.decision;
    c.note = b.note;
    const it = d.items.find((i) => i.id === c.foundItemId)!;
    if (b.decision === "APPROVED") issueToken(c);
    else it.status = "OPEN";
    log(`admin.${b.decision.toLowerCase()}`, u.name, it.title);
    notify(c.userId, { type: "CLAIM_RESULT", title: b.decision === "APPROVED" ? "Claim verified" : "Claim not verified", body: it.title, data: { claimId: c.id } });
    save();
    return HttpResponse.json({ ok: true });
  }),
  http.get(`${P}/admin/tips`, ({ request }) => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const sp = new URL(request.url).searchParams;
    let rows = getDb().tips.map((t) => tipOut(t.id, true));
    if (sp.get("status")) rows = rows.filter((t) => t.status === sp.get("status"));
    return HttpResponse.json(paged(rows.reverse(), sp.get("cursor")));
  }),
  http.get(`${P}/admin/audit`, ({ request }) => {
    const u = me();
    if (!u || u.role !== "ADMIN") return err(403, "Staff only");
    const sp = new URL(request.url).searchParams;
    const q = sp.get("q")?.toLowerCase();
    let rows = getDb().audit;
    if (q) rows = rows.filter((r) => `${r.action} ${r.actor} ${r.target}`.toLowerCase().includes(q));
    return HttpResponse.json(paged(rows, sp.get("cursor")));
  }),
  http.post(`${P}/__reset`, () => {
    resetDb();
    return HttpResponse.json({ ok: true });
  }),
];

function tipOut(id: string, withNames = false) {
  const d = getDb();
  const t = d.tips.find((x) => x.id === id)!;
  return {
    id: t.id, amount: t.amount, note: t.note, anonymous: t.anonymous, status: t.status, createdAt: t.createdAt, claimId: t.claimId,
    ...(withNames ? { fromName: t.anonymous ? null : name(t.fromId), toName: name(t.toId) } : {}),
  };
}
void IDS;
