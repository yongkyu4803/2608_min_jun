"use client";

import { useCallback } from "react";
import { useStoredState } from "@/lib/use-stored-state";

/** 받은 푸시 알림. 이 기기(브라우저 저장소)에만 보관한다. */
export type StoredNotification = {
  id: string;
  title: string;
  body: string;
  /** 앱이 알림을 확인한 시각(ms). 백그라운드로 도착한 알림은 도착 시각이 아니라 앱을 연 시각이다. */
  receivedAt: number;
  read: boolean;
};

const KEY = "app:notifications";
/** 오래된 것부터 버린다 — 저장소 용량 초과 방지 */
const MAX_ITEMS = 200;
/** 같은 제목·내용이 이 시간 안에 다시 들어오면 같은 알림으로 본다 (표시 경로마다 id 가 다를 수 있다) */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const EMPTY: StoredNotification[] = [];

function parse(raw: string): StoredNotification[] | null {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) return null;
  return data.filter(
    (n): n is StoredNotification =>
      typeof n?.id === "string" &&
      typeof n?.title === "string" &&
      typeof n?.body === "string" &&
      typeof n?.receivedAt === "number" &&
      typeof n?.read === "boolean",
  );
}

const serialize = (v: StoredNotification[]) => JSON.stringify(v);

export type IncomingNotification = {
  id?: string;
  title?: string;
  body?: string;
};

export function useNotifications() {
  const [notifications, setNotifications] = useStoredState({
    key: KEY,
    fallback: EMPTY,
    parse,
    serialize,
  });

  const add = useCallback(
    (items: IncomingNotification[]) => {
      if (items.length === 0) return;
      setNotifications((prev) => {
        const now = Date.now();
        const next = [...prev];
        for (const item of items) {
          const title = item.title ?? "";
          const body = item.body ?? "";
          if (!title && !body) continue;
          const duplicate = next.some(
            (n) =>
              (item.id && n.id === item.id) ||
              (n.title === title &&
                n.body === body &&
                now - n.receivedAt < DUPLICATE_WINDOW_MS),
          );
          if (duplicate) continue;
          next.unshift({
            id: item.id || `${now}-${next.length}`,
            title: title || "새 알림",
            body,
            receivedAt: now,
            read: false,
          });
        }
        return next.length === prev.length ? prev : next.slice(0, MAX_ITEMS);
      });
    },
    [setNotifications],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev,
    );
  }, [setNotifications]);

  const remove = useCallback(
    (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id)),
    [setNotifications],
  );

  const clear = useCallback(() => setNotifications(EMPTY), [setNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  return { notifications, unread, add, markAllRead, remove, clear };
}
