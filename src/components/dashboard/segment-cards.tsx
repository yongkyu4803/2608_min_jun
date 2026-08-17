"use client";

import { BarList, type BarRow } from "@/components/viz/bar-list";
import { num, pct } from "@/lib/election";
import {
  SEGMENTS,
  segmentResults,
  segmentTurnout,
  type SegmentEntry,
} from "@/lib/segments";
import { shortDate } from "@/lib/schedule";

/**
 * 지역 밖 선거인단 3종 카드 — 대의원 · 재외국민 · 국민경선.
 *
 * 값이 없는 동안에도 자리를 비워 두고 "언제 들어오는지"를 보여준다.
 * 0표로 채워 막대를 그리면 화면이 거짓말을 하므로, 미발표는 미발표로 그린다.
 */
export function SegmentCards({
  colorVars,
}: {
  /** 후보 기호(1부터) 순서의 색 슬롯 — 대시보드 다른 차트와 같은 색을 쓴다 */
  colorVars: string[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {SEGMENTS.map((segment) => (
        <SegmentCard
          key={segment.key}
          segment={segment}
          colorVars={colorVars}
        />
      ))}
    </div>
  );
}

function SegmentCard({
  segment,
  colorVars,
}: {
  segment: SegmentEntry;
  colorVars: string[];
}) {
  const rows = segmentResults(segment, "leader");
  const turnout = segmentTurnout(segment);
  const unit = segment.kind === "poll" ? "%" : "표";

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: "var(--viz-surface)",
        border: rows
          ? "1px solid var(--viz-hairline)"
          : "1px dashed var(--viz-baseline)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--viz-text-primary)" }}
          >
            {segment.label}
          </span>
          <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
            {segment.note}
          </span>
        </div>
        <span
          className="shrink-0 rounded-[3px] px-1.5 py-0.5 text-[11px] leading-[16px]"
          style={{
            color: rows ? "var(--viz-text-primary)" : "var(--viz-muted)",
            background: rows ? "var(--viz-grid)" : "transparent",
            border: rows ? "none" : "1px solid var(--viz-hairline)",
          }}
        >
          {rows ? shortDate(segment.date ?? segment.scheduled) : "미발표"}
        </span>
      </div>

      {rows ? (
        <>
          <BarList
            labelWidth="3.25rem"
            max={100}
            rows={rows.map<BarRow>((c) => ({
              key: `${segment.key}-${c.no}`,
              label: c.name,
              value: c.share,
              valueLabel: pct(c.share, 1),
              colorVar: colorVars[c.no - 1],
              valueBadge: c.rank === 1 ? "1위" : undefined,
              tooltip: [
                {
                  label: segment.kind === "poll" ? "지지율" : "득표수",
                  value:
                    segment.kind === "poll"
                      ? pct(c.value, 1)
                      : `${num(c.value)}${unit}`,
                },
                { label: "득표율", value: pct(c.share) },
                { label: "순위", value: `${c.rank}위` },
              ],
            }))}
          />
          <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
            {turnout !== null
              ? `투표율 ${pct(turnout)} · ${num(segment.voters ?? 0)}명 / ${num(segment.electorate ?? 0)}명`
              : segment.samples
                ? `응답자 ${num(segment.samples)}명`
                : "선거인수 미공개"}
          </span>
        </>
      ) : (
        <div className="flex flex-col gap-1 py-2">
          <span
            className="text-sm"
            style={{ color: "var(--viz-text-secondary)" }}
          >
            {shortDate(segment.scheduled)} 발표 예정
          </span>
          <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
            숫자가 들어오면 이 자리에 후보별{" "}
            {segment.kind === "poll" ? "지지율" : "득표"}이 표시됩니다.
          </span>
        </div>
      )}
    </div>
  );
}

/** 표 보기 대응물 — 미발표는 "—" 로 남긴다 */
export function segmentTableRows() {
  return SEGMENTS.map((segment) => {
    const rows = segmentResults(segment, "leader");
    const turnout = segmentTurnout(segment);
    return [
      segment.label,
      rows ? shortDate(segment.date ?? segment.scheduled) : "미발표",
      ...(rows ? rows.map((c) => pct(c.share, 1)) : ["—", "—", "—"]),
      turnout !== null ? pct(turnout) : "—",
    ];
  });
}
