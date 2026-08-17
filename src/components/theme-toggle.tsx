"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useStoredState } from "@/lib/use-stored-state";

const KEY = "chungcheong-primary:theme";

type Theme = "light" | "dark";

/** 사용자가 직접 고르기 전에는 저장값이 없다 — 그때는 OS 설정을 따른다 */
const NO_CHOICE: Theme | null = null;

const parseTheme = (raw: string): Theme | null =>
  raw === "dark" || raw === "light" ? raw : null;
const serializeTheme = (v: Theme | null) => v ?? "light";

const MEDIA = "(prefers-color-scheme: dark)";

/** OS 다크 모드 설정도 외부 스토어다 — 구독해 두면 설정을 바꾸는 즉시 따라간다 */
function subscribePrefersDark(onChange: () => void) {
  const mq = window.matchMedia(MEDIA);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const prefersDarkSnapshot = () => window.matchMedia(MEDIA).matches;
const prefersDarkOnServer = () => false;

export function ThemeToggle() {
  const [choice, setChoice] = useStoredState({
    key: KEY,
    fallback: NO_CHOICE,
    parse: parseTheme,
    serialize: serializeTheme,
  });

  const prefersDark = useSyncExternalStore(
    subscribePrefersDark,
    prefersDarkSnapshot,
    prefersDarkOnServer,
  );

  const dark = choice ? choice === "dark" : prefersDark;

  // 이펙트가 하는 일은 DOM 동기화뿐 — 상태를 다시 세팅하지 않는다
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setChoice(dark ? "light" : "dark")}
    >
      {dark ? "라이트 모드" : "다크 모드"}
    </Button>
  );
}
