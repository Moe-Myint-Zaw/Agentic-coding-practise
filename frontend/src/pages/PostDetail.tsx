import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePost, useUpdatePost } from '../hooks/usePosts';
import { usePostComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useTogglePostLike, useToggleCommentLike } from '../hooks/useLikes';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Send, Pencil, Check, X, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Comment } from '../types';
import { resolveMediaUrl } from '../lib/api';

export const PostDetail: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  const { data: postResponse, isLoading: postLoading, error: postError } = usePost(id!);
  const { data: commentsResponse, isLoading: commentsLoading } = usePostComments(id!, { page: 1, limit: 20 });
  const createComment = useCreateComment();
  const togglePostLike = useTogglePostLike();
  const toggleCommentLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();
  const updatePost = useUpdatePost();

  const post = (postResponse as any)?.data;
  const comments = ((commentsResponse as any)?.data?.items || []).filter(
    (comment: Comment) => comment.postId === id
  );

  const handleCreateComment = async (parentId?: string, content = newComment) => {
    if (!content.trim() || !id) return;

    try {
      await createComment.mutateAsync({ postId: id, content, parentId });
      if (!parentId) setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  };

  const handleLikePost = async () => {
    if (!id) return;
    try {
      await togglePostLike.mutateAsync(id);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await toggleCommentLike.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment.mutateAsync(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (postLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (postError || !post) {
    return <div className="text-center py-8 text-destructive">{t('errors.loadFailed')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author ? (
                <Link to={`/profile/${post.author.id}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {post.author.profileImage ? (
                      <img
                        src={resolveMediaUrl(post.author.profileImage)}
                        alt={post.author.displayName || post.author.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-medium">
                        {post.author.displayName?.[0] || post.author.username[0]}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-medium">?</span>
                </div>
              )}
              <div>
                {post.author ? (
                  <Link to={`/profile/${post.author.id}`}>
                    <p className="font-medium hover:underline">
                      {post.author.displayName || post.author.username}
                    </p>
                  </Link>
                ) : (
                  <p className="font-medium hover:underline">Unknown user</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {post.authorId === user?.id ? (
              <Button variant="ghost" size="icon" aria-label={t('post.editPost')} onClick={() => { setEditing(true); setEditingContent(post.content); }}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="mb-4 flex gap-2">
              <textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} maxLength={500} className="min-h-[100px] flex-1 rounded-md border border-input bg-background p-3" />
              <div className="flex flex-col gap-2">
                <Button size="icon" aria-label={t('common.save')} disabled={!editingContent.trim() || updatePost.isPending} onClick={async () => { await updatePost.mutateAsync({ id: post.id, data: { content: editingContent } }); setEditing(false); }}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={t('common.cancel')} onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : <p className="mb-4">{post.content}</p>}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {post.images.map((image: string, index: number) => (
                <img
                  key={index}
                  src={resolveMediaUrl(image)}
                  alt={`Post image ${index + 1}`}
                  className="rounded-md w-full h-48 object-cover"
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleLikePost}
              disabled={togglePostLike.isPending}
            >
              <Heart className="h-4 w-4" />
              {post._count?.likes || 0}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {post._count?.comments || 0}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{t('comment.comments')}</h2>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-medium">
                  {user?.displayName?.[0] || user?.username[0]}
                </span>
              </div>
              <div className="flex-1">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('comment.addComment')}
                  maxLength={300}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">
                    {newComment.length}/300
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleCreateComment()}
                    disabled={!newComment.trim() || createComment.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {createComment.isPending ? t('common.loading') : t('comment.commentButton')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {commentsLoading ? (
          <div className="text-center py-4">{t('common.loading')}</div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{t('comment.noComments')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {comments.map((comment: Comment) => (
              <CommentThreadItem
                key={comment.id}
                comment={comment}
                postId={id!}
                depth={0}
                onReply={handleCreateComment}
                onLike={handleLikeComment}
                onDelete={handleDeleteComment}
                isLiking={toggleCommentLike.isPending}
                isDeleting={deleteComment.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommentThreadItemProps {
  comment: Comment;
  postId: string;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isLiking: boolean;
  isDeleting: boolean;
}

const CommentThreadItem: React.FC<CommentThreadItemProps> = ({ comment, postId, depth, onReply, onLike, onDelete, isLiking, isDeleting }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [repliesPage, setRepliesPage] = useState(1);
  const { data: replyResponse, isLoading: repliesLoading } = usePostComments(postId, {
    page: repliesPage,
    limit: 20,
    parentId: comment.id,
    enabled: repliesOpen,
  });
  const replies = ((replyResponse as any)?.data?.items || []) as Comment[];
  const replyPagination = (replyResponse as any)?.data?.pagination;
  const liked = comment.likes?.some((like) => like.userId === user?.id) ?? false;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setReplying(false);
      setRepliesOpen(true);
    } catch {
      // Keep the reply draft available for retry.
    }
  };

  return (
    <article className="border-l-2 border-border/70 pl-3 py-2" style={{ marginLeft: Math.min(depth, 4) * 12 }}>
      <div className="flex items-start gap-3">
                    {comment.author ? (
                      <Link to={`/profile/${comment.author.id}`}>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {comment.author.profileImage ? (
                            <img
                              src={resolveMediaUrl(comment.author.profileImage)}
                              alt={comment.author.displayName || comment.author.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {comment.author.displayName?.[0] || comment.author.username[0]}
                            </span>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">?</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        {comment.author ? (
                          <Link to={`/profile/${comment.author.id}`}>
                            <p className="font-medium text-sm hover:underline">
                              {comment.author.displayName || comment.author.username}
                            </p>
                          </Link>
                        ) : (
                          <p className="font-medium text-sm hover:underline">Unknown user</p>
                        )}
                        <div className="flex items-center gap-2">
                          {comment.authorId === user?.id && !comment.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(comment.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onLike(comment.id)}
                            disabled={isLiking || comment.isDeleted}
                          >
                            <Heart className={`h-3 w-3 ${liked ? 'fill-current text-red-500' : ''}`} />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {comment._count?.likes || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{comment.isDeleted ? t('comment.deletedComment') : comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!comment.isDeleted && (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setReplying((open) => !open)}>
                          <Reply className="mr-1 inline h-3 w-3" />{t('comment.reply')}
                        </button>
                        {comment._count?.replies ? (
                          <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setRepliesOpen((open) => !open)}>
                            {repliesOpen ? <ChevronUp className="mr-1 inline h-3 w-3" /> : <ChevronDown className="mr-1 inline h-3 w-3" />}
                            {repliesOpen ? t('comment.hideReplies') : t('comment.viewReplies')} ({comment._count.replies})
                          </button>
                        ) : null}
                      </div>
                    )}
                    {replying && (
                      <div className="mt-3 flex gap-2">
                        <Input value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={300} placeholder={t('comment.replyPlaceholder')} aria-label={t('comment.replyPlaceholder')} />
                        <Button size="icon" aria-label={t('comment.reply')} disabled={!replyText.trim()} onClick={submitReply}><Send className="h-4 w-4" /></Button>
                      </div>
                    )}
                    {repliesOpen && (
                      <div className="mt-3">
                        {repliesLoading ? <p className="py-2 text-xs text-muted-foreground">{t('common.loading')}</p> : replies.map((reply) => (
                          <CommentThreadItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} onReply={onReply} onLike={onLike} onDelete={onDelete} isLiking={isLiking} isDeleting={isDeleting} />
                        ))}
                        {replyPagination && replyPagination.totalPages > 1 && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <button type="button" disabled={repliesPage <= 1} onClick={() => setRepliesPage((page) => page - 1)}>{t('search.previous')}</button>
                            <span>{replyPagination.page}/{replyPagination.totalPages}</span>
                            <button type="button" disabled={repliesPage >= replyPagination.totalPages} onClick={() => setRepliesPage((page) => page + 1)}>{t('search.next')}</button>
                          </div>
                        )}
                      </div>
                    )}
      </div>
    </article>
  );
};