"use client";

import { useMemo, useState } from "react";
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
import { CANDIDATES, RACE_LABEL, type FinalShares, type Race } from "@/lib/election";
import { CONVENTION } from "@/lib/schedule";
import { useAdminUnlock } from "@/lib/use-admin-unlock";

type RaceDraft = Record<number, { party: string; poll: string }>;
type Draft = Record<Race, RaceDraft>;

const RACES: Race[] = ["leader", "supreme"];

const emptyRaceDraft = (race: Race): RaceDraft =>
  Object.fromEntries(
    CANDIDATES[race].map((c) => [c.no, { party: "", poll: "" }]),
  ) as RaceDraft;

const emptyDraft = (): Draft => ({
  leader: emptyRaceDraft("leader"),
  supreme: emptyRaceDraft("supreme"),
});

const toNumber = (v: string) => {
  const n = Number(v.replace(/[,\s%]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * 전당대회 최종 결과 입력. 지역별 누적(AddEntryForm)과 달리 득표수가 아니라
 * 이미 발표된 득표율(%) 두 개(권리당원·대의원 / 국민여론조사)를 CONVENTION 가중치로 합산한다 —
 * 여기서 표수를 더하면(=지역 하나로 취급하면) 안 된다. 국민여론조사는 표수 개념이 없다.
 */
export function FinalResultForm({
  onSubmitRace,
}: {
  onSubmitRace: (race: Race, shares: FinalShares) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const { unlocked, tryUnlock } = useAdminUnlock();
  const [password, setPassword] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setPassword("");
  }

  const partySums = useMemo(
    () => ({
      leader: sumField(draft.leader, "party"),
      supreme: sumField(draft.supreme, "party"),
    }),
    [draft],
  );

  const setField = (
    race: Race,
    no: number,
    key: "party" | "poll",
    value: string,
  ) =>
    setDraft((d) => ({
      ...d,
      [race]: { ...d[race], [no]: { ...d[race][no], [key]: value } },
    }));

  function submitRace(race: Race) {
    const raceDraft = draft[race];
    const partyValues = Object.values(raceDraft).map((v) => v.party.trim());
    if (partyValues.some((v) => v === ""))
      return toast.error(
        `${RACE_LABEL[race]} 권리당원·대의원 득표율을 모두 입력해 주세요.`,
      );

    const pollValues = Object.values(raceDraft).map((v) => v.poll.trim());
    const pollAllBlank = pollValues.every((v) => v === "");
    const pollAllFilled = pollValues.every((v) => v !== "");
    if (!pollAllBlank && !pollAllFilled)
      return toast.error(
        `${RACE_LABEL[race]} 국민여론조사 득표율은 전부 입력하거나 전부 비워 주세요.`,
      );

    const shares: FinalShares = {};
    for (const c of CANDIDATES[race]) {
      const party = toNumber(raceDraft[c.no].party);
      const poll = pollAllBlank ? null : toNumber(raceDraft[c.no].poll);
      if (Number.isNaN(party) || party < 0 || party > 100)
        return toast.error("득표율은 0~100 사이 숫자만 입력할 수 있습니다.");
      if (poll !== null && (Number.isNaN(poll) || poll < 0 || poll > 100))
        return toast.error("득표율은 0~100 사이 숫자만 입력할 수 있습니다.");
      shares[c.no] = { party, poll };
    }

    onSubmitRace(race, shares);
    toast.success(`${RACE_LABEL[race]} 최종 결과가 반영되었습니다.`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        최종 결과 입력
      </DialogTrigger>

      {!unlocked ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>비밀번호 확인</DialogTitle>
            <DialogDescription>
              최종 결과 입력은 담당자만 사용할 수 있습니다. 비밀번호를 입력해
              주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="final-admin-password"
              className="text-xs text-muted-foreground"
            >
              비밀번호
            </Label>
            <Input
              id="final-admin-password"
              type="password"
              autoFocus
              value={password}
              placeholder="••••••"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tryUnlock(password)) setPassword("");
              }}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button
              onClick={() => {
                if (tryUnlock(password)) setPassword("");
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>전당대회 최종 결과 입력</DialogTitle>
            <DialogDescription>
              {CONVENTION.formula}로 산정됩니다. 국민여론조사가 없는 경선이면
              여론조사 칸을 모두 비워 두세요 — 권리당원·대의원 득표율이 그대로
              최종 순위가 됩니다. 경선별로 각각 반영합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {RACES.map((race) => (
              <div key={race} className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">{RACE_LABEL[race]}</h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    권리당원·대의원 합계 {partySums[race].toFixed(1)}%
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CANDIDATES[race].map((c) => (
                    <div
                      key={c.no}
                      className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2.5"
                    >
                      <div className="col-span-2 text-xs font-medium">
                        {c.no}. {c.name}
                      </div>
                      <Field
                        id={`${race}-${c.no}-party`}
                        label="권리당원·대의원 %"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={draft[race][c.no].party}
                        onChange={(v) => setField(race, c.no, "party", v)}
                      />
                      <Field
                        id={`${race}-${c.no}-poll`}
                        label="국민여론조사 %"
                        inputMode="decimal"
                        placeholder="비워두면 없음"
                        value={draft[race][c.no].poll}
                        onChange={(v) => setField(race, c.no, "poll", v)}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => submitRace(race)}>
                    {RACE_LABEL[race]} 결과 반영
                  </Button>
                </div>
                <Separator />
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              닫기
            </DialogClose>
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
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">
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

function sumField(raceDraft: RaceDraft, key: "party" | "poll") {
  return Object.values(raceDraft).reduce((acc, v) => {
    const n = toNumber(v[key] || "0");
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}
