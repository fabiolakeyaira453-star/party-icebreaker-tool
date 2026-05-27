import { FormEvent, useMemo, useState } from "react";
import { FileSpreadsheet, Plus, RotateCcw, Trash2, UsersRound } from "lucide-react";
import { Gender, Participant } from "../types";
import { createId, genderLabel, parseParticipantExcel } from "../utils/participants";
import { EmptyState } from "./EmptyState";

type ParticipantManagerProps = {
  participants: Participant[];
  setParticipants: (participants: Participant[]) => void;
  showToast: (message: string) => void;
};

type ParticipantForm = {
  name: string;
  gender: Gender;
  team: string;
};

const emptyForm: ParticipantForm = {
  name: "",
  gender: "male",
  team: "",
};

export function ParticipantManager({
  participants,
  setParticipants,
  showToast,
}: ParticipantManagerProps) {
  const [activeTeam, setActiveTeam] = useState("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<ParticipantForm>(emptyForm);

  const teams = useMemo(
    () => ["全部", ...Array.from(new Set(participants.map((person) => person.team))).filter(Boolean)],
    [participants],
  );

  const visibleParticipants = useMemo(() => {
    if (activeTeam === "全部") return participants;
    return participants.filter((participant) => participant.team === activeTeam);
  }, [activeTeam, participants]);

  function addParticipant(event: FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      showToast("姓名不能为空");
      return;
    }

    setParticipants([
      {
        id: createId(),
        name,
        gender: form.gender,
        team: form.team.trim() || "未分配",
        drawn: false,
      },
      ...participants,
    ]);
    setForm(emptyForm);
    setShowAdd(false);
    setActiveTeam("全部");
    showToast("参与者已添加");
  }

  async function importExcel(file: File | undefined) {
    if (!file) return;

    try {
      const parsed = await parseParticipantExcel(file);
      if (parsed.length === 0) {
        showToast("上传失败：没有识别到有效名单");
        return;
      }

      setParticipants(parsed);
      setActiveTeam("全部");
      setShowUpload(false);
      showToast(`上传成功：已导入 ${parsed.length} 人`);
    } catch {
      showToast("上传失败：请确认包含姓名、性别、团队三列");
    }
  }

  function removeParticipant(id: string) {
    const target = participants.find((participant) => participant.id === id);
    if (!target) return;
    if (!window.confirm(`确认删除「${target.name}」吗？`)) return;
    setParticipants(participants.filter((participant) => participant.id !== id));
    showToast("参与者已删除");
  }

  function resetDrawn() {
    if (!window.confirm("确认重置所有人的已抽状态吗？")) return;
    setParticipants(participants.map((participant) => ({ ...participant, drawn: false })));
    showToast("已重置抽取状态");
  }

  function clearAll() {
    if (!window.confirm("确认清空全部参与者吗？这个操作无法撤销。")) return;
    setParticipants([]);
    setActiveTeam("全部");
    showToast("已清空全部");
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:space-y-0">
      <section className="app-card p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <button className="primary-button" type="button" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            添加成员
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowUpload(true)}
          >
            <FileSpreadsheet size={18} />
            上传表格
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
          <button
            className="secondary-button"
            type="button"
            onClick={resetDrawn}
            disabled={participants.length === 0}
          >
            <RotateCcw size={17} />
            重置已抽
          </button>
          <button
            className="danger-button"
            type="button"
            onClick={clearAll}
            disabled={participants.length === 0}
          >
            清空全部
          </button>
        </div>

      </section>

      {participants.length === 0 ? (
        <section className="app-card p-4 sm:p-6 lg:row-start-1 lg:col-start-1">
          <EmptyState
            icon={<UsersRound size={34} />}
            title="还没有参与者"
            description="可以单独添加，也可以上传 Excel 表格。"
          />
        </section>
      ) : (
        <section className="app-card overflow-hidden lg:row-start-1 lg:col-start-1">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-4">
            {teams.map((team) => (
              <button
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTeam === team
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                key={team}
                type="button"
                onClick={() => setActiveTeam(team)}
              >
                {team}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100">
            {visibleParticipants.map((participant) => (
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-4"
                key={participant.id}
              >
                <div>
                  <div className="font-bold text-slate-900">{participant.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {genderLabel(participant.gender)} · {participant.team} ·{" "}
                    {participant.drawn ? "已抽" : "未抽"}
                  </div>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  title="删除"
                  onClick={() => removeParticipant(participant.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {showAdd ? (
        <ParticipantModal
          form={form}
          onChange={setForm}
          onClose={() => setShowAdd(false)}
          onSubmit={addParticipant}
        />
      ) : null}

      {showUpload ? (
        <UploadModal onClose={() => setShowUpload(false)} onImport={importExcel} />
      ) : null}
    </div>
  );
}

function ParticipantModal({
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  form: ParticipantForm;
  onChange: (form: ParticipantForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form className="w-full rounded-lg bg-white p-4 shadow-soft sm:max-w-md" onSubmit={onSubmit}>
        <h3 className="text-lg font-black text-slate-900">添加参与者</h3>
        <label className="mt-4 block">
          <span className="field-label">姓名</span>
          <input
            className="field-input mt-1"
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            placeholder="例如：张三"
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">性别</span>
            <select
              className="field-input mt-1"
              value={form.gender}
              onChange={(event) => onChange({ ...form, gender: event.target.value as Gender })}
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">团队</span>
            <input
              className="field-input mt-1"
              value={form.team}
              onChange={(event) => onChange({ ...form, team: event.target.value })}
              placeholder="A队"
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="secondary-button" type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" type="submit">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

function UploadModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (file: File | undefined) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full rounded-lg bg-white p-4 shadow-soft sm:max-w-md">
        <h3 className="text-lg font-black text-slate-900">上传 Excel 表格</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          表头建议为：姓名、性别、团队。上传成功后会替换当前名单。
        </p>
        <label className="primary-button mt-4 w-full cursor-pointer">
          <FileSpreadsheet size={18} />
          选择表格
          <input
            className="hidden"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              onImport(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        <button className="secondary-button mt-2 w-full" type="button" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}
