import { Bell, CheckCheck, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';

const icons = { POST_LIKED: Heart, COMMENT_LIKED: Heart, COMMENT_CREATED: MessageCircle, FOLLOWED: UserPlus };

export const Notifications: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, markRead, markAllRead } = useNotifications();

  const describe = (notification: Notification) => {
    const actor = notification.actor.displayName || notification.actor.username;
    return t(`notifications.messages.${notification.type}`, { actor });
  };

  const openNotification = (notification: Notification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    if (notification.postId) navigate(`/post/${notification.postId}`);
  };

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('notifications.eyebrow')}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t('notifications.title')}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={!data?.unreadCount || markAllRead.isPending}>
          <CheckCheck className="mr-2 h-4 w-4" />{t('notifications.markAllRead')}
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">{data?.unreadCount ?? 0} {t('notifications.unread')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">{t('common.loading')}</p>}
          {isError && <div className="p-6"><p className="mb-3 text-sm text-destructive">{t('errors.loadFailed')}</p><Button variant="outline" onClick={() => refetch()}>{t('errors.tryAgain')}</Button></div>}
          {!isLoading && !isError && data?.items.length === 0 && <div className="flex flex-col items-center gap-3 p-12 text-center"><Bell className="h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{t('notifications.empty')}</p></div>}
          {data?.items.map((notification) => {
            const Icon = icons[notification.type];
            return <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-start gap-4 border-t p-5 text-left transition-colors hover:bg-muted/50 ${notification.readAt ? '' : 'bg-accent/40'}`}>
              <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm leading-6">{describe(notification)}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</span></span>
              {!notification.readAt && <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-label={t('notifications.unread')} />}
            </button>;
          })}
        </CardContent>
      </Card>
    </section>
  );
};