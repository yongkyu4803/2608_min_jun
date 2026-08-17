import { CONVENTION } from "./schedule";

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
  /**
   * 지도에서 이 레코드가 덮는 시·도 이름들.
   * 보도자료가 여러 시·도를 묶어 발표한 경우(예: 전남광주)에만 쓴다 — 생략하면 region 하나.
   */
  mapRegions?: string[];
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

  /* 울산·부산·경남 권리당원 투표결과 보도자료 */
  {
    id: "seed-ulsan",
    region: "울산",
    group: "부울경",
    date: "2026-08-02",
    electorate: 18_027,
    voters: 9_363,
    votes: {
      leader: leader(972, 4_054, 4_337),
      supreme: supreme(4_199, 2_309, 540, 2_694, 2_680, 2_069, 3_205, 1_030),
    },
    seeded: true,
  },
  {
    id: "seed-busan",
    region: "부산",
    group: "부울경",
    date: "2026-08-02",
    electorate: 34_016,
    voters: 21_216,
    votes: {
      leader: leader(1_689, 10_345, 9_182),
      supreme: supreme(9_846, 5_254, 1_009, 6_039, 6_484, 5_368, 6_528, 1_904),
    },
    seeded: true,
  },
  {
    id: "seed-gyeongnam",
    region: "경남",
    group: "부울경",
    date: "2026-08-02",
    electorate: 46_681,
    voters: 23_414,
    votes: {
      leader: leader(2_468, 10_790, 10_156),
      supreme: supreme(
        10_651,
        5_669,
        1_590,
        6_228,
        6_896,
        5_379,
        7_584,
        2_831,
      ),
    },
    seeded: true,
  },

  /* 제주·인천 권리당원 온라인투표 결과 보도자료 (2026.08.08.) */
  {
    id: "seed-jeju",
    region: "제주",
    group: "제주·인천",
    date: "2026-08-08",
    electorate: 44_195,
    voters: 16_607,
    votes: {
      leader: leader(1_240, 6_625, 8_742),
      supreme: supreme(6_080, 4_422, 1_376, 4_781, 4_680, 3_696, 5_125, 3_054),
    },
    seeded: true,
  },
  {
    id: "seed-incheon",
    region: "인천",
    group: "제주·인천",
    date: "2026-08-08",
    electorate: 56_942,
    voters: 30_591,
    votes: {
      leader: leader(3_559, 13_237, 13_795),
      supreme: supreme(9_980, 8_071, 1_588, 9_508, 8_930, 8_200, 11_694, 3_211),
    },
    seeded: true,
  },

  /* 강원·대구·경북 권리당원 투표 결과 보도자료 (2026.08.09.) */
  {
    id: "seed-gangwon",
    region: "강원",
    group: "강원·대구·경북",
    date: "2026-08-09",
    electorate: 44_164,
    voters: 19_022,
    votes: {
      leader: leader(1_476, 7_978, 9_568),
      supreme: supreme(6_760, 5_034, 1_231, 5_740, 5_218, 4_472, 6_790, 2_799),
    },
    seeded: true,
  },
  {
    id: "seed-daegu",
    region: "대구",
    group: "강원·대구·경북",
    date: "2026-08-09",
    electorate: 13_366,
    voters: 9_625,
    votes: {
      leader: leader(561, 4_603, 4_461),
      supreme: supreme(3_263, 2_520, 347, 2_894, 2_972, 2_846, 2_935, 1_473),
    },
    seeded: true,
  },
  {
    id: "seed-gyeongbuk",
    region: "경북",
    group: "강원·대구·경북",
    date: "2026-08-09",
    electorate: 14_666,
    voters: 10_445,
    votes: {
      leader: leader(723, 4_774, 4_948),
      supreme: supreme(3_303, 2_380, 360, 2_926, 2_871, 2_629, 3_152, 3_269),
    },
    seeded: true,
  },

  /* 전남광주·전북 권리당원 투표 결과 보도자료 (2026.08.15.) */
  {
    // 보도자료가 전남과 광주를 하나로 묶어 발표해 분리할 수 없다.
    id: "seed-jeonnam-gwangju",
    region: "전남·광주",
    mapRegions: ["전남", "광주"],
    group: "전남광주·전북",
    date: "2026-08-15",
    electorate: 314_184,
    voters: 151_756,
    votes: {
      leader: leader(16_874, 48_324, 86_558),
      supreme: supreme(
        46_298,
        41_147,
        14_468,
        54_806,
        31_475,
        31_421,
        60_691,
        23_206,
      ),
    },
    seeded: true,
  },
  {
    id: "seed-jeonbuk",
    region: "전북",
    group: "전남광주·전북",
    date: "2026-08-15",
    electorate: 192_020,
    voters: 90_333,
    votes: {
      leader: leader(6_875, 30_709, 52_749),
      supreme: supreme(
        25_297,
        24_851,
        6_326,
        26_845,
        22_979,
        31_752,
        29_037,
        13_579,
      ),
    },
    seeded: true,
  },

  /* 경기·서울 권리당원 투표 결과 보도자료 (2026.08.16.) */
  {
    id: "seed-gyeonggi",
    region: "경기",
    group: "경기·서울",
    date: "2026-08-16",
    electorate: 331_876,
    voters: 180_804,
    votes: {
      leader: leader(12_530, 83_832, 84_442),
      supreme: supreme(
        59_550,
        52_690,
        8_310,
        53_100,
        54_477,
        57_304,
        55_296,
        20_881,
      ),
    },
    seeded: true,
  },
  {
    id: "seed-seoul",
    region: "서울",
    group: "경기·서울",
    date: "2026-08-16",
    electorate: 251_762,
    voters: 136_889,
    votes: {
      leader: leader(9_880, 63_206, 63_803),
      supreme: supreme(
        44_133,
        37_775,
        9_563,
        39_167,
        42_595,
        44_144,
        40_250,
        16_151,
      ),
    },
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
/* 전당대회 최종 결과 (권리당원·대의원 + 국민여론조사 가중합산)          */
/* ------------------------------------------------------------------ */

/**
 * 후보 기호 → 최종 득표율(%).
 * poll 은 해당 경선에 국민여론조사가 없으면(예: 최고위원) null — party 그대로가 최종 순위가 된다.
 */
export type FinalShares = Record<number, { party: number; poll: number | null }>;

export type FinalCandidateResult = Candidate & {
  /** 권리당원·대의원 최종 득표율 (%) */
  party: number;
  /** 국민여론조사 득표율 (%) — 없으면 null */
  poll: number | null;
  /** CONVENTION 가중치로 합산한 최종 득표율 (%). poll 이 없으면 party 와 같다 */
  combined: number;
  rank: number;
};

/** 표수 누적(resultsOf)과 달리, 이미 발표된 득표율(%) 두 개를 가중합산만 한다 — 재계산할 원표가 없다. */
export function finalResultsOf(
  shares: FinalShares,
  race: Race,
): FinalCandidateResult[] {
  const list = CANDIDATES[race].map((c) => {
    const s = shares[c.no] ?? { party: 0, poll: null };
    const combined =
      s.poll === null
        ? s.party
        : s.party * CONVENTION.partyWeight + s.poll * CONVENTION.pollWeight;
    return { ...c, party: s.party, poll: s.poll, combined };
  });
  const ordered = [...list].sort((a, b) => b.combined - a.combined);
  return list.map((v) => ({
    ...v,
    rank: ordered.findIndex((o) => o.no === v.no) + 1,
  }));
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
