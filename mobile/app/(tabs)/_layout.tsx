import { Tabs, Redirect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context'; import { useTheme } from '@/contexts/theme-context';

export default function TabLayout() {
  const { user, loading } = useAuth(); const { t } = useLocale(); const { colors } = useTheme();
  if (loading) return null; if (!user) return <Redirect href="/login" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.tabIconSelected, tabBarInactiveTintColor: colors.tabIconDefault, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border } }}><Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="search" options={{ title: t('search'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} tintColor={color} size={size} /> }} /><Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} tintColor={color} size={size} /> }} /></Tabs>;
}
