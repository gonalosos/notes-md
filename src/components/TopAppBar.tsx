import React from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  RefreshCw,
  X,
  Move,
  Edit2,
  Trash2,
  Folder,
} from 'lucide-react';

interface TopAppBarProps {
  currentPath: string; // e.g. "Guides & Specs" or "" for root
  rootFolderName: string;
  isSelectionMode: boolean;
  selectedCount: number;
  onClearSelection: () => void;
  onMoveSelected: () => void;
  onRenameSelected: () => void;
  onDeleteSelected: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  canRename: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentPath,
  rootFolderName,
  isSelectionMode,
  selectedCount,
  onClearSelection,
  onMoveSelected,
  onRenameSelected,
  onDeleteSelected,
  onBack,
  onRefresh,
  onOpenSettings,
  isRefreshing,
  canRename,
}) => {
  // If in selection mode (MV-1)
  if (isSelectionMode) {
    return (
      <header className="h-14 px-3 flex items-center justify-between bg-emerald-700 text-white shadow-md z-20 shrink-0 select-none animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            onClick={onClearSelection}
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Cancel selection"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-medium text-base tracking-wide">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canRename && (
            <button
              onClick={onRenameSelected}
              className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
              aria-label="Rename selected item"
              title="Rename"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onMoveSelected}
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
            aria-label="Move selected items"
            title="Move"
          >
            <Move className="w-5 h-5" />
          </button>

          <button
            onClick={onDeleteSelected}
            className="p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white"
            aria-label="Delete selected items"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>
    );
  }

  // Normal Top App Bar
  const isAtRoot = !currentPath;
  const pathParts = currentPath ? currentPath.split('/') : [];
  const currentFolderDisplayName = isAtRoot
    ? rootFolderName
    : pathParts[pathParts.length - 1];

  return (
    <header className="h-14 px-3 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shrink-0 z-20 select-none">
      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
        {!isAtRoot ? (
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-full text-slate-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0"
            aria-label="Go up one folder level"
            title="Up one level"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-2 -ml-1 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Folder className="w-5 h-5 fill-current opacity-80" />
          </div>
        )}

        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-semibold text-slate-800 dark:text-zinc-100 truncate leading-tight">
            {currentFolderDisplayName}
          </h1>

          {/* Breadcrumb line for subfolders (FN-4) */}
          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1">
            <span>{rootFolderName}</span>
            {pathParts.map((part, idx) => (
              <React.Fragment key={idx}>
                <span>/</span>
                <span className={idx === pathParts.length - 1 ? 'font-medium' : ''}>{part}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all ${
            isRefreshing ? 'animate-spin text-emerald-600' : ''
          }`}
          aria-label="Pull to refresh folder list"
          title="Refresh from disk"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-slate-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Open settings"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
