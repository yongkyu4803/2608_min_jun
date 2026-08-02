"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "chungcheong-primary:theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    const next =
      stored === "dark" ||
      (stored === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(KEY, next ? "dark" : "light");
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle}>
      {dark ? "라이트 모드" : "다크 모드"}
    </Button>
  );
}
