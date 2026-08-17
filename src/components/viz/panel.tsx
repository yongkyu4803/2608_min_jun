"use client";

import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CopyImageButton,
  EXPORT_IGNORE_ATTR,
} from "@/components/viz/copy-image-button";
import { cn } from "@/lib/utils";

/** 차트 한 개를 담는 카드. 축 라벨까지 포함해 높이를 고정하지 않는다. */
export function Panel({
  title,
  subtitle,
  action,
  titleAction,
  children,
  className,
  copyImage,
  size = "default",
}: {
  title: string;
  subtitle?: string;
  /** 헤더 오른쪽. 범례처럼 캡처에 남아야 하는 것도 오므로 자동 제외하지 않는다 */
  action?: ReactNode;
  /** 제목 바로 옆 버튼. 조작 전용이라 캡처에서 자동 제외된다 */
  titleAction?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 카드 전체를 PNG로 복사하는 버튼을 헤더에 붙인다 */
  copyImage?: boolean;
  /**
   * hero 는 결론에 해당하는 카드 하나에만 쓴다 —
   * 모든 카드를 크게 만들면 위계가 사라져 무엇이 결론인지 알 수 없다.
   */
  size?: "default" | "hero";
}) {
  const ref = useRef<HTMLElement>(null);
  const hero = size === "hero";

  return (
    <section
      ref={ref}
      className={cn(
        "flex flex-col rounded-xl",
        hero ? "gap-5 p-6" : "gap-4 p-5",
        className,
      )}
      style={{
        background: "var(--viz-surface)",
        border: hero
          ? "1px solid var(--viz-baseline)"
          : "1px solid var(--viz-hairline)",
      }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              className={cn(
                "font-semibold",
                hero ? "text-lg tracking-tight sm:text-xl" : "text-sm",
              )}
              style={{ color: "var(--viz-text-primary)" }}
            >
              {title}
            </h2>
            {/* 제목 옆은 조작 버튼 자리다 — action 과 달리 캡처에서 자동으로 뺀다 */}
            {titleAction ? (
              <span {...{ [EXPORT_IGNORE_ATTR]: "" }}>{titleAction}</span>
            ) : null}
          </div>
          {subtitle ? (
            <p
              className={hero ? "text-sm" : "text-xs"}
              style={{ color: "var(--viz-muted)" }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {copyImage ? (
            <span {...{ [EXPORT_IGNORE_ATTR]: "" }}>
              <CopyImageButton targetRef={ref} filename={title} />
            </span>
          ) : null}
        </div>
      </header>
      {children}
    </section>
  );
}

/**
 * 숫자 하나가 곧 차트인 경우 — 뷰당 정확히 하나.
 * headline(사람 이름 등)이 있으면 수치와 같은 비중으로 함께 세운다.
 */
export function HeroFigure({
  label,
  headline,
  value,
  caption,
}: {
  label: string;
  headline?: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
        {label}
      </span>
      {headline ? (
        <span
          className="text-4xl font-semibold leading-tight tracking-tight"
          style={{ color: "var(--viz-text-primary)" }}
        >
          {headline}
        </span>
      ) : null}
      <span
        className="text-5xl font-semibold leading-none"
        style={{ color: "var(--viz-text-primary)" }}
      >
        {value}
      </span>
      <span className="text-sm" style={{ color: "var(--viz-text-secondary)" }}>
        {caption}
      </span>
    </div>
  );
}

export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl p-4"
      style={{
        background: "var(--viz-surface)",
        border: "1px solid var(--viz-hairline)",
      }}
    >
      <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
        {label}
      </span>
      <span
        className="text-2xl font-semibold leading-tight"
        style={{ color: "var(--viz-text-primary)" }}
      >
        {value}
      </span>
      {note ? (
        <span
          className="text-xs"
          style={{ color: "var(--viz-text-secondary)" }}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}

/**
 * 표를 탭 구분(TSV)으로 클립보드에 복사한다.
 * 엑셀·구글시트는 탭을 열 구분자로 읽으므로 붙여넣으면 셀로 나뉜다.
 * 값은 화면에 보이는 그대로 담는다 — "69,980"·"39.08%" 모두 엑셀이 숫자로 인식한다.
 */
function CopyTableButton({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const tsv = [columns, ...rows].map((r) => r.join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      toast.success(`${rows.length}행이 복사되었습니다. 엑셀에 붙여넣으세요.`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        "복사에 실패했습니다. 브라우저의 클립보드 권한을 확인해 주세요.",
      );
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={copy}
      title="표를 탭 구분 형식으로 복사 — 엑셀에 붙여넣으면 셀로 나뉩니다"
    >
      {copied ? "복사됨" : "표 복사"}
    </Button>
  );
}

/** 모든 차트의 표 대응물 */
export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end" {...{ [EXPORT_IGNORE_ATTR]: "" }}>
        <CopyTableButton columns={columns} rows={rows} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--viz-baseline)" }}>
              {columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    "px-2 py-2 text-xs font-medium",
                    i === 0 ? "text-left" : "text-right",
                  )}
                  style={{ color: "var(--viz-muted)" }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                style={{ borderBottom: "1px solid var(--viz-grid)" }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-2 py-2",
                      ci === 0 ? "text-left" : "text-right tabular-nums",
                    )}
                    style={{
                      color:
                        ci === 0
                          ? "var(--viz-text-primary)"
                          : "var(--viz-text-secondary)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
