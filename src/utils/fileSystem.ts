export interface FileItem {
  id: string;
  name: string;
  path: string; // relative path from root, e.g. "sub/doc.md" or "sub"
  parentPath: string; // "" for root, or "sub"
  isDirectory: boolean;
  size: number; // bytes
  lastModified: number; // timestamp ms
  content?: string; // text content for markdown / html
  binaryData?: Uint8Array | Blob; // for images / local assets
  mimeType?: string;
}

export const SUPPORTED_FILE_EXTENSIONS = ['.md', '.markdown', '.html', '.htm'] as const;

/**
 * Checks if a file name has a supported extension (ignoring case)
 */
export function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Returns the file extension including dot, in lowercase (e.g. ".md")
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

/**
 * Filter and sort items according to FL-1:
 * Subfolders first, then only .md, .markdown, .html, .htm files.
 * Each group sorted A to Z ignoring case.
 */
export function sortAndFilterDirectoryItems(items: FileItem[]): FileItem[] {
  const folders = items.filter((item) => item.isDirectory);
  const files = items.filter((item) => !item.isDirectory && isSupportedFile(item.name));

  const compareAZ = (a: FileItem, b: FileItem) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

  folders.sort(compareAZ);
  files.sort(compareAZ);

  return [...folders, ...files];
}

/**
 * Validates a new or renamed folder/file name:
 * - Not empty or whitespace
 * - No invalid characters: / \ : * ? " < > | or control characters
 * - Not "." or ".."
 * - Not already existing in the target folder
 */
export function validateItemName(
  name: string,
  existingNamesInFolder: string[],
  currentName?: string
): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmed === '.' || trimmed === '..') {
    return { isValid: false, error: 'Invalid name' };
  }

  // Illegal characters on Android / Linux / Windows: / \ : * ? " < > |
  const illegalCharRegex = /[\\/:*?"<>|\x00-\x1F]/;
  if (illegalCharRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name cannot contain \\ / : * ? " < > | or control characters',
    };
  }

  // Check collision (case-insensitive for real file systems)
  const isSelf = currentName && trimmed.toLowerCase() === currentName.toLowerCase();
  if (!isSelf) {
    const exists = existingNamesInFolder.some(
      (existing) => existing.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { isValid: false, error: `An item named "${trimmed}" already exists in this folder` };
    }
  }

  return { isValid: true };
}

/**
 * Generates a non-colliding name for conflicting files by adding a numeric suffix (MV-4)
 * e.g. "readme.md" -> "readme (1).md", "readme (2).md"
 */
export function generateUniqueName(existingNames: string[], originalName: string): string {
  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));
  if (!existingSet.has(originalName.toLowerCase())) {
    return originalName;
  }

  const lastDot = originalName.lastIndexOf('.');
  const base = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
  const ext = lastDot !== -1 ? originalName.slice(lastDot) : '';

  let counter = 1;
  while (true) {
    const candidate = `${base} (${counter})${ext}`;
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
    counter++;
  }
}

/**
 * Validates rename according to RN-1:
 * "a file keeps its extension unless I change it to another supported one"
 */
export function computeRenamedFileName(
  oldName: string,
  inputName: string,
  isDirectory: boolean
): { finalName: string; isValid: boolean; error?: string } {
  const trimmed = inputName.trim();
  if (!trimmed) {
    return { finalName: '', isValid: false, error: 'Name cannot be empty' };
  }

  if (isDirectory) {
    return { finalName: trimmed, isValid: true };
  }

  const oldExt = getFileExtension(oldName);
  const inputExt = getFileExtension(trimmed);

  // If user entered a supported extension, allow it
  if (inputExt && isSupportedFile(trimmed)) {
    return { finalName: trimmed, isValid: true };
  }

  // If user omitted extension or changed to unsupported, retain old extension
  if (!inputExt) {
    return { finalName: `${trimmed}${oldExt}`, isValid: true };
  }

  return {
    finalName: trimmed,
    isValid: false,
    error: `Unsupported extension "${inputExt}". Allowed extensions: .md, .markdown, .html, .htm`,
  };
}

/**
 * Checks whether destination folder is invalid for moving (MV-3):
 * "a folder cannot be moved into itself or into its own subfolders"
 */
export function isMoveDestinationAllowed(
  sourcePath: string,
  isSourceDirectory: boolean,
  targetFolderPath: string
): boolean {
  if (!isSourceDirectory) {
    return true; // Files can be moved to any folder
  }

  // Exact same folder
  if (sourcePath === targetFolderPath) {
    return false;
  }

  // Target is subfolder of source
  const normalizedSource = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
  if (targetFolderPath.startsWith(normalizedSource)) {
    return false;
  }

  return true;
}

/**
 * Resolves relative file path in a folder hierarchy.
 * e.g., base="guides/readme.md", rel="../assets/pic.png" => "assets/pic.png"
 * base="sub/index.html", rel="page2.html" => "sub/page2.html"
 */
export function resolveRelativePath(baseFilePath: string, relativePath: string): string {
  // Strip any query string or hash and decode percent encoding (e.g. %20 -> space)
  const cleanRel = decodeURIComponent(relativePath.split('#')[0].split('?')[0]);

  // Base directory path
  const baseDirParts = baseFilePath.split('/').slice(0, -1);
  const relParts = cleanRel.split('/');

  const resultParts = [...baseDirParts];

  for (const part of relParts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      if (resultParts.length > 0) {
        resultParts.pop();
      }
    } else {
      resultParts.push(part);
    }
  }

  return resultParts.join('/');
}

/**
 * Formats file size in readable units
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats last modified date for Android file list rows (FL-2)
 */
export function formatLastModified(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
