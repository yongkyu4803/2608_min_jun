import { CANDIDATES, type Candidate, type Race } from "@/lib/election";

/**
 * 권역 순회경선(지역) 밖의 선거인단.
 *
 * 지역 집계와 성격이 달라 RegionEntry 와 섞지 않는다 —
 * 지도·지역별 득표율·누적 투표율은 지금까지처럼 시·도 자료만으로 계산된다.
 * 최종 결과는 「권리당원·대의원 70% + 국민여론조사 30%」로 합산되므로,
 * 여기 값을 지역 누적에 그대로 더하면 이중 계산이 된다.
 */
export type SegmentKey = "delegate" | "overseas" | "public";

/**
 * 값의 성격.
 * - votes: 득표수(명). 득표율은 유효표 합에서 계산한다.
 * - poll: 여론조사 응답 비율(%). 이미 비율이므로 다시 나누지 않는다.
 */
export type SegmentKind = "votes" | "poll";

export type SegmentEntry = {
  key: SegmentKey;
  /** 카드 제목 */
  label: string;
  /** 투표 방식·기간 안내 */
  note: string;
  kind: SegmentKind;
  /** 결과 발표 예정일 (YYYY-MM-DD) — 미발표 카드에 표시한다 */
  scheduled: string;
  /** 실제 발표일. 값을 채울 때 같이 적는다 */
  date?: string;
  /** votes 방식 — 선거인수 / 투표자수 */
  electorate?: number;
  voters?: number;
  /** poll 방식 — 응답자수(표본) */
  samples?: number;
  /**
   * 기호 → 값. 아직 발표되지 않았으면 null (0으로 두면 득표율이 0%로 거짓말한다).
   * 최고위원 자료가 따로 없으면 supreme 은 null 로 남긴다.
   */
  results: Record<Race, Record<number, number> | null>;
};

/**
 * ── 값 채우는 법 ────────────────────────────────────────────────
 * 보도자료가 나오면 아래 항목의 null 자리만 바꾸면 화면이 따라 바뀐다.
 *
 *   date: "2026-08-17",
 *   electorate: 12_345,
 *   voters: 9_876,
 *   results: {
 *     leader: { 1: 987, 2: 4_321, 3: 4_568 },   // 기호 → 득표수
 *     supreme: { 1: …, 2: …, …, 8: … },          // 없으면 null 그대로
 *   },
 *
 * 국민경선(kind: "poll")은 득표수가 아니라 %를 넣는다 — { 1: 8.5, 2: 41.2, 3: 50.3 }.
 * ───────────────────────────────────────────────────────────────
 */
export const SEGMENTS: SegmentEntry[] = [
  {
    key: "delegate",
    label: "대의원",
    note: "전국대의원 온라인 투표 · 8.17",
    kind: "votes",
    scheduled: "2026-08-17",
    results: { leader: null, supreme: null },
  },
  {
    key: "overseas",
    label: "재외국민",
    note: "재외국민 당원 투표 · 8.9 ~ 8.11",
    kind: "votes",
    scheduled: "2026-08-17",
    results: { leader: null, supreme: null },
  },
  {
    key: "public",
    label: "국민경선",
    note: "국민여론조사 · 8.14 ~ 8.15 · 최종 반영 30%",
    kind: "poll",
    scheduled: "2026-08-17",
    results: { leader: null, supreme: null },
  },
];

export type SegmentResult = Candidate & {
  /** 원값 — votes 방식이면 득표수, poll 방식이면 % */
  value: number;
  /** 득표율/지지율 (%) */
  share: number;
  rank: number;
};

/** 발표 전이면 null — 호출부에서 "미발표"로 분기한다 */
export function segmentResults(
  segment: SegmentEntry,
  race: Race,
): SegmentResult[] | null {
  const raw = segment.results[race];
  if (!raw) return null;

  const rows = CANDIDATES[race].map((c) => ({ ...c, value: raw[c.no] ?? 0 }));
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  const ordered = [...rows].sort((a, b) => b.value - a.value);

  return rows.map((r) => ({
    ...r,
    // 여론조사 값은 이미 비율이다 — 무응답 때문에 합이 100이 아니어도 그대로 쓴다
    share:
      segment.kind === "poll" ? r.value : total > 0 ? (r.value / total) * 100 : 0,
    rank: ordered.findIndex((o) => o.no === r.no) + 1,
  }));
}

/** votes 방식이고 선거인수가 들어온 경우에만 투표율이 있다 */
export function segmentTurnout(segment: SegmentEntry) {
  if (segment.kind !== "votes") return null;
  const { electorate, voters } = segment;
  if (!electorate || voters === undefined) return null;
  return (voters / electorate) * 100;
}

export function hasSegmentData(segment: SegmentEntry, race: Race = "leader") {
  return segment.results[race] !== null;
}
