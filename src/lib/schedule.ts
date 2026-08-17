/**
 * 제3차 정기전국당원대회 투표일정.
 * 출처: 중앙당 선거관리위원회 「투표일정 안내」 (권리당원 · 전국대의원 · 재외국민)
 */

export type RegionalRound = {
  /** 권역명 (예: 충청권) */
  name: string;
  /** 이 권역에 속한 시도 — 대시보드 지역명과 맞춘 축약형 */
  regions: string[];
  /** 순회경선 결과 발표일 */
  announce: string;
  /** 권리당원 온라인 투표 [시작, 종료] */
  online: [string, string];
  /** 권리당원 ARS 투표 [시작, 종료] */
  ars: [string, string];
};

export const ROUNDS: RegionalRound[] = [
  {
    name: "충청권",
    regions: ["대전", "충남", "세종", "충북"],
    announce: "2026-08-01",
    online: ["2026-07-28", "2026-07-29"],
    ars: ["2026-07-30", "2026-07-31"],
  },
  {
    name: "부울경",
    regions: ["부산", "울산", "경남"],
    announce: "2026-08-02",
    online: ["2026-07-29", "2026-07-30"],
    ars: ["2026-07-31", "2026-08-01"],
  },
  {
    name: "제주·인천",
    regions: ["제주", "인천"],
    announce: "2026-08-08",
    online: ["2026-08-04", "2026-08-05"],
    ars: ["2026-08-06", "2026-08-07"],
  },
  {
    name: "강원·대구·경북",
    regions: ["강원", "대구", "경북"],
    announce: "2026-08-09",
    online: ["2026-08-05", "2026-08-06"],
    ars: ["2026-08-07", "2026-08-08"],
  },
  {
    name: "호남권",
    regions: ["광주", "전남", "전북"],
    announce: "2026-08-15",
    online: ["2026-08-11", "2026-08-12"],
    ars: ["2026-08-13", "2026-08-14"],
  },
  {
    name: "경기·서울",
    regions: ["경기", "서울"],
    announce: "2026-08-16",
    online: ["2026-08-12", "2026-08-13"],
    ars: ["2026-08-14", "2026-08-15"],
  },
];

/** 권역 순회경선 외의 일정 */
export const OTHER_VOTES = [
  {
    name: "재외국민 당원",
    note: "권리당원·대의원 · 3일 연속 · 한국시간 기준",
    period: ["2026-08-09", "2026-08-11"] as [string, string],
  },
  {
    name: "전국대의원",
    note: "온라인 투표",
    period: ["2026-08-17", "2026-08-17"] as [string, string],
  },
];

export const CONVENTION = {
  date: "2026-08-17",
  venue: "대전컨벤션센터 제2전시장",
  /** 최종 결과 산정 방식 */
  formula: "권리당원·대의원 70% + 국민여론조사 30%",
  /** formula 를 가중합산에 쓰는 실제 계수 — 문구가 바뀌면 이 값도 같이 맞춰야 한다 */
  partyWeight: 0.7,
  pollWeight: 0.3,
  /**
   * 보도자료 각주 ① — formula 위에 따로 얹히는 보정.
   * 계수를 우리가 재현할 수 없어 발표된 최종 득표율(FinalShare.official)을 그대로 쓴다.
   */
  weightNote: "대구·경북·경남 전국대의원 및 권리당원 유효투표 결과 가중치 5% 반영",
  pollPeriod: ["2026-08-14", "2026-08-15"] as [string, string],
};

/* ------------------------------------------------------------------ */
/* 상태 판정                                                           */
/* ------------------------------------------------------------------ */

export type RoundPhase =
  | { kind: "done" }
  | { kind: "voting"; channel: "온라인" | "ARS"; until: string }
  | { kind: "upcoming" };

/** 한국 시간 기준 오늘 (YYYY-MM-DD) */
export function todayKST(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    now,
  );
}

/**
 * 권역 상태.
 * 완료 판정은 날짜가 아니라 '결과 데이터가 들어왔는지'로 한다 —
 * 발표가 지연돼도 화면이 거짓말하지 않게 하기 위함이다.
 */
export function phaseOf(
  round: RegionalRound,
  collectedRegions: string[],
  today = todayKST(),
): RoundPhase {
  const allIn = round.regions.every((r) => collectedRegions.includes(r));
  if (allIn) return { kind: "done" };

  const within = ([from, to]: [string, string]) => today >= from && today <= to;
  if (within(round.online))
    return { kind: "voting", channel: "온라인", until: round.online[1] };
  if (within(round.ars))
    return { kind: "voting", channel: "ARS", until: round.ars[1] };

  return { kind: "upcoming" };
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * "8/8(토)"
 * 요일은 달력 날짜 자체로 계산한다 — 시간대를 붙인 순간의 UTC 요일을 읽으면
 * KST 자정이 전날 15시 UTC 라서 하루씩 밀린다.
 */
export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}/${d}(${day})`;
}

/** "8.4 ~ 8.5" */
export function shortRange([from, to]: [string, string]) {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-").map(Number);
    return `${m}.${d}`;
  };
  return from === to ? fmt(from) : `${fmt(from)} ~ ${fmt(to)}`;
}
