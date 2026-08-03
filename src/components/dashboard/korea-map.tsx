"use client";

import { useState } from "react";
import { KOREA_PROVINCES, KOREA_VIEWBOX } from "@/lib/korea-map";
import { num } from "@/lib/election";
import { cn } from "@/lib/utils";

export type MapDatum = {
  region: string;
  /** 색 농도를 정하는 값 (%) */
  value: number;
  /** 상세 패널에 넣을 줄들 */
  detail: { label: string; value: string }[];
  /** 지역명 옆에 붙는 짧은 설명 (예: 선두 후보) */
  caption?: string;
};

/** 농도 4단계 — 값 범위를 4등분한다 */
const STEPS = ["--viz-c1", "--viz-c2", "--viz-c3", "--viz-c4"];

/**
 * 면적이 작아 라벨이 겹치는 시도는 바깥으로 밀어내고 지시선을 긋는다.
 * [dx, dy] — 무게중심 기준 이동량(지도 좌표계).
 */
const LABEL_OFFSET: Record<string, [number, number]> = {
  서울: [-92, -26],
  인천: [-96, 6],
  세종: [-104, -6],
  대전: [-40, 58],
  광주: [-88, 18],
  대구: [78, -20],
  울산: [86, -6],
  부산: [72, 40],
  경기: [66, -44],
};

function bucketOf(value: number, min: number, max: number) {
  if (max <= min) return STEPS.length - 1;
  const t = (value - min) / (max - min);
  return Math.min(STEPS.length - 1, Math.floor(t * STEPS.length));
}

/**
 * 시도 단위 단계구분도.
 *
 * 면적이 값의 비중을 왜곡한다 — 경북·강원은 넓지만 선거인수는 적고 세종은 점만 하다.
 * 그래서 이 지도는 막대차트를 대체하지 않고 "어디까지 개표됐는지"를 보여주는
 * 보조 뷰로 둔다. 자료가 없는 시도는 회색으로 남겨 진행률이 그대로 드러나게 한다.
 * 정확한 값은 옆의 목록에서 읽는다 — 호버에만 의존하지 않는다.
 */
export function KoreaMap({
  data,
  unit = "%",
}: {
  data: MapDatum[];
  unit?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const byRegion = new Map(data.map((d) => [d.region, d]));
  const values = data.map((d) => d.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const ranked = [...data].sort((a, b) => b.value - a.value);
  const active = hover ? byRegion.get(hover) : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <div className="mx-auto w-full max-w-[24rem] shrink-0">
        <svg
          viewBox={KOREA_VIEWBOX}
          className="h-auto w-full"
          role="img"
          aria-label="시도별 지도"
        >
          {KOREA_PROVINCES.map((p) => {
            const d = byRegion.get(p.name);
            const fill = d
              ? `var(${STEPS[bucketOf(d.value, min, max)]})`
              : "var(--viz-c0)";
            return (
              <path
                key={p.name}
                d={p.d}
                fill={fill}
                stroke="var(--viz-surface)"
                strokeWidth={1.2}
                tabIndex={d ? 0 : -1}
                className={cn(
                  "outline-none transition-opacity",
                  d && "cursor-pointer",
                  hover && hover !== p.name && "opacity-55",
                )}
                onMouseEnter={() => d && setHover(p.name)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => d && setHover(p.name)}
                onBlur={() => setHover(null)}
              />
            );
          })}

          {/* 자료가 있는 지역만 라벨 — 값은 옆 목록에 있으므로 지도에는 이름만 */}
          {KOREA_PROVINCES.filter((p) => byRegion.has(p.name)).map((p) => {
            const [dx, dy] = LABEL_OFFSET[p.name] ?? [0, 0];
            const [cx, cy] = p.label;
            const lx = cx + dx;
            const ly = cy + dy;
            const dim = hover !== null && hover !== p.name;
            return (
              <g
                key={`label-${p.name}`}
                className="pointer-events-none transition-opacity"
                opacity={dim ? 0.45 : 1}
              >
                {dx || dy ? (
                  <line
                    x1={cx}
                    y1={cy}
                    x2={lx}
                    y2={ly}
                    stroke="var(--viz-baseline)"
                    strokeWidth={1.2}
                  />
                ) : null}
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[20px] font-semibold"
                  fill="var(--viz-text-primary)"
                  stroke="var(--viz-surface)"
                  strokeWidth={5}
                  paintOrder="stroke"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <ScaleLegend min={min} max={max} unit={unit} />

        {/* 값은 목록으로도 읽을 수 있어야 한다 — 호버는 보조 수단 */}
        <ul className="flex flex-col">
          {ranked.map((d) => {
            const on = hover === d.region;
            return (
              <li key={d.region}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
                  style={{ background: on ? "var(--viz-grid)" : "transparent" }}
                  onMouseEnter={() => setHover(d.region)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(d.region)}
                  onBlur={() => setHover(null)}
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{
                        background: `var(${STEPS[bucketOf(d.value, min, max)]})`,
                      }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--viz-text-primary)" }}
                    >
                      {d.region}
                    </span>
                    {d.caption ? (
                      <span
                        className="text-xs"
                        style={{ color: "var(--viz-muted)" }}
                      >
                        {d.caption}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="shrink-0 text-sm tabular-nums"
                    style={{ color: "var(--viz-text-secondary)" }}
                  >
                    {d.value.toFixed(2)}
                    {unit}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className="rounded-lg px-3 py-2.5"
          style={{ border: "1px solid var(--viz-hairline)" }}
        >
          {active ? (
            <div className="flex flex-col gap-1.5">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--viz-text-primary)" }}
              >
                {active.region}
              </span>
              {active.detail.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-3 text-xs"
                >
                  <span style={{ color: "var(--viz-muted)" }}>{row.label}</span>
                  <span
                    className="tabular-nums"
                    style={{ color: "var(--viz-text-secondary)" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--viz-muted)" }}>
              지도나 목록에서 지역을 가리키면 상세 수치가 표시됩니다.
            </p>
          )}
        </div>

        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--viz-muted)" }}
        >
          회색은 아직 경선이 진행되지 않은{" "}
          {num(KOREA_PROVINCES.length - data.length)}개 시도입니다. 면적이 넓다고
          표가 많은 것은 아니므로, 비중 비교는 막대차트를 보세요.
          <br />
          지도 경계: 통계청 센서스용 행정구역경계(2013) · southkorea-maps
        </p>
      </div>
    </div>
  );
}

/** 순차 색상에는 항상 척도 범례를 붙인다 */
function ScaleLegend({
  min,
  max,
  unit,
}: {
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
        <div className="flex h-2.5 overflow-hidden rounded-sm">
          {STEPS.map((s) => (
            <div
              key={s}
              className="flex-1"
              style={{ background: `var(${s})` }}
            />
          ))}
        </div>
        <div
          className="flex justify-between text-[11px] tabular-nums"
          style={{ color: "var(--viz-muted)" }}
        >
          <span>
            {min.toFixed(1)}
            {unit}
          </span>
          <span>
            {max.toFixed(1)}
            {unit}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pb-4">
        <span
          aria-hidden
          className="size-2.5 rounded-[3px]"
          style={{ background: "var(--viz-c0)" }}
        />
        <span className="text-[11px]" style={{ color: "var(--viz-muted)" }}>
          미개표
        </span>
      </div>
    </div>
  );
}
