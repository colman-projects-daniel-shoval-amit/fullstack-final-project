import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

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
    <img src={src} alt={alt} className="rounded-lg max-w-full my-4" />
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

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-custom text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
