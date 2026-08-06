"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CONVENTION,
  OTHER_VOTES,
  ROUNDS,
  phaseOf,
  type RoundPhase,
  shortDate,
  shortRange,
  todayKST,
} from "@/lib/schedule";

/**
 * 경선 일정 요약 줄. 두 줄을 넘지 않도록 항목을 최소로 유지한다.
 * 상세 일정(권역별 온라인·ARS 기간)은 모달로 뺀다.
 */
export function ScheduleStrip({
  collectedRegions,
}: {
  collectedRegions: string[];
}) {
  const today = todayKST();
  const phases = ROUNDS.map((r) => ({
    round: r,
    phase: phaseOf(r, collectedRegions, today),
  }));

  const done = phases.filter((p) => p.phase.kind === "done");
  const voting = phases.filter((p) => p.phase.kind === "voting");
  const next = phases.find(
    (p) => p.phase.kind !== "done" && p.round.announce >= today,
  );

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl px-4 py-3"
      style={{
        background: "var(--viz-surface)",
        border: "1px solid var(--viz-hairline)",
      }}
    >
      <span className="shrink-0 text-xs" style={{ color: "var(--viz-muted)" }}>
        경선 일정
      </span>

      {/* 좁은 화면에서는 두 줄을 지키려고 부차적인 항목을 접는다 */}
      <Item
        label="완료"
        value={`${done.length}/${ROUNDS.length} 권역`}
        className="hidden sm:flex"
      />

      {voting.length > 0 ? (
        <Item label="투표 중" value={votingSummary(voting)} accent />
      ) : null}

      {next ? (
        <Item
          label="다음 발표"
          value={`${shortDate(next.round.announce)} ${next.round.name}`}
        />
      ) : null}

      <Item
        label="전당대회"
        value={shortDate(CONVENTION.date)}
        className="hidden md:flex"
      />

      <div className="ml-auto shrink-0">
        <ScheduleDialog collectedRegions={collectedRegions} />
      </div>
    </div>
  );
}

/**
 * 투표 중인 권역 요약. 둘 이상이면 마감이 가까운 하나만 쓰고 나머지는 개수로 접는다 —
 * 전부 나열하면 좁은 화면에서 줄이 넘친다.
 */
function votingSummary(
  voting: { round: { name: string }; phase: RoundPhase }[],
) {
  const items = voting.flatMap(({ round, phase }) =>
    phase.kind === "voting"
      ? [{ name: round.name, channel: phase.channel, until: phase.until }]
      : [],
  );
  items.sort((a, b) => a.until.localeCompare(b.until));
  const [first, ...rest] = items;
  if (!first) return "";
  const head = `${first.name} ${first.channel} ~${shortDate(first.until).split("(")[0]}`;
  return rest.length > 0 ? `${head} 외 ${rest.length}곳` : head;
}

function Item({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("flex shrink-0 items-baseline gap-1.5 text-xs", className)}
    >
      <span style={{ color: "var(--viz-muted)" }}>{label}</span>
      <span
        className="font-medium"
        style={{
          color: accent ? "var(--viz-s1)" : "var(--viz-text-primary)",
        }}
      >
        {value}
      </span>
    </span>
  );
}

function ScheduleDialog({ collectedRegions }: { collectedRegions: string[] }) {
  const [open, setOpen] = useState(false);
  const today = todayKST();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="h-7 text-xs" />}
      >
        전체 일정
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>투표일정 안내</DialogTitle>
          <DialogDescription>
            제3차 정기전국당원대회 · 중앙당 선거관리위원회
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">권리당원</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                      권역
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                      발표일
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                      온라인 투표
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                      ARS 투표
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROUNDS.map((r) => {
                    const phase = phaseOf(r, collectedRegions, today);
                    return (
                      <tr key={r.name} className="border-b border-border/60">
                        <td className="px-2 py-2">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.regions.join("·")}
                          </div>
                        </td>
                        <td className="px-2 py-2 tabular-nums">
                          {shortDate(r.announce)}
                        </td>
                        <td className="px-2 py-2 tabular-nums text-muted-foreground">
                          {shortRange(r.online)}
                        </td>
                        <td className="px-2 py-2 tabular-nums text-muted-foreground">
                          {shortRange(r.ars)}
                        </td>
                        <td className="px-2 py-2 text-right text-xs">
                          {phase.kind === "done" ? (
                            <span className="text-muted-foreground">완료</span>
                          ) : phase.kind === "voting" ? (
                            <span
                              className="font-medium"
                              style={{ color: "var(--viz-s1)" }}
                            >
                              {phase.channel} 투표 중
                            </span>
                          ) : (
                            <span className="text-muted-foreground">예정</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">그 밖의 투표</h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {OTHER_VOTES.map((v) => (
                <li key={v.name} className="flex flex-wrap gap-x-3">
                  <span className="font-medium">{v.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {shortRange(v.period)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {v.note}
                  </span>
                </li>
              ))}
              <li className="flex flex-wrap gap-x-3">
                <span className="font-medium">국민여론조사</span>
                <span className="tabular-nums text-muted-foreground">
                  {shortRange(CONVENTION.pollPeriod)}
                </span>
              </li>
            </ul>
          </section>

          <Separator />

          <section className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">전당대회</h3>
            <p className="text-sm">
              {shortDate(CONVENTION.date)} · {CONVENTION.venue}
            </p>
            <p className="text-xs text-muted-foreground">
              최종 결과는 {CONVENTION.formula}로 산정됩니다. 이 대시보드의
              수치는 그중 권리당원 온라인투표 집계이므로 최종 결과와 다릅니다.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
