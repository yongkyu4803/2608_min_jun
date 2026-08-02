"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SEED_ENTRIES, type RegionEntry } from "@/lib/election";

/**
 * 사용자가 직접 추가한 지역만 저장한다.
 * 보도자료 시드는 항상 코드에서 가져오므로, 시드가 늘어나도 예전 저장값에 가려지지 않는다.
 */
const STORAGE_KEY = "chungcheong-primary:user-entries:v2";

function readStored(): RegionEntry[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as RegionEntry[];
  } catch {
    // 저장값이 깨졌으면 조용히 버리고 기본 데이터로 시작한다.
    return null;
  }
}

/**
 * 누적 집계 데이터 저장소.
 * 보도자료 기본값(seeded)으로 시작하고, 사용자가 추가한 지역은 localStorage에 남는다.
 * SSR과 마크업을 맞추기 위해 첫 렌더는 항상 기본값, 마운트 후 저장값을 반영한다.
 */
export function useElectionStore() {
  const [userEntries, setUserEntries] = useState<RegionEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) setUserEntries(stored.filter((e) => !e.seeded));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userEntries));
  }, [userEntries, hydrated]);

  const addEntry = useCallback((entry: RegionEntry) => {
    setUserEntries((prev) => [...prev, entry]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setUserEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const reset = useCallback(() => {
    setUserEntries([]);
  }, []);

  const entries = useMemo(
    () => [...SEED_ENTRIES, ...userEntries],
    [userEntries],
  );

  return { entries, hydrated, addEntry, removeEntry, reset };
}
