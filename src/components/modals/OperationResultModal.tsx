import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface OperationResultModalProps {
  isOpen: boolean;
  title: string;
  succeededCount: number;
  failedItems: { name: string; reason: string }[];
  onClose: () => void;
}

export const OperationResultModal: React.FC<OperationResultModalProps> = ({
  isOpen,
  title,
  succeededCount,
  failedItems,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-slate-800 dark:text-zinc-100 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Operation completed with notices (MV-5)
            </p>
          </div>
        </div>

        <div className="space-y-3 my-2 text-xs">
          {succeededCount > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{succeededCount} item(s) succeeded and are saved.</span>
            </div>
          )}

          {failedItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-semibold text-rose-900 dark:text-rose-200">
                Failed items ({failedItems.length}):
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {failedItems.map((f, i) => (
                  <li key={i}>
                    <strong>{f.name}</strong>: {f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs shadow-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
