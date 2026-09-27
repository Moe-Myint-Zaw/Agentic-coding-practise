import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { RemoteImage } from '@/components/remote-image';
import { ScreenFrame } from '@/components/screen-frame';
import { api, resolveMediaUrl, updatePost } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useLocale } from '@/contexts/locale-context';
import type { Comment } from '@/types';

export default function PostDetailScreen() {
	const { id, edit: editParam } = useLocalSearchParams<{ id: string; edit?: string }>();
	const headerHeight = useHeaderHeight();
	const { user } = useAuth();
	const { t } = useLocale();
	const client = useQueryClient();
	const [content, setContent] = useState('');
	const [editingContent, setEditingContent] = useState('');
	const [isEditing, setIsEditing] = useState(editParam === '1');

	const post = useQuery({ queryKey: ['post', id], queryFn: () => api.post(id), enabled: Boolean(id) });
	const comments = useQuery({ queryKey: ['comments', id, { parentId: null, page: 1 }], queryFn: () => api.comments(id), enabled: Boolean(id) });
	const rootComments = comments.data?.items.filter((comment) => comment.postId === id && comment.parentId === null) ?? [];
	const create = useMutation({
		mutationFn: (input: { content: string; parentId?: string }) => api.createComment(id, input.content, input.parentId),
		onSuccess: (_, input) => {
			if (!input.parentId) setContent('');
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
	const edit = useMutation({
		mutationFn: () => updatePost(id, editingContent.trim()),
		onSuccess: () => {
			setIsEditing(false);
			client.invalidateQueries({ queryKey: ['post', id] });
			client.invalidateQueries({ queryKey: ['posts'] });
		},
	});

	useEffect(() => {
		if (isEditing && post.data && !editingContent) {
			setEditingContent(post.data.content);
		}
	}, [editingContent, isEditing, post.data]);

	const confirmDelete = (commentId: string) => {
		Alert.alert(t('deleteComment'), t('deleteCommentConfirm'), [
			{ text: t('cancel'), style: 'cancel' },
			{ text: t('delete'), style: 'destructive', onPress: () => remove.mutate(commentId) },
		]);
	};

	if (post.isLoading) return <ScreenFrame edges={['left', 'right', 'bottom']}><ActivityIndicator style={styles.center} /></ScreenFrame>;
	if (!post.data) return <ScreenFrame edges={['left', 'right', 'bottom']}><View style={styles.center}><Text>{t('networkError')}</Text></View></ScreenFrame>;

	return (
		<ScreenFrame edges={['left', 'right', 'bottom']} keyboardAware keyboardVerticalOffset={headerHeight}>
		<View style={styles.page}>
			<Stack.Screen options={{ title: post.data.author.displayName || post.data.author.username }} />
			<ScrollView
				style={styles.postContentScroll}
				contentContainerStyle={styles.postContent}
				contentInsetAdjustmentBehavior="never"
				keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
				keyboardShouldPersistTaps="handled"
			>
			<View style={styles.post}>
				<Text style={styles.author}>{post.data.author.displayName || post.data.author.username}</Text>
				{post.data.authorId === user?.id && isEditing ? (
					<View style={styles.editBox}>
						<TextInput value={editingContent} onChangeText={setEditingContent} maxLength={500} multiline style={styles.editInput} />
						<View style={styles.editActions}>
							<Pressable accessibilityLabel={t('save')} disabled={!editingContent.trim() || edit.isPending} onPress={() => edit.mutate()}><Text style={styles.saveText}>{t('save')}</Text></Pressable>
							<Pressable accessibilityLabel={t('cancel')} onPress={() => setIsEditing(false)}><Text>{t('cancel')}</Text></Pressable>
						</View>
					</View>
				) : <Text style={styles.content}>{post.data.content}</Text>}
				{post.data.authorId === user?.id && !isEditing ? (
					<Pressable accessibilityRole="button" accessibilityLabel={t('save')} onPress={() => { setEditingContent(post.data.content); setIsEditing(true); }} style={styles.editButton}>
						<Text style={styles.saveText}>{t('save')}</Text>
					</Pressable>
				) : null}
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
			{comments.isLoading ? <ActivityIndicator style={styles.commentsLoading} /> : rootComments.length === 0 ? <Text style={styles.empty}>{t('emptyFeed')}</Text> : rootComments.map((comment) => (
				<CommentThreadItem
					key={comment.id}
					comment={comment}
					postId={id}
					depth={0}
					userId={user?.id}
					onReply={(parentId, replyContent) => create.mutateAsync({ parentId, content: replyContent })}
					onLike={(commentId) => like.mutate(commentId)}
					onDelete={confirmDelete}
					isLiking={like.isPending}
					deletingId={remove.isPending ? remove.variables : undefined}
				/>
			))}
			</ScrollView>
			<View style={styles.composer}>
				<TextInput value={content} onChangeText={setContent} maxLength={300} placeholder={t('comment')} style={styles.input} />
				<Pressable accessibilityLabel={t('post')} disabled={!content.trim() || create.isPending} style={styles.button} onPress={() => create.mutate({ content: content.trim() })}>
					<View style={styles.buttonContent}>
						<SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} size={16} tintColor="#fff" />
						<Text style={styles.buttonText}>{t('post')}</Text>
					</View>
				</Pressable>
			</View>
		</View>
		</ScreenFrame>
	);
}

interface CommentThreadItemProps {
	comment: Comment;
	postId: string;
	depth: number;
	userId?: string;
	onReply: (parentId: string, content: string) => Promise<unknown>;
	onLike: (commentId: string) => void;
	onDelete: (commentId: string) => void;
	isLiking: boolean;
	deletingId?: string;
}

function CommentThreadItem({ comment, postId, depth, userId, onReply, onLike, onDelete, isLiking, deletingId }: CommentThreadItemProps) {
	const { t } = useLocale();
	const [replyContent, setReplyContent] = useState('');
	const [replying, setReplying] = useState(false);
	const [repliesOpen, setRepliesOpen] = useState(false);
	const [page, setPage] = useState(1);
	const replies = useQuery({
		queryKey: ['comments', postId, { parentId: comment.id, page }],
		queryFn: () => api.comments(postId, page, comment.id),
		enabled: repliesOpen,
	});
	const liked = comment.likes.some((itemLike) => itemLike.userId === userId);

	const submitReply = async () => {
		if (!replyContent.trim()) return;
		try {
			await onReply(comment.id, replyContent.trim());
			setReplyContent('');
			setReplying(false);
			setRepliesOpen(true);
		} catch {
			Alert.alert(t('networkError'));
		}
	};

	return (
		<View style={[styles.comment, { marginLeft: Math.min(depth, 4) * 12 }]}>
			<View style={styles.commentHeader}>
				<Text style={styles.commentAuthor}>{comment.author.displayName || comment.author.username}</Text>
				<View style={styles.commentActions}>
					<Pressable accessibilityRole="button" accessibilityLabel={`${liked ? t('unlike') : t('like')} ${comment.author.username}`} disabled={isLiking || comment.isDeleted} hitSlop={8} onPress={() => onLike(comment.id)}>
						<View style={styles.iconAction}>
							<SymbolView pointerEvents="none" name={{ ios: liked ? 'heart.fill' : 'heart', android: 'favorite', web: 'favorite' }} size={18} tintColor={liked ? '#087f5b' : '#52605a'} />
							<Text style={liked ? styles.liked : styles.action}>{comment._count.likes}</Text>
						</View>
					</Pressable>
					{comment.authorId === userId && !comment.isDeleted ? (
						<Pressable accessibilityRole="button" accessibilityLabel={t('deleteComment')} disabled={deletingId === comment.id} hitSlop={8} onPress={() => onDelete(comment.id)}>
							<SymbolView pointerEvents="none" name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} tintColor="#b42318" />
						</Pressable>
					) : null}
				</View>
			</View>
			<Text>{comment.isDeleted ? t('deletedComment') : comment.content}</Text>
			{!comment.isDeleted ? (
				<View style={styles.threadActions}>
					<Pressable accessibilityRole="button" onPress={() => setReplying((open) => !open)}><Text style={styles.threadAction}>{t('reply')}</Text></Pressable>
					{comment._count.replies > 0 ? <Pressable accessibilityRole="button" onPress={() => setRepliesOpen((open) => !open)}><Text style={styles.threadAction}>{t(repliesOpen ? 'hideReplies' : 'viewReplies')} ({comment._count.replies})</Text></Pressable> : null}
				</View>
			) : null}
			{replying ? (
				<View style={styles.replyComposer}>
					<TextInput value={replyContent} onChangeText={setReplyContent} maxLength={300} placeholder={t('replyPlaceholder')} style={styles.replyInput} accessibilityLabel={t('replyPlaceholder')} />
					<Pressable accessibilityRole="button" accessibilityLabel={t('reply')} disabled={!replyContent.trim()} onPress={submitReply}><Text style={styles.threadAction}>{t('reply')}</Text></Pressable>
				</View>
			) : null}
			{repliesOpen ? (
				<View style={styles.replies}>
					{replies.isLoading ? <ActivityIndicator /> : replies.data?.items.map((reply) => <CommentThreadItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} userId={userId} onReply={onReply} onLike={onLike} onDelete={onDelete} isLiking={isLiking} deletingId={deletingId} />)}
					{replies.data && replies.data.pagination.totalPages > 1 ? <View style={styles.threadActions}>
						<Pressable accessibilityRole="button" disabled={page <= 1 || replies.isFetching} onPress={() => setPage((current) => current - 1)}><Text style={styles.threadAction}>{t('previous')}</Text></Pressable>
						<Text>{page} / {replies.data.pagination.totalPages}</Text>
						<Pressable accessibilityRole="button" disabled={page >= replies.data.pagination.totalPages || replies.isFetching} onPress={() => setPage((current) => current + 1)}><Text style={styles.threadAction}>{t('next')}</Text></Pressable>
					</View> : null}</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	page: { backgroundColor: '#f7f8f4', flex: 1 },
	postContentScroll: { flex: 1 },
	postContent: { paddingBottom: 12 },
	post: { backgroundColor: '#fff', padding: 18 },
	author: { fontSize: 17, fontWeight: '700' },
	content: { fontSize: 17, lineHeight: 25, marginTop: 12 },
	editBox: { marginTop: 12 },
	editInput: { backgroundColor: '#f0f3f0', borderRadius: 8, minHeight: 90, padding: 12 },
	editActions: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'flex-end', marginTop: 8 },
	editButton: { alignSelf: 'flex-start', marginTop: 12 },
	saveText: { color: '#087f5b', fontWeight: '700' },
	mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
	mediaImage: { aspectRatio: 1, backgroundColor: '#e1e8e3', borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '48%' },
	singleImage: { aspectRatio: 16 / 10, backgroundColor: '#e1e8e3', borderCurve: 'continuous', borderRadius: 8, overflow: 'hidden', width: '100%' },
	heading: { alignItems: 'center', flexDirection: 'row', gap: 7, padding: 16 },
	headingText: { color: '#52605a', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
	comment: { backgroundColor: '#fff', borderBottomColor: '#e1e8e3', borderBottomWidth: 1, padding: 14 },
	commentsLoading: { padding: 18 },
	commentHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
	commentAuthor: { fontWeight: '700' },
	commentActions: { alignItems: 'center', flexDirection: 'row', gap: 14 },
	threadActions: { alignItems: 'center', flexDirection: 'row', gap: 16, marginTop: 8 },
	threadAction: { color: '#087f5b', fontSize: 13, fontWeight: '600' },
	replyComposer: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
	replyInput: { backgroundColor: '#f0f3f0', borderRadius: 8, flex: 1, padding: 10 },
	replies: { marginTop: 8 },
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