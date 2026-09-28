import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Users, MessageSquare, FileText, Activity } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import type { User } from '../types';

export const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/feed" replace />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => api.getAdminStats(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.getAdminUsers({ page: 1, limit: 10 }),
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('admin.dashboard')}</h1>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats as any)?.data?.totalUsers || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalPosts')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats as any)?.data?.totalPosts || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalComments')}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats as any)?.data?.totalComments || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.activeUsers')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : (stats as any)?.data?.activeUsers || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('admin.userManagement')}</CardTitle>
          <CardDescription>
            {t('admin.viewAllUsers')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(usersData as any)?.data?.items?.map((user: User) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-medium">
                      {user.displayName?.[0] || user.username[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.isBanned ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {user.isBanned ? 'Banned' : 'Active'}
                  </span>
                  <Button variant="outline" size="sm">
                    {user.isBanned ? t('admin.unbanUser') : t('admin.banUser')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.contentModeration')}</CardTitle>
          <CardDescription>
            Manage posts and comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              {t('admin.viewAllPosts')}
            </Button>
            <Button variant="outline">
              {t('admin.viewAllComments')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};