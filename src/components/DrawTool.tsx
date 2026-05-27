import { useEffect, useMemo, useRef, useState } from "react";
import { Dices, RotateCcw, Trophy, UsersRound } from "lucide-react";
import { Participant } from "../types";
import { genderLabel } from "../utils/participants";
import { pickRandom, shuffleArray } from "../utils/random";
import { EmptyState } from "./EmptyState";

type DrawMode = "single" | "multiple" | "team";

type DrawToolProps = {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
};

export function DrawTool({ participants, setParticipants }: DrawToolProps) {
  const [mode, setMode] = useState<DrawMode>("single");
  const [drawCount, setDrawCount] = useState(2);
  const [excludeDrawn, setExcludeDrawn] = useState(true);
  const [rollingName, setRollingName] = useState("准备开始");
  const [resultPeople, setResultPeople] = useState<Participant[]>([]);
  const [resultTeam, setResultTeam] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const timerRef = useRef<number | null>(null);

  const teams = useMemo(
    () => Array.from(new Set(participants.map((participant) => participant.team))).filter(Boolean),
    [participants],
  );

  const availablePeople = useMemo(() => {
    return excludeDrawn
      ? participants.filter((participant) => !participant.drawn)
      : participants;
  }, [excludeDrawn, participants]);

  const availableTeams = useMemo(
    () => Array.from(new Set(availablePeople.map((participant) => participant.team))).filter(Boolean),
    [availablePeople],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function runDraw() {
    if (participants.length === 0 || isRolling) return;

    const source = availablePeople;
    if (source.length === 0) return;

    setIsRolling(true);
    setResultPeople([]);
    setResultTeam("");

    const names =
      mode === "team"
        ? shuffleArray(availableTeams.length > 0 ? availableTeams : ["未分配"])
        : shuffleArray(source.map((participant) => participant.name));

    let tick = 0;
    timerRef.current = window.setInterval(() => {
      setRollingName(names[tick % names.length]);
      tick += 1;
    }, 70);

    window.setTimeout(() => {
      if (timerRef.current) window.clearInterval(timerRef.current);

      if (mode === "team") {
        const [team] = pickRandom(availableTeams.length > 0 ? availableTeams : ["未分配"], 1);
        setResultTeam(team);
        setRollingName(team);
        setParticipants(
          participants.map((participant) =>
            participant.team === team ? { ...participant, drawn: true } : participant,
          ),
        );
      } else {
        const targetCount = mode === "single" ? 1 : Math.min(drawCount, availablePeople.length);
        const winners = pickRandom(availablePeople, targetCount);
        const winnerIds = new Set(winners.map((winner) => winner.id));

        setResultPeople(winners);
        setRollingName(winners.map((winner) => winner.name).join("、"));
        setParticipants(
          participants.map((participant) =>
            winnerIds.has(participant.id) ? { ...participant, drawn: true } : participant,
          ),
        );
      }

      setIsRolling(false);
    }, 1200);
  }

  function resetDrawn() {
    if (!window.confirm("确认重置所有抽取记录吗？")) return;
    setParticipants(participants.map((participant) => ({ ...participant, drawn: false })));
    setResultPeople([]);
    setResultTeam("");
    setRollingName("准备开始");
  }

  const cannotDraw =
    participants.length === 0 || availablePeople.length === 0;
  const hasDrawOutput = resultPeople.length > 0 || Boolean(resultTeam) || isRolling;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:space-y-0">
      <section
        className={`app-card flex flex-col ${
          hasDrawOutput
            ? "min-h-[280px] p-4 sm:min-h-[448px] sm:p-6"
            : "p-4 sm:p-6"
        }`}
      >
        {participants.length === 0 ? (
          <EmptyState
            fill
            icon={<UsersRound size={36} />}
            title="名单为空"
            description="先上传参与者名单。"
          />
        ) : availablePeople.length === 0 && mode !== "team" ? (
          <EmptyState
            fill
            icon={<Trophy size={36} />}
            title="所有人都抽过了"
            description="重置抽取记录后可以继续。"
          />
        ) : (
          <div
            className="flex flex-1 flex-col items-center justify-center text-center"
          >
            <div
              className={`max-w-4xl break-words font-black leading-tight text-slate-950 transition ${
                hasDrawOutput ? "text-4xl sm:text-7xl" : "text-3xl text-slate-400 sm:text-5xl"
              } ${
                isRolling ? "scale-105 text-teal-600" : ""
              }`}
            >
              {rollingName}
            </div>

            {resultTeam ? (
              <p className="mt-6 text-base text-slate-500">抽中的原团队：{resultTeam}</p>
            ) : null}

            {resultPeople.length > 0 ? (
              <div className="mt-6 grid w-full gap-2 sm:max-w-3xl sm:grid-cols-2 xl:grid-cols-3">
                {resultPeople.map((person) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-left"
                    key={person.id}
                  >
                    <div className="text-lg font-bold text-slate-900">{person.name}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {genderLabel(person.gender)} · {person.team}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="app-card p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
            <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
              单人
            </ModeButton>
            <ModeButton active={mode === "multiple"} onClick={() => setMode("multiple")}>
              多人
            </ModeButton>
            <ModeButton active={mode === "team"} onClick={() => setMode("team")}>
              团队
            </ModeButton>
          </div>

          {mode === "multiple" ? (
            <label className="block">
              <span className="field-label">抽取人数</span>
              <input
                className="field-input mt-1"
                type="number"
                min={1}
                max={Math.max(1, availablePeople.length)}
                value={drawCount}
                onChange={(event) => setDrawCount(Number(event.target.value))}
              />
            </label>
          ) : null}

          {participants.some((participant) => participant.drawn) ? (
            <div className="rounded-lg border border-slate-200 p-4">
              <Toggle checked={excludeDrawn} label="排除已抽" onChange={setExcludeDrawn} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-50 px-4 py-2">
              <div className="text-xs text-slate-500">可抽人数</div>
              <div className="text-xl font-bold text-slate-900">{availablePeople.length}</div>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2">
              <div className="text-xs text-slate-500">团队数</div>
              <div className="text-xl font-bold text-slate-900">
                {excludeDrawn ? availableTeams.length : teams.length}
              </div>
            </div>
          </div>

          <button
            className="primary-button w-full"
            type="button"
            onClick={runDraw}
            disabled={cannotDraw || isRolling}
          >
            <Dices size={18} />
            {isRolling ? "抽取中" : "开始抽取"}
          </button>
          <button
            className="secondary-button w-full"
            type="button"
            onClick={resetDrawn}
            disabled={participants.length === 0}
          >
            <RotateCcw size={16} />
            重置记录
          </button>
        </div>
      </section>
    </div>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 text-sm font-medium ${
        disabled ? "text-slate-300" : "text-slate-700"
      }`}
    >
      <span>{label}</span>
      <input
        checked={checked}
        className="h-6 w-6 accent-teal-600"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
