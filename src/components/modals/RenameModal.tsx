import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { FileItem } from '../../utils/fileSystem';

interface RenameModalProps {
  isOpen: boolean;
  item: FileItem | null;
  onClose: () => void;
  onSubmit: (itemId: string, newName: string) => { success: boolean; error?: string };
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  item,
  onClose,
  onSubmit,
}) => {
  const [nameInput, setNameInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setNameInput(item.name);
      setErrorMessage(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onSubmit(item.id, nameInput);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid name');
    } else {
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 text-slate-800 dark:text-zinc-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Rename {item.isDirectory ? 'Folder' : 'File'}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {item.isDirectory
                ? 'Enter a new folder name'
                : 'Files keep their extension unless changed to another supported one (.md, .html)'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setErrorMessage(null);
              }}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              aria-label="Rename input"
            />
            {errorMessage && (
              <p className="text-rose-600 dark:text-rose-400 text-xs mt-1.5 font-medium">
                {errorMessage}
              </p>
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
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs shadow-xs transition-all"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
