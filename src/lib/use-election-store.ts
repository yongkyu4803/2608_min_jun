"use client";

import { useCallback, useMemo } from "react";
import { SEED_ENTRIES, type RegionEntry } from "@/lib/election";
import { useStoredState } from "@/lib/use-stored-state";

/**
 * 사용자가 직접 추가한 지역만 저장한다.
 * 보도자료 시드는 항상 코드에서 가져오므로, 시드가 늘어나도 예전 저장값에 가려지지 않는다.
 */
const STORAGE_KEY = "chungcheong-primary:user-entries:v2";

/** 저장값이 없을 때의 기본 — 참조가 흔들리지 않게 모듈 상수로 둔다 */
const NO_ENTRIES: RegionEntry[] = [];

function parseEntries(raw: string): RegionEntry[] | null {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;
  // 예전 저장값에 시드가 섞여 있을 수 있다 — 시드는 항상 코드에서 온다
  return (parsed as RegionEntry[]).filter((e) => !e.seeded);
}

const serializeEntries = (entries: RegionEntry[]) => JSON.stringify(entries);

/**
 * 누적 집계 데이터 저장소.
 * 보도자료 기본값(seeded)으로 시작하고, 사용자가 추가한 지역은 localStorage에 남는다.
 * SSR과 마크업을 맞추기 위해 첫 렌더는 항상 기본값, 하이드레이션 후 저장값을 반영한다.
 */
export function useElectionStore() {
  const [userEntries, setUserEntries] = useStoredState({
    key: STORAGE_KEY,
    fallback: NO_ENTRIES,
    parse: parseEntries,
    serialize: serializeEntries,
  });

  const addEntry = useCallback(
    (entry: RegionEntry) => {
      setUserEntries((prev) => [...prev, entry]);
    },
    [setUserEntries],
  );

  const removeEntry = useCallback(
    (id: string) => {
      setUserEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setUserEntries],
  );

  const reset = useCallback(() => {
    setUserEntries(NO_ENTRIES);
  }, [setUserEntries]);

  const entries = useMemo(
    () => [...SEED_ENTRIES, ...userEntries],
    [userEntries],
  );

  return { entries, addEntry, removeEntry, reset };
}
