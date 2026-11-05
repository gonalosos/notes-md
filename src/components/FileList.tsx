import React, { useRef } from 'react';
import {
  Folder,
  FileCode2,
  FileText,
  Plus,
  FolderOpen,
  CheckCircle2,
  Circle,
  HelpCircle,
} from 'lucide-react';
import {
  FileItem,
  formatFileSize,
  formatLastModified,
  getFileExtension,
} from '../utils/fileSystem';

interface FileListProps {
  items: FileItem[];
  selectedItemIds: Set<string>;
  isSelectionMode: boolean;
  onItemClick: (item: FileItem) => void;
  onItemLongPress: (item: FileItem) => void;
  onToggleSelectItem: (item: FileItem) => void;
  onCreateFolderClick: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  selectedItemIds,
  isSelectionMode,
  onItemClick,
  onItemLongPress,
  onToggleSelectItem,
  onCreateFolderClick,
}) => {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const handleTouchStart = (item: FileItem) => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      onItemLongPress(item);
    }, 500); // 500ms Android standard long-press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    onItemLongPress(item);
  };

  const handleClick = (item: FileItem) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    if (isSelectionMode) {
      onToggleSelectItem(item);
    } else {
      onItemClick(item);
    }
  };

  // FL-3: Empty state when folder has no subfolders and no supported files
  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 shadow-inner">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-zinc-200 mb-1">
          Folder is empty
        </h3>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs leading-relaxed mb-6">
          No subfolders or supported files (.md, .markdown, .html, .htm) found here.
        </p>

        <button
          onClick={onCreateFolderClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New Folder
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 pb-20 select-none">
      {items.map((item) => {
        const isSelected = selectedItemIds.has(item.id);
        const ext = getFileExtension(item.name);
        const isMarkdown = ext === '.md' || ext === '.markdown';
        const isHtml = ext === '.html' || ext === '.htm';

        return (
          <div
            key={item.id}
            onClick={() => handleClick(item)}
            onTouchStart={() => handleTouchStart(item)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onContextMenu={(e) => handleContextMenu(e, item)}
            className={`flex items-center px-4 py-3.5 gap-3.5 cursor-pointer transition-colors active:bg-slate-100/80 dark:active:bg-zinc-800/80 ${
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
                : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
            }`}
            data-testid={`file-row-${item.name}`}
            role="row"
            aria-label={`${item.name}, ${item.isDirectory ? 'Folder' : isMarkdown ? 'Markdown file' : 'HTML file'}`}
          >
            {/* Selection Checkbox (Visible in selection mode, or toggleable) */}
            {isSelectionMode ? (
              <div
                className="shrink-0 p-1 text-emerald-600 dark:text-emerald-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelectItem(item);
                }}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 fill-current" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-400 dark:text-zinc-600" />
                )}
              </div>
            ) : null}

            {/* Distinct Icon (FL-2) */}
            <div className="shrink-0">
              {item.isDirectory ? (
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <Folder className="w-5 h-5 fill-current" />
                </div>
              ) : isMarkdown ? (
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs relative">
                  <FileText className="w-5 h-5" />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded-sm uppercase tracking-tighter">
                    MD
                  </span>
                </div>
              ) : isHtml ? (
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-xs relative">
                  <FileCode2 className="w-5 h-5" />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-orange-600 text-white text-[9px] font-bold rounded-sm uppercase tracking-tighter">
                    HTML
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Name, Modified Date & Size (FL-2) */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-zinc-100 truncate">
                {item.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                {!item.isDirectory && (
                  <>
                    <span>{formatFileSize(item.size)}</span>
                    <span>•</span>
                  </>
                )}
                <span>{formatLastModified(item.lastModified)}</span>
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
};
