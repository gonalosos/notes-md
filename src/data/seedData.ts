import { FileItem } from '../utils/fileSystem';

export const INITIAL_ROOT_FOLDER_NAME = 'My Documents';

const sampleSvgAsset = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="100%" height="240">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#34A853;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0F9D58;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="600" height="320" rx="16" fill="url(#bgGrad)"/>
  <circle cx="300" cy="110" r="50" fill="url(#grad1)"/>
  <!-- Android robot head -->
  <path d="M 265 110 A 35 35 0 0 1 335 110 Z" fill="#ffffff"/>
  <circle cx="280" cy="98" r="4" fill="#34A853"/>
  <circle cx="320" cy="98" r="4" fill="#34A853"/>
  <line x1="275" y1="80" x2="265" y2="68" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  <line x1="325" y1="80" x2="335" y2="68" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
  <text x="300" y="195" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Android HTML/Markdown Architecture</text>
  <text x="300" y="225" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">Local SAF Storage • Sandboxed WebView • Offline First</text>
  <rect x="130" y="250" width="150" height="36" rx="8" fill="#334155"/>
  <text x="205" y="273" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">Markdown Engine</text>
  <rect x="320" y="250" width="150" height="36" rx="8" fill="#334155"/>
  <text x="395" y="273" fill="#4ade80" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">HTML5 Sandbox</text>
</svg>`;

export const SAMPLE_FILES: FileItem[] = [
  // Subfolders in root
  {
    id: 'f-demos',
    name: 'Interactive Demos',
    path: 'Interactive Demos',
    parentPath: '',
    isDirectory: true,
    size: 0,
    lastModified: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'f-guides',
    name: 'Guides & Specs',
    path: 'Guides & Specs',
    parentPath: '',
    isDirectory: true,
    size: 0,
    lastModified: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: 'f-assets',
    name: 'assets',
    path: 'assets',
    parentPath: '',
    isDirectory: true,
    size: 0,
    lastModified: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'f-misc',
    name: 'Mixed Files (Test Filter)',
    path: 'Mixed Files (Test Filter)',
    parentPath: '',
    isDirectory: true,
    size: 0,
    lastModified: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'f-empty',
    name: 'Empty Folder (Test Empty)',
    path: 'Empty Folder (Test Empty)',
    parentPath: '',
    isDirectory: true,
    size: 0,
    lastModified: Date.now() - 1000 * 60 * 60 * 48,
  },

  // Root files
  {
    id: 'doc-readme',
    name: 'README.md',
    path: 'README.md',
    parentPath: '',
    isDirectory: false,
    size: 4210,
    lastModified: Date.now() - 1000 * 60 * 30,
    content: `# Android HTML & Markdown Reader

Welcome to the **Android HTML/Markdown Reader**. This viewer renders Markdown and HTML files kept in your chosen folder, running entirely offline with zero network leaks.

---

### Key Capabilities

* [x] **Subfolders first**: Folders listed at top, then Markdown and HTML files sorted A-Z
* [x] **Full Markdown support**: Headings, bold, italic, strikethrough, blockquotes, horizontal rules
* [x] **Task lists & bullet lists**: Interactive visual checklists
* [x] **Horizontally scrolling tables**: Keeps layout intact on mobile viewports
* [x] **Syntax-highlighted code blocks**: Horizontal scrolling with monospace formatting
* [x] **Relative images**: Resolved automatically from the file's own folder
* [x] **Relative cross-file navigation**: Links to other Markdown or HTML files navigate with back-stack support
* [x] **Sandboxed HTML**: Local JavaScript runs (sliders, tabs, charts), network access is completely blocked

---

### Relative Image Example

Here is a diagram loaded via a relative path (\`assets/android_architecture.svg\`):

![Android Architecture Diagram](assets/android_architecture.svg)

---

### Features & Formats Matrix

| Feature | Markdown (.md / .markdown) | HTML (.html / .htm) |
| :--- | :--- | :--- |
| **Rendering** | Native Material typography | Sandboxed WebView engine |
| **Interactive JS** | N/A (Static read-only) | Full JS (Tabs, Sliders, Canvas) |
| **Network Access** | Blocked | Blocked (Zero network permissions) |
| **Font Scaling** | Adjustable via Settings (RD-3) | Author-defined layout |
| **Scroll Memory** | Remembers session scroll (RD-4) | Remembers session scroll (RD-4) |
| **Relative Linking** | Supported (\`.md\` & \`.html\`) | Supported (\`.md\` & \`.html\`) |

---

### Code Block Demonstration

Below is a snippet demonstrating the Kotlin coroutine SAF query pattern:

\`\`\`kotlin
// Asynchronous background indexing over Storage Access Framework
suspend fun queryDirectorySaf(context: Context, treeUri: Uri): List<FileRecord> = withContext(Dispatchers.IO) {
    val items = mutableListOf<FileRecord>()
    val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(
        treeUri, DocumentsContract.getTreeDocumentId(treeUri)
    )
    context.contentResolver.query(
        childrenUri,
        arrayOf(Document.COLUMN_DOCUMENT_ID, Document.COLUMN_DISPLAY_NAME, Document.COLUMN_MIME_TYPE, Document.COLUMN_LAST_MODIFIED),
        null, null, null
    )?.use { cursor ->
        while (cursor.moveToNext()) {
            val name = cursor.getString(1) ?: continue
            if (isSupported(name)) items.add(FileRecord.fromCursor(cursor))
        }
    }
    return@withContext items.sortedWith(FolderFirstComparator)
}
\`\`\`

---

### Navigation Links

Tap these relative links to test in-app back-stack navigation:

* [Open Interactive Explainer HTML](Interactive%20Demos/explainer.html)
* [Open Architecture Guide Markdown](Guides%20&%20Specs/architecture_spec.markdown)
* [Open Quick Start Guide](Guides%20&%20Specs/quick_start.md)
* [Visit External Markdown Website (Opens in Browser)](https://www.markdownguide.org)
`,
  },
  {
    id: 'doc-quickstart',
    name: 'Getting Started.markdown',
    path: 'Getting Started.markdown',
    parentPath: '',
    isDirectory: false,
    size: 2450,
    lastModified: Date.now() - 1000 * 60 * 90,
    content: `# Getting Started

This reader is built around Android's Storage Access Framework principles:

1. **Pick Once**: Choose your root folder once; the app remembers it across launches.
2. **File Management**: Long-press any file or folder to trigger the action bar for **Move**, **Rename**, and **Delete**.
3. **Safe Storage**: When moving files with name collisions, choose between Cancel or Keep Both with automated numeric suffixes (\`filename (1).md\`).
4. **Dark Mode**: Automatically respects your device theme while preserving original author styling in HTML documents.

Return to: [Main README](README.md)
`,
  },

  // Assets folder items
  {
    id: 'asset-svg',
    name: 'android_architecture.svg',
    path: 'assets/android_architecture.svg',
    parentPath: 'assets',
    isDirectory: false,
    size: 1540,
    lastModified: Date.now() - 1000 * 60 * 60 * 12,
    content: sampleSvgAsset,
    mimeType: 'image/svg+xml',
  },

  // Interactive Demos folder items
  {
    id: 'demo-explainer',
    name: 'explainer.html',
    path: 'Interactive Demos/explainer.html',
    parentPath: 'Interactive Demos',
    isDirectory: false,
    size: 4800,
    lastModified: Date.now() - 1000 * 60 * 45,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Explainer</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #1e293b;
      background: #f8fafc;
      line-height: 1.5;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
    }
    h2 { margin-top: 0; color: #0f172a; font-size: 1.3rem; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .tab-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    .tab-btn.active {
      background: #2563eb;
      color: #ffffff;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .slider-row { margin: 16px 0; }
    .slider-row label { display: block; font-weight: 600; margin-bottom: 6px; }
    input[type="range"] { width: 100%; accent-color: #2563eb; }
    .metric-box {
      display: inline-block;
      padding: 12px 20px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      font-size: 20px;
      font-weight: bold;
      color: #1d4ed8;
      margin-top: 8px;
    }
    canvas {
      width: 100%;
      height: 160px;
      background: #0f172a;
      border-radius: 8px;
      display: block;
    }
    .btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 10px;
    }
    .blocked-log {
      margin-top: 10px;
      padding: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      font-size: 13px;
      color: #991b1b;
      display: none;
    }
    .nav-box {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
    }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Interactive HTML Explainer (HT-1)</h2>
    <p>This page runs client-side JavaScript inside a sandboxed WebView with blocked network access.</p>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('simulation')">Interactive Slider</button>
      <button class="tab-btn" onclick="switchTab('diagram')">Canvas Diagram</button>
      <button class="tab-btn" onclick="switchTab('security')">Sandbox Test</button>
    </div>

    <div id="tab-simulation" class="tab-content active">
      <div class="slider-row">
        <label for="speedSlider">Simulation Frequency: <span id="freqVal">50</span> Hz</label>
        <input type="range" id="speedSlider" min="1" max="100" value="50" oninput="updateFreq(this.value)">
      </div>
      <div>Calculated Latency:</div>
      <div class="metric-box" id="resultBox">20.0 ms</div>
    </div>

    <div id="tab-diagram" class="tab-content">
      <canvas id="animCanvas"></canvas>
      <button class="btn" onclick="togglePulse()">Trigger Pulse Animation</button>
    </div>

    <div id="tab-security" class="tab-content">
      <p>Demonstrating HT-3: Attempts to fetch network resources are safely rejected by CSP / sandbox.</p>
      <button class="btn" onclick="testNetworkFetch()">Test Network Request</button>
      <div id="networkResult" class="blocked-log"></div>
    </div>
  </div>

  <div class="card nav-box">
    <strong>Cross-Document Relative Navigation (HT-6):</strong><br>
    • <a href="../README.md">Return to Root README.md</a><br>
    • <a href="../Guides & Specs/architecture_spec.markdown">View Architecture Spec</a><br>
    • <a href="https://developer.android.com" target="_blank">External Android Docs (HT-5 opens in browser)</a>
  </div>

  <script>
    function switchTab(id) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + id).classList.add('active');
      if (id === 'diagram') initCanvas();
    }

    function updateFreq(val) {
      document.getElementById('freqVal').textContent = val;
      const ms = (1000 / Number(val)).toFixed(1);
      document.getElementById('resultBox').textContent = ms + ' ms';
    }

    function testNetworkFetch() {
      const log = document.getElementById('networkResult');
      log.style.display = 'block';
      log.textContent = 'Initiating fetch to https://example.com...';
      fetch('https://example.com/api', { mode: 'no-cors' })
        .then(() => {
          log.textContent = 'Unexpected: Request completed (sandbox warning)';
        })
        .catch(err => {
          log.textContent = 'HT-3 Verified: Network request blocked safely (' + err.message + ')';
        });
    }

    let canvasInited = false;
    let pulseCount = 0;
    function initCanvas() {
      if (canvasInited) return;
      canvasInited = true;
      const cvs = document.getElementById('animCanvas');
      const ctx = cvs.getContext('2d');
      cvs.width = cvs.offsetWidth || 340;
      cvs.height = cvs.offsetHeight || 160;

      function render() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        // draw grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for(let x = 0; x < cvs.width; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cvs.height); ctx.stroke();
        }

        // draw pulse wave
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const midY = cvs.height / 2;
        for (let x = 0; x < cvs.width; x++) {
          const y = midY + Math.sin((x + pulseCount) * 0.05) * 30;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        pulseCount += 2;
        requestAnimationFrame(render);
      }
      render();
    }
    function togglePulse() {
      pulseCount += 25;
    }
  </script>
</body>
</html>`,
  },
  {
    id: 'demo-summary',
    name: 'overview.htm',
    path: 'Interactive Demos/overview.htm',
    parentPath: 'Interactive Demos',
    isDirectory: false,
    size: 1950,
    lastModified: Date.now() - 1000 * 60 * 120,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Overview</title>
  <style>
    body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
    .badge { background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 999px; font-weight: bold; }
  </style>
</head>
<body>
  <h1><span class="badge">Active</span> Local Storage Summary</h1>
  <p>This .htm file confirms support for both <code>.html</code> and <code>.htm</code> extensions (FL-1).</p>
  <p>Navigation test: <a href="explainer.html">Open explainer.html</a> or <a href="../README.md">Return to Root</a></p>
</body>
</html>`,
  },

  // Guides folder items
  {
    id: 'guide-arch',
    name: 'architecture_spec.markdown',
    path: 'Guides & Specs/architecture_spec.markdown',
    parentPath: 'Guides & Specs',
    isDirectory: false,
    size: 3100,
    lastModified: Date.now() - 1000 * 60 * 180,
    content: `# Architecture & Storage Access Framework Specification

This technical guide outlines the internal mechanics of the Android Markdown/HTML Reader.

## 1. Storage Isolation (NF-4)
The application requests access **only** to the user-selected folder tree via:
\`\`\`text
android.intent.action.OPEN_DOCUMENT_TREE
\`\`\`
No general storage permissions or external network permissions are declared in the manifest.

## 2. Large File Safety (NF-7)
Files larger than 10 MB trigger memory-safe streaming to prevent \`OutOfMemoryError\` on Android:
- Direct buffer chunks
- Truncated syntax rendering with preview
- Non-blocking parser execution

## 3. Sandboxed WebView Execution (HT-1..HT-7)
- **Local Assets**: Loaded via WebViewAssetLoader virtual scheme.
- **Network Requests**: Blocked using \`shouldInterceptRequest\` and CSP header.
- **JavaScript**: Allowed for interactive explainers, but without Android interface bindings or permissions.

Link back to: [Main README](../README.md) or [Getting Started](../Getting Started.markdown)
`,
  },
  {
    id: 'guide-quick',
    name: 'quick_start.md',
    path: 'Guides & Specs/quick_start.md',
    parentPath: 'Guides & Specs',
    isDirectory: false,
    size: 1450,
    lastModified: Date.now() - 1000 * 60 * 200,
    content: `# Quick Start Guide

Welcome to the Quick Start guide.

- Long-press any item to select it.
- Choose **Move** to relocate it to another directory.
- Choose **Rename** to change its name while preserving its file extension.
- Choose **Delete** with confirmation dialog.

Back: [README](../README.md)
`,
  },

  // Mixed Files folder (To test FL-1: hidden non-supported files)
  {
    id: 'misc-notes',
    name: 'notes.md',
    path: 'Mixed Files (Test Filter)/notes.md',
    parentPath: 'Mixed Files (Test Filter)',
    isDirectory: false,
    size: 620,
    lastModified: Date.now() - 1000 * 60 * 60 * 5,
    content: `# Mixed Files Folder

In this folder on disk, there are also:
- \`data_dump.csv\` (hidden)
- \`archive.zip\` (hidden)
- \`document.pdf\` (hidden)

According to Acceptance Criteria **FL-1**, only Markdown (.md, .markdown) and HTML (.html, .htm) appear in the list.

Back: [Root README](../README.md)
`,
  },
  {
    id: 'misc-hidden-zip',
    name: 'archive.zip',
    path: 'Mixed Files (Test Filter)/archive.zip',
    parentPath: 'Mixed Files (Test Filter)',
    isDirectory: false,
    size: 1048576,
    lastModified: Date.now() - 1000 * 60 * 60 * 24,
    content: '',
  },
  {
    id: 'misc-hidden-pdf',
    name: 'manual.pdf',
    path: 'Mixed Files (Test Filter)/manual.pdf',
    parentPath: 'Mixed Files (Test Filter)',
    isDirectory: false,
    size: 2097152,
    lastModified: Date.now() - 1000 * 60 * 60 * 48,
    content: '',
  },
  {
    id: 'misc-hidden-csv',
    name: 'data.csv',
    path: 'Mixed Files (Test Filter)/data.csv',
    parentPath: 'Mixed Files (Test Filter)',
    isDirectory: false,
    size: 32000,
    lastModified: Date.now() - 1000 * 60 * 60 * 72,
    content: '',
  },
];
