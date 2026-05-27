import { useEffect, useState } from "react";
import { CheckCircle2, Dices, Download, Shuffle, UsersRound, X } from "lucide-react";
import { DrawTool } from "./components/DrawTool";
import { GroupTool } from "./components/GroupTool";
import { ParticipantManager } from "./components/ParticipantManager";
import { Participant, TabKey } from "./types";
import { loadParticipants, saveParticipants } from "./utils/storage";

const tabs: Array<{
  key: TabKey;
  label: string;
  icon: typeof UsersRound;
}> = [
  { key: "draw", label: "随机抽取", icon: Dices },
  { key: "groups", label: "活动分组", icon: Shuffle },
  { key: "participants", label: "参与者", icon: UsersRound },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("draw");
  const [participants, setParticipants] = useState<Participant[]>(() => loadParticipants());
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    saveParticipants(participants);
  }, [participants]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#f7f7fb_45%,#f6f7fb_100%)] pb-24 lg:pb-0">
      <GlobalToast message={toastMessage} />

      <header className="sticky top-0 z-20 hidden border-b border-white/70 bg-white/90 backdrop-blur lg:block">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png?v=2`}
              alt="聚会破冰工具"
              className="h-10 w-10 shrink-0 rounded-lg object-cover shadow-lg shadow-teal-100"
            />
            <div>
              <h1 className="text-lg font-black text-slate-950 sm:text-2xl">聚会破冰工具</h1>
            </div>
          </div>

          <div className="hidden grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1 lg:grid">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition active:scale-[0.98] sm:min-w-28 ${
                    active
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon size={17} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <InstallHint />

        {activeTab === "participants" ? (
          <ParticipantManager
            participants={participants}
            setParticipants={setParticipants}
            showToast={setToastMessage}
          />
        ) : null}
        {activeTab === "draw" ? (
          <DrawTool participants={participants} setParticipants={setParticipants} />
        ) : null}
        {activeTab === "groups" ? (
          <GroupTool participants={participants} showToast={setToastMessage} />
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                className={`flex min-h-14 flex-col items-center justify-center gap-2 rounded-lg text-xs font-bold transition active:scale-[0.98] ${
                  active
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function GlobalToast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-[max(16px,env(safe-area-inset-top))] z-[80] flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-teal-700 shadow-soft">
      <CheckCircle2 className="shrink-0 text-teal-600" size={17} />
      <span className="min-w-0 truncate">{message}</span>
    </div>
  );
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function InstallHint() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(() => localStorage.getItem("pwa-install-hint") !== "hide");

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone;

  if (!visible || standalone) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  function close() {
    localStorage.setItem("pwa-install-hint", "hide");
    setVisible(false);
  }

  return (
    <section className="mb-4 rounded-lg border border-teal-100 bg-teal-50 p-4 text-teal-900 lg:hidden">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold">添加到手机主屏幕</div>
          <p className="mt-1 text-sm leading-6 text-teal-800">
            {installEvent
              ? "点击安装后，就能像 App 一样从桌面打开。"
              : "iPhone 用 Safari 打开后，点分享按钮，再选“添加到主屏幕”。"}
          </p>
          {installEvent ? (
            <button className="primary-button mt-4 bg-teal-700" type="button" onClick={install}>
              安装应用
            </button>
          ) : null}
        </div>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-teal-700 hover:bg-white/70"
          type="button"
          aria-label="关闭提示"
          onClick={close}
        >
          <X size={17} />
        </button>
      </div>
    </section>
  );
}

export default App;
