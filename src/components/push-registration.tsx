"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

/**
 * 네이티브 앱(Capacitor)에서만 푸시 알림을 등록한다. 일반 브라우저에서는 아무 일도 하지 않는다.
 * 지금은 권한 요청과 FCM 토큰 발급까지만 — 토큰 저장·발송은 구독 기능과 함께 붙인다.
 */
export function PushRegistration() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const handles: { remove: () => Promise<void> }[] = [];

    (async () => {
      const { PushNotifications } = await import(
        "@capacitor/push-notifications"
      );

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
            if (!cancelled) toast(n.title ?? "새 알림", { description: n.body });
          },
        ),
      );

      let { receive } = await PushNotifications.checkPermissions();
      if (receive === "prompt" || receive === "prompt-with-rationale") {
        ({ receive } = await PushNotifications.requestPermissions());
      }
      if (receive === "granted") await PushNotifications.register();
    })().catch(() => {
      /* 알림은 부가 기능 — 실패해도 대시보드에 영향을 주지 않는다 */
    });

    return () => {
      cancelled = true;
      handles.forEach((h) => void h.remove());
    };
  }, []);

  return null;
}
