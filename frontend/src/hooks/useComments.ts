import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const usePostComments = (postId: string, params?: { page?: number; limit?: number; parentId?: string; enabled?: boolean }) => {
  return useQuery({
    queryKey: ['postComments', postId, { page: params?.page, limit: params?.limit, parentId: params?.parentId }],
    queryFn: () => api.getPostComments(postId, params),
    enabled: !!postId && params?.enabled !== false,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { postId: string; content: string; parentId?: string }) => api.createComment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};