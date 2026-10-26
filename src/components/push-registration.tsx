"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { useNotifications } from "@/lib/use-notifications";

/**
 * 네이티브 앱(Capacitor)에서만 푸시 알림을 등록하고, 받은 알림을 기기에 저장한다.
 * 일반 브라우저에서는 아무 일도 하지 않는다.
 *
 * 알림이 저장되는 경로:
 *  - 앱이 켜져 있을 때 도착 → pushNotificationReceived
 *  - 백그라운드에서 도착해 알림 센터에 떠 있는 것 → 앱이 다시 보일 때 getDeliveredNotifications
 *  - 알림 센터에서 눌러 연 것 → pushNotificationActionPerformed
 * 토큰 서버 저장·발송은 구독 기능과 함께 붙인다.
 */
export function PushRegistration() {
  const { add } = useNotifications();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const handles: { remove: () => Promise<void> }[] = [];
    let collectDelivered: (() => Promise<void>) | null = null;

    // 앱으로 돌아올 때마다 알림 센터에 남은 알림을 저장한다
    const onVisible = () => {
      if (document.visibilityState === "visible") void collectDelivered?.();
    };

    (async () => {
      const { PushNotifications } = await import(
        "@capacitor/push-notifications"
      );

      collectDelivered = async () => {
        const { notifications } =
          await PushNotifications.getDeliveredNotifications();
        if (!cancelled) add(notifications);
      };

      handles.push(
        await PushNotifications.addListener("registration", () => {
          if (!cancelled) toast.success("알림이 활성화되었습니다");
        }),
        await PushNotifications.addListener("registrationError", () => {
          if (!cancelled) toast.error("알림을 활성화하지 못했습니다");
        }),
        await PushNotifications.addListener(
          "pushNotificationReceived",
          (n) => {
            if (cancelled) return;
            add([n]);
            toast(n.title ?? "새 알림", { description: n.body });
          },
        ),
        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (a) => {
            if (!cancelled) add([a.notification]);
          },
        ),
      );

      document.addEventListener("visibilitychange", onVisible);

      let { receive } = await PushNotifications.checkPermissions();
      if (receive === "prompt" || receive === "prompt-with-rationale") {
        ({ receive } = await PushNotifications.requestPermissions());
      }
      if (receive === "granted") await PushNotifications.register();
      await collectDelivered();
    })().catch(() => {
      /* 알림은 부가 기능 — 실패해도 대시보드에 영향을 주지 않는다 */
    });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      handles.forEach((h) => void h.remove());
    };
  }, [add]);

  return null;
}
