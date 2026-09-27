export type Role = 'USER' | 'ADMIN';
export interface User { id: string; email: string; username: string; displayName?: string | null; bio?: string | null; profileImage?: string | null; coverImage?: string | null; role: Role; isBanned: boolean; createdAt: string; updatedAt: string; followerCount?: number; followingCount?: number; isFollowing?: boolean; }
export interface Like { id: string; userId: string; postId?: string | null; commentId?: string | null; }
export interface Comment { id: string; content: string; postId: string; parentId: string | null; authorId: string; author: User; isDeleted: boolean; createdAt: string; likes: Like[]; _count: { likes: number; replies: number }; }
export interface Post { id: string; content: string; images: string[]; authorId: string; author: User; createdAt: string; comments: Comment[]; likes: Like[]; _count: { comments: number; likes: number }; }
export interface Page<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }
export interface SearchUserResult extends Pick<User, 'id' | 'username' | 'displayName' | 'bio' | 'profileImage' | 'coverImage' | 'createdAt'> { followerCount: number; followingCount: number; isFollowing: boolean; }
export interface SearchPostResult extends Pick<Post, 'id' | 'content' | 'images' | 'authorId' | 'createdAt'> { author: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'>; _count: { comments: number; likes: number }; }
export interface SearchCommentResult extends Pick<Comment, 'id' | 'content' | 'postId' | 'authorId' | 'createdAt'> { author: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'>; }
export interface SearchResults { query: string; users: Page<SearchUserResult>; posts: Page<SearchPostResult>; comments: Page<SearchCommentResult>; }
export type NotificationType = 'POST_LIKED' | 'COMMENT_LIKED' | 'COMMENT_CREATED' | 'FOLLOWED';
export interface Notification { id: string; type: NotificationType; postId: string | null; commentId: string | null; readAt: string | null; createdAt: string; actor: Pick<User, 'id' | 'username' | 'displayName' | 'profileImage'>; }
export interface NotificationsResponse { items: Notification[]; unreadCount: number; pagination: Page<Notification>['pagination']; }
export interface AuthResponse { user: User; tokens: { accessToken: string; refreshToken: string }; }
export interface ApiEnvelope<T> { success: boolean; data?: T; message?: string; error?: string | { message?: string; code?: string; details?: unknown[] }; }