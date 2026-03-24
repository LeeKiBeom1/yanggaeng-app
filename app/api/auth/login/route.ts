import { NextResponse } from "next/server";
import { createSessionToken, getCookieName, getSessionAgeSeconds } from "@/lib/auth";

export async function POST(request: Request) {
  const { id, password } = await request.json();
  const expectedId = process.env.APP_LOGIN_ID;
  const expectedPassword = process.env.APP_LOGIN_PASSWORD;

  if (!expectedId || !expectedPassword) {
    return NextResponse.json({ error: "Server auth env not configured" }, { status: 500 });
  }

  if (id !== expectedId || password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getCookieName(),
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionAgeSeconds(),
  });
  return response;
}
