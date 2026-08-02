import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TOTAL_KEY = "visits:total";
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

/** 집계 없이 현재 카운트만 읽는다 (같은 세션의 재방문·새로고침용). */
export async function GET() {
  const redis = redisOrNull();
  if (!redis) {
    return NextResponse.json({ available: false }, { status: 503 });
  }

  const [total, today] = await redis.mget<[number | null, number | null]>(
    TOTAL_KEY,
    `visits:day:${todayKST()}`,
  );

  return NextResponse.json({
    available: true,
    total: total ?? 0,
    today: today ?? 0,
  });
}

/**
 * 방문 1회를 기록하고 갱신된 카운트를 돌려준다.
 * 저장하는 값은 누적/일자 카운터 두 정수뿐 — 방문자를 식별하는 정보도,
 * 브라우저에 남기는 쿠키도 없다.
 */
export async function POST() {
  const redis = redisOrNull();
  // 아직 스토리지가 연결되지 않았으면 카운터를 숨긴다 (0을 보여주면 오해를 부른다).
  if (!redis) {
    return NextResponse.json({ available: false }, { status: 503 });
  }

  const dayKey = `visits:day:${todayKST()}`;

  const pipe = redis.pipeline();
  pipe.incr(TOTAL_KEY);
  pipe.incr(dayKey);
  pipe.expire(dayKey, DAY_TTL_SECONDS);

  const [total, today] = (await pipe.exec()) as [number, number, unknown];

  return NextResponse.json({ available: true, total, today });
}
