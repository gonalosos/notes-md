import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { FileItem } from '../../utils/fileSystem';
import { storageService } from '../../services/storageService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemsToDelete: FileItem[];
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  itemsToDelete,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || itemsToDelete.length === 0) return null;

  const count = itemsToDelete.length;

  // DL-1 & DL-3: Check if any folder with content is included
  const foldersWithContent: string[] = [];
  for (const item of itemsToDelete) {
    if (item.isDirectory && storageService.folderHasContent(item.path)) {
      foldersWithContent.push(item.name);
    }
  }

  const hasFolderWithContent = foldersWithContent.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-slate-800 dark:text-zinc-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Delete {count === 1 ? 'Item' : `${count} Items`}?</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="font-semibold text-slate-900 dark:text-zinc-100">
              {count === 1 ? `"${itemsToDelete[0].name}"` : `${count} selected items`}
            </strong>{' '}
            from disk?
          </p>

          {/* DL-1, DL-3: Specific warning naming folders that have content */}
          {hasFolderWithContent && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Contains folder with content:</span>
                <br />
                {foldersWithContent.map((folderName) => (
                  <span key={folderName} className="block mt-0.5">
                    • <strong>{folderName}</strong> and all its contents will be permanently deleted.
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-medium text-xs shadow-xs transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
