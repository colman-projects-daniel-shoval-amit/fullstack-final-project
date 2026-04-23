import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import { Table as TableExtension } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Markdown } from 'tiptap-markdown';
import {
  Bold, Italic, Link as LinkIcon, ImagePlus, X, Loader2, Table, Code, Plus, Sparkles, Minus, Strikethrough, Quote,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { topicService } from '@/services/topicService';
import type { Topic } from '@/services/topicService';
import { aiService } from '@/services/aiService';
import { resolveImageUrl } from '@/lib/utils';
import isURL from 'validator/lib/isURL';

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
  const [isInsertingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [plusTop, setPlusTop] = useState<number | null>(null);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ top: number; left: number } | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableHover, setTableHover] = useState<{ rows: number; cols: number } | null>(null);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const inlineImageRef = useRef<HTMLInputElement>(null);
  const pendingInlineFiles = useRef<Map<string, File>>(new Map());

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      Typography,
      Image.configure({ inline: false }),
      TableExtension.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({ linkify: true }),
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
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  useEffect(() => {
    topicService.getTopics().then(setAllTopics);
  }, []);

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
      setSelectedTopicIds((post.topics ?? []).map(t => (typeof t === 'object' ? t._id : t)));
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

  async function handleAiAssist(instruction: 'improve' | 'continue' | 'outline') {
    const content = editor ? (editor.storage as any).markdown.getMarkdown() : text;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await aiService.assist(title, content, instruction);
      if (editor) {
        if (instruction === 'continue') {
          editor.chain().focus().insertContentAt(editor.state.doc.content.size, '\n\n' + result).run();
        } else {
          editor.chain().setContent(result, { emitUpdate: true }).focus().run();
        }
        setText((editor.storage as any).markdown.getMarkdown());
      } else {
        setText(instruction === 'continue' ? content + '\n\n' + result : result);
      }
    } catch {
      setAiError('AI request failed. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  }

  useEffect(() => {
    if (!topicsDialogOpen || allTopics.length === 0) return;
    const content = editor ? (editor.storage as any).markdown.getMarkdown() : text;
    if (!content.trim()) return;
    setIsSuggestingTopics(true);
    aiService.suggestTopics(title, content, allTopics)
      .then(ids => setSelectedTopicIds(ids))
      .catch(() => {})
      .finally(() => setIsSuggestingTopics(false));
  }, [topicsDialogOpen]);

  function handleSubmit() {
    const content = editor ? (editor.storage as any).markdown.getMarkdown() : text;
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Content is required.'); return; }
    setError(null);
    setTopicsDialogOpen(true);
  }

  async function handleConfirmPublish() {
    setTopicsDialogOpen(false);
    let content = editor ? (editor.storage as any).markdown.getMarkdown() : text;
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
      const payload = {
        title: title.trim(),
        text: content.trim(),
        ...(finalImage ? { image: finalImage } : {}),
        topics: selectedTopicIds,
      };
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

  const editorNavbar = (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
        <span>Markdown</span>
        <button
          type="button"
          role="switch"
          aria-checked={rawMode}
          onClick={() => setRawMode(v => {
            if (!v && editor) {
              setText((editor.storage as any).markdown.getMarkdown());
            }
            if (v && editor) {
              editor.commands.setContent(text);
            }
            return !v;
          })}
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
  );

  if (isLoadingPost) {
    return (
      <PageLayout navbarChildren={editorNavbar}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout navbarChildren={editorNavbar}>
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

        <textarea
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          rows={1}
          className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-8 focus:ring-0 resize-none overflow-hidden leading-tight"
        />

        <div className="flex items-center gap-2 mb-4">
          {(['improve', 'continue', 'outline'] as const).map(action => (
            <button
              key={action}
              type="button"
              onClick={() => handleAiAssist(action)}
              disabled={isAiLoading || !title.trim()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
            >
              {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </button>
          ))}
        </div>
        {aiError && <p className="text-xs text-destructive mb-3">{aiError}</p>}

        <div ref={wrapperRef} className="relative pl-10">
          {selectionToolbar && editor && (
            <div
              className="absolute flex items-center gap-0.5 bg-foreground text-background rounded-lg px-1.5 py-1 shadow-lg z-30"
              style={{ top: selectionToolbar.top, left: selectionToolbar.left }}
              onMouseDown={e => e.preventDefault()}
            >
              {linkPopoverOpen ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={e => {
                    e.preventDefault();
                    const raw = linkInput.trim();
                    if (raw) {
                      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
                      if (!isURL(href, { protocols: ['http', 'https'], require_protocol: true })) return;
                      editor.chain().focus().setLink({ href }).run();
                    }
                    setLinkPopoverOpen(false);
                    setLinkInput('');
                    setSelectionToolbar(null);
                  }}
                >
                  <input
                    autoFocus
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    placeholder="https://…"
                    className="bg-background text-foreground text-xs rounded px-2 py-0.5 outline-none w-44 border border-border"
                    onKeyDown={e => {
                      if (e.key === 'Escape') { setLinkPopoverOpen(false); setLinkInput(''); }
                    }}
                  />
                  <button type="submit" className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">Add</button>
                </form>
              ) : (
                <>
                  <SelectionButton icon={<span className="text-[11px] font-bold leading-none">H1</span>} label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<span className="text-[11px] font-bold leading-none">H2</span>} label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<span className="text-[11px] font-bold leading-none">H3</span>} label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setSelectionToolbar(null); }} />
                  <div className="w-px h-4 bg-white/20 mx-0.5" />
                  <SelectionButton icon={<Bold className="w-3.5 h-3.5" />} label="Bold" active={editor.isActive('bold')} onClick={() => { editor.chain().focus().toggleBold().run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<Italic className="w-3.5 h-3.5" />} label="Italic" active={editor.isActive('italic')} onClick={() => { editor.chain().focus().toggleItalic().run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<Code className="w-3.5 h-3.5" />} label="Code" active={editor.isActive('code')} onClick={() => { editor.chain().focus().toggleCode().run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<LinkIcon className="w-3.5 h-3.5" />} label="Link" active={editor.isActive('link')} onClick={() => { setLinkInput(''); setLinkPopoverOpen(true); }} />
                  <SelectionButton icon={<Strikethrough className="w-3.5 h-3.5" />} label="Strikethrough" active={editor.isActive('strike')} onClick={() => { editor.chain().focus().toggleStrike().run(); setSelectionToolbar(null); }} />
                  <SelectionButton icon={<Quote className="w-3.5 h-3.5" />} label="Blockquote" active={editor.isActive('blockquote')} onClick={() => { editor.chain().focus().toggleBlockquote().run(); setSelectionToolbar(null); }} />
                </>
              )}
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
                <div className="relative">
                  <PlusMenuItem
                    icon={<Table className="w-4 h-4" />}
                    label="Table"
                    onClick={() => setTablePickerOpen(v => !v)}
                  />
                  {tablePickerOpen && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg p-2 z-30"
                      onMouseLeave={() => setTableHover(null)}
                    >
                      <p className="text-xs text-muted-foreground mb-1.5 text-center">
                        {tableHover ? `${tableHover.rows} × ${tableHover.cols}` : 'Pick size'}
                      </p>
                      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                        {Array.from({ length: 36 }, (_, i) => {
                          const r = Math.floor(i / 6) + 1;
                          const c = (i % 6) + 1;
                          const highlighted = tableHover && r <= tableHover.rows && c <= tableHover.cols;
                          return (
                            <div
                              key={i}
                              className={`w-5 h-5 border rounded-sm cursor-pointer transition-colors ${highlighted ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                              onMouseEnter={() => setTableHover({ rows: r, cols: c })}
                              onClick={() => {
                                editor?.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                                setTablePickerOpen(false);
                                setTableHover(null);
                                setPlusMenuOpen(false);
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <PlusMenuItem
                  icon={<Code className="w-4 h-4" />}
                  label="Code block"
                  onClick={() => { setPlusMenuOpen(false); editor?.chain().focus().toggleCodeBlock().run(); }}
                />
                <PlusMenuItem
                  icon={<Minus className="w-4 h-4" />}
                  label="Divider"
                  onClick={() => { setPlusMenuOpen(false); editor?.chain().focus().setHorizontalRule().run(); }}
                />
              </div>
              )}
            </div>
          )}

          {rawMode ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write your post in markdown…"
              className="w-full min-h-[60vh] bg-transparent border-none outline-none text-base leading-7 resize-none focus:ring-0 placeholder:text-muted-foreground/40"
              style={{ overflow: 'auto' }}
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

      <Dialog open={topicsDialogOpen} onOpenChange={setTopicsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose topics</DialogTitle>
            <DialogDescription>Select the topics that best describe your post.</DialogDescription>
          </DialogHeader>
          {isSuggestingTopics && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI is suggesting topics…
            </span>
          )}
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto py-1">
            {(() => {
              const selectedTopics = allTopics.filter(t => selectedTopicIds.includes(t._id));
              const unselectedTopics = allTopics.filter(t => !selectedTopicIds.includes(t._id));
              const renderPill = (topic: Topic, active: boolean) => (
                <button
                  key={topic._id}
                  type="button"
                  onClick={() => setSelectedTopicIds(prev =>
                    active ? prev.filter(id => id !== topic._id) : [...prev, topic._id]
                  )}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    active ? 'bg-foreground text-background' : 'bg-muted text-foreground hover:bg-muted/70'
                  }`}
                >
                  {topic.name}
                </button>
              );
              return (
                <>
                  {selectedTopics.map(t => renderPill(t, true))}
                  {selectedTopics.length > 0 && unselectedTopics.length > 0 && (
                    <div className="w-full h-px bg-border my-1" />
                  )}
                  {unselectedTopics.map(t => renderPill(t, false))}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmPublish} disabled={busy}>
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {isEditMode ? 'Save' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
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
