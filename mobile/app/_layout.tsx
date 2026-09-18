import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/theme-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return <AuthProvider><AppThemeProvider><LocaleProvider><QueryClientProvider client={queryClient}><RootNavigator /></QueryClientProvider></LocaleProvider></AppThemeProvider></AuthProvider>;
}
function RootNavigator() {
  const { colorScheme } = useTheme();
  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}><StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} /><Stack><Stack.Screen name="(auth)" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="post/[id]" options={{ title: 'Post' }} /><Stack.Screen name="admin" options={{ title: 'Admin' }} /></Stack></ThemeProvider>;
}
