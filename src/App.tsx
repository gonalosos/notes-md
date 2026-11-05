import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { FileList } from './components/FileList';
import { MarkdownViewer } from './components/MarkdownViewer';
import { HtmlViewer } from './components/HtmlViewer';
import { ChooseRootFolderModal } from './components/modals/ChooseRootFolderModal';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { RenameModal } from './components/modals/RenameModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { MoveModal } from './components/modals/MoveModal';
import { OperationResultModal } from './components/modals/OperationResultModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { storageService, StorageState } from './services/storageService';
import {
  FileItem,
  sortAndFilterDirectoryItems,
  getFileExtension,
} from './utils/fileSystem';

export default function App() {
  const [storageState, setStorageState] = useState<StorageState>(() =>
    storageService.getState()
  );
  const [currentPath, setCurrentPath] = useState<string>(''); // "" is root
  const [fileHistoryStack, setFileHistoryStack] = useState<FileItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isChooseRootOpen, setIsChooseRootOpen] = useState<boolean>(
    !storageState.hasChosenRoot || storageState.isAccessRevoked
  );
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [renamingItem, setRenamingItem] = useState<FileItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [operationResult, setOperationResult] = useState<{
    isOpen: boolean;
    title: string;
    succeededCount: number;
    failedItems: { name: string; reason: string }[];
  }>({
    isOpen: false,
    title: '',
    succeededCount: 0,
    failedItems: [],
  });

  // Effective theme (RD-1)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const updateTheme = () => {
      if (storageState.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(prefersDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(storageState.theme);
      }
    };
    updateTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', updateTheme);
    return () => media.removeEventListener('change', updateTheme);
  }, [storageState.theme]);

  // Sync state from storage service
  const refreshStorageState = useCallback(() => {
    const updated = storageService.getState();
    setStorageState(updated);
    if (!updated.hasChosenRoot || updated.isAccessRevoked) {
      setIsChooseRootOpen(true);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // FL-4: Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await storageService.refreshFromDisk();
    refreshStorageState();
    setIsRefreshing(false);
    showToast('Folder synced with disk');
  };

  // Current folder items (FL-1: filtered & sorted)
  const currentItems = React.useMemo(() => {
    const rawItems = storageService.getItemsInFolder(currentPath);
    return sortAndFilterDirectoryItems(rawItems);
  }, [currentPath, storageState.files]);

  // Active open file in viewer
  const activeFile = fileHistoryStack.length > 0 ? fileHistoryStack[fileHistoryStack.length - 1] : null;

  // Multi-selection state
  const isSelectionMode = selectedItemIds.size > 0;
  const selectedItems = React.useMemo(() => {
    return storageState.files.filter((f) => selectedItemIds.has(f.id));
  }, [selectedItemIds, storageState.files]);

  // Back button handling (FN-4, MD-6, HT-6)
  const handleBack = () => {
    // 1. If viewing a file, unwind viewer back-stack
    if (fileHistoryStack.length > 1) {
      setFileHistoryStack((prev) => prev.slice(0, -1));
      return;
    }
    if (fileHistoryStack.length === 1) {
      setFileHistoryStack([]);
      return;
    }

    // 2. If in selection mode, cancel selection
    if (isSelectionMode) {
      setSelectedItemIds(new Set());
      return;
    }

    // 3. If in subfolder, go up one level (FN-4)
    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/'));
      return;
    }

    // 4. Back at root leaves app
    showToast('Press Back again to exit reader');
  };

  // Home button
  const handleHome = () => {
    setFileHistoryStack([]);
    setSelectedItemIds(new Set());
    setCurrentPath('');
  };

  // Open item (Folder navigation or File viewer)
  const handleItemClick = (item: FileItem) => {
    if (item.isDirectory) {
      setCurrentPath(item.path);
    } else {
      // Open file in viewer
      setFileHistoryStack([item]);
    }
  };

  // Long-press multi-select initiation (MV-1)
  const handleItemLongPress = (item: FileItem) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedItemIds(newSet);
  };

  const handleToggleSelectItem = (item: FileItem) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(item.id)) {
      newSet.delete(item.id);
    } else {
      newSet.add(item.id);
    }
    setSelectedItemIds(newSet);
  };

  // Relative link navigation in Markdown or HTML (MD-6, HT-6)
  const handleNavigateRelative = (relativePath: string) => {
    if (!activeFile) return;
    const targetItem = storageService.resolveRelativeFile(activeFile.path, relativePath);
    if (targetItem) {
      if (targetItem.isDirectory) {
        // If relative link was a folder
        setFileHistoryStack([]);
        setCurrentPath(targetItem.path);
      } else {
        // Push target file to multi-level navigation back-stack
        setFileHistoryStack((prev) => [...prev, targetItem]);
      }
    } else {
      showToast(`Linked file not found: ${relativePath}`);
    }
  };

  // Create folder (FN-5, FN-6)
  const handleCreateFolder = (folderName: string) => {
    const result = storageService.createFolder(currentPath, folderName);
    if (result.success) {
      refreshStorageState();
      showToast(`Folder "${folderName}" created`);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Rename item (RN-1, RN-2)
  const handleRename = (itemId: string, newName: string) => {
    const result = storageService.renameItem(itemId, newName);
    if (result.success) {
      refreshStorageState();
      setSelectedItemIds(new Set());
      showToast(`Renamed to "${result.item?.name}"`);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  // Delete items (DL-1..DL-3)
  const handleConfirmDelete = () => {
    const ids = Array.from(selectedItemIds);
    const result = storageService.deleteItems(ids);
    setIsDeleteModalOpen(false);
    setSelectedItemIds(new Set());
    refreshStorageState();

    // DL-3: If active folder was deleted, reset navigation to parent or root
    const currentStillExists =
      !currentPath || storageService.getFileByPath(currentPath)?.isDirectory;
    if (!currentStillExists) {
      setCurrentPath('');
    }

    showToast(`Deleted ${result.deletedCount} item(s)`);
  };

  // Move items (MV-1..MV-5)
  const handleConfirmMove = (
    targetFolderPath: string,
    conflictStrategy: 'keep_both' | 'cancel'
  ) => {
    const ids = Array.from(selectedItemIds);
    const result = storageService.moveItems(ids, targetFolderPath, conflictStrategy);

    setSelectedItemIds(new Set());
    refreshStorageState();

    // MV-2: If the current working folder was moved, reset navigation to nearest parent folder
    const currentStillExists =
      !currentPath || storageService.getFileByPath(currentPath)?.isDirectory;
    if (!currentStillExists) {
      setCurrentPath(targetFolderPath);
    }

    if (result.failedItems.length > 0) {
      // MV-5: Show detailed failure report
      setOperationResult({
        isOpen: true,
        title: 'Move Results',
        succeededCount: result.movedCount,
        failedItems: result.failedItems,
      });
    } else {
      showToast(`Moved ${result.movedCount} item(s)`);
    }
  };

  // Change root folder from Settings or Modal (FN-2)
  const handleFolderChosen = (rootName: string) => {
    setIsChooseRootOpen(false);
    setCurrentPath('');
    setFileHistoryStack([]);
    setSelectedItemIds(new Set());
    refreshStorageState();
    showToast(`Storage folder set to "${rootName}"`);
  };

  return (
    <div className={effectiveTheme === 'dark' ? 'dark' : ''}>
      <AndroidFrame
        theme={effectiveTheme}
        onBackPress={handleBack}
        onHomePress={handleHome}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900">
          {/* If a file is active, show the appropriate viewer */}
          {activeFile ? (
            (() => {
              const ext = getFileExtension(activeFile.name);
              const isMarkdown = ext === '.md' || ext === '.markdown';
              return isMarkdown ? (
                <MarkdownViewer
                  file={activeFile}
                  fontSize={storageState.markdownFontSize}
                  onFontSizeChange={(size) => {
                    storageService.setMarkdownFontSize(size);
                    refreshStorageState();
                  }}
                  onBack={handleBack}
                  onNavigateRelative={handleNavigateRelative}
                />
              ) : (
                <HtmlViewer
                  file={activeFile}
                  onBack={handleBack}
                  onNavigateRelative={handleNavigateRelative}
                />
              );
            })()
          ) : (
            /* File List & Top App Bar */
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <TopAppBar
                currentPath={currentPath}
                rootFolderName={storageState.rootFolderName}
                isSelectionMode={isSelectionMode}
                selectedCount={selectedItemIds.size}
                onClearSelection={() => setSelectedItemIds(new Set())}
                onMoveSelected={() => setIsMoveModalOpen(true)}
                onRenameSelected={() => {
                  if (selectedItems.length === 1) {
                    setRenamingItem(selectedItems[0]);
                  }
                }}
                onDeleteSelected={() => setIsDeleteModalOpen(true)}
                onBack={handleBack}
                onRefresh={handleRefresh}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isRefreshing={isRefreshing}
                canRename={selectedItems.length === 1}
              />

              <FileList
                items={currentItems}
                selectedItemIds={selectedItemIds}
                isSelectionMode={isSelectionMode}
                onItemClick={handleItemClick}
                onItemLongPress={handleItemLongPress}
                onToggleSelectItem={handleToggleSelectItem}
                onCreateFolderClick={() => setIsCreateFolderOpen(true)}
              />

              {/* Floating Action Button (FAB) for New Folder (FN-5) */}
              {!isSelectionMode && (
                <button
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="absolute bottom-4 right-4 w-13 h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all z-20"
                  aria-label="Create new folder"
                  title="Create Folder"
                >
                  <Plus className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {/* Android Toast notification */}
          {toastMessage && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-800/90 text-white text-xs font-medium shadow-lg backdrop-blur-xs select-none pointer-events-none z-40 animate-fadeIn">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Dialogs & Modals */}
        <ChooseRootFolderModal
          isOpen={isChooseRootOpen}
          isRevoked={storageState.isAccessRevoked}
          onFolderChosen={handleFolderChosen}
        />

        <CreateFolderModal
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
          onSubmit={handleCreateFolder}
        />

        <RenameModal
          isOpen={!!renamingItem}
          item={renamingItem}
          onClose={() => setRenamingItem(null)}
          onSubmit={handleRename}
        />

        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          itemsToDelete={selectedItems}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />

        <MoveModal
          isOpen={isMoveModalOpen}
          itemsToMove={selectedItems}
          rootFolderName={storageState.rootFolderName}
          onClose={() => setIsMoveModalOpen(false)}
          onConfirmMove={handleConfirmMove}
        />

        <OperationResultModal
          isOpen={operationResult.isOpen}
          title={operationResult.title}
          succeededCount={operationResult.succeededCount}
          failedItems={operationResult.failedItems}
          onClose={() =>
            setOperationResult((prev) => ({ ...prev, isOpen: false }))
          }
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          rootFolderName={storageState.rootFolderName}
          theme={storageState.theme}
          markdownFontSize={storageState.markdownFontSize}
          isAccessRevoked={storageState.isAccessRevoked}
          onClose={() => setIsSettingsOpen(false)}
          onChangeRootFolder={() => setIsChooseRootOpen(true)}
          onThemeChange={(th) => {
            storageService.setTheme(th);
            refreshStorageState();
          }}
          onFontSizeChange={(size) => {
            storageService.setMarkdownFontSize(size);
            refreshStorageState();
          }}
          onToggleSimulateRevoked={(revoked) => {
            storageService.simulateAccessRevoked(revoked);
            refreshStorageState();
          }}
          onResetSampleData={() => {
            storageService.resetToSampleFolder();
            setCurrentPath('');
            setFileHistoryStack([]);
            setSelectedItemIds(new Set());
            refreshStorageState();
            showToast('Reset to sample library');
          }}
        />
      </AndroidFrame>
    </div>
  );
}
