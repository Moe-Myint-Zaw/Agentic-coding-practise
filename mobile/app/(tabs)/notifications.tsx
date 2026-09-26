import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { api } from '@/lib/api-client';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const client = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications(1), enabled: Boolean(user) });
  const markRead = useMutation({ mutationFn: api.markNotificationRead, onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
  const markAllRead = useMutation({ mutationFn: api.markAllNotificationsRead, onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });

  const renderItem = ({ item }: { item: Notification }) => {
    const actor = item.actor.displayName || item.actor.username;
    const messageKey = item.type === 'POST_LIKED'
      ? 'notificationPostLiked'
      : item.type === 'COMMENT_LIKED'
        ? 'notificationCommentLiked'
        : item.type === 'COMMENT_CREATED'
          ? 'notificationCommentCreated'
          : 'notificationFollowed';
    const message = t(messageKey).replace('{{actor}}', actor);
    return <Pressable accessibilityRole="button" onPress={() => { if (!item.readAt) markRead.mutate(item.id); if (item.postId) router.push(`/post/${item.postId}`); }} style={[styles.item, !item.readAt && styles.unread]}>
      <View style={styles.icon}><SymbolView name={{ ios: item.type === 'FOLLOWED' ? 'person.badge.plus' : item.type === 'COMMENT_CREATED' ? 'bubble.left.fill' : 'heart.fill', android: item.type === 'FOLLOWED' ? 'person_add' : item.type === 'COMMENT_CREATED' ? 'chat_bubble' : 'favorite', web: item.type === 'FOLLOWED' ? 'person_add' : item.type === 'COMMENT_CREATED' ? 'chat_bubble' : 'favorite' }} size={18} tintColor={colors.tint} /></View>
      <View style={styles.copy}><Text style={styles.message}>{message}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text></View>
      {!item.readAt && <View style={styles.dot} />}
    </Pressable>;
  };

  return <View style={styles.page}><View style={styles.headingRow}><View><Text style={styles.eyebrow}>{t('notificationEyebrow')}</Text><Text style={styles.heading}>{t('notifications')}</Text></View><Pressable accessibilityRole="button" onPress={() => markAllRead.mutate()} disabled={!notifications.data?.unreadCount || markAllRead.isPending} style={styles.readAll}><Text style={styles.readAllText}>{t('markAllRead')}</Text></Pressable></View><FlatList data={notifications.data?.items ?? []} keyExtractor={(item) => item.id} renderItem={renderItem} refreshControl={<RefreshControl refreshing={notifications.isRefetching} onRefresh={() => notifications.refetch()} tintColor={colors.tint} />} ListEmptyComponent={<View style={styles.empty}><SymbolView name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} size={30} tintColor={colors.mutedText} /><Text style={styles.emptyText}>{notifications.isLoading ? t('loading') : t('notificationsEmpty')}</Text></View>} /></View>;
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({ page: { backgroundColor: colors.background, flex: 1, paddingHorizontal: 16, paddingTop: 22 }, headingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }, eyebrow: { color: colors.mutedText, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }, heading: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 }, readAll: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 }, readAllText: { color: colors.tint, fontSize: 12, fontWeight: '700' }, item: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 11, marginBottom: 9, padding: 13 }, unread: { backgroundColor: colors.accentSoft, borderColor: colors.tint }, icon: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 20, height: 36, justifyContent: 'center', width: 36 }, copy: { flex: 1 }, message: { color: colors.text, fontSize: 14, lineHeight: 21 }, date: { color: colors.mutedText, fontSize: 11, marginTop: 5 }, dot: { backgroundColor: colors.tint, borderRadius: 5, height: 8, marginTop: 5, width: 8 }, empty: { alignItems: 'center', gap: 10, paddingTop: 90 }, emptyText: { color: colors.mutedText, fontSize: 14 } });