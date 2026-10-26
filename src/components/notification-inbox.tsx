"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotifications } from "@/lib/use-notifications";

const noSubscribe = () => () => {};
const isNativeSnapshot = () => Capacitor.isNativePlatform();
const isNativeOnServer = () => false;

const formatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** 받은 알림 목록. 알림은 앱에서만 오므로 일반 브라우저에서는 보이지 않는다. */
export function NotificationInbox() {
  const isNative = useSyncExternalStore(
    noSubscribe,
    isNativeSnapshot,
    isNativeOnServer,
  );
  const { notifications, unread, markAllRead, remove, clear } =
    useNotifications();

  if (!isNative) return null;

  return (
    <Dialog onOpenChange={(open) => !open && markAllRead()}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="relative" />}
        aria-label={unread > 0 ? `알림 ${unread}건 안 읽음` : "알림함"}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>알림함</DialogTitle>
          <DialogDescription>
            받은 알림은 이 기기에만 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            받은 알림이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-sm break-words text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatter.format(n.receivedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => remove(n.id)}
                  aria-label={`알림 삭제: ${n.title}`}
                >
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          {notifications.length > 0 && (
            <Button variant="outline" onClick={clear}>
              모두 삭제
            </Button>
          )}
          <DialogClose render={<Button />}>닫기</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
