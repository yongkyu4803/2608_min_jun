export type Race = "leader" | "supreme";

export type Candidate = {
  /** 기호 */
  no: number;
  name: string;
};

/** 당대표 후보 (기호순) */
export const LEADER_CANDIDATES: Candidate[] = [
  { no: 1, name: "송영길" },
  { no: 2, name: "정청래" },
  { no: 3, name: "김민석" },
];

/** 최고위원 후보 (기호순) */
export const SUPREME_CANDIDATES: Candidate[] = [
  { no: 1, name: "최민희" },
  { no: 2, name: "김　용" },
  { no: 3, name: "김영호" },
  { no: 4, name: "서미화" },
  { no: 5, name: "한민수" },
  { no: 6, name: "이성윤" },
  { no: 7, name: "박선원" },
  { no: 8, name: "임미애" },
];

export const CANDIDATES: Record<Race, Candidate[]> = {
  leader: LEADER_CANDIDATES,
  supreme: SUPREME_CANDIDATES,
};

export const RACE_LABEL: Record<Race, string> = {
  leader: "당대표",
  supreme: "최고위원",
};

/** 최고위원 선출 정수 */
export const SUPREME_SEATS = 5;

/**
 * 한 지역(시·도)의 온라인투표 누적 집계 1건.
 * 순회경선은 권역별로 결과가 쌓이므로, 지역 단위 레코드를 더해 누적값을 만든다.
 */
export type RegionEntry = {
  id: string;
  /** 시·도 이름 (예: 충남) */
  region: string;
  /** 권역 (예: 충청권) */
  group: string;
  /** 발표일 (YYYY-MM-DD) */
  date: string;
  /** 총선거인수 */
  electorate: number;
  /** 투표자수 */
  voters: number;
  /**
   * 후보 기호 → 득표수.
   * 해당 경선 자료가 아직 없는 지역은 null — 0표와 구분해야 득표율이 왜곡되지 않는다.
   */
  votes: Record<Race, Record<number, number> | null>;
  /** 보도자료에서 온 기본 데이터인지 (사용자 입력과 구분) */
  seeded?: boolean;
};

const leader = (a: number, b: number, c: number) => ({ 1: a, 2: b, 3: c });
const supreme = (...v: number[]) =>
  Object.fromEntries(v.map((n, i) => [i + 1, n])) as Record<number, number>;

/** 2026-08-01 중앙당 선거관리위원회 보도자료 — 충청권 권리당원 온라인투표 결과 */
export const SEED_ENTRIES: RegionEntry[] = [
  {
    id: "seed-chungnam",
    region: "충남",
    group: "충청권",
    date: "2026-08-01",
    electorate: 69_980,
    voters: 27_345,
    votes: {
      leader: leader(3_026, 11_835, 12_484),
      supreme: supreme(12_024, 6_806, 2_113, 7_716, 7_625, 5_840, 9_237, 3_329),
    },
    seeded: true,
  },
  {
    id: "seed-chungbuk",
    region: "충북",
    group: "충청권",
    date: "2026-08-01",
    electorate: 46_769,
    voters: 18_920,
    votes: {
      leader: leader(2_034, 7_919, 8_967),
      supreme: supreme(8_217, 5_065, 1_490, 5_240, 5_084, 3_873, 6_405, 2_466),
    },
    seeded: true,
  },
  {
    id: "seed-daejeon",
    region: "대전",
    group: "충청권",
    date: "2026-08-01",
    electorate: 37_937,
    voters: 16_974,
    votes: {
      leader: leader(1_538, 8_187, 7_249),
      supreme: supreme(7_854, 4_049, 1_121, 4_427, 5_028, 3_970, 5_556, 1_943),
    },
    seeded: true,
  },
  {
    id: "seed-sejong",
    region: "세종",
    group: "충청권",
    date: "2026-08-01",
    electorate: 9_160,
    voters: 4_749,
    votes: {
      leader: leader(429, 2_388, 1_932),
      supreme: supreme(2_289, 1_125, 299, 1_134, 1_485, 1_155, 1_523, 488),
    },
    seeded: true,
  },

  /*
   * 울산·부산·경남 권리당원 투표결과 보도자료.
   *
   * 최고위원은 기호 1~3(최민희·김용·김영호) 자료를 아직 확보하지 못해 null 로 둔다.
   * 확보한 기호 4~8 득표수는 다음과 같으므로, 1~3 이 들어오는 대로 함께 채우면 된다.
   *   서미화  울산 2,694 · 부산 6,039 · 경남 6,228 (합 14,961)
   *   한민수  울산 2,680 · 부산 6,484 · 경남 6,896 (합 16,060)
   *   이성윤  울산 2,069 · 부산 5,368 · 경남 5,379 (합 12,816)
   *   박선원  울산 3,205 · 부산 6,528 · 경남 7,584 (합 17,317)
   *   임미애  울산 1,030 · 부산 1,904 · 경남 2,831 (합  5,765)
   */
  {
    id: "seed-ulsan",
    region: "울산",
    group: "부울경",
    date: "2026-08-02",
    electorate: 18_027,
    voters: 9_363,
    votes: { leader: leader(972, 4_054, 4_337), supreme: null },
    seeded: true,
  },
  {
    id: "seed-busan",
    region: "부산",
    group: "부울경",
    date: "2026-08-02",
    electorate: 34_016,
    voters: 21_216,
    votes: { leader: leader(1_689, 10_345, 9_182), supreme: null },
    seeded: true,
  },
  {
    id: "seed-gyeongnam",
    region: "경남",
    group: "부울경",
    date: "2026-08-02",
    electorate: 46_681,
    voters: 23_414,
    votes: { leader: leader(2_468, 10_790, 10_156), supreme: null },
    seeded: true,
  },
];

/* ------------------------------------------------------------------ */
/* 집계                                                                */
/* ------------------------------------------------------------------ */

export type CandidateResult = Candidate & {
  votes: number;
  /** 해당 경선 총 유효표 대비 득표율 (%) */
  share: number;
  /** 득표수 기준 순위 (1부터) */
  rank: number;
};

export type Totals = {
  electorate: number;
  voters: number;
  /** 투표율 (%) */
  turnout: number;
  regions: number;
};

export function totalsOf(entries: RegionEntry[]): Totals {
  const electorate = sum(entries.map((e) => e.electorate));
  const voters = sum(entries.map((e) => e.voters));
  return {
    electorate,
    voters,
    turnout: electorate > 0 ? (voters / electorate) * 100 : 0,
    regions: entries.length,
  };
}

/** 해당 경선 자료가 있는 지역만 */
export function entriesWithRace(entries: RegionEntry[], race: Race) {
  return entries.filter((e) => e.votes[race] !== null);
}

/** 해당 경선 자료가 아직 없는 지역 이름 */
export function regionsMissingRace(entries: RegionEntry[], race: Race) {
  return entries.filter((e) => e.votes[race] === null).map((e) => e.region);
}

/**
 * 경선별 후보 누적 득표 — 배열 순서는 항상 기호순(색 고정용), rank는 별도 필드.
 * 자료가 없는 지역은 집계에서 제외한다 (0표로 넣으면 득표율이 왜곡된다).
 */
export function resultsOf(entries: RegionEntry[], race: Race): CandidateResult[] {
  const scoped = entriesWithRace(entries, race);
  const votes = CANDIDATES[race].map((c) => ({
    ...c,
    votes: sum(scoped.map((e) => e.votes[race]?.[c.no] ?? 0)),
  }));
  const total = sum(votes.map((v) => v.votes));
  const ordered = [...votes].sort((a, b) => b.votes - a.votes);
  return votes.map((v) => ({
    ...v,
    share: total > 0 ? (v.votes / total) * 100 : 0,
    rank: ordered.findIndex((o) => o.no === v.no) + 1,
  }));
}

/** 지역별 투표율 */
export function turnoutByRegion(entries: RegionEntry[]) {
  return entries.map((e) => ({
    id: e.id,
    region: e.region,
    group: e.group,
    electorate: e.electorate,
    voters: e.voters,
    turnout: e.electorate > 0 ? (e.voters / e.electorate) * 100 : 0,
  }));
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}

/* ------------------------------------------------------------------ */
/* 포맷                                                                */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat("ko-KR");

export function num(n: number) {
  return nf.format(Math.round(n));
}

export function pct(n: number, digits = 2) {
  return `${n.toFixed(digits)}%`;
}
