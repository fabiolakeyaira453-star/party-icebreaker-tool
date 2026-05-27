import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Shuffle,
  Trash2,
  UsersRound,
} from "lucide-react";
import { ActivityDefinition, ActivityGroup, Participant } from "../types";
import { generateActivityGroups } from "../utils/grouping";
import { createId, parseActivityExcel } from "../utils/participants";
import { createGroupsImageDataUrl, downloadImageDataUrl } from "../utils/downloadGroupImage";
import { loadActivities, loadGroups, saveActivities, saveGroups } from "../utils/storage";
import { EmptyState } from "./EmptyState";

type GroupToolProps = {
  participants: Participant[];
  showToast: (message: string) => void;
};

type ActivityForm = {
  name: string;
  description: string;
};

const defaultActivities: ActivityDefinition[] = [];

const emptyForm: ActivityForm = {
  name: "",
  description: "",
};

function loadInitialActivities() {
  const activities = loadActivities(defaultActivities);

  if (
    activities.length === 1 &&
    activities[0].name === "破冰聊天" &&
    activities[0].description === ""
  ) {
    return [];
  }

  return activities;
}

export function GroupTool({ participants, showToast }: GroupToolProps) {
  const [activities, setActivities] = useState<ActivityDefinition[]>(() =>
    loadInitialActivities(),
  );
  const [groups, setGroups] = useState<ActivityGroup[]>(() => loadGroups());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<ActivityForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    saveActivities(activities);
  }, [activities]);

  useEffect(() => {
    saveGroups(groups);
  }, [groups]);

  const validActivityCount = useMemo(
    () => activities.filter((activity) => activity.name.trim()).length,
    [activities],
  );

  function buildGroups(message = "分组已生成") {
    const nextGroups = generateActivityGroups(participants, activities);
    setGroups(nextGroups);
    if (nextGroups.length > 0) showToast(message);
  }

  function openCreateForm() {
    setEditingId(null);
    setActivityForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(activity: ActivityDefinition) {
    setEditingId(activity.id);
    setActivityForm({
      name: activity.name,
      description: activity.description,
    });
    setShowForm(true);
  }

  function saveActivity(event: FormEvent) {
    event.preventDefault();
    const name = activityForm.name.trim();
    if (!name) {
      showToast("活动名称不能为空");
      return;
    }

    if (editingId) {
      setActivities(
        activities.map((activity) =>
          activity.id === editingId
            ? { ...activity, name, description: activityForm.description.trim() }
            : activity,
        ),
      );
      showToast("活动已更新");
    } else {
      const nextActivity = {
        id: createId(),
        name,
        description: activityForm.description.trim(),
      };
      setActivities([...activities, nextActivity]);
      setExpandedId(nextActivity.id);
      showToast("活动已添加");
    }

    setShowForm(false);
    setEditingId(null);
    setActivityForm(emptyForm);
  }

  async function importActivities(file: File | undefined) {
    if (!file) return;

    try {
      const parsed = await parseActivityExcel(file);
      if (parsed.length === 0) {
        showToast("上传失败：没有识别到活动");
        return;
      }

      setActivities([...activities, ...parsed]);
      setShowUpload(false);
      showToast(`上传成功：已导入 ${parsed.length} 个活动`);
    } catch {
      showToast("上传失败：请确认包含活动名称、活动简介两列");
      return;
    }
  }

  function removeActivity(id: string) {
    if (!window.confirm("确认删除这个活动吗？")) return;
    setActivities(activities.filter((activity) => activity.id !== id));
    if (expandedId === id) setExpandedId(null);
    showToast("活动已删除");
  }

  function downloadAll() {
    if (groups.length === 0) return;
    const image = createGroupsImageDataUrl(groups);
    if (!image) {
      showToast("图片生成失败");
      return;
    }

    setPreviewImage(image);
    showToast("分组图片已生成");
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:space-y-0">
      <section className="app-card p-4 sm:p-6">
        {participants.length === 0 ? (
          <EmptyState
            icon={<UsersRound size={36} />}
            title="还没有可分组的人"
            description="先上传参与者名单。"
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Shuffle size={36} />}
            title="等待生成分组"
            description="添加活动后点击生成。"
          />
        ) : (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                className="secondary-button"
                type="button"
                onClick={() => buildGroups("已重新分组")}
              >
                再分一次
              </button>
              <button className="primary-button" type="button" onClick={downloadAll}>
                <Download size={16} />
                下载分组图片
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {groups.map((group) => (
                <div className="border-b border-slate-100 px-4 py-4 last:border-b-0" key={group.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-base font-black text-slate-900">
                        {group.activityName}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                        {group.activityDescription || "暂无简介"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-50 px-4 py-2 text-xs font-black text-[#cc5f10]">
                      队伍 {group.groupNumber}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    {group.members.map((member) => member.name).join("、")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="app-card p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <button className="primary-button" type="button" onClick={openCreateForm}>
            <Plus size={17} />
            添加活动
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setShowUpload(true)}
          >
            <FileSpreadsheet size={17} />
            上传表格
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              还没有活动，添加一个或上传表格。
            </div>
          ) : null}

          {activities.map((activity, index) => {
            const expanded = expandedId === activity.id;

            return (
              <article className="rounded-lg border border-slate-200 bg-slate-50" key={activity.id}>
                <button
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 text-left"
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : activity.id)}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {index + 1}. {activity.name || "未命名活动"}
                    </div>
                  </div>
                  <ChevronDown
                    className={`text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
                    size={18}
                  />
                </button>

                {expanded ? (
                  <div className="border-t border-slate-200 px-4 py-4">
                    <p className="text-sm leading-6 text-slate-600">
                      {activity.description || "暂无简介"}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => openEditForm(activity)}
                      >
                        <Edit3 size={15} />
                        编辑
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => removeActivity(activity.id)}
                      >
                        <Trash2 size={15} />
                        删除
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <button
          className="generate-button mt-4 w-full"
          type="button"
          onClick={() => buildGroups()}
          disabled={participants.length === 0 || validActivityCount === 0}
        >
          <Shuffle size={17} />
          生成活动分组
        </button>
      </section>

      {showForm ? (
        <ActivityModal
          form={activityForm}
          title={editingId ? "编辑活动" : "添加活动"}
          onClose={() => setShowForm(false)}
          onChange={setActivityForm}
          onSubmit={saveActivity}
        />
      ) : null}

      {showUpload ? (
        <ActivityUploadModal
          onClose={() => setShowUpload(false)}
          onImport={importActivities}
        />
      ) : null}

      {previewImage ? (
        <GroupImagePreview
          image={previewImage}
          onClose={() => setPreviewImage("")}
          onDownload={() => downloadImageDataUrl(previewImage)}
        />
      ) : null}
    </div>
  );
}

function GroupImagePreview({
  image,
  onClose,
  onDownload,
}: {
  image: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4">
          <div>
            <h3 className="text-base font-black text-slate-900">分组图片预览</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              手机端可长按图片，选择保存到照片或添加到照片。
            </p>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            type="button"
            aria-label="关闭"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
          <img
            className="mx-auto max-h-none w-full rounded-lg bg-white shadow-sm"
            src={image}
            alt="活动分组图片"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
          <button className="secondary-button" type="button" onClick={onClose}>
            关闭
          </button>
          <button className="primary-button" type="button" onClick={onDownload}>
            <Download size={16} />
            下载图片
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityModal({
  form,
  title,
  onChange,
  onClose,
  onSubmit,
}: {
  form: ActivityForm;
  title: string;
  onChange: (form: ActivityForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form className="w-full rounded-lg bg-white p-4 shadow-soft sm:max-w-md" onSubmit={onSubmit}>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <label className="mt-4 block">
          <span className="field-label">活动名称</span>
          <input
            className="field-input mt-1"
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            placeholder="例如：桌游体验"
          />
        </label>
        <label className="mt-4 block">
          <span className="field-label">活动简介</span>
          <textarea
            className="field-input mt-1 min-h-24 resize-y"
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            placeholder="可选"
          />
        </label>
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

function ActivityUploadModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (file: File | undefined) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full rounded-lg bg-white p-4 shadow-soft sm:max-w-md">
        <h3 className="text-lg font-black text-slate-900">上传活动表格</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          表头建议为：活动名称、活动简介。上传后会追加到当前活动列表。
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
