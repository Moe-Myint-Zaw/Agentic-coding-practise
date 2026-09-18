import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useUserPosts } from '../hooks/usePosts';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Edit, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isOwnProfile = !id || id === currentUser?.id;
  const profileId = id || currentUser?.id;

  const { data: userResponse, isLoading, error } = useQuery({
    queryKey: ['user', profileId],
    queryFn: () => api.getUser(profileId!),
    enabled: !!profileId,
  });

  const user = userResponse;

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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};