import React, { useState } from 'react';
import { Folder, HardDrive, Sparkles, FolderPlus, AlertTriangle } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { FileItem } from '../../utils/fileSystem';

interface ChooseRootFolderModalProps {
  isOpen: boolean;
  isRevoked: boolean;
  onFolderChosen: (folderName: string) => void;
}

export const ChooseRootFolderModal: React.FC<ChooseRootFolderModalProps> = ({
  isOpen,
  isRevoked,
  onFolderChosen,
}) => {
  const [customName, setCustomName] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Storage Access Framework / File System Access API
  const handlePickRealDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-expect-error window.showDirectoryPicker is experimental in standard types
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        const folderName = dirHandle.name || 'External Storage';

        const importedFiles: FileItem[] = [];
        // Read directory entries asynchronously (NF-3)
        for await (const entry of (dirHandle as any).values()) {
          const isDir = entry.kind === 'directory';
          let size = 0;
          let content = '';
          let lastModified = Date.now();

          if (!isDir) {
            try {
              const fileData = await entry.getFile();
              size = fileData.size;
              lastModified = fileData.lastModified;
              if (
                fileData.name.endsWith('.md') ||
                fileData.name.endsWith('.markdown') ||
                fileData.name.endsWith('.html') ||
                fileData.name.endsWith('.htm')
              ) {
                content = await fileData.text();
              }
            } catch {
              // skip unreadable
            }
          }

          importedFiles.push({
            id: `real-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: entry.name,
            path: entry.name,
            parentPath: '',
            isDirectory: isDir,
            size,
            lastModified,
            content,
          });
        }

        storageService.setChosenRoot(folderName, importedFiles);
        onFolderChosen(folderName);
      } else {
        // Fallback for browsers without showDirectoryPicker
        storageService.setChosenRoot('Device Storage (SAF)');
        onFolderChosen('Device Storage (SAF)');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled picker
        return;
      }
      setError('Could not access folder. You can use the built-in storage library instead.');
    }
  };

  const handleUseSampleLibrary = () => {
    storageService.resetToSampleFolder();
    onFolderChosen('My Documents');
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed) {
      setError('Please enter a folder name');
      return;
    }
    storageService.setChosenRoot(trimmed, []);
    onFolderChosen(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col p-6 text-slate-800 dark:text-zinc-100">
        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-5">
          {isRevoked ? (
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Folder className="w-7 h-7 fill-current" />
            </div>
          )}

          <h2 className="text-lg font-bold">
            {isRevoked ? 'Folder Access Revoked' : 'Choose Root Folder'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            {isRevoked
              ? 'The previously chosen folder is no longer reachable (deleted or access revoked). Please pick a folder to continue.'
              : 'The app works on real files in a folder you choose once. Other apps and sync tools see the same files.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Option Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handlePickRealDirectory}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-medium text-xs flex items-center gap-3 transition-all shadow-sm"
          >
            <HardDrive className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Select Local Folder</div>
              <div className="text-[11px] opacity-90">SAF / Device File System</div>
            </div>
          </button>

          <button
            onClick={handleUseSampleLibrary}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 active:scale-98 text-slate-800 dark:text-zinc-200 font-medium text-xs flex items-center gap-3 transition-all"
          >
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-left">
              <div className="font-semibold text-sm">Load Sample Library</div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                Interactive demos, markdown specs & diagrams
              </div>
            </div>
          </button>

          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-98 text-slate-700 dark:text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Empty Root Folder</span>
            </button>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-2 pt-1">
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setError(null);
                }}
                placeholder="Folder name (e.g. My Notes)"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 py-2 rounded-xl text-xs text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
                >
                  Create & Select
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
