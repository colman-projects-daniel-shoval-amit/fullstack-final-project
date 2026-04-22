import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { X } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  useEffect(() => {
    if (!lightboxSrc) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') closeLightbox(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxSrc, closeLightbox]);

  const components: Components = {
    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 break-words">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold mt-7 mb-3 break-words">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-2 break-words">{children}</h3>,
    p: ({ children }) => <p className="mb-4 leading-7 break-words">{children}</p>,
    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-4">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => (
      <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.startsWith('language-');
      if (isBlock) {
        return (
          <pre className="bg-muted rounded-lg p-4 overflow-x-auto mb-4">
            <code className="text-sm font-mono">{children}</code>
          </pre>
        );
      }
      return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
    },
    hr: () => <hr className="my-8 border-border" />,
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        className="rounded-lg max-w-full my-4 cursor-zoom-in"
        onClick={() => src && setLightboxSrc(src)}
      />
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-3 py-2">{children}</td>
    ),
  };

  return (
    <>
      <div className="prose-custom text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
