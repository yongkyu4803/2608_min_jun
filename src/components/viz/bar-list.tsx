"use client";

import { cn } from "@/lib/utils";

export type BarRow = {
  key: string;
  /** 축 라벨 (지역명 / 후보명) */
  label: string;
  value: number;
  /** 막대 끝에 붙는 직접 라벨 */
  valueLabel: string;
  /** 색 슬롯 CSS 변수. 단일 계열이면 모든 행이 같은 값을 쓴다. */
  colorVar: string;
  /** 라벨 앞 작은 배지 (기호, 순위 등) */
  badge?: string;
  /**
   * 값 뒤 작은 배지 (예: "1위").
   * 이름 칸이 좁은 스몰 멀티플에서 앞쪽에 붙이면 막대가 짧아지므로 뒤에 둔다.
   */
  valueBadge?: string;
  /** 툴팁 본문 */
  tooltip: { label: string; value: string }[];
  /** 강조 해제 (참고용 행) */
  dim?: boolean;
};

type Props = {
  rows: BarRow[];
  /** 막대 길이의 기준값. 생략하면 행 중 최댓값 */
  max?: number;
  labelWidth?: string;
  className?: string;
};

/**
 * 가로 막대 목록.
 * - 막대 두께 24px, 데이터 끝만 4px 라운드, 기준선(왼쪽)은 각지게
 * - 값은 막대 끝에 직접 라벨 (텍스트는 항상 ink 토큰, 계열색을 입히지 않는다)
 * - 행 전체가 hover/focus 대상 → 툴팁, 키보드로도 동일하게 열림
 */
export function BarList({ rows, max, labelWidth = "5.5rem", className }: Props) {
  const scale = max ?? Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {rows.map((row) => {
        const width = scale > 0 ? Math.max((row.value / scale) * 100, 1.5) : 0;
        return (
          <div
            key={row.key}
            tabIndex={0}
            className="group relative grid items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr) auto` }}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              {row.badge ? (
                <span
                  className="shrink-0 rounded-[3px] px-1 text-[11px] leading-[18px] tabular-nums"
                  style={{
                    color: "var(--viz-muted)",
                    border: "1px solid var(--viz-hairline)",
                  }}
                >
                  {row.badge}
                </span>
              ) : null}
              <span
                className="truncate text-sm"
                style={{ color: "var(--viz-text-primary)" }}
              >
                {row.label}
              </span>
            </div>

            {/* 막대 트랙 — 값 라벨은 별도 컬럼이라 막대가 라벨을 밀어내지 않는다 */}
            <div className="min-w-0">
              <div
                className="h-6 rounded-r-[4px] transition-[width] duration-500 ease-out"
                style={{
                  width: `${width}%`,
                  background: `var(${row.colorVar})`,
                  opacity: row.dim ? 0.35 : 1,
                }}
              />
            </div>
            {/* 배지를 숫자 앞에 둔다 — 뒤에 붙이면 그 행만 숫자가 밀려 정렬이 깨진다 */}
            <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {row.valueBadge ? (
                // 테두리 대신 채우고 잉크를 올린다 — 색을 새로 들이지 않고 대비만 높인다
                <span
                  className="shrink-0 rounded-[3px] px-1 text-[11px] leading-[18px] font-medium"
                  style={{
                    color: "var(--viz-text-primary)",
                    background: "var(--viz-grid)",
                  }}
                >
                  {row.valueBadge}
                </span>
              ) : null}
              <span
                className="text-sm tabular-nums"
                style={{
                  // 1위 행은 수치도 함께 진해져 행 전체가 떠오른다
                  color: row.valueBadge
                    ? "var(--viz-text-primary)"
                    : "var(--viz-text-secondary)",
                }}
              >
                {row.valueLabel}
              </span>
            </span>

            <Tooltip title={row.label} items={row.tooltip} />
          </div>
        );
      })}
    </div>
  );
}

export function Tooltip({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div
      className="pointer-events-none absolute -top-1 left-0 z-20 hidden -translate-y-full flex-col gap-1 rounded-md px-3 py-2 text-xs shadow-lg group-hover:flex group-focus-visible:flex"
      style={{
        background: "var(--viz-surface)",
        border: "1px solid var(--viz-hairline)",
        color: "var(--viz-text-primary)",
      }}
    >
      <div className="font-medium">{title}</div>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-4">
          <span style={{ color: "var(--viz-muted)" }}>{item.label}</span>
          <span className="tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 계열이 2개 이상이면 항상 표시하는 범례 */
export function Legend({
  items,
}: {
  items: { key: string; label: string; colorVar: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ background: `var(${item.colorVar})` }}
          />
          <span className="text-xs" style={{ color: "var(--viz-text-secondary)" }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
