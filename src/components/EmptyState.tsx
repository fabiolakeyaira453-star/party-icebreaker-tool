import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  fill?: boolean;
};

export function EmptyState({ title, description, icon, fill = false }: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center ${
        fill ? "h-full flex-1" : ""
      }`}
    >
      {icon ? <div className="mb-4 text-slate-400">{icon}</div> : null}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
