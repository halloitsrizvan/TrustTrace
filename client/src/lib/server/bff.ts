import "server-only";
import { NextResponse } from "next/server";

export const TOKEN_COOKIE = "tt_token";

export function apiUrl() {
  const u = process.env.API_URL;
  if (!u) throw new Error("API_URL is not set");
  return u.replace(/\/$/, "");
}

export function setTokenCookie(res: NextResponse, token: string) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export function clearTokenCookie(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ statusCode: status, message, error: "Error" }, { status });
}
