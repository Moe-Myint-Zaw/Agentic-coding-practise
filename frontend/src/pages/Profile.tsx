import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useUserPosts } from '../hooks/usePosts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Heart, MessageCircle, Share2, Edit, Calendar, UserPlus, UserMinus } from 'lucide-react';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isOwnProfile = !id || id === currentUser?.id;
  const profileId = id || currentUser?.id;

  const { data: userResponse, isLoading, error } = useQuery({
    queryKey: ['user', profileId],
    queryFn: () => api.getUser(profileId!),
    enabled: !!profileId,
  });

  const user = userResponse;

  const followMutation = useMutation({
    mutationFn: () => user?.isFollowing ? api.unfollowUser(user.id) : api.followUser(user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', profileId] }),
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) => api.togglePostLike(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-posts', profileId] }),
  });

  const handleShare = async (post: any) => {
    const shareData = {
      title: user?.displayName || user?.username || t('nav.profile'),
      text: post.content,
      url: `${window.location.origin}/post/${post.id}`,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard?.writeText(`${shareData.text}\n${shareData.url}`);
  };

  const { data: postsData } = useUserPosts(profileId!, { page: 1, limit: 20 });

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading')}</div>;
  }

  if (error || !user) {
    return <div className="text-center py-8 text-destructive">{t('errors.loadFailed')}</div>;
  }

  const posts = postsData?.data?.items || [];
  const profileLetter = user.displayName?.[0] || user.username?.[0] || '?';

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {user.profileImage ? (
                  <img
                    src={resolveMediaUrl(user.profileImage)}
                    alt={user.displayName || user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium">
                    {profileLetter}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user.displayName || user.username}
                </h1>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.bio && (
                  <p className="mt-2 text-sm">{user.bio}</p>
                )}
              </div>
            </div>
            {!isOwnProfile && currentUser && (
              <Button
                variant={user.isFollowing ? 'outline' : 'default'}
                size="sm"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                {user.isFollowing ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                {user.isFollowing ? t('profile.unfollow') : t('profile.follow')}
              </Button>
            )}
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {t('profile.editProfile')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('profile.joined')} {new Date(user.createdAt || '').toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium text-foreground">{posts.length}</span> {t('profile.postsCount')}
            </div>
            <div>
              <span className="font-medium text-foreground">{user.followerCount ?? 0}</span> {t('profile.followers')}
            </div>
            <div>
              <span className="font-medium text-foreground">{user.followingCount ?? 0}</span> {t('profile.following')}
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mb-4">{t('post.posts')}</h2>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('post.noPosts')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-medium">
                        {post.author?.displayName?.[0] || post.author?.username?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {post.author?.displayName || post.author?.username || 'Unknown user'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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
                    onClick={() => likeMutation.mutate(post.id)}
                    disabled={likeMutation.isPending}
                    aria-label={t(post.likes?.some((like: any) => like.userId === currentUser?.id) ? 'post.unlikePost' : 'post.likePost')}
                  >
                    <Heart className="h-4 w-4" fill={post.likes?.some((like: any) => like.userId === currentUser?.id) ? 'currentColor' : 'none'} />
                    {post._count?.likes || 0}
                  </Button>
                  <Link to={`/post/${post.id}`}>
                    <Button variant="ghost" size="sm" className="gap-2" aria-label={t('post.commentPost')}>
                      <MessageCircle className="h-4 w-4" />
                      {post._count?.comments || 0}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    aria-label={t('post.sharePost')}
                    onClick={() => handleShare(post)}
                  >
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