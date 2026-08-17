"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * 잠금 해제 비밀번호. .env.local 의 NEXT_PUBLIC_ADMIN_PASSWORD 에서 읽는다.
 * NEXT_PUBLIC_ 값은 브라우저 번들에 그대로 들어가므로 실제 인증이 아니라
 * '실수로 누르는 것'을 막는 장치다. 진짜 접근 제어가 필요하면 서버 라우트에서 검증해야 한다.
 */
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const UNLOCK_KEY = "chungcheong-primary:unlocked";

/** 담당자 전용 입력 폼들이 공유하는 잠금 해제 상태. 탭이 닫힐 때까지 유지된다. */
export function useAdminUnlock() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  function tryUnlock(password: string) {
    if (!ADMIN_PASSWORD) {
      toast.error(
        "잠금 해제 비밀번호가 설정되지 않았습니다. .env.local 의 NEXT_PUBLIC_ADMIN_PASSWORD 를 확인해 주세요.",
      );
      return false;
    }
    if (password !== ADMIN_PASSWORD) {
      toast.error("비밀번호가 올바르지 않습니다.");
      return false;
    }
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
    return true;
  }

  return { unlocked, tryUnlock };
}
