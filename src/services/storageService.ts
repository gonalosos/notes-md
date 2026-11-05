import {
  FileItem,
  generateUniqueName,
  isMoveDestinationAllowed,
  computeRenamedFileName,
  validateItemName,
  resolveRelativePath,
} from '../utils/fileSystem';
import { SAMPLE_FILES, INITIAL_ROOT_FOLDER_NAME } from '../data/seedData';

const STORAGE_KEY_FILES = 'android_reader_files_v2';
const STORAGE_KEY_ROOT_NAME = 'android_reader_root_name_v2';
const STORAGE_KEY_HAS_CHOSEN_ROOT = 'android_reader_has_chosen_root_v2';
const STORAGE_KEY_FONT_SIZE = 'android_reader_md_font_size_v2';
const STORAGE_KEY_THEME = 'android_reader_theme_v2';
const STORAGE_KEY_ACCESS_REVOKED = 'android_reader_simulated_revoked_v2';

export interface StorageState {
  rootFolderName: string;
  hasChosenRoot: boolean;
  isAccessRevoked: boolean;
  files: FileItem[];
  markdownFontSize: number; // in px, default 16
  theme: 'system' | 'light' | 'dark';
}

class StorageService {
  private files: FileItem[] = [];
  private rootFolderName: string = INITIAL_ROOT_FOLDER_NAME;
  private hasChosenRoot: boolean = false;
  private isAccessRevoked: boolean = false;
  private markdownFontSize: number = 16;
  private theme: 'system' | 'light' | 'dark' = 'system';
  private sessionScrollPositions: Map<string, number> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedHasChosen = localStorage.getItem(STORAGE_KEY_HAS_CHOSEN_ROOT);
      this.hasChosenRoot = savedHasChosen === 'true';

      const savedRootName = localStorage.getItem(STORAGE_KEY_ROOT_NAME);
      if (savedRootName) {
        this.rootFolderName = savedRootName;
      }

      const savedRevoked = localStorage.getItem(STORAGE_KEY_ACCESS_REVOKED);
      this.isAccessRevoked = savedRevoked === 'true';

      const savedFontSize = localStorage.getItem(STORAGE_KEY_FONT_SIZE);
      if (savedFontSize) {
        this.markdownFontSize = Number(savedFontSize) || 16;
      }

      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        this.theme = savedTheme;
      }

      const rawFiles = localStorage.getItem(STORAGE_KEY_FILES);
      if (rawFiles) {
        this.files = JSON.parse(rawFiles);
      } else {
        // First launch: initialize with sample files
        this.files = [...SAMPLE_FILES];
        this.saveFiles();
      }
    } catch {
      this.files = [...SAMPLE_FILES];
      this.hasChosenRoot = false;
      this.isAccessRevoked = false;
    }
  }

  private saveFiles() {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(this.files));
    } catch (e) {
      console.warn('Storage quota exceeded, unable to persist entire file cache', e);
    }
  }

  public getState(): StorageState {
    return {
      rootFolderName: this.rootFolderName,
      hasChosenRoot: this.hasChosenRoot,
      isAccessRevoked: this.isAccessRevoked,
      files: [...this.files],
      markdownFontSize: this.markdownFontSize,
      theme: this.theme,
    };
  }

  public setChosenRoot(rootName: string, initialFiles?: FileItem[]) {
    this.rootFolderName = rootName;
    this.hasChosenRoot = true;
    this.isAccessRevoked = false;
    if (initialFiles) {
      this.files = initialFiles;
    }
    localStorage.setItem(STORAGE_KEY_ROOT_NAME, rootName);
    localStorage.setItem(STORAGE_KEY_HAS_CHOSEN_ROOT, 'true');
    localStorage.setItem(STORAGE_KEY_ACCESS_REVOKED, 'false');
    this.saveFiles();
  }

  public simulateAccessRevoked(revoked: boolean) {
    this.isAccessRevoked = revoked;
    localStorage.setItem(STORAGE_KEY_ACCESS_REVOKED, revoked ? 'true' : 'false');
  }

  public setMarkdownFontSize(size: number) {
    this.markdownFontSize = size;
    localStorage.setItem(STORAGE_KEY_FONT_SIZE, size.toString());
  }

  public setTheme(theme: 'system' | 'light' | 'dark') {
    this.theme = theme;
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }

  public resetToSampleFolder() {
    this.files = [...SAMPLE_FILES];
    this.rootFolderName = INITIAL_ROOT_FOLDER_NAME;
    this.hasChosenRoot = true;
    this.isAccessRevoked = false;
    localStorage.setItem(STORAGE_KEY_ROOT_NAME, this.rootFolderName);
    localStorage.setItem(STORAGE_KEY_HAS_CHOSEN_ROOT, 'true');
    localStorage.setItem(STORAGE_KEY_ACCESS_REVOKED, 'false');
    this.saveFiles();
  }

  /**
   * Returns items located directly in the given folder path (empty string "" for root).
   */
  public getItemsInFolder(folderPath: string): FileItem[] {
    return this.files.filter((item) => item.parentPath === folderPath);
  }

  /**
   * Returns all folders in the file system for directory picker dialogs
   */
  public getAllFolders(): FileItem[] {
    return this.files.filter((item) => item.isDirectory);
  }

  /**
   * Find a file by exact path relative to root
   */
  public getFileByPath(path: string): FileItem | undefined {
    return this.files.find((f) => f.path === path);
  }

  /**
   * Resolves a relative path from a current file's folder to a target file.
   */
  public resolveRelativeFile(currentFilePath: string, relativeTarget: string): FileItem | undefined {
    const targetPath = resolveRelativePath(currentFilePath, relativeTarget);
    return this.getFileByPath(targetPath);
  }

  /**
   * FN-5, FN-6: Create a folder in the current directory
   */
  public createFolder(
    parentPath: string,
    folderName: string
  ): { success: boolean; item?: FileItem; error?: string } {
    const existingNames = this.getItemsInFolder(parentPath).map((i) => i.name);
    const validation = validateItemName(folderName, existingNames);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const trimmedName = folderName.trim();
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const newFolder: FileItem = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      path: newPath,
      parentPath: parentPath,
      isDirectory: true,
      size: 0,
      lastModified: Date.now(),
    };

    this.files.push(newFolder);
    this.saveFiles();
    return { success: true, item: newFolder };
  }

  /**
   * RN-1, RN-2: Rename a file or folder
   */
  public renameItem(
    itemId: string,
    newNameInput: string
  ): { success: boolean; item?: FileItem; error?: string } {
    const item = this.files.find((f) => f.id === itemId);
    if (!item) {
      return { success: false, error: 'Item not found on disk' };
    }

    const renameValidation = computeRenamedFileName(item.name, newNameInput, item.isDirectory);
    if (!renameValidation.isValid) {
      return { success: false, error: renameValidation.error };
    }

    const finalName = renameValidation.finalName;
    const existingNames = this.getItemsInFolder(item.parentPath).map((i) => i.name);
    const nameValidation = validateItemName(finalName, existingNames, item.name);
    if (!nameValidation.isValid) {
      return { success: false, error: nameValidation.error };
    }

    const oldPath = item.path;
    const newPath = item.parentPath ? `${item.parentPath}/${finalName}` : finalName;

    item.name = finalName;
    item.path = newPath;
    item.lastModified = Date.now();

    // If item is a folder, update paths of all its descendant children
    if (item.isDirectory) {
      const prefixOld = `${oldPath}/`;
      const prefixNew = `${newPath}/`;
      for (const child of this.files) {
        if (child.path.startsWith(prefixOld)) {
          child.path = prefixNew + child.path.slice(prefixOld.length);
          if (child.parentPath === oldPath) {
            child.parentPath = newPath;
          } else if (child.parentPath.startsWith(prefixOld)) {
            child.parentPath = prefixNew + child.parentPath.slice(prefixOld.length);
          }
        }
      }
    }

    this.saveFiles();
    return { success: true, item };
  }

  /**
   * DL-1, DL-2, DL-3: Delete one or more items and their contents
   */
  public deleteItems(itemIds: string[]): {
    success: boolean;
    deletedCount: number;
    failedItems: { name: string; reason: string }[];
  } {
    const itemsToDelete = this.files.filter((f) => itemIds.includes(f.id));
    const pathsToRemove: string[] = [];

    for (const item of itemsToDelete) {
      pathsToRemove.push(item.path);
      if (item.isDirectory) {
        const prefix = `${item.path}/`;
        for (const child of this.files) {
          if (child.path.startsWith(prefix)) {
            pathsToRemove.push(child.path);
          }
        }
      }
    }

    const set = new Set(pathsToRemove);
    const originalCount = this.files.length;
    this.files = this.files.filter((f) => !set.has(f.path));
    this.saveFiles();

    return {
      success: true,
      deletedCount: originalCount - this.files.length,
      failedItems: [],
    };
  }

  /**
   * Checks if a folder has any content (DL-1)
   */
  public folderHasContent(folderPath: string): boolean {
    const prefix = `${folderPath}/`;
    return this.files.some((f) => f.path.startsWith(prefix));
  }

  /**
   * MV-1..MV-5: Move one or more items to destination folder
   */
  public moveItems(
    itemIds: string[],
    targetFolderPath: string, // "" for root, or "folder/sub"
    conflictResolution: 'keep_both' | 'cancel' = 'keep_both'
  ): {
    success: boolean;
    movedCount: number;
    failedItems: { name: string; reason: string }[];
  } {
    const failedItems: { name: string; reason: string }[] = [];
    let movedCount = 0;

    const existingInTarget = this.getItemsInFolder(targetFolderPath).map((i) => i.name);

    for (const id of itemIds) {
      const item = this.files.find((f) => f.id === id);
      if (!item) {
        failedItems.push({ name: id, reason: 'Item not found' });
        continue;
      }

      // Check if moving folder into itself or its own subfolder (MV-3)
      if (!isMoveDestinationAllowed(item.path, item.isDirectory, targetFolderPath)) {
        failedItems.push({
          name: item.name,
          reason: 'Cannot move a folder into itself or into its own subfolders',
        });
        continue;
      }

      // Check if already in destination
      if (item.parentPath === targetFolderPath) {
        continue; // Already there, nothing to do
      }

      // Check collision
      let finalName = item.name;
      const collisionExists = existingInTarget.some(
        (n) => n.toLowerCase() === item.name.toLowerCase()
      );

      if (collisionExists) {
        if (conflictResolution === 'cancel') {
          failedItems.push({
            name: item.name,
            reason: 'Item with same name already exists and move was cancelled',
          });
          continue;
        } else {
          // MV-4: Keep both with numeric suffix
          finalName = generateUniqueName(existingInTarget, item.name);
        }
      }

      const oldPath = item.path;
      const newPath = targetFolderPath ? `${targetFolderPath}/${finalName}` : finalName;

      item.name = finalName;
      item.path = newPath;
      item.parentPath = targetFolderPath;
      item.lastModified = Date.now();
      existingInTarget.push(finalName);
      movedCount++;

      // If folder, update all descendant children paths
      if (item.isDirectory) {
        const prefixOld = `${oldPath}/`;
        const prefixNew = `${newPath}/`;
        for (const child of this.files) {
          if (child.path.startsWith(prefixOld)) {
            child.path = prefixNew + child.path.slice(prefixOld.length);
            if (child.parentPath === oldPath) {
              child.parentPath = newPath;
            } else if (child.parentPath.startsWith(prefixOld)) {
              child.parentPath = prefixNew + child.parentPath.slice(prefixOld.length);
            }
          }
        }
      }
    }

    this.saveFiles();
    return {
      success: failedItems.length === 0,
      movedCount,
      failedItems,
    };
  }

  /**
   * RD-4, RD-5: Scroll position memory for current session
   */
  public saveScrollPosition(filePath: string, position: number) {
    this.sessionScrollPositions.set(filePath, position);
  }

  public getScrollPosition(filePath: string): number {
    return this.sessionScrollPositions.get(filePath) || 0;
  }

  public clearScrollPosition(filePath: string) {
    this.sessionScrollPositions.delete(filePath);
  }

  /**
   * FL-4: Pull to refresh / sync disk simulation
   */
  public async refreshFromDisk(): Promise<void> {
    // Simulates SAF background coroutine query
    await new Promise((resolve) => setTimeout(resolve, 350));
    this.loadFromStorage();
  }
}

export const storageService = new StorageService();
