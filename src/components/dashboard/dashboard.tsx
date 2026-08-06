"use client";

import { useMemo, useState } from "react";
import { AddEntryForm } from "@/components/dashboard/add-entry-form";
import { BannerSlots } from "@/components/dashboard/banner-slots";
import { KoreaMap, type MapDatum } from "@/components/dashboard/korea-map";
import { ScheduleStrip } from "@/components/dashboard/schedule-strip";
import { VisitorCount } from "@/components/dashboard/visitor-count";
import { ThemeToggle } from "@/components/theme-toggle";
import { BarList, Legend, type BarRow } from "@/components/viz/bar-list";
import { DataTable, HeroFigure, Panel, StatTile } from "@/components/viz/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CANDIDATES,
  RACE_LABEL,
  SUPREME_SEATS,
  entriesWithRace,
  num,
  pct,
  regionsMissingRace,
  resultsOf,
  totalsOf,
  turnoutByRegion,
  type Race,
} from "@/lib/election";
import { useElectionStore } from "@/lib/use-election-store";
import { cn } from "@/lib/utils";

/**
 * 후보 색은 기호(entity)에 고정 — 필터로 순위가 바뀌어도 색은 따라 움직이지 않는다.
 * 당 색상(블루) 단일 계열이므로 색상 대신 명도 단계로 구분한다.
 */
const LEADER_COLORS = ["--viz-o1", "--viz-o2", "--viz-o3"];

export function Dashboard() {
  const { entries, addEntry, removeEntry, reset } = useElectionStore();
  const [excluded, setExcluded] = useState<string[]>([]);
  const [asTable, setAsTable] = useState(false);
  const [mapMetric, setMapMetric] = useState<"leader" | "turnout">("leader");

  const regions = useMemo(() => entries.map((e) => e.region), [entries]);
  const selected = useMemo(
    () => entries.filter((e) => !excluded.includes(e.region)),
    [entries, excluded],
  );

  const totals = totalsOf(selected);
  const turnouts = turnoutByRegion(selected);
  const leader = resultsOf(selected, "leader");
  const supreme = resultsOf(selected, "supreme");
  const topTurnout = [...turnouts].sort((a, b) => b.turnout - a.turnout)[0];
  const supremeRegions = entriesWithRace(selected, "supreme");
  const supremeMissing = regionsMissingRace(selected, "supreme");
  const leaderRanked = [...leader].sort((a, b) => b.votes - a.votes);
  const leadingCandidate = leaderRanked[0];
  const runnerUp = leaderRanked[1];
  const leaderTotal = leader.reduce((acc, c) => acc + c.votes, 0);
  const userEntries = entries.filter((e) => !e.seeded);

  /** 지도용 — 지역마다 선두 후보와 투표율을 함께 담아 두 지표를 한 번에 처리한다 */
  const mapData = useMemo<MapDatum[]>(
    () =>
      entriesWithRace(selected, "leader").map((e) => {
        const top = [...resultsOf([e], "leader")].sort(
          (a, b) => b.votes - a.votes,
        )[0];
        const turnout = e.electorate > 0 ? (e.voters / e.electorate) * 100 : 0;
        return {
          region: e.region,
          value: mapMetric === "leader" ? top.share : turnout,
          caption: mapMetric === "leader" ? `선두 ${top.name}` : undefined,
          detail: [
            { label: `선두 ${top.name}`, value: pct(top.share) },
            { label: "투표율", value: pct(turnout) },
            { label: "투표자수", value: `${num(e.voters)}명` },
          ],
        };
      }),
    [selected, mapMetric],
  );

  function toggleRegion(region: string) {
    setExcluded((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : // 마지막 하나까지 끄는 것은 막는다 (빈 대시보드 방지)
          selected.length > 1
          ? [...prev, region]
          : prev,
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--viz-plane)",
        color: "var(--viz-text-primary)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8">
        {/* 헤더 */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/* 12px 의 120% = 14.4px */}
            <p
              className="text-[0.9rem]"
              style={{ color: "var(--viz-text-secondary)" }}
            >
              제3차 당대표·최고위원 선출 순회경선
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              더불어민주당 권리당원 온라인투표 누적 현황
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAsTable((v) => !v)}
              aria-pressed={asTable}
            >
              {asTable ? "차트로 보기" : "표로 보기"}
            </Button>
            <ThemeToggle />
            <AddEntryForm existingRegions={regions} onAdd={addEntry} />
          </div>
        </header>

        {/* 배너 — 헤더와 필터 사이, 1/3씩 세 칸 */}
        <BannerSlots />

        {/* 필터 + 일정 — 화면 전체를 스코프하는 컨트롤이므로 한 카드에 묶는다 */}
        <div
          className="flex flex-col rounded-xl"
          style={{
            background: "var(--viz-surface)",
            border: "1px solid var(--viz-hairline)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
              집계 지역
            </span>
            {entries.map((e) => {
              const on = !excluded.includes(e.region);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleRegion(e.region)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    on ? "font-medium" : "",
                  )}
                  style={{
                    background: on ? "var(--viz-s1)" : "transparent",
                    color: on ? "#ffffff" : "var(--viz-text-secondary)",
                    border: `1px solid ${on ? "transparent" : "var(--viz-hairline)"}`,
                  }}
                >
                  {e.region}
                </button>
              );
            })}
            {excluded.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setExcluded([])}
              >
                전체 선택
              </Button>
            ) : null}
          </div>

          <div style={{ borderTop: "1px solid var(--viz-hairline)" }} />

          {/* 경선 일정 — 두 줄 이내 요약, 상세는 모달 */}
          <ScheduleStrip collectedRegions={regions} />
        </div>

        {/* 당대표 누적 득표율 — 이 대시보드의 헤드라인 */}
        <Panel
          title="당대표 누적 득표율"
          copyImage
          subtitle={`집계 지역 ${totals.regions}곳 · 총 유효표 ${num(leaderTotal)}표`}
          action={<Legend items={legendItems("leader")} />}
        >
          {asTable ? (
            <DataTable
              columns={["순위", "후보", "득표수", "득표율"]}
              rows={[...leader]
                .sort((a, b) => a.rank - b.rank)
                .map((c) => [
                  `${c.rank}위`,
                  `${c.no}. ${c.name}`,
                  num(c.votes),
                  pct(c.share),
                ])}
            />
          ) : (
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,19rem)_1fr]">
              {leadingCandidate ? (
                <HeroFigure
                  label={`선두 · 기호 ${leadingCandidate.no}`}
                  headline={leadingCandidate.name}
                  value={pct(leadingCandidate.share)}
                  caption={
                    runnerUp
                      ? `${num(leadingCandidate.votes)}표 · 2위와 ${num(
                          leadingCandidate.votes - runnerUp.votes,
                        )}표 차`
                      : `${num(leadingCandidate.votes)}표`
                  }
                />
              ) : null}
              <BarList
                labelWidth="5rem"
                rows={leader.map<BarRow>((c) => ({
                  key: `leader-${c.no}`,
                  label: c.name,
                  badge: String(c.no),
                  value: c.votes,
                  valueLabel: `${num(c.votes)}표 · ${pct(c.share)}`,
                  colorVar: LEADER_COLORS[c.no - 1],
                  tooltip: [
                    { label: "득표수", value: `${num(c.votes)}표` },
                    { label: "득표율", value: pct(c.share) },
                    { label: "순위", value: `${c.rank}위` },
                  ],
                }))}
              />
            </div>
          )}
        </Panel>

        {/* 당대표 지역별 — 스몰 멀티플 */}
        <Panel
          title="당대표 지역별 득표율"
          copyImage
          subtitle="지역마다 같은 척도(0–100%)로 비교"
          action={<Legend items={legendItems("leader")} />}
        >
          {asTable ? (
            <DataTable
              columns={["지역", ...CANDIDATES.leader.map((c) => c.name)]}
              rows={entriesWithRace(selected, "leader").map((e) => {
                const r = resultsOf([e], "leader");
                return [e.region, ...r.map((c) => pct(c.share))];
              })}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {entriesWithRace(selected, "leader").map((e) => (
                <div key={e.id} className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium">{e.region}</span>
                    <span
                      className="text-[11px] tabular-nums"
                      style={{ color: "var(--viz-muted)" }}
                    >
                      {num(e.voters)}표
                    </span>
                  </div>
                  <BarList
                    max={100}
                    labelWidth="3.25rem"
                    rows={resultsOf([e], "leader").map<BarRow>((c) => ({
                      key: `${e.id}-${c.no}`,
                      label: c.name,
                      value: c.share,
                      valueLabel: pct(c.share, 1),
                      colorVar: LEADER_COLORS[c.no - 1],
                      tooltip: [
                        { label: "득표수", value: `${num(c.votes)}표` },
                        { label: "득표율", value: pct(c.share) },
                      ],
                    }))}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* 지도 */}
        <Panel
          title="지도로 보기"
          subtitle={
            mapMetric === "leader"
              ? "지역별 선두 후보의 득표율 — 진할수록 높음"
              : "지역별 투표율 — 진할수록 높음"
          }
          copyImage
          action={
            <div
              className="flex rounded-lg p-0.5"
              style={{ border: "1px solid var(--viz-hairline)" }}
            >
              {(
                [
                  ["leader", "선두 득표율"],
                  ["turnout", "투표율"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMapMetric(key)}
                  aria-pressed={mapMetric === key}
                  className="rounded-md px-2.5 py-1 text-xs transition-colors"
                  style={{
                    background:
                      mapMetric === key ? "var(--viz-s1)" : "transparent",
                    color:
                      mapMetric === key
                        ? "#ffffff"
                        : "var(--viz-text-secondary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {asTable ? (
            <DataTable
              columns={["지역", "선두 후보", "선두 득표율", "투표율"]}
              rows={mapData.map((d) => [
                d.region,
                d.caption ?? "—",
                d.detail[0]?.value ?? "—",
                d.detail[1]?.value ?? "—",
              ])}
            />
          ) : (
            <KoreaMap data={mapData} />
          )}
        </Panel>

        {/* 최고위원 */}
        <Panel
          title="최고위원 누적 득표"
          copyImage
          subtitle={`득표순 · 선출 정수 ${SUPREME_SEATS}명 · 집계 지역 ${supremeRegions.length}곳`}
        >
          {supremeMissing.length > 0 ? (
            <p
              className="rounded-lg px-3 py-2 text-xs"
              style={{
                color: "var(--viz-text-secondary)",
                border: "1px solid var(--viz-hairline)",
              }}
            >
              {supremeMissing.join("·")} 은(는) 최고위원 자료가 아직 입력되지
              않아 이 집계에서 제외했습니다. 0표로 넣으면 득표율이 왜곡되기
              때문입니다.
            </p>
          ) : null}
          {asTable ? (
            <DataTable
              columns={["순위", "후보", "득표수", "득표율"]}
              rows={[...supreme]
                .sort((a, b) => a.rank - b.rank)
                .map((c) => [
                  `${c.rank}위`,
                  `${c.no}. ${c.name}`,
                  num(c.votes),
                  pct(c.share),
                ])}
            />
          ) : (
            <BarList
              labelWidth="8rem"
              rows={[...supreme]
                .sort((a, b) => a.rank - b.rank)
                .map<BarRow>((c) => ({
                  key: `supreme-${c.no}`,
                  label: c.name,
                  badge: `${c.rank}위`,
                  value: c.votes,
                  valueLabel: `${num(c.votes)}표 · ${pct(c.share)}`,
                  colorVar: "--viz-s1",
                  dim: c.rank > SUPREME_SEATS,
                  tooltip: [
                    { label: "기호", value: String(c.no) },
                    { label: "득표수", value: `${num(c.votes)}표` },
                    { label: "득표율", value: pct(c.share) },
                    {
                      label: "선출권",
                      value: c.rank <= SUPREME_SEATS ? "당선권" : "당선권 밖",
                    },
                  ],
                }))}
            />
          )}
          {asTable ? null : (
            <p className="text-xs" style={{ color: "var(--viz-muted)" }}>
              흐리게 표시된 막대는 상위 {SUPREME_SEATS}명(당선권) 밖입니다.
              순위는 라벨로도 표시되므로 색에만 의존하지 않습니다.
            </p>
          )}
        </Panel>

        {/* 참고 — 투표 참여 현황 */}
        <Panel
          title="투표 참여 현황"
          copyImage
          subtitle="참고 지표 · 선거인수 대비 온라인투표 참여율"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label={`누적 투표율 · ${totals.regions}개 지역`}
              value={pct(totals.turnout)}
              note={`${num(totals.voters)}명 / ${num(totals.electorate)}명`}
            />
            <StatTile
              label="총선거인수"
              value={`${num(totals.electorate)}명`}
            />
            <StatTile
              label="최고 투표율 지역"
              value={topTurnout ? topTurnout.region : "—"}
              note={topTurnout ? pct(topTurnout.turnout) : undefined}
            />
          </div>

          {asTable ? (
            <DataTable
              columns={["지역", "총선거인수", "투표자수", "투표율"]}
              rows={turnouts.map((t) => [
                t.region,
                num(t.electorate),
                num(t.voters),
                pct(t.turnout),
              ])}
            />
          ) : turnouts.length === 1 ? null : (
            <BarList
              max={Math.max(...turnouts.map((t) => t.turnout), 1)}
              rows={turnouts.map<BarRow>((t) => ({
                key: t.id,
                label: t.region,
                value: t.turnout,
                valueLabel: pct(t.turnout),
                colorVar: "--viz-s1",
                tooltip: [
                  { label: "총선거인수", value: `${num(t.electorate)}명` },
                  { label: "투표자수", value: `${num(t.voters)}명` },
                  { label: "투표율", value: pct(t.turnout) },
                ],
              }))}
            />
          )}
        </Panel>

        {/* 입력한 데이터 관리 */}
        <Panel
          title="누적 집계에 포함된 지역"
          subtitle="직접 입력한 지역은 삭제할 수 있습니다"
          action={
            userEntries.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                보도자료 값으로 초기화
              </Button>
            ) : null
          }
        >
          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2"
                style={{ border: "1px solid var(--viz-hairline)" }}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{e.region}</span>
                  <Badge variant="secondary">{e.group}</Badge>
                  {e.votes.supreme === null ? (
                    <Badge variant="outline">최고위원 미입력</Badge>
                  ) : null}
                  <span
                    className="text-xs"
                    style={{ color: "var(--viz-muted)" }}
                  >
                    {e.date} · 선거인 {num(e.electorate)}명 · 투표{" "}
                    {num(e.voters)}명
                  </span>
                </div>
                {e.seeded ? (
                  <span
                    className="text-xs"
                    style={{ color: "var(--viz-muted)" }}
                  >
                    보도자료
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => removeEntry(e.id)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Separator className="mt-2" />

        <footer className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p
              className="text-xs"
              style={{ color: "var(--viz-text-secondary)" }}
            >
              출처: 더불어민주당 중앙당 선거관리위원회 보도자료 — 제3차
              당대표·최고위원 선출 순회경선 충청권(2026.08.01.) 및
              울산·부산·경남 권리당원 투표결과.
            </p>
            <p className="text-xs" style={{ color: "var(--viz-muted)" }}>
              직접 입력한 누적값은 이 브라우저에만 저장되며, 공식 집계가
              아닙니다.
            </p>
          </div>

          <div className="flex flex-col gap-1 sm:items-end">
            <VisitorCount />
            <p
              className="text-xs whitespace-nowrap"
              style={{ color: "var(--viz-muted)" }}
            >
              Made by{" "}
              <a
                href="https://gqai.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--viz-s1)" }}
              >
                GQAI.kr
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function legendItems(race: Race) {
  return CANDIDATES[race].map((c, i) => ({
    key: `${RACE_LABEL[race]}-${c.no}`,
    label: c.name,
    colorVar: LEADER_COLORS[i],
  }));
}
