"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FinalShares, Race, RegionEntry } from "@/lib/election";
import { buildWorkbook, workbookFileName } from "@/lib/export-workbook";

/**
 * 로데이터 엑셀 내려받기.
 *
 * 엑셀 라이브러리는 클릭한 순간에만 불러온다 — 첫 화면에는 필요 없는 코드라
 * 정적 import 로 두면 대시보드를 보기만 하는 사람도 그 용량을 내려받게 된다.
 */
export function DownloadExcelButton({
  entries,
  finalShares,
}: {
  entries: RegionEntry[];
  finalShares: Partial<Record<Race, FinalShares>>;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      const { default: writeXlsxFile } = await import(
        "write-excel-file/browser"
      );
      const generatedAt = new Date();
      const sheets = buildWorkbook(entries, finalShares, generatedAt);
      const blob = await writeXlsxFile(
        // 라이브러리 타입은 셀 스타일을 리터럴 유니온으로 좁혀 두는데,
        // 시트 정의는 라이브러리를 모르는 파일에서 만들어 구조만 맞춰 넘긴다
        sheets as unknown as Parameters<typeof writeXlsxFile>[0],
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = workbookFileName(generatedAt);
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 브라우저가 저장을 시작할 틈을 준 뒤 해제한다
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success(`엑셀 ${sheets.length}개 시트를 내려받았습니다.`);
    } catch {
      toast.error("엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={download}
      disabled={busy}
      // 패널 안에 있지만 이 패널만이 아니라 대시보드 전체를 받는다 — 라벨과 툴팁으로 범위를 밝힌다
      title="지역별 원표·지역 외 선거인단·최종 결과를 5개 시트 엑셀로 내려받습니다"
    >
      {busy ? "만드는 중" : "전체 엑셀 받기"}
    </Button>
  );
}
