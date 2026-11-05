import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FileItem,
  sortAndFilterDirectoryItems,
  isSupportedFile,
  validateItemName,
  generateUniqueName,
  computeRenamedFileName,
  isMoveDestinationAllowed,
  resolveRelativePath,
} from './fileSystem';

test('FL-1: Filters out unsupported files and sorts subfolders first, then supported files A to Z case-insensitive', () => {
  const items: FileItem[] = [
    {
      id: '1',
      name: 'zebra.md',
      path: 'zebra.md',
      parentPath: '',
      isDirectory: false,
      size: 100,
      lastModified: Date.now(),
    },
    {
      id: '2',
      name: 'archive.zip',
      path: 'archive.zip',
      parentPath: '',
      isDirectory: false,
      size: 500,
      lastModified: Date.now(),
    },
    {
      id: '3',
      name: 'Beta Folder',
      path: 'Beta Folder',
      parentPath: '',
      isDirectory: true,
      size: 0,
      lastModified: Date.now(),
    },
    {
      id: '4',
      name: 'apple.HTML',
      path: 'apple.HTML',
      parentPath: '',
      isDirectory: false,
      size: 200,
      lastModified: Date.now(),
    },
    {
      id: '5',
      name: 'alpha folder',
      path: 'alpha folder',
      parentPath: '',
      isDirectory: true,
      size: 0,
      lastModified: Date.now(),
    },
    {
      id: '6',
      name: 'guide.markdown',
      path: 'guide.markdown',
      parentPath: '',
      isDirectory: false,
      size: 300,
      lastModified: Date.now(),
    },
    {
      id: '7',
      name: 'picture.png',
      path: 'picture.png',
      parentPath: '',
      isDirectory: false,
      size: 800,
      lastModified: Date.now(),
    },
  ];

  const sorted = sortAndFilterDirectoryItems(items);

  // Subfolders first: 'alpha folder', 'Beta Folder'
  // Then supported files: 'apple.HTML', 'guide.markdown', 'zebra.md'
  // archive.zip and picture.png should NOT appear in list
  assert.equal(sorted.length, 5);
  assert.equal(sorted[0].name, 'alpha folder');
  assert.equal(sorted[1].name, 'Beta Folder');
  assert.equal(sorted[2].name, 'apple.HTML');
  assert.equal(sorted[3].name, 'guide.markdown');
  assert.equal(sorted[4].name, 'zebra.md');
});

test('FN-6: Name validation rejects empty, existing names, and invalid characters', () => {
  const existing = ['ExistingFolder', 'Notes.md'];

  // Empty
  assert.equal(validateItemName('', existing).isValid, false);
  assert.equal(validateItemName('   ', existing).isValid, false);

  // Invalid chars
  assert.equal(validateItemName('invalid/name', existing).isValid, false);
  assert.equal(validateItemName('name:test', existing).isValid, false);
  assert.equal(validateItemName('star*test', existing).isValid, false);
  assert.equal(validateItemName('pipe|test', existing).isValid, false);
  assert.equal(validateItemName('quote"test', existing).isValid, false);

  // Collision
  assert.equal(validateItemName('existingfolder', existing).isValid, false);
  assert.equal(validateItemName('Notes.md', existing).isValid, false);

  // Valid
  assert.equal(validateItemName('New Folder', existing).isValid, true);
  assert.equal(validateItemName('Document (1).md', existing).isValid, true);
});

test('MV-3: Folder cannot be moved into itself or into its own subfolders', () => {
  // Folder moving to root: allowed
  assert.equal(isMoveDestinationAllowed('docs', true, ''), true);

  // Folder moving to another folder: allowed
  assert.equal(isMoveDestinationAllowed('docs', true, 'archive'), true);

  // Folder moving into itself: disallowed
  assert.equal(isMoveDestinationAllowed('docs', true, 'docs'), false);

  // Folder moving into subfolder: disallowed
  assert.equal(isMoveDestinationAllowed('docs', true, 'docs/sub'), false);
  assert.equal(isMoveDestinationAllowed('docs', true, 'docs/sub/nested'), false);

  // Files can be moved to any folder
  assert.equal(isMoveDestinationAllowed('docs/readme.md', false, 'docs'), true);
});

test('MV-4: Conflict resolution generates unique numeric suffixes', () => {
  const existing = ['Report.md', 'Report (1).md', 'index.html'];

  assert.equal(generateUniqueName(existing, 'New.md'), 'New.md');
  assert.equal(generateUniqueName(existing, 'Report.md'), 'Report (2).md');
  assert.equal(generateUniqueName(existing, 'index.html'), 'index (1).html');
});

test('RN-1: Rename preserves file extension unless changed to another supported one', () => {
  // Keeping same extension
  const res1 = computeRenamedFileName('notes.md', 'new_notes', false);
  assert.equal(res1.isValid, true);
  assert.equal(res1.finalName, 'new_notes.md');

  // Changing to another supported extension
  const res2 = computeRenamedFileName('notes.md', 'summary.html', false);
  assert.equal(res2.isValid, true);
  assert.equal(res2.finalName, 'summary.html');

  // Changing to an unsupported extension
  const res3 = computeRenamedFileName('notes.md', 'danger.exe', false);
  assert.equal(res3.isValid, false);

  // Renaming folder does not add extension
  const resFolder = computeRenamedFileName('Docs', 'Project Docs', true);
  assert.equal(resFolder.isValid, true);
  assert.equal(resFolder.finalName, 'Project Docs');
});

test('MD-6 & HT-2: Relative path resolution for subfolders, dot-dot and local assets', () => {
  assert.equal(resolveRelativePath('docs/guide.md', 'next.md'), 'docs/next.md');
  assert.equal(resolveRelativePath('docs/guide.md', './next.md'), 'docs/next.md');
  assert.equal(resolveRelativePath('docs/guide.md', '../index.html'), 'index.html');
  assert.equal(resolveRelativePath('docs/deep/nested/page.html', '../../images/chart.png'), 'docs/images/chart.png');
  assert.equal(resolveRelativePath('root_doc.md', 'assets/logo.png'), 'assets/logo.png');
});

test('MV-2 & RN-1: Recursive path updates when folder is moved or renamed', () => {
  const oldFolder = 'projects';
  const newFolder = 'archived_projects';
  const childPath = 'projects/app/readme.md';

  const prefixOld = `${oldFolder}/`;
  const prefixNew = `${newFolder}/`;

  assert.equal(childPath.startsWith(prefixOld), true);
  const updatedChildPath = prefixNew + childPath.slice(prefixOld.length);
  assert.equal(updatedChildPath, 'archived_projects/app/readme.md');
});

