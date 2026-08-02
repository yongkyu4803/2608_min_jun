"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  CANDIDATES,
  RACE_LABEL,
  num,
  type Race,
  type RegionEntry,
} from "@/lib/election";

type Draft = {
  region: string;
  group: string;
  date: string;
  electorate: string;
  voters: string;
  leader: Record<number, string>;
  supreme: Record<number, string>;
};

const emptyVotes = (race: Race) =>
  Object.fromEntries(CANDIDATES[race].map((c) => [c.no, ""])) as Record<
    number,
    string
  >;

const emptyDraft = (): Draft => ({
  region: "",
  group: "",
  date: new Date().toISOString().slice(0, 10),
  electorate: "",
  voters: "",
  leader: emptyVotes("leader"),
  supreme: emptyVotes("supreme"),
});

const toNumber = (v: string) => {
  const n = Number(v.replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * 잠금 해제 비밀번호. .env.local 의 NEXT_PUBLIC_ADMIN_PASSWORD 에서 읽는다.
 * NEXT_PUBLIC_ 값은 브라우저 번들에 그대로 들어가므로 실제 인증이 아니라
 * '실수로 누르는 것'을 막는 장치다. 진짜 접근 제어가 필요하면 서버 라우트에서 검증해야 한다.
 */
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const UNLOCK_KEY = "chungcheong-primary:unlocked";

export function AddEntryForm({
  existingRegions,
  onAdd,
}: {
  existingRegions: string[];
  onAdd: (entry: RegionEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  // 한 번 열면 탭이 닫힐 때까지 유지 (새 탭/새 세션에서는 다시 물어본다)
  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(UNLOCK_KEY) === "1");
  }, []);

  function unlock() {
    if (!ADMIN_PASSWORD) {
      return toast.error(
        "잠금 해제 비밀번호가 설정되지 않았습니다. .env.local 의 NEXT_PUBLIC_ADMIN_PASSWORD 를 확인해 주세요.",
      );
    }
    if (password !== ADMIN_PASSWORD) {
      setPassword("");
      return toast.error("비밀번호가 올바르지 않습니다.");
    }
    window.sessionStorage.setItem(UNLOCK_KEY, "1");
    setUnlocked(true);
    setPassword("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setPassword("");
  }

  const sums = useMemo(
    () => ({
      leader: sumVotes(draft.leader),
      supreme: sumVotes(draft.supreme),
    }),
    [draft.leader, draft.supreme],
  );

  const setVote = (race: Race, no: number, value: string) =>
    setDraft((d) => ({ ...d, [race]: { ...d[race], [no]: value } }));

  function submit() {
    const region = draft.region.trim();
    if (!region) return toast.error("지역명을 입력해 주세요.");
    if (existingRegions.some((r) => r === region))
      return toast.error(`'${region}' 은(는) 이미 집계에 포함되어 있습니다.`);

    const electorate = toNumber(draft.electorate);
    const voters = toNumber(draft.voters);
    if (!(electorate > 0)) return toast.error("총선거인수를 입력해 주세요.");
    if (!(voters >= 0) || Number.isNaN(voters))
      return toast.error("투표자수를 입력해 주세요.");
    if (voters > electorate)
      return toast.error("투표자수가 총선거인수보다 많을 수 없습니다.");

    const leaderVotes = parseVotes(draft.leader);
    // 최고위원 칸을 전부 비워두면 '자료 미입력'으로 저장한다 (0표와 구분).
    const supremeBlank = Object.values(draft.supreme).every(
      (v) => v.trim() === "",
    );
    const supremeVotes = supremeBlank ? null : parseVotes(draft.supreme);
    if (!leaderVotes || (!supremeBlank && !supremeVotes))
      return toast.error("득표수는 0 이상의 숫자만 입력할 수 있습니다.");

    if (sums.leader > voters)
      return toast.error(
        `당대표 득표 합계(${num(sums.leader)}표)가 투표자수(${num(voters)}명)를 초과합니다.`,
      );

    onAdd({
      id: `user-${Date.now()}`,
      region,
      group: draft.group.trim() || "기타",
      date: draft.date,
      electorate,
      voters,
      votes: { leader: leaderVotes, supreme: supremeVotes },
    });
    toast.success(`${region} 결과가 누적 집계에 반영되었습니다.`);
    setDraft(emptyDraft());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>누적값 입력</DialogTrigger>

      {!unlocked ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>비밀번호 확인</DialogTitle>
            <DialogDescription>
              누적값 입력은 담당자만 사용할 수 있습니다. 비밀번호를 입력해
              주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="admin-password"
              className="text-xs text-muted-foreground"
            >
              비밀번호
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoFocus
              value={password}
              placeholder="••••••"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") unlock();
              }}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button onClick={unlock}>확인</Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>지역 결과 추가</DialogTitle>
            <DialogDescription>
              새 지역의 온라인투표 결과를 입력하면 모든 지표에 누적 반영됩니다.
              입력값은 이 브라우저에 저장됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id="region"
                label="지역"
                placeholder="예: 광주"
                value={draft.region}
                onChange={(v) => setDraft((d) => ({ ...d, region: v }))}
              />
              <Field
                id="group"
                label="권역"
                placeholder="예: 호남권"
                value={draft.group}
                onChange={(v) => setDraft((d) => ({ ...d, group: v }))}
              />
              <Field
                id="electorate"
                label="총선거인수"
                inputMode="numeric"
                placeholder="0"
                value={draft.electorate}
                onChange={(v) => setDraft((d) => ({ ...d, electorate: v }))}
              />
              <Field
                id="voters"
                label="투표자수"
                inputMode="numeric"
                placeholder="0"
                value={draft.voters}
                onChange={(v) => setDraft((d) => ({ ...d, voters: v }))}
              />
              <Field
                id="date"
                label="발표일"
                type="date"
                value={draft.date}
                onChange={(v) => setDraft((d) => ({ ...d, date: v }))}
              />
            </div>

            <Separator />

            {(["leader", "supreme"] as Race[]).map((race) => (
              <div key={race} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">
                    {RACE_LABEL[race]} 득표수
                    {race === "supreme" ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        비워두면 &lsquo;미입력&rsquo;으로 저장됩니다
                      </span>
                    ) : null}
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    합계 {num(sums[race])}표
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {CANDIDATES[race].map((c) => (
                    <Field
                      key={c.no}
                      id={`${race}-${c.no}`}
                      label={`${c.no}. ${c.name}`}
                      inputMode="numeric"
                      placeholder="0"
                      value={draft[race][c.no] ?? ""}
                      onChange={(v) => setVote(race, c.no, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button onClick={submit}>누적에 반영</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  );
}

function sumVotes(votes: Record<number, string>) {
  return Object.values(votes).reduce((acc, v) => {
    const n = toNumber(v || "0");
    return acc + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

/** 전부 유효한 숫자면 숫자 맵, 하나라도 잘못되면 null */
function parseVotes(votes: Record<number, string>) {
  const out: Record<number, number> = {};
  for (const [no, raw] of Object.entries(votes)) {
    const n = raw.trim() === "" ? 0 : toNumber(raw);
    if (Number.isNaN(n) || n < 0) return null;
    out[Number(no)] = n;
  }
  return out;
}
