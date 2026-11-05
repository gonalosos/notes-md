import React, { useState } from 'react';
import {
  Folder,
  ChevronRight,
  FolderOpen,
  Move,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { FileItem, isMoveDestinationAllowed } from '../../utils/fileSystem';
import { storageService } from '../../services/storageService';

interface MoveModalProps {
  isOpen: boolean;
  itemsToMove: FileItem[];
  rootFolderName: string;
  onClose: () => void;
  onConfirmMove: (
    targetFolderPath: string,
    conflictStrategy: 'keep_both' | 'cancel'
  ) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  itemsToMove,
  rootFolderName,
  onClose,
  onConfirmMove,
}) => {
  // Navigation inside the destination folder picker (MV-3)
  const [currentBrowsePath, setCurrentBrowsePath] = useState<string>('');
  const [conflictItemNames, setConflictItemNames] = useState<string[]>([]);
  const [showConflictPrompt, setShowConflictPrompt] = useState<boolean>(false);

  if (!isOpen || itemsToMove.length === 0) return null;

  // Folders directly inside currentBrowsePath
  const subfolders = storageService
    .getItemsInFolder(currentBrowsePath)
    .filter((item) => item.isDirectory);

  // Check if currentBrowsePath is invalid for ANY of the selected items (MV-3)
  const isCurrentDestinationDisallowed = itemsToMove.some((item) => {
    return !isMoveDestinationAllowed(item.path, item.isDirectory, currentBrowsePath);
  });

  // Check if items are already in currentBrowsePath
  const isAlreadyHere = itemsToMove.every(
    (item) => item.parentPath === currentBrowsePath
  );

  // Handle clicking "Move Here"
  const handleInitiateMove = () => {
    if (isCurrentDestinationDisallowed || isAlreadyHere) return;

    // Check collisions in target folder (MV-4)
    const existingInTarget = storageService
      .getItemsInFolder(currentBrowsePath)
      .map((i) => i.name.toLowerCase());

    const collisions = itemsToMove
      .filter((item) => existingInTarget.includes(item.name.toLowerCase()))
      .map((item) => item.name);

    if (collisions.length > 0) {
      setConflictItemNames(collisions);
      setShowConflictPrompt(true);
    } else {
      onConfirmMove(currentBrowsePath, 'keep_both');
      onClose();
    }
  };

  const handleResolveConflictKeepBoth = () => {
    setShowConflictPrompt(false);
    onConfirmMove(currentBrowsePath, 'keep_both');
    onClose();
  };

  const handleResolveConflictCancel = () => {
    setShowConflictPrompt(false);
    onClose();
  };

  const browseParts = currentBrowsePath ? currentBrowsePath.split('/') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[85vh] p-6 text-slate-800 dark:text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Move className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">
              Move {itemsToMove.length === 1 ? `"${itemsToMove[0].name}"` : `${itemsToMove.length} items`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select destination folder
            </p>
          </div>
        </div>

        {/* Conflict Prompt Dialog (MV-4) */}
        {showConflictPrompt ? (
          <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <span className="font-semibold">Name collision detected:</span>
                <p className="mt-1">
                  The destination already has item(s) named:{' '}
                  <strong>{conflictItemNames.join(', ')}</strong>.
                </p>
                <p className="mt-1 text-[11px] opacity-90">
                  Nothing will be overwritten silently (MV-4). Choose to cancel or keep both (with numeric suffixes like <code>name (1).md</code>).
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleResolveConflictKeepBoth}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Copy className="w-4 h-4" />
                Keep Both (Add numeric suffix)
              </button>
              <button
                onClick={handleResolveConflictCancel}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium text-xs transition-all"
              >
                Cancel Move
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Breadcrumb navigator for folder picker (MV-3) */}
            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-100 dark:bg-zinc-800/70 rounded-xl text-xs overflow-x-auto shrink-0 mb-3 text-slate-600 dark:text-zinc-300">
              <button
                onClick={() => setCurrentBrowsePath('')}
                className={`hover:underline font-medium ${!currentBrowsePath ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
              >
                {rootFolderName}
              </button>
              {browseParts.map((part, index) => {
                const subPath = browseParts.slice(0, index + 1).join('/');
                const isLast = index === browseParts.length - 1;
                return (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    <button
                      onClick={() => setCurrentBrowsePath(subPath)}
                      className={`hover:underline truncate max-w-[90px] ${isLast ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}
                    >
                      {part}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Folder items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 -mx-2 px-2 min-h-[160px]">
              {subfolders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 italic">
                  No subfolders in this location
                </div>
              ) : (
                subfolders.map((folder) => {
                  // Check if folder is disallowed to move into (MV-3: cannot move into itself or its own subfolders)
                  const isDisallowed = itemsToMove.some(
                    (item) => !isMoveDestinationAllowed(item.path, item.isDirectory, folder.path)
                  );

                  return (
                    <div
                      key={folder.id}
                      onClick={() => !isDisallowed && setCurrentBrowsePath(folder.path)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-colors ${
                        isDisallowed
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Folder className="w-4 h-4 text-amber-500 fill-current shrink-0" />
                        <span className="text-xs font-medium truncate">{folder.name}</span>
                        {isDisallowed && (
                          <span className="text-[10px] text-rose-500">(Cannot move into itself)</span>
                        )}
                      </div>
                      {!isDisallowed && (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Target status / warning */}
            {isCurrentDestinationDisallowed ? (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs mt-2 shrink-0">
                A folder cannot be moved into itself or into its own subfolders (MV-3).
              </div>
            ) : isAlreadyHere ? (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 text-xs mt-2 shrink-0">
                Item(s) already in this folder.
              </div>
            ) : null}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInitiateMove}
                disabled={isCurrentDestinationDisallowed || isAlreadyHere}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 active:scale-95 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4" />
                Move Here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
