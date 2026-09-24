import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePosts, useCreatePost, useDeletePost, useUpdatePost } from '../hooks/usePosts';
import { useTogglePostLike } from '../hooks/useLikes';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Pencil, ImagePlus, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';

export const Feed: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: postsData, isLoading, error } = usePosts(
    { page: 1, limit: 20 },
    !authLoading && isAuthenticated,
  );
  const createPost = useCreatePost();
  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();

  useEffect(() => {
    const previews = selectedImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview));
  }, [selectedImages]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return;

    try {
      setUploadError('');
      const uploadedImages = await Promise.all(selectedImages.map((file) => api.uploadImage(file)));
      await createPost.mutateAsync({
        content: newPostContent,
        images: uploadedImages.map(({ url }) => url),
      });
      setNewPostContent('');
      setSelectedImages([]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('errors.uploadFailed'));
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    if (selectedImages.length + files.length > 5) {
      setUploadError(t('post.maxImages'));
      return;
    }
    const invalidFile = files.find((file) => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalidFile) {
      setUploadError(invalidFile.size > 5 * 1024 * 1024 ? t('post.maxImageSize') : t('errors.uploadFailed'));
      return;
    }
    setUploadError('');
    setSelectedImages((current) => [...current, ...files]);
    event.target.value = '';
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

  const handleUpdatePost = async (postId: string) => {
    if (!editingContent.trim()) return;
    try {
      await updatePost.mutateAsync({ id: postId, data: { content: editingContent } });
      setEditingPostId(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : t('errors.somethingWentWrong'));
    }
  };

  if (authLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

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
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {selectedImages.map((file, index) => (
                  <div className="relative aspect-square" key={`${file.name}-${file.lastModified}`}>
                    <img src={imagePreviews[index]} alt={file.name} className="w-full h-full rounded-md object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
                      onClick={() => setSelectedImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                {newPostContent.length}/500
              </span>
              <div className="flex gap-2">
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleImageSelection} />
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={selectedImages.length >= 5 || createPost.isPending}>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  {t('post.addImages')}
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={(!newPostContent.trim() && selectedImages.length === 0) || createPost.isPending}
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
                        aria-label={t('post.editPost')}
                        onClick={() => { setEditingPostId(post.id); setEditingContent(post.content); }}
                        disabled={updatePost.isPending}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
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
                {editingPostId === post.id ? (
                  <div className="mb-4 flex gap-2">
                    <textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} maxLength={500} className="min-h-[90px] flex-1 rounded-md border border-input bg-background p-3" />
                    <div className="flex flex-col gap-2">
                      <Button size="icon" aria-label={t('common.save')} onClick={() => handleUpdatePost(post.id)} disabled={!editingContent.trim() || updatePost.isPending}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={t('common.cancel')} onClick={() => setEditingPostId(null)}><X className="h-4 w-4" /></Button>
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