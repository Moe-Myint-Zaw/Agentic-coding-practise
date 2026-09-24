export type Role = 'USER' | 'ADMIN';
export interface User { id: string; email: string; username: string; displayName?: string | null; bio?: string | null; profileImage?: string | null; role: Role; isBanned: boolean; createdAt: string; updatedAt: string; followerCount?: number; followingCount?: number; isFollowing?: boolean; }
export interface Like { id: string; userId: string; postId?: string | null; commentId?: string | null; }
export interface Comment { id: string; content: string; postId: string; authorId: string; author: User; createdAt: string; likes: Like[]; _count: { likes: number }; }
export interface Post { id: string; content: string; images: string[]; authorId: string; author: User; createdAt: string; comments: Comment[]; likes: Like[]; _count: { comments: number; likes: number }; }
export interface Page<T> { items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }
export interface AuthResponse { user: User; tokens: { accessToken: string; refreshToken: string }; }
export interface ApiEnvelope<T> { success: boolean; data?: T; message?: string; error?: string | { message?: string; code?: string; details?: unknown[] }; }