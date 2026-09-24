import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const usePosts = (params?: { page?: number; limit?: number; feed?: 'latest' | 'following' }, enabled = true) => {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => api.getPosts(params),
    enabled,
  });
};

export const usePost = (id: string) => {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => api.getPost(id),
    enabled: !!id,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { content: string; images?: string[] }) => api.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { content?: string; images?: string[] } }) => api.updatePost(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['post', variables.id], response);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
};

export const useUserPosts = (userId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['userPosts', userId, params],
    queryFn: () => api.getUserPosts(userId, params),
    enabled: !!userId,
  });
};