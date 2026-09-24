import { Tabs, Redirect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context'; import { useTheme } from '@/contexts/theme-context';
import { authStorage } from '@/lib/auth-storage';
import { api, API_ORIGIN } from '@/lib/api-client';

export default function TabLayout() {
  const { user, loading } = useAuth(); const { t } = useLocale(); const { colors } = useTheme();
  const client = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => api.notifications(1), enabled: Boolean(user) });

  useEffect(() => {
    if (!user) return undefined;

    let socket: WebSocket | null = null;
    let active = true;
    authStorage.getAccessToken().then((token) => {
      if (!active || !token) return;
      const origin = new URL(API_ORIGIN);
      const protocol = origin.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${origin.host}/ws?token=${encodeURIComponent(token)}`);
      socket.onmessage = (event) => {
        try {
          if (JSON.parse(event.data).type === 'notification.created') {
            client.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch {
          // Ignore malformed socket messages.
        }
      };
    });

    return () => { active = false; socket?.close(); };
  }, [client, user?.id]);

  if (loading) return null; if (!user) return <Redirect href="/login" />;
  const unreadCount = notifications.data?.unreadCount ?? 0;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.tabIconSelected, tabBarInactiveTintColor: colors.tabIconDefault, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}><Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="search" options={{ title: t('search'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="notifications" options={{ title: t('notifications'), tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined, tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} tintColor={color} size={size} /> }} /></Tabs>;
}
