// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  bio?: string;
  profileImage?: string;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

// Post Types
export interface Post {
  id: string;
  content: string;
  images: string[];
  authorId: string;
  author: User;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  likes?: Like[];
  _count?: {
    comments: number;
    likes: number;
  };
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  postId: string;
  post?: Post;
  authorId: string;
  author: User;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  likes?: Like[];
  _count?: {
    likes: number;
  };
}

// Like Types
export interface Like {
  id: string;
  userId: string;
  user: User;
  postId?: string;
  post?: Post;
  commentId?: string;
  comment?: Comment;
  createdAt: string;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  activeUsers: number;
}

export interface UserManagementData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}