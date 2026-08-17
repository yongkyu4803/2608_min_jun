"use client";

import { useCallback } from "react";
import type { FinalShares, Race } from "@/lib/election";
import { useStoredState } from "@/lib/use-stored-state";

const STORAGE_KEY = "chungcheong-primary:final-result";

export type FinalResultState = Partial<Record<Race, FinalShares>>;

/** 저장값이 없을 때의 기본 — 참조가 흔들리지 않게 모듈 상수로 둔다 */
const NO_RESULT: FinalResultState = {};

function parseResult(raw: string): FinalResultState | null {
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
    return null;
  return parsed as FinalResultState;
}

const serializeResult = (state: FinalResultState) => JSON.stringify(state);

/**
 * 전당대회 최종 결과(경선별 권리당원·대의원/국민여론조사 득표율)를 브라우저에 저장한다.
 * 지역 누적값(use-election-store)과 마찬가지로 이 브라우저에만 남는 값이며,
 * 비어 있으면 호출부가 보도자료 시드(SEED_FINAL_SHARES)로 떨어진다.
 */
export function useFinalResultStore() {
  const [finalResult, setFinalResult] = useStoredState({
    key: STORAGE_KEY,
    fallback: NO_RESULT,
    parse: parseResult,
    serialize: serializeResult,
  });

  const setRace = useCallback(
    (race: Race, shares: FinalShares) => {
      setFinalResult((prev) => ({ ...prev, [race]: shares }));
    },
    [setFinalResult],
  );

  const clearRace = useCallback(
    (race: Race) => {
      setFinalResult((prev) => {
        const next = { ...prev };
        delete next[race];
        return next;
      });
    },
    [setFinalResult],
  );

  return { finalResult, setRace, clearRace };
}
