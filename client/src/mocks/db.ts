import type {
  AppNotification, BadgeCode, ClaimPrompt, ClaimStatus, ItemCategory, ItemStatus, ItemType, ScoreBreakdown, User,
} from "@/lib/api/types";

// In-memory fixture database for mock mode. Persisted to sessionStorage so reloads keep the demo state.
export interface MUser extends User {
  password: string;
  karma: number;
  badges: BadgeCode[];
  wallet: number;
}
export interface MItem {
  id: string;
  type: ItemType;
  status: ItemStatus;
  category: ItemCategory;
  title: string;
  publicDescription: string;
  zone: string;
  eventTag: string | null;
  occurredAt: string;
  imageUrl: string | null;
  reporterId: string;
  holdLocation: string | null;
  createdAt: string;
  updatedAt: string;
  privateDetails: string | null;
  keywords: string[];
  prompts: ClaimPrompt[];
}
export interface MClaim {
  id: string;
  userId: string;
  foundItemId: string;
  status: ClaimStatus;
  createdAt: string;
  answers: { promptId: string; answer: string }[];
  trustScore: number | null;
  breakdown: ScoreBreakdown | null;
  decision: "APPROVED" | "FLAGGED" | "REJECTED" | null;
  token: string | null;
  tokenExpiresAt: string | null;
  note?: string;
}
export interface MTip {
  id: string;
  claimId: string;
  fromId: string;
  toId: string;
  amount: number;
  note: string | null;
  anonymous: boolean;
  status: "PENDING" | "CONFIRMED";
  createdAt: string;
  key: string;
}
export interface MLedger { id: string; userId: string; amount: number; kind: string; label: string; createdAt: string }
export interface MAudit { id: string; action: string; actor: string; target: string; createdAt: string }
export interface MNotif extends AppNotification { userId: string }

export interface DB {
  users: MUser[];
  items: MItem[];
  claims: MClaim[];
  notifs: MNotif[];
  tips: MTip[];
  ledger: MLedger[];
  audit: MAudit[];
  returns: { finderId: string; at: string }[];
}

const KEY = "tt-mock-db";
const H = 3_600_000;
const ago = (h: number) => new Date(Date.now() - h * H).toISOString();
export const uid = () => crypto.randomUUID();

const GENERIC_PROMPTS: ClaimPrompt[] = [
  { id: "p1", text: "Describe any marks, damage or stickers on it.", hint: "Think about the front, back and edges." },
  { id: "p2", text: "What is inside it, attached to it, or saved on it?", hint: "Contents, charms or saved items.", allowPhoto: true },
  { id: "p3", text: "When did you last use it, and where were you?", hint: "Say what you were doing." },
];
const PHONE_PROMPTS: ClaimPrompt[] = [
  { id: "p1", text: "What is the wallpaper on the lock screen?", hint: "Describe the picture." },
  { id: "p2", text: "What is inside or behind the phone case?", hint: "Anything tucked in there.", allowPhoto: true },
  { id: "p3", text: "Is there a sticker or mark on the back?", hint: "Say where it is." },
];

function item(p: Partial<MItem> & Pick<MItem, "id" | "type" | "category" | "title" | "zone" | "reporterId"> & { hrs: number }): MItem {
  const { hrs, ...rest } = p;
  return {
    status: "OPEN",
    publicDescription: `${p.title}. Found or lost near ${p.zone.toLowerCase().replace(/_/g, " ")}.`,
    eventTag: null,
    occurredAt: ago(hrs),
    imageUrl: null,
    holdLocation: null,
    createdAt: ago(hrs - 0.2),
    updatedAt: ago(hrs - 0.2),
    privateDetails: null,
    keywords: [],
    prompts: GENERIC_PROMPTS,
    ...rest,
  };
}

export const IDS = {
  alice: "a1111111-1111-4111-8111-111111111111",
  mallory: "b2222222-2222-4222-8222-222222222222",
  admin: "c3333333-3333-4333-8333-333333333333",
  ravi: "d4444444-4444-4444-8444-444444444444",
  meera: "e5555555-5555-4555-8555-555555555555",
  arjun: "f6666666-6666-4666-8666-666666666666",
  sneha: "a7777777-7777-4777-8777-777777777777",
  lostPhone: "11111111-aaaa-4aaa-8aaa-0000000a0412",
  foundPhone: "22222222-aaaa-4aaa-8aaa-0000000a0413",
  foundId: "33333333-aaaa-4aaa-8aaa-0000000a0521",
  flagged: "44444444-aaaa-4aaa-8aaa-0000000c0001",
};

export function seed(): DB {
  const u = (id: string, name: string, email: string, role: "STUDENT" | "ADMIN", trust: number, karma: number, badges: BadgeCode[]): MUser => ({
    id, name, email, role, trustScore: trust, password: "DemoPass123!", karma, badges, wallet: 0,
  });
  const items: MItem[] = [
    item({ id: IDS.lostPhone, type: "LOST", category: "PHONE", title: "Black phone, cracked corner", zone: "LIBRARY", reporterId: IDS.alice, hrs: 30,
      publicDescription: "Black phone with a crack in the top right corner. Lost near the second floor reading room.",
      privateDetails: "Wallpaper is a red motorbike." }),
    item({ id: IDS.foundPhone, type: "FOUND", category: "PHONE", title: "Phone with a cracked corner", zone: "LIBRARY", reporterId: IDS.ravi, hrs: 20,
      publicDescription: "Dark phone with a cracked corner, found on a desk in the reading room. Handed to the desk.",
      holdLocation: "Security desk, main gate", prompts: PHONE_PROMPTS,
      privateDetails: "Wallpaper is a red Royal Enfield motorbike. Clear case with a folded 100 rupee note behind the phone. Small cat sticker on the back.",
      keywords: ["red", "royal", "enfield", "motorbike", "bike", "folded", "100", "rupee", "note", "cat", "sticker"] }),
    item({ id: IDS.foundId, type: "FOUND", category: "ID_CARD", title: "Student ID card, blue lanyard", zone: "ACADEMIC_BLOCK", reporterId: IDS.meera, hrs: 5,
      holdLocation: "Admin block desk", privateDetails: "The card belongs to a second year mechanical student. The lanyard has a small brass key clipped to it.",
      keywords: ["mechanical", "second", "brass", "key", "lanyard"] }),
    item({ id: "55555555-aaaa-4aaa-8aaa-0000000a0731", type: "LOST", category: "BOOK", title: "Engineering Mathematics, green cover", zone: "CAFETERIA", reporterId: IDS.arjun, hrs: 50 }),
    item({ id: "66666666-aaaa-4aaa-8aaa-0000000a0842", type: "FOUND", category: "KEYS", title: "Three keys with a red tag", zone: "HOSTELS", reporterId: IDS.sneha, hrs: 8,
      privateDetails: "The red tag says room 214 in marker. One key is a small padlock key.", keywords: ["214", "padlock", "room"] }),
    item({ id: "77777777-aaaa-4aaa-8aaa-0000000a0955", type: "LOST", category: "WALLET", title: "Brown leather wallet", zone: "FEST_GROUNDS", reporterId: IDS.arjun, hrs: 3, eventTag: "Techfest 2026" }),
    item({ id: "88888888-aaaa-4aaa-8aaa-0000000a1066", type: "FOUND", category: "BAG", title: "Grey backpack with a stitched strap", zone: "SPORTS_COMPLEX", reporterId: IDS.ravi, hrs: 26, eventTag: "Sports day",
      privateDetails: "A blue inhaler in the front pocket and a chemistry record book inside.", keywords: ["inhaler", "chemistry", "record"] }),
    item({ id: "99999999-aaaa-4aaa-8aaa-0000000a1177", type: "LOST", category: "GADGET", title: "White wireless earbuds case", zone: "AUDITORIUM", reporterId: IDS.meera, hrs: 12 }),
    item({ id: "aaaaaaaa-aaaa-4aaa-8aaa-0000000a1288", type: "FOUND", category: "GADGET", title: "Silver laptop charger, 65W", zone: "FEST_GROUNDS", reporterId: IDS.sneha, hrs: 2, eventTag: "Techfest 2026",
      privateDetails: "Cable has black tape near the plug and a name label that is peeled.", keywords: ["tape", "label", "peeled"] }),
    item({ id: "bbbbbbbb-aaaa-4aaa-8aaa-0000000a1399", type: "FOUND", category: "BOOK", title: "Organic Chemistry notes, spiral bound", zone: "LIBRARY", reporterId: IDS.ravi, hrs: 70,
      privateDetails: "First page has a doodle of a cat and the name starts with S.", keywords: ["doodle", "cat"] }),
    item({ id: "cccccccc-aaaa-4aaa-8aaa-0000000a1410", type: "LOST", category: "ID_CARD", title: "Library card", zone: "MAIN_GATE", reporterId: IDS.meera, hrs: 40 }),
    item({ id: "dddddddd-aaaa-4aaa-8aaa-0000000a1521", type: "FOUND", category: "OTHER", title: "Blue steel water bottle", zone: "CAFETERIA", reporterId: IDS.arjun, hrs: 6,
      privateDetails: "A dent near the base and a sticker of a mountain on the side.", keywords: ["dent", "mountain", "sticker"] }),
    item({ id: "eeeeeeee-aaaa-4aaa-8aaa-0000000a1632", type: "LOST", category: "KEYS", title: "Bike key with a panda keyring", zone: "HOSTELS", reporterId: IDS.sneha, hrs: 15 }),
    item({ id: "ffffffff-aaaa-4aaa-8aaa-0000000a1743", type: "FOUND", category: "WALLET", title: "Black card holder, two cards", zone: "MAIN_GATE", reporterId: IDS.ravi, hrs: 1,
      privateDetails: "Holds a metro card and a bank card ending in 4471.", keywords: ["metro", "4471"] }),
  ];
  const flagged: MClaim = {
    id: IDS.flagged, userId: IDS.arjun, foundItemId: IDS.foundId, status: "FLAGGED", createdAt: ago(2),
    answers: [
      { promptId: "p1", answer: "A scratch across the photo and the lanyard is blue." },
      { promptId: "p2", answer: "A key clipped to the lanyard, maybe brass." },
      { promptId: "p3", answer: "Dropped it near the academic block steps in the morning." },
    ],
    trustScore: 58, breakdown: { proof: 24, timeline: 8, history: 14, behaviour: 12 }, decision: "FLAGGED", token: null, tokenExpiresAt: null,
  };
  return {
    users: [
      u(IDS.alice, "Alice Sharma", "alice@demo.edu", "STUDENT", 70, 60, ["GRATEFUL_SOUL"]),
      u(IDS.mallory, "Mallory Reed", "mallory@demo.edu", "STUDENT", 35, 0, []),
      u(IDS.admin, "Desk Admin", "admin@demo.edu", "ADMIN", 100, 0, []),
      u(IDS.ravi, "Ravi Menon", "ravi@demo.edu", "STUDENT", 80, 340, ["FIRST_RETURN", "CAMPUS_HERO", "GUARDIAN"]),
      u(IDS.meera, "Meera Nair", "meera@demo.edu", "STUDENT", 78, 210, ["FIRST_RETURN", "GENEROUS"]),
      u(IDS.arjun, "Arjun Das", "arjun@demo.edu", "STUDENT", 55, 90, ["FIRST_RETURN"]),
      u(IDS.sneha, "Sneha Pillai", "sneha@demo.edu", "STUDENT", 66, 40, []),
    ],
    items,
    claims: [flagged],
    notifs: [
      { id: uid(), userId: IDS.alice, type: "MATCH_FOUND", title: "A possible match for your phone",
        body: "A found phone near the Library looks like yours.", readAt: null, createdAt: ago(19), data: { itemId: IDS.foundPhone } },
    ],
    tips: [],
    ledger: [],
    audit: [{ id: uid(), action: "seed", actor: "system", target: "demo data", createdAt: ago(48) }],
    returns: [
      ...Array.from({ length: 6 }, (_, i) => ({ finderId: IDS.ravi, at: ago(24 * i + 5) })),
      ...Array.from({ length: 4 }, (_, i) => ({ finderId: IDS.meera, at: ago(24 * i + 30) })),
      ...Array.from({ length: 2 }, (_, i) => ({ finderId: IDS.arjun, at: ago(24 * 9 + i) })),
    ],
  };
}

let db: DB | null = null;
export function getDb(): DB {
  if (db) return db;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      db = JSON.parse(raw) as DB;
      return db;
    }
  } catch {}
  db = seed();
  return db;
}
export function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}
export function resetDb() {
  db = seed();
  save();
}
export function log(action: string, actor: string, target: string) {
  getDb().audit.unshift({ id: uid(), action, actor, target, createdAt: new Date().toISOString() });
}
