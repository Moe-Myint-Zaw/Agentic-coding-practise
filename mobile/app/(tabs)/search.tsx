import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RemoteImage } from '@/components/remote-image';
import { useLocale } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { api, resolveMediaUrl } from '@/lib/api-client';
import type { User } from '@/types';

export default function SearchScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const results = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => api.searchUsers(query),
    enabled: query.length >= 2,
  });

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/profile', params: { id: item.id } })}
      style={styles.result}
    >
      {item.profileImage ? (
        <RemoteImage uri={resolveMediaUrl(item.profileImage)} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(item.displayName || item.username).slice(0, 1).toUpperCase()}</Text></View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.displayName || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('searchUsers')}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setInput}
        placeholder={t('searchUsersHint')}
        placeholderTextColor={colors.mutedText}
        style={styles.input}
        value={input}
      />
      {results.isFetching ? <ActivityIndicator color={colors.tint} style={styles.loader} /> : null}
      {query.length >= 2 && !results.isFetching && results.data?.items.length === 0 ? <Text style={styles.empty}>{t('searchUsersEmpty')}</Text> : null}
      <FlatList data={results.data?.items ?? []} keyExtractor={(item) => item.id} renderItem={renderUser} keyboardShouldPersistTaps="handled" />
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { backgroundColor: colors.background, flex: 1, padding: 20 },
    heading: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 },
    input: { backgroundColor: colors.input, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
    loader: { margin: 20 },
    empty: { color: colors.mutedText, paddingVertical: 24, textAlign: 'center' },
    result: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 14 },
    avatar: { borderRadius: 24, height: 48, width: 48 },
    avatarFallback: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
    avatarText: { color: colors.tint, fontSize: 18, fontWeight: '800' },
    userInfo: { marginLeft: 12 },
    name: { color: colors.text, fontSize: 16, fontWeight: '700' },
    username: { color: colors.mutedText, marginTop: 3 },
  });
}