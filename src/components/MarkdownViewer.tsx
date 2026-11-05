import React, { useEffect, useRef, useState, useMemo } from 'react';
import { marked } from 'marked';
import { ArrowLeft, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { FileItem } from '../utils/fileSystem';
import { storageService } from '../services/storageService';

interface MarkdownViewerProps {
  file: FileItem;
  fontSize: number; // in px
  onFontSizeChange: (newSize: number) => void;
  onBack: () => void;
  onNavigateRelative: (relativePath: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  fontSize,
  onFontSizeChange,
  onBack,
  onNavigateRelative,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // RD-4, RD-5: Restore scroll position in current session
  useEffect(() => {
    const savedScroll = storageService.getScrollPosition(file.path);
    if (containerRef.current) {
      containerRef.current.scrollTop = savedScroll;
    }

    const container = containerRef.current;
    const handleScroll = () => {
      if (container) {
        storageService.saveScrollPosition(file.path, container.scrollTop);
      }
    };

    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [file.path]);

  // NF-7: Check large file size warning (>10MB)
  const isLargeFile = file.size > 10 * 1024 * 1024;

  // MD-1..MD-4: Parse markdown with custom marked renderer
  const renderedHtml = useMemo(() => {
    try {
      const rawContent = file.content || '';
      if (!rawContent.trim()) {
        return '<div class="text-slate-400 dark:text-zinc-500 italic py-8 text-center">Empty document</div>';
      }

      // Configure marked
      const renderer = new marked.Renderer();

      // MD-5 & MD-6: Links
      renderer.link = ({ href, title, text }) => {
        if (!href) return text;
        const isExternal =
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('mailto:');
        const titleAttr = title ? ` title="${title}"` : '';

        if (isExternal) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"${titleAttr}>${text}</a>`;
        } else {
          // Relative link
          return `<a href="javascript:void(0)" data-relative-target="${href}" class="markdown-rel-link text-emerald-600 dark:text-emerald-400 hover:underline font-medium"${titleAttr}>${text}</a>`;
        }
      };

      // MD-4: Relative image resolution with placeholder fallback
      renderer.image = ({ href, title, text }) => {
        if (!href) return '';
        const titleAttr = title ? ` title="${title}"` : '';
        const altText = text || 'image';

        // Check if external image
        if (href.startsWith('http://') || href.startsWith('https://')) {
          return `<div class="my-3"><img src="${href}" alt="${altText}" class="max-w-full h-auto rounded-lg shadow-xs" ${titleAttr} loading="lazy" /></div>`;
        }

        // Relative image in folder/subfolder
        const resolvedItem = storageService.resolveRelativeFile(file.path, href);
        if (resolvedItem && resolvedItem.content) {
          // If SVG or base64/data
          const isSvg =
            resolvedItem.name.endsWith('.svg') || resolvedItem.mimeType === 'image/svg+xml';
          const src = isSvg
            ? `data:image/svg+xml;utf8,${encodeURIComponent(resolvedItem.content)}`
            : resolvedItem.content;

          return `<div class="my-4"><img src="${src}" alt="${altText}" class="max-w-full h-auto rounded-lg shadow-xs border border-slate-200 dark:border-zinc-800" ${titleAttr} /></div>`;
        }

        // Missing image: show graceful placeholder, never error screen (MD-4)
        return `<div class="my-4 p-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400 select-none">
          <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Image placeholder: <code>${href}</code> (${altText})</span>
        </div>`;
      };

      // MD-2: Tables with horizontal scroll wrapper
      renderer.table = (token) => {
        const header = token.header
          .map((cell) => `<th class="border border-slate-300 dark:border-zinc-700 px-3 py-2 bg-slate-100 dark:bg-zinc-800 text-left font-semibold">${cell.text}</th>`)
          .join('');
        const rows = token.rows
          .map(
            (row) =>
              `<tr class="even:bg-slate-50/60 dark:even:bg-zinc-800/40">${row
                .map((cell) => `<td class="border border-slate-300 dark:border-zinc-700 px-3 py-2">${cell.text}</td>`)
                .join('')}</tr>`
          )
          .join('');

        return `<div class="overflow-x-auto my-4 rounded-lg border border-slate-300 dark:border-zinc-700 shadow-2xs">
          <table class="w-full text-left border-collapse text-xs sm:text-sm">
            <thead><tr>${header}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
      };

      // MD-3: Code blocks with monospace formatting and horizontal scroll
      renderer.code = ({ text, lang }) => {
        return `<div class="my-4 rounded-xl overflow-hidden bg-zinc-950 text-zinc-100 shadow-sm border border-zinc-800">
          ${
            lang
              ? `<div class="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider bg-zinc-900 text-zinc-400 border-b border-zinc-800">${lang}</div>`
              : ''
          }
          <pre class="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed"><code>${text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')}</code></pre>
        </div>`;
      };

      // Task lists & list items
      renderer.listitem = (item) => {
        const parsedText = marked.parseInline(item.text, { renderer });
        if (item.task) {
          return `<li class="flex items-start gap-2 my-1 list-none -ml-4">
            <input type="checkbox" disabled ${item.checked ? 'checked' : ''} class="mt-1 rounded accent-emerald-600 pointer-events-none" />
            <span>${parsedText}</span>
          </li>`;
        }
        return `<li class="my-1">${parsedText}</li>`;
      };

      return marked.parse(rawContent, {
        renderer,
        gfm: true,
        breaks: true,
      }) as string;
    } catch (e) {
      // MD-7: Never crashes on invalid markdown
      return `<div class="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
        Best effort rendering preview:<br><pre class="mt-2 text-xs font-mono whitespace-pre-wrap">${file.content}</pre>
      </div>`;
    }
  }, [file.content, file.path]);

  // Click handler delegation for relative and external links (MD-5, MD-6)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;

    const href = link.getAttribute('data-relative-target') || link.getAttribute('href');
    if (!href || href === 'javascript:void(0)' || href.startsWith('#')) return;

    const isExternal =
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:');

    e.preventDefault();
    e.stopPropagation();

    if (isExternal) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      onNavigateRelative(href);
    }
  };

  // Font size scaling controls (RD-3)
  const handleIncreaseFont = () => {
    if (fontSize < 24) onFontSizeChange(fontSize + 1);
  };

  const handleDecreaseFont = () => {
    if (fontSize > 12) onFontSizeChange(fontSize - 1);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-900 select-text">
      {/* Viewer Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 shrink-0 select-none">
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
            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
              Markdown • {fontSize}px
            </div>
          </div>
        </div>

        {/* Font size scaling toolbar (RD-3) */}
        <div className="flex items-center gap-1 shrink-0 bg-slate-200/60 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={handleDecreaseFont}
            disabled={fontSize <= 12}
            className="p-1.5 rounded text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 active:scale-95 transition-all"
            aria-label="Decrease text size"
            title="Decrease font size"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono px-1 font-medium text-slate-700 dark:text-zinc-300">
            {fontSize}
          </span>
          <button
            onClick={handleIncreaseFont}
            disabled={fontSize >= 24}
            className="p-1.5 rounded text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 active:scale-95 transition-all"
            aria-label="Increase text size"
            title="Increase font size"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Warning banner if modified/deleted or large file (MD-8, NF-7) */}
      {isLargeFile && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 border-b border-amber-200 dark:border-amber-900 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Large file (&gt;10MB): streaming safe preview enabled to prevent memory overflow.</span>
        </div>
      )}

      {warningMessage && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between border-b border-rose-200 dark:border-rose-900 shrink-0">
          <span>{warningMessage}</span>
          <button
            onClick={onBack}
            className="text-xs underline font-semibold ml-2"
          >
            Return to list
          </button>
        </div>
      )}

      {/* Rendered Markdown Body (RD-1, RD-3, RD-6 strictly read-only) */}
      <div
        ref={containerRef}
        onClick={handleContentClick}
        className="flex-1 overflow-y-auto p-4 sm:p-6 leading-relaxed text-slate-800 dark:text-zinc-200 prose prose-slate dark:prose-invert max-w-none"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          className="space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:tracking-tight [&>h1]:pb-2 [&>h1]:border-b [&>h1]:border-slate-200 dark:[&>h1]:border-zinc-800 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>p]:leading-relaxed [&>blockquote]:pl-4 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-500 [&>blockquote]:text-slate-600 dark:[&>blockquote]:text-zinc-400 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>hr]:my-6 [&>hr]:border-slate-200 dark:[&>hr]:border-zinc-800"
        />
      </div>
    </div>
  );
};
