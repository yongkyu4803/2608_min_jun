"use client";

import { useState, type RefObject } from "react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** 캡처에서 제외할 요소(버튼 등)에 붙이는 표식 */
export const EXPORT_IGNORE_ATTR = "data-export-ignore";

function canWriteImage() {
  return (
    typeof window !== "undefined" &&
    typeof ClipboardItem !== "undefined" &&
    !!navigator.clipboard?.write
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 대상 요소를 PNG로 렌더링해 클립보드에 복사한다.
 * 클립보드 이미지 쓰기를 지원하지 않는 브라우저(주로 Safari·Firefox)에서는
 * 조용히 실패하는 대신 파일 다운로드로 넘어간다.
 */
export function CopyImageButton({
  targetRef,
  filename,
}: {
  targetRef: RefObject<HTMLElement | null>;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    const node = targetRef.current;
    if (!node) return;

    setBusy(true);
    try {
      const blob = await toBlob(node, {
        // 화면 배율의 2배로 떠서 발표자료에 넣어도 또렷하게
        pixelRatio: 2,
        // 카드가 투명 배경이면 PNG가 비쳐 보이므로 표면색을 깔아준다
        backgroundColor: getComputedStyle(node).backgroundColor,
        filter: (el) =>
          !(el instanceof HTMLElement && el.hasAttribute(EXPORT_IGNORE_ATTR)),
      });
      if (!blob) throw new Error("렌더링 실패");

      if (canWriteImage()) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setDone(true);
        toast.success("차트를 이미지로 복사했습니다. 붙여넣기 하세요.");
        window.setTimeout(() => setDone(false), 2000);
      } else {
        download(blob, `${filename}.png`);
        toast.success(
          "이 브라우저는 이미지 클립보드를 지원하지 않아 파일로 저장했습니다.",
        );
      }
    } catch {
      toast.error("이미지를 만들지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={run}
      disabled={busy}
      title="차트를 PNG 이미지로 복사 — 문서나 메신저에 바로 붙여넣을 수 있습니다"
    >
      {busy ? "만드는 중" : done ? "복사됨" : "이미지 복사"}
    </Button>
  );
}
