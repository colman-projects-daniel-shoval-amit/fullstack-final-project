import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Edit2, Loader2, Sparkles, Trash2, X } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CommentItem } from '@/components/CommentItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { AuthorBadge } from '@/components/AuthorBadge';
import { postService } from '@/services/postService';
import { commentService } from '@/services/commentService';
import { likeService } from '@/services/likeService';
import { userService } from '@/services/userService';
import { getDateFromId, resolveImageUrl } from '@/lib/utils';
import type { Post, Comment } from '@/types';

const COMMENT_LIMIT = 10;

export function PostViewPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [authorEmail, setAuthorEmail] = useState('');
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  const [liked, setLiked] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, string>>({});

  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoadingPost(true);

    postService.getPostById(id).then(async p => {
      setPost(p);
      setAuthorEmail(typeof p.authorId === 'object' ? p.authorId.email : '');
      setIsLoadingPost(false);

      if (userId) {
        const likes = await likeService.getLikesForPost(id, userId);
        if (likes.length > 0) {
          setLiked(true);
          setLikeId(likes[0]._id);
        }
      }
    }).catch(() => {
      navigate('/not-found');
    });
  }, [id, userId, navigate]);

  useEffect(() => {
    if (!id) return;
    loadComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadComments(page: number) {
    if (!id) return;
    setIsLoadingComments(true);
    try {
      const newComments = await commentService.getComments(id, page, COMMENT_LIMIT);
      if (newComments.length < COMMENT_LIMIT) setHasMoreComments(false);

      setComments(prev => page === 1 ? newComments : [...prev, ...newComments]);
      setCommentPage(page + 1);

      const unknownIds = [...new Set(newComments.map(c => c.authorId))].filter(
        aid => !commentAuthors[aid]
      );
      if (unknownIds.length > 0) {
        const users = await Promise.all(unknownIds.map(uid => userService.getUserById(uid)));
        setCommentAuthors(prev => {
          const next = { ...prev };
          unknownIds.forEach((uid, i) => { next[uid] = users[i].email; });
          return next;
        });
      }
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function handleLikeToggle() {
    if (!id || isTogglingLike || !post) return;
    setIsTogglingLike(true);

    if (liked) {
      setLiked(false);
      setPost(p => p ? { ...p, likesCount: p.likesCount - 1 } : p);
      try {
        await likeService.unlikePost(likeId!);
        setLikeId(null);
      } catch {
        setLiked(true);
        setPost(p => p ? { ...p, likesCount: p.likesCount + 1 } : p);
      }
    } else {
      setLiked(true);
      setPost(p => p ? { ...p, likesCount: p.likesCount + 1 } : p);
      try {
        const newLike = await likeService.likePost(id);
        setLikeId(newLike._id);
      } catch {
        setLiked(false);
        setPost(p => p ? { ...p, likesCount: p.likesCount - 1 } : p);
      }
    }

    setIsTogglingLike(false);
  }

  async function handleAddComment() {
    if (!id || !newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const comment = await commentService.createComment(id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setPost(p => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
      setNewComment('');

      if (userId && !commentAuthors[comment.authorId]) {
        const user = await userService.getUserById(comment.authorId);
        setCommentAuthors(prev => ({ ...prev, [comment.authorId]: user.email }));
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeletePost() {
    if (!id) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(id);
      navigate('/');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    await commentService.deleteComment(commentId);
    setComments(prev => prev.filter(c => c._id !== commentId));
    setPost(p => p ? { ...p, commentsCount: p.commentsCount - 1 } : p);
  }

  if (isLoadingPost) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  if (!post) return null;

  const date = getDateFromId(post._id).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const postAuthorId = typeof post.authorId === 'object' ? post.authorId._id : post.authorId;
  const isAuthor = userId === postAuthorId;

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-10 items-start">
        <article className="flex-1 min-w-0">
          <div className="mb-6">
            <h1 className="text-4xl font-bold leading-tight mb-4 break-words">{post.title}</h1>
            <div className="flex items-center justify-between">
              <AuthorBadge email={authorEmail} date={date} authorId={postAuthorId} showFollow />
              {isAuthor && (
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/posts/${post._id}/edit`}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>

          {post.image && (
            <img
              src={resolveImageUrl(post.image)}
              alt={post.title}
              className="w-full rounded-xl mb-8 max-h-96 object-cover cursor-zoom-in"
              onClick={() => setLightboxSrc(resolveImageUrl(post.image!)!)}
            />
          )}

          <MarkdownRenderer content={post.text} />

          {post.topics && post.topics.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.topics.map(t => {
                const id = typeof t === 'string' ? t : t._id;
                const name = typeof t === 'string' ? t : t.name;
                return (
                  <span key={id} className="px-3 py-1 rounded-full text-sm bg-muted text-foreground">
                    {name}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleLikeToggle}
              disabled={isTogglingLike}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${liked ? 'fill-red-500 text-red-500' : ''}`}
              />
              <span className="text-sm font-medium">{post.likesCount}</span>
            </button>
          </div>

        </article>

        {post.summary && (
          <aside className="w-72 shrink-0 sticky top-24 self-start">
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Summary
              </p>
              <div className="text-sm text-foreground leading-relaxed [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:leading-6 [&_p]:mb-2 [&_p:last-child]:mb-0">
                <MarkdownRenderer content={post.summary} />
              </div>
            </div>
          </aside>
        )}
        </div>

        <Separator className="my-10" />

        <section>
          <h2 className="text-xl font-bold mb-6">
            Comments ({post.commentsCount})
          </h2>

          {comments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              authorEmail={commentAuthors[comment.authorId] ?? '…'}
              currentUserId={userId}
              onDelete={handleDeleteComment}
            />
          ))}

          {hasMoreComments && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => loadComments(commentPage)}
              disabled={isLoadingComments}
            >
              {isLoadingComments ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Load more comments
            </Button>
          )}

          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-semibold">Add a comment</h3>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write your thoughts…"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <Button
              onClick={handleAddComment}
              disabled={isSubmittingComment || !newComment.trim()}
              size="sm"
            >
              {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Post comment
            </Button>
          </div>
        </section>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>This action cannot be undone. The post will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePost} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
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
    </PageLayout>
  );
}
