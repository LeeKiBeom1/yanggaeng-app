import { NextResponse } from "next/server";
import { createSessionToken, getCookieName, getSessionAgeSeconds } from "@/lib/auth";

export async function POST(request: Request) {
  const { id, password } = await request.json();

  // [수정] 허용된 사용자 목록에서 매니저 아이디를 manager01로 변경
  const users = ["manager01", "god6332", "staff01"];
  const VALID_PASSWORD = "6332";

  // 1. 아이디 및 비밀번호 확인
  if (!users.includes(id) || password !== VALID_PASSWORD) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 틀립니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user_id: id });

  // 2. 보안 세션 쿠키 설정
  response.cookies.set({
    name: getCookieName(),
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionAgeSeconds(),
  });

  // 3. 현재 로그인한 유저 ID 저장용 쿠키 (프론트엔드에서 인식용)
  response.cookies.set({
    name: "yanggaeng_user_id",
    value: id,
    httpOnly: false, // 프론트엔드 JS에서 접근 가능하게 설정
    path: "/",
    maxAge: getSessionAgeSeconds(),
  });

  return response;
}