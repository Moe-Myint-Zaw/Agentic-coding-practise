import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { useTheme } from '@/contexts/theme-context';
import type { ThemeColors } from '@/constants/Colors';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RemoteImage } from '@/components/remote-image';
import { api, ApiError, postsByFeed, resolveMediaUrl } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import type { Post } from '@/types';

type SelectedImage = { uri: string; name: string; type: string; fileSize?: number };

function confirmDestructiveAction(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string,
  onConfirm: () => void,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function FeedScreen() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const client = useQueryClient();
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [feedType, setFeedType] = useState<'latest' | 'following'>('latest');

  const feed = useQuery({ queryKey: ['posts', feedType], queryFn: () => postsByFeed(1, feedType) });
  const create = useMutation({
    mutationFn: async () => {
      const uploadedImages = await Promise.all(selectedImages.map((image) => api.uploadImage(image)));
      return api.createPost(content.trim(), uploadedImages.map((image) => image.url));
    },
    onSuccess: () => {
      setContent('');
      setSelectedImages([]);
      setUploadError('');
      client.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : t('networkError'));
    },
  });
  const like = useMutation({
    mutationFn: api.togglePostLike,
    onSuccess: () => client.invalidateQueries({ queryKey: ['posts'] }),
  });
  const remove = useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['posts'] });
      client.invalidateQueries({ queryKey: ['user-posts'] });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : t('networkError');
      Alert.alert(t('deletePost'), message);
    },
  });

  const confirmDelete = (postId: string) => {
    confirmDestructiveAction(
      t('deletePost'),
      t('deletePostConfirm'),
      t('delete'),
      t('cancel'),
      () => remove.mutate(postId),
    );
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('addImages'), t('networkError'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - selectedImages.length,
      quality: 0.8,
    });
    if (result.canceled) return;

    const images = result.assets.map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName || `post-image-${Date.now()}-${index}.jpg`,
      type: asset.mimeType || 'image/jpeg',
      fileSize: asset.fileSize,
    }));
    const invalidImage = images.find((image) => !['image/jpeg', 'image/png'].includes(image.type) || (image.fileSize ?? 0) > 5 * 1024 * 1024);
    if (invalidImage) {
      setUploadError((invalidImage.fileSize ?? 0) > 5 * 1024 * 1024 ? t('maxImageSize') : t('uploadFailed'));
      return;
    }
    setUploadError('');
    setSelectedImages((current) => [...current, ...images].slice(0, 5));
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('appName')}</Text>
        <Text style={styles.greeting}>@{user?.username}</Text>
      </View>

      <View style={styles.composer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          maxLength={500}
          multiline
          placeholder={t('createPost')}
          placeholderTextColor={colors.mutedText}
          style={styles.composeInput}
        />
        {selectedImages.length > 0 ? (
          <View style={styles.selectedImages}>
            {selectedImages.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.selectedImageContainer}>
                <RemoteImage uri={image.uri} style={styles.selectedImage} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('delete')} ${image.name}`}
                  hitSlop={8}
                  style={styles.removeImage}
                  onPress={() => setSelectedImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                >
                  <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={13} tintColor="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
        {uploadError ? <Text style={styles.uploadError}>{uploadError}</Text> : null}
        <View style={styles.composerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('addImages')}
            disabled={selectedImages.length >= 5 || create.isPending}
            style={styles.imageButton}
            onPress={pickImages}
          >
            <SymbolView name={{ ios: 'photo.on.rectangle', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={18} tintColor={colors.tint} />
            <Text style={styles.imageButtonText}>{t('addImages')}</Text>
          </Pressable>
        <Pressable
          accessibilityLabel={t('post')}
          disabled={(!content.trim() && selectedImages.length === 0) || create.isPending}
          style={styles.postButton}
          onPress={() => create.mutate()}
        >
          <View style={styles.buttonContent}>
            <SymbolView name={{ ios: 'square.and.pencil', android: 'edit', web: 'edit' }} size={16} tintColor="#fff" />
            <Text style={styles.postButtonText}>{t('post')}</Text>
          </View>
        </Pressable>
        </View>
      </View>

      <View style={styles.feedTabs} accessibilityRole="tablist">
        {(['latest', 'following'] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: feedType === option }}
            style={[styles.feedTab, feedType === option && styles.feedTabActive]}
            onPress={() => setFeedType(option)}
          >
            <Text style={[styles.feedTabText, feedType === option && styles.feedTabTextActive]}>{t(option)}</Text>
          </Pressable>
        ))}
      </View>

      {feed.isLoading ? (
        <ActivityIndicator style={styles.center} />
      ) : feed.isError ? (
        <View style={styles.center}>
          <Text>{t('networkError')}</Text>
          <Pressable accessibilityLabel={t('retry')} onPress={() => feed.refetch()}>
            <View style={styles.iconAction}>
              <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={20} tintColor="#087f5b" />
              <Text style={styles.link}>{t('retry')}</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={feed.data?.items ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />}
          ListEmptyComponent={<Text style={styles.empty}>{t('emptyFeed')}</Text>}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => like.mutate(item.id)}
              onDelete={
                item.author.id === user?.id
                  ? () => confirmDelete(item.id)
                  : undefined
              }
              onEdit={item.author.id === user?.id ? () => router.push({ pathname: '/post/[id]', params: { id: item.id, edit: '1' } }) : undefined}
              isDeleting={remove.isPending && remove.variables === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

function PostCard({
  post,
  onLike,
  onEdit,
  onDelete,
  isDeleting,
}: {
  post: Post;
  onLike: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const liked = post.likes.some((like) => like.userId === user?.id);
  const authorName = post.author.displayName || post.author.username;

  const openPost = () => {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  };

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${authorName} profile`}
          style={styles.authorPressable}
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: post.author.id } })}
        >
          {post.author.profileImage ? (
            <RemoteImage uri={resolveMediaUrl(post.author.profileImage)} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{authorName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={styles.author}>{authorName}</Text>
            <Text style={styles.date}>
              @{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('save')}
              hitSlop={8}
              style={styles.headerIconButton}
              onPress={onEdit}
            >
              <SymbolView
                pointerEvents="none"
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                size={18}
                tintColor="#087f5b"
              />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('deletePost')}
              disabled={isDeleting}
              hitSlop={8}
              style={styles.headerIconButton}
              onPress={onDelete}
            >
              <SymbolView
                pointerEvents="none"
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                size={18}
                tintColor="#b42318"
              />
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel="More post actions" hitSlop={8} style={styles.headerIconButton} onPress={() => {}}>
            <SymbolView
              pointerEvents="none"
              name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
              size={20}
              tintColor="#52605a"
            />
          </Pressable>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={openPost}>
        <Text style={styles.content}>{post.content}</Text>
        {post.images.length > 0 ? (
          <View style={styles.mediaGrid}>
            {post.images.slice(0, 4).map((image, index) => (
              <RemoteImage
                key={`${post.id}-${index}`}
                uri={resolveMediaUrl(image)}
                accessibilityLabel={`${t('post')} ${index + 1}`}
                style={post.images.length === 1 ? styles.singleImage : styles.mediaImage}
              />
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`${liked ? t('unlike') : t('like')} ${authorName}`}
          hitSlop={8}
          onPress={onLike}
        >
          <View style={styles.iconAction}>
            <SymbolView
              pointerEvents="none"
              name={{ ios: liked ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }}
              size={18}
              tintColor={liked ? '#087f5b' : '#52605a'}
            />
            <Text style={liked ? styles.liked : styles.action}>{post._count.likes}</Text>
          </View>
        </Pressable>

        <Link href={{ pathname: '/post/[id]', params: { id: post.id } }} asChild>
          <Pressable accessibilityLabel={`${t('comments')} ${post._count.comments}`}>
            <View style={styles.iconAction}>
              <SymbolView
                pointerEvents="none"
                name={{ ios: 'bubble.left', android: 'comment', web: 'comment' }}
                size={18}
                tintColor="#52605a"
              />
              <Text style={styles.action}>{post._count.comments}</Text>
            </View>
          </Pressable>
        </Link>

        <Pressable accessibilityLabel="Share post" hitSlop={8} onPress={() => Share.share({ message: post.content })}>
          <View style={styles.iconAction}>
            <SymbolView
              pointerEvents="none"
              name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              size={18}
              tintColor="#52605a"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) { return StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.tint, fontSize: 27, fontWeight: '800' },
  greeting: { color: colors.mutedText },
  composer: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: 14,
  },
  feedTabs: { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 14 },
  feedTab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, justifyContent: 'center', minHeight: 46 },
  feedTabActive: { borderBottomColor: colors.tint },
  feedTabText: { color: colors.mutedText, fontWeight: '600' },
  feedTabTextActive: { color: colors.tint, fontWeight: '800' },
  composerActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  composeInput: { color: colors.text, minHeight: 48, padding: 8, textAlignVertical: 'top' },
  imageButton: { alignItems: 'center', flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 4 },
  imageButtonText: { color: colors.tint, fontWeight: '600' },
  selectedImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  selectedImageContainer: { height: 64, position: 'relative', width: 64 },
  selectedImage: { borderCurve: 'continuous', borderRadius: 7, height: '100%', overflow: 'hidden', width: '100%' },
  removeImage: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 12, height: 24, justifyContent: 'center', position: 'absolute', right: -6, top: -6, width: 24 },
  uploadError: { color: colors.danger, fontSize: 13, marginTop: 7 },
  postButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.tint,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  buttonContent: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  postButtonText: { color: colors.surface, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    padding: 16,
  },
  postHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  authorPressable: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarImage: { borderRadius: 20, height: 40, width: 40 },
  avatarText: { color: colors.tint, fontSize: 17, fontWeight: '800' },
  authorInfo: { flex: 1, minWidth: 0 },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
    zIndex: 1,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    backgroundColor: 'transparent',
  },
  author: { color: colors.text, fontSize: 16, fontWeight: '700' },
  date: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  content: { color: colors.text, fontSize: 16, lineHeight: 23, marginVertical: 12 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  mediaImage: { aspectRatio: 1, backgroundColor: colors.border, borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '48%' },
  singleImage: { aspectRatio: 16 / 10, backgroundColor: colors.border, borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '100%' },
  actions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 28,
    paddingTop: 12,
  },
  iconAction: { alignItems: 'center', flexDirection: 'row', gap: 6, minHeight: 28 },
  action: { color: colors.mutedText },
  liked: { color: colors.tint, fontWeight: '700' },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', gap: 12 },
  empty: { color: colors.mutedText, padding: 32, textAlign: 'center' },
  link: { color: colors.tint, fontWeight: '700' },
}); }
