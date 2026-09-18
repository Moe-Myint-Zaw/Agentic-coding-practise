import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePosts, useCreatePost, useDeletePost } from '../hooks/usePosts';
import { useTogglePostLike } from '../hooks/useLikes';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Feed: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');

  const { data: postsData, isLoading, error } = usePosts({ page: 1, limit: 20 });
  const createPost = useCreatePost();
  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await createPost.mutateAsync({ content: newPostContent });
      setNewPostContent('');
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike.mutateAsync(postId);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost.mutateAsync(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{t('errors.loadFailed')}</div>;
  }

  const posts = postsData?.data?.items || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{t('nav.feed')}</h1>
        <Card>
          <CardContent className="pt-6">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={t('post.postContent')}
              className="w-full min-h-[100px] p-3 border border-input bg-background text-foreground placeholder:text-muted-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                {newPostContent.length}/500
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  {t('post.addImages')}
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || createPost.isPending}
                >
                  {createPost.isPending ? t('common.loading') : t('post.postButton')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t('post.noPosts')}</p>
            <Button onClick={() => setNewPostContent('')}>{t('post.createFirstPost')}</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${post.author.id}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {post.author.profileImage ? (
                          <img
                            src={post.author.profileImage}
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
                    <div>
                      <Link to={`/profile/${post.author.id}`}>
                        <p className="font-medium hover:underline">
                          {post.author.displayName || post.author.username}
                        </p>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.authorId === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={deletePost.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.images.map((image: string, index: number) => (
                      <img
                        key={index}
                        src={image}
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
                    onClick={() => handleLike(post.id)}
                    disabled={toggleLike.isPending}
                  >
                    <Heart className="h-4 w-4" />
                    {post._count?.likes || 0}
                  </Button>
                  <Link to={`/post/${post.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {post._count?.comments || 0}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};