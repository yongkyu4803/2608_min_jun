"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinalShares, Race } from "@/lib/election";

const STORAGE_KEY = "chungcheong-primary:final-result";

export type FinalResultState = Partial<Record<Race, FinalShares>>;

function readStored(): FinalResultState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FinalResultState) : null;
  } catch {
    return null;
  }
}

/**
 * 전당대회 최종 결과(경선별 권리당원·대의원/국민여론조사 득표율)를 브라우저에 저장한다.
 * 지역 누적값(use-election-store)과 마찬가지로 이 브라우저에만 남는 값이다.
 */
export function useFinalResultStore() {
  const [finalResult, setFinalResult] = useState<FinalResultState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) setFinalResult(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(finalResult));
  }, [finalResult, hydrated]);

  const setRace = useCallback((race: Race, shares: FinalShares) => {
    setFinalResult((prev) => ({ ...prev, [race]: shares }));
  }, []);

  const clearRace = useCallback((race: Race) => {
    setFinalResult((prev) => {
      const next = { ...prev };
      delete next[race];
      return next;
    });
  }, []);

  return { finalResult, hydrated, setRace, clearRace };
}
