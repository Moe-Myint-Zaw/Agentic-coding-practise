import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePost } from '../hooks/usePosts';
import { usePostComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useTogglePostLike, useToggleCommentLike } from '../hooks/useLikes';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Comment } from '../types';
import { resolveMediaUrl } from '../lib/api';

export const PostDetail: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [newComment, setNewComment] = useState('');

  const { data: postResponse, isLoading: postLoading, error: postError } = usePost(id!);
  const { data: commentsResponse, isLoading: commentsLoading } = usePostComments(id!, { page: 1, limit: 20 });
  const createComment = useCreateComment();
  const togglePostLike = useTogglePostLike();
  const toggleCommentLike = useToggleCommentLike();
  const deleteComment = useDeleteComment();

  const post = postResponse?.data;
  const comments = (commentsResponse?.data?.items || []).filter(
    (comment: Comment) => comment.postId === id
  );

  const handleCreateComment = async () => {
    if (!newComment.trim() || !id) return;

    try {
      await createComment.mutateAsync({ postId: id, content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
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
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{post.content}</p>
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
                    onClick={handleCreateComment}
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
          <div className="space-y-4">
            {comments.map((comment: any) => (
              <Card key={comment.id}>
                <CardContent className="pt-4">
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
                    <div className="flex-1">
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
                          {comment.authorId === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deleteComment.isPending}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLikeComment(comment.id)}
                            disabled={toggleCommentLike.isPending}
                          >
                            <Heart className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {comment._count?.likes || 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};