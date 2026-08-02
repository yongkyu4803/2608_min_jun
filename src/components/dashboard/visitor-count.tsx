"use client";

import { useEffect, useState } from "react";
import { num } from "@/lib/election";

type Counts = { total: number; today: number };

/**
 * 방문 카운터. 마운트 시 1회 기록하고 갱신된 값을 표시한다.
 * 스토리지가 연결되지 않았거나 실패하면 아무것도 렌더링하지 않는다 — 0을 보여주면 오해를 부른다.
 */
export function VisitorCount() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let cancelled = false;
    // 개발 중 StrictMode 이중 실행으로 두 번 세는 것을 막는다.
    const sessionKey = "chungcheong-primary:visit-logged";
    const already = window.sessionStorage.getItem(sessionKey) === "1";
    window.sessionStorage.setItem(sessionKey, "1");
    if (already) return;

    fetch("/api/visits", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.available) setCounts(data);
      })
      .catch(() => {
        /* 카운터는 부가 정보 — 실패해도 대시보드에 영향을 주지 않는다 */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!counts) return null;

  return (
    <dl
      className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs"
      style={{ color: "var(--viz-muted)" }}
    >
      <Item label="누적 방문" value={counts.total} />
      <Item label="오늘" value={counts.today} />
    </dl>
  );
}

function Item({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd
        className="font-medium tabular-nums"
        style={{ color: "var(--viz-text-secondary)" }}
      >
        {num(value)}
      </dd>
    </div>
  );
}
