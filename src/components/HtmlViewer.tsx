import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { FileItem } from '../utils/fileSystem';
import { storageService } from '../services/storageService';

interface HtmlViewerProps {
  file: FileItem;
  onBack: () => void;
  onNavigateRelative: (relativePath: string) => void;
}

export const HtmlViewer: React.FC<HtmlViewerProps> = ({
  file,
  onBack,
  onNavigateRelative,
}) => {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // NF-7: Check large file size warning (>10MB)
  const isLargeFile = file.size > 10 * 1024 * 1024;

  // Listen to postMessage from sandboxed iframe for relative and external links (HT-5, HT-6)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'READER_EXTERNAL_LINK') {
        // HT-5: External links open in browser, not inside viewer
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else if (data.type === 'READER_RELATIVE_LINK') {
        // HT-6: Relative link to another Markdown or HTML file
        onNavigateRelative(data.path);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onNavigateRelative]);

  // HT-1, HT-2, HT-3, HT-7, HT-8: Prepare sandboxed HTML content
  const sandboxedHtmlSrcDoc = useMemo(() => {
    let content = file.content || '';

    // If empty
    if (!content.trim()) {
      content = `<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:80vh;color:#888;">Empty HTML Document</body></html>`;
    }

    // HT-8: Viewport tag check & inject if missing
    if (!/<meta\s+name=["']viewport["']/i.test(content)) {
      const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">';
      if (/<head[^>]*>/i.test(content)) {
        content = content.replace(/<head[^>]*>/i, `$&${viewportTag}`);
      } else {
        content = `${viewportTag}${content}`;
      }
    }

    // HT-3: Content Security Policy - strictly blocks all external network requests (fetch, external script/css/img)
    const cspMetaTag = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: blob:; style-src 'unsafe-inline' data: blob:; script-src 'unsafe-inline' data: blob:; font-src data: blob:; connect-src 'none';">`;
    if (/<head[^>]*>/i.test(content)) {
      content = content.replace(/<head[^>]*>/i, `$&${cspMetaTag}`);
    } else {
      content = `${cspMetaTag}${content}`;
    }

    // HT-2: Intercept local relative assets (CSS, images, JS) and inline them from file's folder
    // Replace relative images: src="relative/path.ext"
    content = content.replace(/<img\s+([^>]*?)src=["'](?!https?:\/\/|data:|blob:)([^"']+)["']([^>]*?)>/gi, (match, prefix, relSrc, suffix) => {
      const resolved = storageService.resolveRelativeFile(file.path, relSrc);
      if (resolved && resolved.content) {
        const isSvg = resolved.name.endsWith('.svg') || resolved.mimeType === 'image/svg+xml';
        const dataSrc = isSvg
          ? `data:image/svg+xml;utf8,${encodeURIComponent(resolved.content)}`
          : resolved.content;
        return `<img ${prefix}src="${dataSrc}" ${suffix}>`;
      }
      return match;
    });

    // Replace relative stylesheets: <link rel="stylesheet" href="style.css">
    content = content.replace(/<link\s+[^>]*?href=["'](?!https?:\/\/|data:|blob:)([^"']+\.css)["'][^>]*?>/gi, (match, relHref) => {
      const resolved = storageService.resolveRelativeFile(file.path, relHref);
      if (resolved && resolved.content) {
        return `<style>/* Inlined from ${relHref} */\n${resolved.content}</style>`;
      }
      return match;
    });

    // Injected link interceptor script (HT-5, HT-6)
    const linkInterceptorScript = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    e.preventDefault();
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
      window.parent.postMessage({ type: 'READER_EXTERNAL_LINK', url: href }, '*');
    } else {
      window.parent.postMessage({ type: 'READER_RELATIVE_LINK', path: href }, '*');
    }
  });
})();
</script>
`;

    if (/<\/body>/i.test(content)) {
      content = content.replace(/<\/body>/i, `${linkInterceptorScript}</body>`);
    } else {
      content = `${content}${linkInterceptorScript}`;
    }

    return content;
  }, [file.content, file.path]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900 select-none">
      {/* Viewer Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-full text-slate-700 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="Back to file list"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">
              {file.name}
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 truncate">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Sandboxed
              </span>
              <span>•</span>
              <span>Network Disabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner if large file (NF-7) */}
      {isLargeFile && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 border-b border-amber-200 dark:border-amber-900 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Large file (&gt;10MB): streaming safe preview enabled to prevent memory overflow.</span>
        </div>
      )}

      {warningMessage && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between border-b border-rose-200 dark:border-rose-900 shrink-0">
          <span>{warningMessage}</span>
          <button onClick={onBack} className="text-xs underline font-semibold ml-2">
            Return to list
          </button>
        </div>
      )}

      {/* Sandboxed HTML Iframe (HT-1..HT-7, RD-2: page keeps its own colors) */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          title={file.name}
          srcDoc={sandboxedHtmlSrcDoc}
          sandbox="allow-scripts"
          className="w-full h-full border-none block"
        />
      </div>
    </div>
  );
};
