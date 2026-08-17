import {
  CANDIDATES,
  FINAL_ELECTORATE,
  FINAL_GAP_NOTE,
  RACE_LABEL,
  SUPREME_SEATS,
  finalResultsOf,
  type FinalShares,
  type Race,
  type RegionEntry,
} from "@/lib/election";
import { CONVENTION } from "@/lib/schedule";
import { SEGMENTS, segmentResults, segmentTurnout } from "@/lib/segments";

/**
 * 로데이터 엑셀 내보내기.
 *
 * 화면은 집계·반올림된 값을 보여 주지만 여기서는 원표를 그대로 싣는다.
 * 두 가지 원칙을 지킨다 —
 *   1) 자료가 없는 칸은 0이 아니라 빈 칸으로 둔다. 0을 넣으면 받는 사람이
 *      득표율을 다시 계산할 때 분모가 틀어진다.
 *   2) 득표율은 % 단위 숫자(45.92)로 넣는다. Excel 백분율 서식(0.4592)로
 *      두면 화면 값과 셀 값이 달라 보여 검증이 어렵다.
 */

/** 라이브러리 타입을 직접 import 하지 않는다 — 이 파일은 번들에 항상 들어가고 라이브러리는 클릭 시에만 로드된다 */
type Cell = string | number | boolean | null | { value?: unknown; [k: string]: unknown };
type SheetSpec = {
  sheet: string;
  data: Cell[][];
  columns?: { width: number }[];
};

const bold = (text: string): Cell => ({ value: text, fontWeight: "bold" });
const header = (cells: string[]) => cells.map(bold);
const w = (...widths: number[]) => widths.map((width) => ({ width }));

const pctOrBlank = (n: number | null | undefined) =>
  n === null || n === undefined ? null : Number(n.toFixed(4));

/* ------------------------------------------------------------------ */
/* 시트 1 — 지역별 순회경선 원표                                        */
/* ------------------------------------------------------------------ */

function regionSheet(entries: RegionEntry[]): SheetSpec {
  const head = header([
    "지역",
    "발표 단위",
    "권역",
    "발표일",
    "출처",
    "총선거인수",
    "투표자수",
    "투표율(%)",
    ...CANDIDATES.leader.map((c) => `당대표 ${c.no}.${c.name}`),
    ...CANDIDATES.supreme.map((c) => `최고위원 ${c.no}.${c.name}`),
  ]);

  const rows = entries.map((e): Cell[] => [
    e.region,
    // 묶어서 발표된 지역만 값이 있다 (예: 전남·광주)
    e.mapRegions ? e.mapRegions.join(", ") : null,
    e.group,
    e.date,
    e.seeded ? "보도자료" : "직접 입력",
    e.electorate,
    e.voters,
    e.electorate > 0 ? Number(((e.voters / e.electorate) * 100).toFixed(4)) : null,
    // 해당 경선 자료가 없는 지역은 빈 칸 — 0표와 구분해야 한다
    ...CANDIDATES.leader.map((c) => e.votes.leader?.[c.no] ?? null),
    ...CANDIDATES.supreme.map((c) => e.votes.supreme?.[c.no] ?? null),
  ]);

  return {
    sheet: "지역별 원표",
    data: [head, ...rows],
    columns: w(
      12,
      14,
      14,
      12,
      10,
      12,
      12,
      10,
      ...CANDIDATES.leader.map(() => 14),
      ...CANDIDATES.supreme.map(() => 16),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* 시트 2 — 지역 외 선거인단 (긴 형식)                                  */
/* ------------------------------------------------------------------ */

/**
 * 대의원은 득표수, 국민경선은 지지율(%)이라 단위가 섞인다.
 * 열을 후보로 펼치면 경선마다 후보 수가 달라 표가 어긋나므로 행으로 눕힌다.
 */
function segmentSheet(): SheetSpec {
  const head = header([
    "구분",
    "발표일",
    "경선",
    "기호",
    "후보",
    "값",
    "단위",
    "득표율(%)",
    "선거인수",
    "투표자수",
    "투표율(%)",
    "비고",
  ]);

  const rows: Cell[][] = [];
  for (const segment of SEGMENTS) {
    const turnout = segmentTurnout(segment);
    const races: Race[] = ["leader", "supreme"];
    let wrote = false;

    for (const race of races) {
      const results = segmentResults(segment, race);
      if (!results) continue;
      for (const c of results) {
        wrote = true;
        rows.push([
          segment.label,
          segment.date ?? null,
          RACE_LABEL[race],
          c.no,
          c.name.replace(/\s/g, ""),
          Number(c.value.toFixed(4)),
          segment.kind === "poll" ? "%" : "표",
          pctOrBlank(c.share),
          segment.electorate ?? null,
          segment.voters ?? null,
          pctOrBlank(turnout),
          null,
        ]);
      }
    }

    // 값이 하나도 없는 구분도 존재는 남긴다 — 빠뜨린 것과 발표가 없는 것은 다르다
    if (!wrote) {
      rows.push([
        segment.label,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        segment.electorate ?? null,
        segment.voters ?? null,
        pctOrBlank(turnout),
        segment.absorbed ?? "미발표",
      ]);
    }
  }

  return {
    sheet: "지역 외 선거인단",
    data: [head, ...rows],
    columns: w(12, 12, 10, 6, 12, 12, 6, 10, 12, 12, 10, 34),
  };
}

/* ------------------------------------------------------------------ */
/* 시트 3 — 전당대회 최종 결과                                          */
/* ------------------------------------------------------------------ */

function finalSheet(shares: Partial<Record<Race, FinalShares>>): SheetSpec {
  const head = header([
    "경선",
    "기호",
    "후보",
    "전국대의원 득표수",
    "권리당원 득표수",
    "대의원·권리당원 득표율(%)",
    "국민여론조사(%)",
    "최종 득표율(%)",
    "순위",
    "당선",
  ]);

  const rows: Cell[][] = [];
  for (const race of ["leader", "supreme"] as Race[]) {
    const raceShares = shares[race];
    if (!raceShares) continue;
    const results = [...finalResultsOf(raceShares, race)].sort(
      (a, b) => a.rank - b.rank,
    );
    for (const c of results) {
      rows.push([
        RACE_LABEL[race],
        c.no,
        c.name.replace(/\s/g, ""),
        c.breakdown?.delegate ?? null,
        c.breakdown?.member ?? null,
        pctOrBlank(c.party),
        pctOrBlank(c.poll),
        pctOrBlank(c.combined),
        c.rank,
        c.elected ? "당선" : null,
      ]);
    }

    // 최종 집계표에서 빠진 후보 — 0%가 아니라 사유를 적는다
    for (const c of CANDIDATES[race]) {
      if (raceShares[c.no] !== undefined) continue;
      rows.push([
        RACE_LABEL[race],
        c.no,
        c.name.replace(/\s/g, ""),
        null,
        null,
        null,
        null,
        null,
        null,
        c.droppedOut ? `${c.droppedOut.label} (${c.droppedOut.date})` : "집계 제외",
      ]);
    }
  }

  return {
    sheet: "최종 결과",
    data: [head, ...rows],
    columns: w(10, 6, 12, 18, 18, 24, 18, 16, 8, 18),
  };
}

/* ------------------------------------------------------------------ */
/* 시트 4 — 선거인단 투표 현황                                          */
/* ------------------------------------------------------------------ */

function electorateSheet(): SheetSpec {
  const head = header(["구분", "총선거인수", "투표자수", "투표율(%)"]);
  const row = (label: string, electorate: number, voters: number): Cell[] => [
    label,
    electorate,
    voters,
    electorate > 0 ? Number(((voters / electorate) * 100).toFixed(4)) : null,
  ];

  return {
    sheet: "선거인단 투표 현황",
    data: [
      head,
      ...FINAL_ELECTORATE.rows.map((r) => row(r.label, r.electorate, r.voters)),
      row("총합", FINAL_ELECTORATE.total.electorate, FINAL_ELECTORATE.total.voters),
    ],
    columns: w(16, 14, 14, 12),
  };
}

/* ------------------------------------------------------------------ */
/* 시트 5 — 읽는 법                                                     */
/* ------------------------------------------------------------------ */

/**
 * 숫자만 넘기면 받는 사람이 지역 누적과 최종 결과를 그대로 비교하다 틀린 결론에 닿는다.
 * 둘의 집계 범위가 왜 다른지를 파일 안에 같이 넣는다.
 */
function readmeSheet(entries: RegionEntry[], generatedAt: Date): SheetSpec {
  const userCount = entries.filter((e) => !e.seeded).length;
  const note = (label: string, value: string): Cell[] => [bold(label), value];

  return {
    sheet: "읽는 법",
    data: [
      [bold("제3차 정기전국당원대회 로데이터")],
      [],
      note("생성 시각", generatedAt.toLocaleString("ko-KR")),
      note(
        "출처",
        "더불어민주당 중앙당 선거관리위원회 보도자료 — 권역별 권리당원 투표결과(2026.08.01.~08.16.) 및 당대표·최고위원 선거 결과(2026.08.17.)",
      ),
      note("최종 결과 산정", `① ${CONVENTION.weightNote} ② ${CONVENTION.formula}`),
      note("최고위원 선출 정수", `${SUPREME_SEATS}명`),
      note(
        "직접 입력분",
        userCount > 0
          ? `${userCount}건 포함 — '지역별 원표' 시트의 출처 열이 '직접 입력'인 행. 공식 집계가 아닙니다.`
          : "없음 (전부 보도자료 값)",
      ),
      [],
      [bold("주의")],
      ["빈 칸은 0이 아니라 '자료 없음'입니다. 0으로 바꿔 계산하면 득표율이 왜곡됩니다."],
      [`당대표 — ${FINAL_GAP_NOTE.leader}`],
      [`최고위원 — ${FINAL_GAP_NOTE.supreme}`],
      [
        "'지역별 원표'와 '최종 결과'는 집계 범위가 다릅니다. 두 시트의 후보별 득표수를 직접 빼서 비교하지 마세요.",
      ],
      [
        "'최종 득표율'은 보도자료에 인쇄된 값입니다. 앞의 두 열로 다시 계산하면 지역 가중치·반올림 때문에 0.01%p 안팎이 어긋납니다.",
      ],
    ],
    columns: w(18, 120),
  };
}

/* ------------------------------------------------------------------ */

export function buildWorkbook(
  entries: RegionEntry[],
  finalShares: Partial<Record<Race, FinalShares>>,
  generatedAt = new Date(),
): SheetSpec[] {
  return [
    regionSheet(entries),
    segmentSheet(),
    finalSheet(finalShares),
    electorateSheet(),
    readmeSheet(entries, generatedAt),
  ];
}

export function workbookFileName(generatedAt = new Date()) {
  const d = generatedAt;
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("");
  return `민주당_전당대회_로데이터_${stamp}.xlsx`;
}
