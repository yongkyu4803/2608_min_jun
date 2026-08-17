import { CONVENTION } from "./schedule";

export type Race = "leader" | "supreme";

export type Candidate = {
  /** 기호 */
  no: number;
  name: string;
  /**
   * 최종 집계에서 빠진 사유.
   * 지역 순회경선에는 표가 그대로 남아 있으므로 누적 화면에서 구분 표시가 필요하다.
   */
  droppedOut?: { label: string; date: string };
};

/**
 * 당대표 후보 (기호순).
 * 선호투표제 — 1순위 과반 득표자가 없으면 최하위 후보가 탈락하고 그 표는 차순위 후보로 넘어간다.
 */
export const LEADER_CANDIDATES: Candidate[] = [
  {
    no: 1,
    name: "송영길",
    // 사퇴가 아니라 1순위 최하위(8.58%)로 탈락 — 그의 표는 2순위대로 재배분됐다
    droppedOut: { label: "탈락", date: "2026-08-17" },
  },
  { no: 2, name: "정청래" },
  { no: 3, name: "김민석" },
];

/** 최고위원 후보 (기호순). 선호투표가 아니라 연기명 투표라 사퇴 후보의 표는 재배분되지 않는다. */
export const SUPREME_CANDIDATES: Candidate[] = [
  { no: 1, name: "최민희" },
  { no: 2, name: "김　용" },
  // 8.16 서울·경기 결과 발표 직후 두 후보가 사퇴하며 김용 지지를 선언했다
  { no: 3, name: "김영호", droppedOut: { label: "사퇴", date: "2026-08-16" } },
  { no: 4, name: "서미화" },
  { no: 5, name: "한민수" },
  { no: 6, name: "이성윤" },
  { no: 7, name: "박선원" },
  { no: 8, name: "임미애", droppedOut: { label: "사퇴", date: "2026-08-16" } },
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

/** 한 후보의 최종 득표율 구성 */
export type FinalShare = {
  /** 전국대의원·권리당원 통합 득표율 (%) */
  party: number;
  /** 국민여론조사 득표율 (%) — 해당 경선에 여론조사가 없으면 null */
  poll: number | null;
  /**
   * 보도자료에 인쇄된 최종 득표율 (%). 있으면 가중합산 대신 이 값을 쓴다.
   * 당이 발표한 숫자를 우리가 다시 계산해 0.01%p 어긋나게 만들지 않기 위함이다 —
   * 대구·경북·경남 5% 가중치와 반올림 때문에 재계산값이 미세하게 벌어진다.
   */
  official?: number;
  /** 합산 전 원표 — 있으면 툴팁에 그대로 보여준다 */
  breakdown?: { delegate: number; member: number };
};

/**
 * 후보 기호 → 최종 득표율.
 * 최종 집계표에 없는 후보(사퇴 등)는 키 자체를 넣지 않는다 — 0%로 채우면 최하위로 그려져 거짓말이 된다.
 */
export type FinalShares = Record<number, FinalShare>;

export type FinalCandidateResult = Candidate &
  FinalShare & {
    /** 발표된 최종 득표율, 없으면 CONVENTION 가중치로 합산한 값 (%) */
    combined: number;
    rank: number;
    /** 선출 여부 — 당대표는 1위, 최고위원은 상위 SUPREME_SEATS 명 */
    elected: boolean;
  };

/** 표수 누적(resultsOf)과 달리, 이미 발표된 득표율(%) 두 개를 가중합산만 한다 — 재계산할 원표가 없다. */
export function finalResultsOf(
  shares: FinalShares,
  race: Race,
): FinalCandidateResult[] {
  const list = CANDIDATES[race]
    .filter((c) => shares[c.no] !== undefined)
    .map((c) => {
      const s = shares[c.no];
      const combined =
        s.official ??
        (s.poll === null
          ? s.party
          : s.party * CONVENTION.partyWeight + s.poll * CONVENTION.pollWeight);
      return { ...c, ...s, combined };
    });
  const ordered = [...list].sort((a, b) => b.combined - a.combined);
  const seats = race === "supreme" ? SUPREME_SEATS : 1;
  return list.map((v) => {
    const rank = ordered.findIndex((o) => o.no === v.no) + 1;
    return { ...v, rank, elected: rank <= seats };
  });
}

/* ------------------------------------------------------------------ */
/* 최종 결과 보도자료 (2026.08.17.)                                     */
/* ------------------------------------------------------------------ */

/**
 * 중앙당 선거관리위원회 「제3차 정기전국당원대회 당대표·최고위원 선거 결과」 중 선거인단 투표 현황.
 * 지역 순회경선 누적(SEED_ENTRIES)과 집계 범위가 달라 그대로 비교되지 않는다 — 패널을 나눠 둔 이유다.
 */
export const FINAL_ELECTORATE = {
  date: "2026-08-17",
  rows: [
    { label: "전국대의원", electorate: 17_667, voters: 14_306 },
    { label: "권리당원", electorate: 1_527_261, voters: 769_051 },
  ],
  total: { electorate: 1_544_928, voters: 783_357 },
};

type FinalSeedRow = {
  no: number;
  /** 전국대의원 득표수 */
  delegate: number;
  /** 권리당원 득표수 */
  member: number;
  /** 국민여론조사 득표율 (%) */
  poll: number;
  /** 보도자료에 인쇄된 최종 득표율 (%) */
  official: number;
};

/** 전국대의원·권리당원을 하나의 유효표로 합쳐 득표율을 낸다 — 보도자료 최종득표율이 이 방식이다 */
function finalSharesOf(rows: FinalSeedRow[]): FinalShares {
  const total = sum(rows.map((r) => r.delegate + r.member));
  return Object.fromEntries(
    rows.map((r) => [
      r.no,
      {
        party: total > 0 ? ((r.delegate + r.member) / total) * 100 : 0,
        poll: r.poll,
        official: r.official,
        breakdown: { delegate: r.delegate, member: r.member },
      },
    ]),
  );
}

/**
 * 지역 누적(SEED_ENTRIES)과 최종 결과의 후보별 득표수가 다른 이유 — 경선마다 다르다.
 *
 * 당대표는 선호투표다. 1순위 과반 득표자가 없으면 최하위 후보가 탈락하고 그 표는 차순위 후보로
 * 넘어간다. 넘어가는 비율은 유권자가 실제로 적어 낸 순위라 1순위 비율로는 계산해 낼 수 없다 —
 * 발표된 최종 득표율(official)을 재계산하지 않고 그대로 쓰는 또 하나의 이유다.
 *
 * 최고위원은 선호투표가 아니라서 재배분이 없다. 사퇴한 후보의 표는 유효표 총계에서 그대로 빠진다.
 */
export const FINAL_GAP_NOTE: Record<Race, string> = {
  leader:
    "당대표는 선호투표입니다. 1순위 과반 득표자가 없어 최하위 후보가 탈락하고 그 표가 차순위 후보로 넘어갔습니다 — 위 지역별 집계는 1순위 기준이라 최종 득표수와 다릅니다.",
  supreme:
    "최고위원은 선호투표가 아닙니다. 중도 사퇴한 후보의 표는 남은 후보에게 재배분되지 않고 유효표에서 그대로 빠집니다 — 위 지역별 집계와 총계가 다릅니다.",
};

export const SEED_FINAL_SHARES: Partial<Record<Race, FinalShares>> = {
  /* 기호 1 송영길은 1순위 최하위로 탈락해 최종 집계표에 없다 — 0%가 아니라 '자료 없음'으로 둔다 */
  leader: finalSharesOf([
    { no: 2, delegate: 4_765, member: 338_809, poll: 50.7, official: 45.92 },
    { no: 3, delegate: 9_541, member: 430_242, poll: 49.3, official: 54.08 },
  ]),
  /* 기호 3 김영호 · 8 임미애도 최종 집계표에 없다 (재배분 없이 유효표에서 빠졌다) */
  supreme: finalSharesOf([
    { no: 1, delegate: 1_955, member: 260_098, poll: 17.88, official: 18.35 },
    { no: 2, delegate: 8_513, member: 209_432, poll: 14.9, official: 15.26 },
    { no: 4, delegate: 2_711, member: 233_562, poll: 16.33, official: 16.6 },
    { no: 5, delegate: 3_990, member: 211_806, poll: 17.24, official: 15.86 },
    { no: 6, delegate: 3_649, member: 214_499, poll: 18.49, official: 16.35 },
    { no: 7, delegate: 7_777, member: 255_262, poll: 15.15, official: 17.57 },
  ]),
};

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
