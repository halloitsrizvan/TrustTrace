import { NextResponse } from "next/server";
import { apiUrl, jsonError, setTokenCookie } from "@/lib/server/bff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError(400, "Invalid request");
  let upstream: Response;
  try {
    upstream = await fetch(`${apiUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return jsonError(502, "The server is not reachable");
  }
  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });
  // The token never reaches the browser: it goes into an httpOnly cookie only.
  const res = NextResponse.json({ user: data.user });
  setTokenCookie(res, data.accessToken);
  return res;
}
