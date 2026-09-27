import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RemoteImage } from '@/components/remote-image';
import { ScreenFrame } from '@/components/screen-frame';
import { useLocale } from '@/contexts/locale-context';
import { useTheme } from '@/contexts/theme-context';
import { api, resolveMediaUrl } from '@/lib/api-client';

export default function SearchScreen() {
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const results = useQuery({
    queryKey: ['search', query, peoplePage, postsPage, commentsPage],
    queryFn: () => api.search(query, peoplePage, postsPage, commentsPage),
    enabled: query.length >= 2,
  });

  const users = results.data?.users.items ?? [];
  const posts = results.data?.posts.items ?? [];
  const comments = results.data?.comments.items ?? [];

  return (
    <ScreenFrame edges={['top', 'left', 'right']} keyboardAware>
    <View style={styles.container}>
      <Text style={styles.heading}>{t('search')}</Text>
      <TextInput
        accessibilityLabel={t('searchUsersHint')}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={(value) => { setInput(value); setPeoplePage(1); setPostsPage(1); setCommentsPage(1); }}
        placeholder={t('searchUsersHint')}
        placeholderTextColor={colors.mutedText}
        style={styles.input}
        value={input}
      />
      {results.isFetching ? <ActivityIndicator color={colors.tint} style={styles.loader} /> : null}
      {results.isError ? <Pressable accessibilityRole="button" onPress={() => results.refetch()}><Text style={styles.empty}>{t('networkError')} · {t('retry')}</Text></Pressable> : null}
      {query.length >= 2 && !results.isFetching && users.length === 0 && posts.length === 0 && comments.length === 0 && !results.isError ? <Text style={styles.empty}>{t('searchEmpty')}</Text> : null}
      {query.length >= 2 && !results.isError ? <ScrollView contentInsetAdjustmentBehavior="never" keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results}>
        <Text style={styles.sectionHeading}>{t('searchPeople')}</Text>
        {users.length === 0 ? <Text style={styles.emptySection}>{t('searchNoPeople')}</Text> : users.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })} style={styles.result}>
            {item.profileImage ? <RemoteImage uri={resolveMediaUrl(item.profileImage)} style={styles.avatar} /> : (
              <View style={styles.avatarFallback}><Text style={styles.avatarText}>{(item.displayName || item.username).slice(0, 1).toUpperCase()}</Text></View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.displayName || item.username}</Text>
              <Text style={styles.username}>@{item.username}</Text>
              {item.bio ? <Text numberOfLines={2} style={styles.bio}>{item.bio}</Text> : null}
            </View>
          </Pressable>
        ))}
        <Text style={styles.sectionHeading}>{t('searchPosts')}</Text>
        {posts.length === 0 ? <Text style={styles.emptySection}>{t('searchNoPosts')}</Text> : posts.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })} style={styles.postResult}>
            <Text style={styles.postAuthor}>{item.author.displayName || item.author.username} · @{item.author.username}</Text>
            <Text numberOfLines={5} style={styles.postContent}>{item.content}</Text>
          </Pressable>
        ))}
        <Text style={styles.sectionHeading}>{t('searchComments')}</Text>
        {comments.length === 0 ? <Text style={styles.emptySection}>{t('searchNoComments')}</Text> : comments.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.postId } })} style={styles.postResult}>
            <Text style={styles.postAuthor}>{item.author.displayName || item.author.username} · @{item.author.username}</Text>
            <Text numberOfLines={5} style={styles.postContent}>{item.content}</Text>
          </Pressable>
        ))}
        {results.data && results.data.users.pagination.totalPages > 1 ? <View style={styles.pagination}>
          <Pressable accessibilityRole="button" disabled={peoplePage <= 1 || results.isFetching} onPress={() => setPeoplePage((current) => current - 1)}><Text style={styles.pageAction}>{t('previous')}</Text></Pressable>
          <Text style={styles.pageLabel}>{peoplePage} / {results.data.users.pagination.totalPages}</Text>
          <Pressable accessibilityRole="button" disabled={peoplePage >= results.data.users.pagination.totalPages || results.isFetching} onPress={() => setPeoplePage((current) => current + 1)}><Text style={styles.pageAction}>{t('next')}</Text></Pressable>
        </View> : null}
        {results.data && results.data.posts.pagination.totalPages > 1 ? <View style={styles.pagination}>
          <Pressable accessibilityRole="button" disabled={postsPage <= 1 || results.isFetching} onPress={() => setPostsPage((current) => current - 1)}><Text style={styles.pageAction}>{t('previous')}</Text></Pressable>
          <Text style={styles.pageLabel}>{postsPage} / {results.data.posts.pagination.totalPages}</Text>
          <Pressable accessibilityRole="button" disabled={postsPage >= results.data.posts.pagination.totalPages || results.isFetching} onPress={() => setPostsPage((current) => current + 1)}><Text style={styles.pageAction}>{t('next')}</Text></Pressable>
        </View> : null}
        {results.data && results.data.comments.pagination.totalPages > 1 ? <View style={styles.pagination}>
          <Pressable accessibilityRole="button" disabled={commentsPage <= 1 || results.isFetching} onPress={() => setCommentsPage((current) => current - 1)}><Text style={styles.pageAction}>{t('previous')}</Text></Pressable>
          <Text style={styles.pageLabel}>{commentsPage} / {results.data.comments.pagination.totalPages}</Text>
          <Pressable accessibilityRole="button" disabled={commentsPage >= results.data.comments.pagination.totalPages || results.isFetching} onPress={() => setCommentsPage((current) => current + 1)}><Text style={styles.pageAction}>{t('next')}</Text></Pressable>
        </View> : null}
      </ScrollView> : null}
    </View>
    </ScreenFrame>
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
    results: { paddingBottom: 24 },
    sectionHeading: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4, marginTop: 20 },
    emptySection: { color: colors.mutedText, paddingVertical: 12 },
    bio: { color: colors.mutedText, marginTop: 5 },
    postResult: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 14 },
    postAuthor: { color: colors.mutedText, fontSize: 13, marginBottom: 7 },
    postContent: { color: colors.text, fontSize: 15, lineHeight: 22 },
    pagination: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 18 },
    pageAction: { color: colors.tint, fontWeight: '700', padding: 8 },
    pageLabel: { color: colors.mutedText },
  });
}