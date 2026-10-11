import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

function matchesPassword(candidate: string, expected: string) {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function POST(request: NextRequest) {
  const expectedPassword = process.env.SITE_PASSWORD;
  if (!expectedPassword || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return NextResponse.json({ error: "The lobby is not configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the lobby password to continue." }, { status: 400 });
  }
  const password = typeof body === "object" && body !== null && "password" in body
    ? body.password
    : undefined;
  if (typeof password !== "string" || !matchesPassword(password, expectedPassword)) {
    return NextResponse.json({ error: "That password didn't open the lobby. Try again." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
