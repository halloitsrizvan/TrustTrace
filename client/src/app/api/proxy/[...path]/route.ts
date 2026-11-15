import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { apiUrl, jsonError, TOKEN_COOKIE } from "@/lib/server/bff";

// Forwards browser calls to the backend and attaches the JWT from the httpOnly cookie.
const FORWARD_HEADERS = ["content-type", "idempotency-key", "accept"];

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const target = `${apiUrl()}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const h of FORWARD_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return jsonError(502, "The server is not reachable");
  }
  const out = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status });
  const ct = upstream.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);
  out.headers.set("cache-control", "no-store");
  return out;
}

export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
