import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RemoteImage } from '@/components/remote-image';
import { api, resolveMediaUrl } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';

export default function PostDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { user } = useAuth();
	const { t } = useLocale();
	const client = useQueryClient();
	const [content, setContent] = useState('');

	const post = useQuery({ queryKey: ['post', id], queryFn: () => api.post(id), enabled: Boolean(id) });
	const comments = useQuery({ queryKey: ['comments', id], queryFn: () => api.comments(id), enabled: Boolean(id) });
	const create = useMutation({
		mutationFn: () => api.createComment(id, content.trim()),
		onSuccess: () => {
			setContent('');
			client.invalidateQueries({ queryKey: ['comments', id] });
			client.invalidateQueries({ queryKey: ['post', id] });
		},
	});
	const like = useMutation({
		mutationFn: api.toggleCommentLike,
		onSuccess: () => client.invalidateQueries({ queryKey: ['comments', id] }),
	});
	const remove = useMutation({
		mutationFn: api.deleteComment,
		onSuccess: () => {
			client.invalidateQueries({ queryKey: ['comments', id] });
			client.invalidateQueries({ queryKey: ['post', id] });
		},
	});

	const confirmDelete = (commentId: string) => {
		Alert.alert(t('deleteComment'), t('deleteCommentConfirm'), [
			{ text: t('cancel'), style: 'cancel' },
			{ text: t('delete'), style: 'destructive', onPress: () => remove.mutate(commentId) },
		]);
	};

	if (post.isLoading) return <ActivityIndicator style={styles.center} />;
	if (!post.data) return <View style={styles.center}><Text>{t('networkError')}</Text></View>;

	return (
		<View style={styles.page}>
			<Stack.Screen options={{ title: post.data.author.displayName || post.data.author.username }} />
			<View style={styles.post}>
				<Text style={styles.author}>{post.data.author.displayName || post.data.author.username}</Text>
				<Text style={styles.content}>{post.data.content}</Text>
				{post.data.images.length > 0 ? (
					<View style={styles.mediaGrid}>
						{post.data.images.map((image, index) => (
							<RemoteImage
								key={`${post.data.id}-${index}`}
								uri={resolveMediaUrl(image)}
								accessibilityLabel={`${t('post')} ${index + 1}`}
								style={post.data.images.length === 1 ? styles.singleImage : styles.mediaImage}
							/>
						))}
					</View>
				) : null}
			</View>
			<View style={styles.heading}>
				<SymbolView name={{ ios: 'bubble.left', android: 'comment', web: 'comment' }} size={17} tintColor="#52605a" />
				<Text style={styles.headingText}>{t('comments')}</Text>
			</View>
			<FlatList
				data={comments.data?.items.filter((comment) => comment.postId === id) ?? []}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={<Text style={styles.empty}>{t('emptyFeed')}</Text>}
				renderItem={({ item }) => {
					const liked = item.likes.some((itemLike) => itemLike.userId === user?.id);
					const authorName = item.author.displayName || item.author.username;
					const isDeleting = remove.isPending && remove.variables === item.id;

					return (
						<View style={styles.comment}>
							<View style={styles.commentHeader}>
								<Text style={styles.commentAuthor}>{authorName}</Text>
								<View style={styles.commentActions}>
									<Pressable
										accessibilityRole="button"
										accessibilityLabel={`${liked ? t('unlike') : t('like')} ${authorName}`}
										disabled={like.isPending}
										hitSlop={8}
										onPress={() => like.mutate(item.id)}
									>
										<View style={styles.iconAction}>
											<SymbolView
												pointerEvents="none"
												name={{ ios: liked ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }}
												size={18}
												tintColor={liked ? '#087f5b' : '#52605a'}
											/>
											<Text style={liked ? styles.liked : styles.action}>{item._count.likes}</Text>
										</View>
									</Pressable>
									{item.authorId === user?.id ? (
										<Pressable
											accessibilityRole="button"
											accessibilityLabel={t('deleteComment')}
											disabled={isDeleting}
											hitSlop={8}
											onPress={() => confirmDelete(item.id)}
										>
											<SymbolView pointerEvents="none" name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} tintColor="#b42318" />
										</Pressable>
									) : null}
								</View>
							</View>
							<Text>{item.content}</Text>
						</View>
					);
				}}
			/>
			<View style={styles.composer}>
				<TextInput value={content} onChangeText={setContent} maxLength={300} placeholder={t('comment')} style={styles.input} />
				<Pressable accessibilityLabel={t('post')} disabled={!content.trim() || create.isPending} style={styles.button} onPress={() => create.mutate()}>
					<View style={styles.buttonContent}>
						<SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} size={16} tintColor="#fff" />
						<Text style={styles.buttonText}>{t('post')}</Text>
					</View>
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	page: { backgroundColor: '#f7f8f4', flex: 1 },
	post: { backgroundColor: '#fff', padding: 18 },
	author: { fontSize: 17, fontWeight: '700' },
	content: { fontSize: 17, lineHeight: 25, marginTop: 12 },
	mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
	mediaImage: { aspectRatio: 1, backgroundColor: '#e1e8e3', borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '48%' },
	singleImage: { aspectRatio: 16 / 10, backgroundColor: '#e1e8e3', borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '100%' },
	heading: { alignItems: 'center', flexDirection: 'row', gap: 7, padding: 16 },
	headingText: { color: '#52605a', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
	comment: { backgroundColor: '#fff', borderBottomColor: '#e1e8e3', borderBottomWidth: 1, padding: 14 },
	commentHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
	commentAuthor: { fontWeight: '700' },
	commentActions: { alignItems: 'center', flexDirection: 'row', gap: 14 },
	iconAction: { alignItems: 'center', flexDirection: 'row', gap: 5 },
	action: { color: '#52605a', fontSize: 12 },
	liked: { color: '#087f5b', fontSize: 12 },
	composer: { backgroundColor: '#fff', borderTopColor: '#e1e8e3', borderTopWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
	input: { backgroundColor: '#f0f3f0', borderRadius: 8, flex: 1, padding: 12 },
	button: { alignSelf: 'center', backgroundColor: '#087f5b', borderRadius: 8, padding: 12 },
	buttonContent: { alignItems: 'center', flexDirection: 'row', gap: 7 },
	buttonText: { color: '#fff', fontWeight: '700' },
	center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
	empty: { color: '#64706a', padding: 20, textAlign: 'center' },
});