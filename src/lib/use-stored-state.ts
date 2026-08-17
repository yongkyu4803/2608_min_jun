"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 브라우저 저장소를 React 외부 스토어로 다룬다.
 *
 * useEffect 안에서 저장값을 읽어 setState 하면 마운트마다 렌더가 한 번 더 돌고
 * (react-hooks/set-state-in-effect), 저장값을 되쓰는 이펙트가 첫 렌더의 빈 값으로
 * 저장소를 덮어쓰지 않도록 hydrated 플래그를 직접 들고 다녀야 한다.
 * useSyncExternalStore 는 서버 스냅샷으로 SSR 마크업을 만들고 하이드레이션 직후
 * 클라이언트 스냅샷으로 바꿔 끼우는 일을 React 가 대신 해 준다.
 *
 * 덤으로 같은 키를 쓰는 훅끼리, 그리고 다른 탭끼리도 값이 함께 갱신된다.
 */

type Area = "local" | "session";

const listeners = new Map<string, Set<() => void>>();

/**
 * getSnapshot 은 값이 그대로면 '같은 참조'를 돌려줘야 한다 —
 * 호출마다 JSON.parse 하면 매번 새 객체라 React 가 무한 렌더로 판단한다.
 * 원문과 파싱 결과를 함께 캐시해 두고, 원문이 같으면 파싱 결과를 재사용한다.
 */
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

/** 저장소를 못 쓰는 환경(프라이빗 모드, 용량 초과)에서도 화면은 돌아가야 한다 */
const memory = new Map<string, string>();

function storageOf(area: Area) {
  return area === "session" ? window.sessionStorage : window.localStorage;
}

function readRaw(key: string, area: Area): string | null {
  try {
    return storageOf(area).getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeRaw(key: string, area: Area, raw: string) {
  try {
    storageOf(area).setItem(key, raw);
  } catch {
    memory.set(key, raw);
  }
}

export type StoredStateOptions<T> = {
  key: string;
  /** SSR 과 '저장값 없음'일 때의 값 */
  fallback: T;
  /** 저장 문자열 → 값. 형식이 깨졌으면 null 을 돌려주면 조용히 fallback 으로 떨어진다 */
  parse: (raw: string) => T | null;
  serialize: (value: T) => string;
  area?: Area;
};

export function useStoredState<T>({
  key,
  fallback,
  parse,
  serialize,
  area = "local",
}: StoredStateOptions<T>) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      // 같은 탭의 변경에는 storage 이벤트가 오지 않는다 — 그쪽은 listeners 로 직접 알린다
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          snapshots.delete(key);
          onChange();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        set.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key, area);
    const cached = snapshots.get(key);
    if (cached && cached.raw === raw) return cached.value as T;

    let value = fallback;
    if (raw !== null) {
      try {
        value = parse(raw) ?? fallback;
      } catch {
        // 저장값이 깨졌으면 조용히 버리고 기본값으로 시작한다
        value = fallback;
      }
    }
    snapshots.set(key, { raw, value });
    return value;
  }, [key, area, fallback, parse]);

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(getSnapshot())
          : next;
      writeRaw(key, area, serialize(resolved));
      snapshots.delete(key);
      listeners.get(key)?.forEach((fn) => fn());
    },
    [key, area, serialize, getSnapshot],
  );

  return [value, setValue] as const;
}
