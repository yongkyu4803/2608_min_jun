"use client";

import { BANNERS, BANNER_ASPECT, type Banner } from "@/lib/banners";

/**
 * 헤더와 필터 사이의 배너 영역. 세 칸을 정확히 1/3씩 나눈다.
 * 좁은 화면(md 미만)에서는 세로로 쌓인다 — 3등분하면 한 칸이 너무 좁아지기 때문.
 *
 * 개발 중에는 빈 칸도 자리표시자로 보여 위치를 확인할 수 있게 하고,
 * 배포본에서는 채워진 배너가 하나도 없으면 영역 자체를 그리지 않는다.
 */
export function BannerSlots() {
  const showPlaceholders = process.env.NODE_ENV !== "production";
  const hasAny = BANNERS.some(Boolean);
  if (!hasAny && !showPlaceholders) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {BANNERS.map((banner, i) =>
        banner ? (
          <BannerCard key={i} banner={banner} />
        ) : showPlaceholders ? (
          <Placeholder key={i} index={i} />
        ) : (
          // 일부만 채워져 있을 때 남은 칸을 비워 두어 1/3 배치를 유지한다
          <div key={i} aria-hidden />
        ),
      )}
    </div>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const external =
    /^https?:\/\//.test(banner.src) || /^https?:\/\//.test(banner.href ?? "");
  const newTab = banner.newTab ?? external;

  const image = (
    // next/image 대신 img 를 쓰는 이유: 외부 도메인 배너를 넣을 때
    // next.config 의 remotePatterns 를 건드리지 않아도 되게 하기 위함.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.src}
      alt={banner.alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );

  const frame = (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        aspectRatio: BANNER_ASPECT,
        border: "1px solid var(--viz-hairline)",
        background: "var(--viz-surface)",
      }}
    >
      {image}
    </div>
  );

  if (!banner.href) return frame;

  return (
    <a
      href={banner.href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="block rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      {frame}
    </a>
  );
}

function Placeholder({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-xl"
      style={{
        aspectRatio: BANNER_ASPECT,
        border: "1px dashed var(--viz-baseline)",
        background: "var(--viz-surface)",
      }}
    >
      <span
        className="text-xs font-medium"
        style={{ color: "var(--viz-muted)" }}
      >
        배너 {index + 1} (1/3)
      </span>
      <span className="text-[11px]" style={{ color: "var(--viz-muted)" }}>
        src/lib/banners.ts · 권장 3:1
      </span>
    </div>
  );
}
