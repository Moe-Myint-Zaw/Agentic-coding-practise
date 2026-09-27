import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { ScreenFrame } from '@/components/screen-frame';
import { useAuth } from '@/contexts/auth-context';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <ScreenFrame><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View></ScreenFrame>;
  if (user) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}