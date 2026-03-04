"use client";

import { useToastStore } from "@/lib/toast";

const TYPE_STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const TYPE_ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-md text-sm animate-in slide-in-from-right-5 ${TYPE_STYLES[t.type]}`}
        >
          <span className="font-bold mt-0.5">{TYPE_ICONS[t.type]}</span>
          <p className="flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-60 hover:opacity-100 font-bold leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
