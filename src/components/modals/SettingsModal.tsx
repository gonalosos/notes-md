import React from 'react';
import {
  Settings as SettingsIcon,
  Folder,
  Sun,
  Moon,
  Laptop,
  Type,
  RotateCcw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  rootFolderName: string;
  theme: 'system' | 'light' | 'dark';
  markdownFontSize: number;
  isAccessRevoked: boolean;
  onClose: () => void;
  onChangeRootFolder: () => void;
  onThemeChange: (theme: 'system' | 'light' | 'dark') => void;
  onFontSizeChange: (fontSize: number) => void;
  onToggleSimulateRevoked: (revoked: boolean) => void;
  onResetSampleData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  rootFolderName,
  theme,
  markdownFontSize,
  isAccessRevoked,
  onClose,
  onChangeRootFolder,
  onThemeChange,
  onFontSizeChange,
  onToggleSimulateRevoked,
  onResetSampleData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-slate-800 dark:text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 py-4 text-xs">
          {/* Storage / Root folder setting (FN-2) */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">
              Storage Root Folder
            </label>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 mr-2">
                <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 fill-current" />
                <span className="font-medium truncate text-slate-800 dark:text-zinc-100">
                  {rootFolderName}
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onChangeRootFolder();
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] shrink-0 active:scale-95 transition-all"
              >
                Change
              </button>
            </div>
          </div>

          {/* Theme setting (RD-1) */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">
              App Theme (RD-1)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onThemeChange('system')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  theme === 'system'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>System</span>
              </button>

              <button
                onClick={() => onThemeChange('light')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  theme === 'light'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                onClick={() => onThemeChange('dark')}
                className={`py-2 px-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-600 bg-emerald-950/50 border-emerald-500 text-emerald-300 font-semibold'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
              Note (RD-2): HTML documents keep their own author colors regardless of theme.
            </p>
          </div>

          {/* Markdown Font Size (RD-3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                Markdown Font Size (RD-3)
              </label>
              <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {markdownFontSize}px
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={24}
              step={1}
              value={markdownFontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
              <span>Compact (12px)</span>
              <span>Default (16px)</span>
              <span>Large (24px)</span>
            </div>
          </div>

          {/* Testing helper: Simulate Access Revoked (FN-3) */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-900 dark:text-amber-200 text-xs">
                  Simulate Access Revoked (FN-3)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAccessRevoked}
                onChange={(e) => onToggleSimulateRevoked(e.target.checked)}
                className="rounded accent-amber-600 w-4 h-4 cursor-pointer"
                aria-label="Toggle simulate access revoked"
              />
            </div>
            <p className="text-[10px] text-amber-800 dark:text-amber-400 mt-1 leading-normal">
              Tests behavior when the chosen folder is deleted or permission revoked.
            </p>
          </div>

          {/* Reset sample library */}
          <div className="pt-1">
            <button
              onClick={() => {
                onResetSampleData();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Sample Library Files
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
