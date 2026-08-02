import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOTAL_KEY = "visits:total";
const UNIQUE_KEY = "visits:unique";
const VISITOR_COOKIE = "vid";
/** 일자별 카운터 보관 기간 */
const DAY_TTL_SECONDS = 400 * 24 * 60 * 60;

/** 한국 시간 기준 YYYY-MM-DD */
function todayKST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date(),
  );
}

/**
 * Vercel Marketplace의 Upstash 통합은 KV_REST_API_* 로 주입한다.
 * (Upstash 콘솔에서 직접 만든 경우의 UPSTASH_REDIS_REST_* 도 함께 받아준다.)
 */
function redisOrNull() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** 방문 1회를 기록하고 갱신된 카운트를 돌려준다. */
export async function POST() {
  const redis = redisOrNull();
  // 아직 스토리지가 연결되지 않았으면 카운터를 숨긴다 (0을 보여주면 오해를 부른다).
  if (!redis) {
    return NextResponse.json({ available: false }, { status: 503 });
  }

  const jar = await cookies();
  const isNewVisitor = !jar.get(VISITOR_COOKIE);
  const dayKey = `visits:day:${todayKST()}`;

  const pipe = redis.pipeline();
  pipe.incr(TOTAL_KEY);
  pipe.incr(dayKey);
  pipe.expire(dayKey, DAY_TTL_SECONDS);
  if (isNewVisitor) pipe.incr(UNIQUE_KEY);
  else pipe.get<number>(UNIQUE_KEY);

  const [total, today, , unique] = (await pipe.exec()) as [
    number,
    number,
    unknown,
    number | null,
  ];

  const res = NextResponse.json({
    available: true,
    total,
    today,
    unique: unique ?? 0,
  });

  if (isNewVisitor) {
    res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  return res;
}
