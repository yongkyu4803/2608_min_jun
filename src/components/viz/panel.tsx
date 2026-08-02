"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 차트 한 개를 담는 카드. 축 라벨까지 포함해 높이를 고정하지 않는다. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("flex flex-col gap-4 rounded-xl p-5", className)}
      style={{
        background: "var(--viz-surface)",
        border: "1px solid var(--viz-hairline)",
      }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--viz-text-primary)" }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="text-xs" style={{ color: "var(--viz-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** 숫자 하나가 곧 차트인 경우 — 뷰당 정확히 하나 */
export function HeroFigure({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: "var(--viz-muted)" }}>
        {label}
      </span>
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
        <span className="text-xs" style={{ color: "var(--viz-text-secondary)" }}>
          {note}
        </span>
      ) : null}
    </div>
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
            <tr key={ri} style={{ borderBottom: "1px solid var(--viz-grid)" }}>
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
  );
}
