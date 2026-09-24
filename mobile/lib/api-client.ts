import { authStorage } from "./auth-storage";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import type {
  ApiEnvelope,
  AuthResponse,
  Comment,
  Page,
  Post,
  User,
} from "@/types";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const hostnameFromUri = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    return (
      new URL(value.includes("://") ? value : `http://${value}`).hostname ||
      null
    );
  } catch {
    return null;
  }
};

const getDevHost = (): string => {
  if (Platform.OS === "web") return "localhost";
  const candidates = [Constants.expoConfig?.hostUri, Constants.linkingUri];
  for (const candidate of candidates) {
    const hostname = hostnameFromUri(candidate);
    if (
      hostname &&
      !LOOPBACK_HOSTS.has(hostname) &&
      !hostname.endsWith(".exp.direct") &&
      !hostname.endsWith(".exp.host")
    ) {
      return hostname;
    }
  }
  // For physical devices with Expo Go, default to localhost which will fail
  // User should set EXPO_PUBLIC_API_URL to their machine's LAN IP
  return Platform.OS === "android" ? "10.0.2.2" : "localhost";
};

const withReachableHost = (url: string): string => {
  if (Platform.OS === "web") return url;
  try {
    const parsed = new URL(url);
    if (LOOPBACK_HOSTS.has(parsed.hostname)) {
      parsed.hostname = getDevHost();
      return parsed.toString().replace(/\/$/, "");
    }
    return url;
  } catch {
    return url;
  }
};

const API_URL = withReachableHost(
  process.env.EXPO_PUBLIC_API_URL ?? `http://${getDevHost()}:3000/api/v1`,
);
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

export const resolveMediaUrl = (url: string): string => {
  if (
    !url ||
    url.startsWith("file:") ||
    url.startsWith("content:") ||
    url.startsWith("data:")
  )
    return url;
  if (!url.startsWith("http"))
    return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
  try {
    const parsed = new URL(url);
    return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
  } catch {
    return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
  }
};
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const updatePost = (id: string, content: string) =>
  request<Post>(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
export const postsByFeed = (
  page = 1,
  feed: "latest" | "following" = "latest",
) => request<Page<Post>>(`/posts?page=${page}&limit=20&feed=${feed}`);
async function request<T>(
  path: string,
  init: RequestInit = {},
  canRefresh = true,
): Promise<T> {
  const token = await authStorage.getAccessToken();
  const isMultipart = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (response.status === 401 && canRefresh && path !== "/auth/refresh") {
    const refreshToken = await authStorage.getRefreshToken();
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshBody = (await refreshResponse
        .json()
        .catch(() => ({}))) as ApiEnvelope<{
        tokens: { accessToken: string; refreshToken: string };
      }>;
      if (refreshResponse.ok && refreshBody.data?.tokens) {
        await authStorage.save(
          refreshBody.data.tokens.accessToken,
          refreshBody.data.tokens.refreshToken,
        );
        return request<T>(path, init, false);
      }
    }
    await authStorage.clear();
  }
  if (!response.ok) {
    const errorMessage =
      typeof body.error === "string" ? body.error : body.error?.message;
    throw new ApiError(
      response.status,
      body.message ?? errorMessage ?? "Request failed",
    );
  }
  return body.data as T;
}
export const api = {
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  register: (input: { email: string; username: string; password: string }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  me: () => request<User>("/auth/me"),
  posts: (page = 1) => request<Page<Post>>(`/posts?page=${page}&limit=20`),
  post: (id: string) => request<Post>(`/posts/${id}`),
  createPost: (content: string, images: string[] = []) =>
    request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify({ content, images }),
    }),
  uploadImage: async (asset: { uri: string; name: string; type: string }) => {
    const token = await authStorage.getAccessToken();
    const response = await FileSystem.uploadAsync(
      `${API_URL}/upload/image`,
      asset.uri,
      {
        fieldName: "image",
        httpMethod: "POST",
        mimeType: asset.type,
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    const body = JSON.parse(response.body) as ApiEnvelope<{ url: string }>;
    if (response.status < 200 || response.status >= 300) {
      const message =
        typeof body.error === "string" ? body.error : body.error?.message;
      throw new ApiError(
        response.status,
        body.message ?? message ?? "Image upload failed",
      );
    }
    return body.data as { url: string };
  },
  deletePost: (id: string) =>
    request<{ deleted: boolean }>(`/posts/${id}`, { method: "DELETE" }),
  comments: (postId: string, page = 1) =>
    request<Page<Comment>>(`/posts/${postId}/comments?page=${page}&limit=10`),
  createComment: (postId: string, content: string) =>
    request<Comment>("/comments", {
      method: "POST",
      body: JSON.stringify({ postId, content }),
    }),
  deleteComment: (id: string) =>
    request<{ deleted: boolean }>(`/comments/${id}`, { method: "DELETE" }),
  togglePostLike: (id: string) =>
    request<{ liked: boolean; postId: string }>(`/likes/post/${id}`, {
      method: "POST",
    }),
  toggleCommentLike: (id: string) =>
    request<{ liked: boolean; commentId: string }>(`/likes/comment/${id}`, {
      method: "POST",
    }),
  profile: (id: string) => request<User>(`/users/${id}`),
  searchUsers: (query: string, page = 1) =>
    request<Page<User>>(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=20`),
  followUser: (id: string) => request<{ following: boolean; userId: string }>(`/users/${id}/follow`, { method: 'POST' }),
  unfollowUser: (id: string) => request<{ following: boolean; userId: string }>(`/users/${id}/follow`, { method: 'DELETE' }),
  userPosts: (id: string, page = 1) =>
    request<Page<Post>>(`/users/${id}/posts?page=${page}&limit=20`),
  updateProfile: (
    id: string,
    input: { displayName?: string; bio?: string; profileImage?: string },
  ) =>
    request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  adminStats: () =>
    request<{
      totalUsers: number;
      totalPosts: number;
      totalComments: number;
      activeUsers: number;
    }>("/admin/stats"),
  adminUsers: () => request<Page<User & { postCount: number }>>("/admin/users"),
};
