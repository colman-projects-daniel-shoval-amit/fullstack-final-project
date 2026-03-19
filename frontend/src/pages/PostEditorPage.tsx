import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import {
  Bold, Italic, Link as LinkIcon, ImagePlus, X, Loader2, Table, Code, Plus,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { resolveImageUrl } from '@/lib/utils';

export function PostEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [rawMode, setRawMode] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const [isLoadingPost, setIsLoadingPost] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plusTop, setPlusTop] = useState<number | null>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ top: number; left: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const pendingInlineFiles = useRef<Map<string, File>>(new Map());

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      Typography,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false }),
      Markdown,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-neutral dark:prose-invert max-w-none min-h-[60vh] outline-none focus:outline-none',
      },
    },
    onBlur() { setPlusTop(null); setPlusMenuOpen(false); },
    onUpdate({ editor: e }) {
      setText((e.storage as any).markdown.getMarkdown());
    },
    onSelectionUpdate({ editor: e }) {
      const { state, view } = e;
      const { from, to } = state.selection;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const wRect = wrapper.getBoundingClientRect();

      if (from !== to) {
        setSelectionToolbar(null);
        setPlusTop(null);
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionToolbar({
            top: rect.top - wRect.top - 46,
            left: Math.max(0, Math.min(rect.left - wRect.left + rect.width / 2 - 96, wRect.width - 200)),
          });
        }
        return;
      }

      setSelectionToolbar(null);

      const $pos = state.doc.resolve(from);
      const node = $pos.parent;
      const isEmpty = node.content.size === 0;
      if (!isEmpty) { setPlusTop(null); return; }

      const domNode = view.nodeDOM(from - 1) ?? view.domAtPos(from).node;
      const el = domNode instanceof HTMLElement ? domNode : (domNode as Node)?.parentElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        setPlusTop(rect.top - wRect.top + rect.height / 2);
      }
    },
  });

  useEffect(() => {
    if (!isEditMode || !id) return;
    setIsLoadingPost(true);
    postService.getPostById(id).then(post => {
      const postAuthorId = typeof post.authorId === 'object' ? post.authorId._id : post.authorId;
      if (postAuthorId !== userId) { navigate('/'); return; }
      setTitle(post.title);
      setText(post.text);
      if (editor) editor.commands.setContent(post.text);
      setCoverImage(post.image ?? '');
      setIsLoadingPost(false);
    }).catch(() => navigate('/'));
  }, [id, isEditMode, userId, navigate, editor]);

  useEffect(() => {
    return () => { if (coverImagePreview) URL.revokeObjectURL(coverImagePreview); };
  }, [coverImagePreview]);

  useEffect(() => {
    const pending = pendingInlineFiles.current;
    return () => { pending.forEach((_, blobUrl) => URL.revokeObjectURL(blobUrl)); };
  }, []);

  function insertBlock(snippet: string) {
    setPlusMenuOpen(false);
    editor?.commands.insertContent(snippet);
    editor?.commands.focus();
  }

  function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inlineImageRef.current) inlineImageRef.current.value = '';
    setPlusMenuOpen(false);
    const blobUrl = URL.createObjectURL(file);
    pendingInlineFiles.current.set(blobUrl, file);
    editor?.chain().focus().setImage({ src: blobUrl }).run();
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setCoverImage('');
  }

  function removeCoverImage() {
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setCoverImage('');
    if (coverFileRef.current) coverFileRef.current.value = '';
  }

  async function handleSubmit() {
    let content = editor ? (editor.storage as any).markdown.getMarkdown() : text;
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Content is required.'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      if (pendingInlineFiles.current.size > 0) {
        const uploads = await Promise.all(
          Array.from(pendingInlineFiles.current.entries()).map(async ([blobUrl, file]) => {
            const serverUrl = resolveImageUrl(await postService.uploadImage(file))!;
            return [blobUrl, serverUrl] as [string, string];
          })
        );
        for (const [blobUrl, serverUrl] of uploads) {
          content = content.replaceAll(blobUrl, serverUrl);
          if (editor) {
            editor.view.state.doc.descendants((node, pos) => {
              if (node.type.name === 'image' && node.attrs.src === blobUrl) {
                editor.view.dispatch(
                  editor.view.state.tr.setNodeAttribute(pos, 'src', serverUrl)
                );
              }
            });
          }
          URL.revokeObjectURL(blobUrl);
        }
        pendingInlineFiles.current.clear();
      }

      let finalImage = coverImage;
      if (coverImageFile) {
        setIsUploadingCover(true);
        finalImage = await postService.uploadImage(coverImageFile);
        setIsUploadingCover(false);
      }
      const payload = { title: title.trim(), text: content.trim(), ...(finalImage ? { image: finalImage } : {}) };
      if (isEditMode && id) {
        await postService.updatePost(id, payload);
        navigate(`/posts/${id}`);
      } else {
        const newPost = await postService.createPost(payload);
        navigate(`/posts/${newPost._id}`);
      }
    } catch {
      setIsUploadingCover(false);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayCover = coverImagePreview ?? resolveImageUrl(coverImage) ?? null;
  const busy = isSubmitting || isUploadingCover || isInsertingImage;

  if (isLoadingPost) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <span>Markdown</span>
            <button
              type="button"
              role="switch"
              aria-checked={rawMode}
              onClick={() => setRawMode(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rawMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${rawMode ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            {isUploadingCover ? 'Uploading…' : isEditMode ? 'Save' : 'Publish'}
          </Button>
        </div>
      </Navbar>

      <main className="max-w-3xl mx-auto px-4 pt-12 pb-32">
        {displayCover ? (
          <div className="relative group mb-8">
            <img src={displayCover} alt="Cover" className="w-full max-h-64 object-cover rounded-xl" />
            <button
              type="button"
              onClick={removeCoverImage}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverFileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8 hover:text-foreground transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Add cover image
          </button>
        )}
        <input ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleCoverFileChange} />

        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-8 focus:ring-0"
        />

        <div ref={wrapperRef} className="relative pl-10">
          {selectionToolbar && editor && (
            <div
              className="absolute flex items-center gap-0.5 bg-foreground text-background rounded-lg px-1.5 py-1 shadow-lg z-30"
              style={{ top: selectionToolbar.top, left: selectionToolbar.left }}
              onMouseDown={e => e.preventDefault()}
            >
              <SelectionButton icon={<Bold className="w-3.5 h-3.5" />} label="Bold" active={editor.isActive('bold')} onClick={() => { editor.chain().focus().toggleBold().run(); setSelectionToolbar(null); }} />
              <SelectionButton icon={<Italic className="w-3.5 h-3.5" />} label="Italic" active={editor.isActive('italic')} onClick={() => { editor.chain().focus().toggleItalic().run(); setSelectionToolbar(null); }} />
              <SelectionButton icon={<Code className="w-3.5 h-3.5" />} label="Code" active={editor.isActive('code')} onClick={() => { editor.chain().focus().toggleCode().run(); setSelectionToolbar(null); }} />
              <SelectionButton icon={<LinkIcon className="w-3.5 h-3.5" />} label="Link" active={false} onClick={() => { const url = window.prompt('URL'); if (url) editor.chain().focus().setLink({ href: url }).run(); setSelectionToolbar(null); }} />
            </div>
          )}

          {plusTop !== null && (
            <div className="absolute left-0 flex items-center" style={{ top: plusTop - 12 }} onMouseDown={e => e.preventDefault()}>
              <button
                type="button"
                onClick={() => setPlusMenuOpen(v => !v)}
                className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
              {plusMenuOpen && (
              <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-md px-1.5 py-1 z-20">
                <PlusMenuItem
                  icon={isInsertingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  label="Image"
                  onClick={() => inlineImageRef.current?.click()}
                  disabled={isInsertingImage}
                />
                <PlusMenuItem
                  icon={<Table className="w-4 h-4" />}
                  label="Table"
                  onClick={() => insertBlock('| Column 1 | Column 2 |\n|----------|----------|\n| Cell | Cell |\n')}
                />
                <PlusMenuItem
                  icon={<Code className="w-4 h-4" />}
                  label="Code block"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                />
              </div>
              )}
            </div>
          )}

          {rawMode ? (
            <textarea
              value={text}
              onChange={e => {
                setText(e.target.value);
                editor?.commands.setContent(e.target.value);
              }}
              placeholder="Write your post in markdown…"
              className="w-full min-h-[60vh] bg-transparent border-none outline-none text-base leading-7 resize-none focus:ring-0 placeholder:text-muted-foreground/40"
              style={{ overflow: 'hidden' }}
            />
          ) : (
            <EditorContent editor={editor} />
          )}
        </div>

        <input ref={inlineImageRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleInlineImage} />

        {error && <p className="text-sm text-destructive mt-4">{error}</p>}

        <div className="flex gap-3 mt-10">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </main>
    </div>
  );
}

function PlusMenuItem({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function SelectionButton({ icon, label, onClick, active }: { icon: React.ReactNode; label: string; onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`p-1 rounded transition-colors ${active ? 'bg-white/20' : 'hover:bg-white/20'}`}
    >
      {icon}
    </button>
  );
}
