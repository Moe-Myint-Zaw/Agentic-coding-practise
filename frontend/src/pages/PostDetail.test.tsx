import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PostDetail } from './PostDetail';

const {
  mockUsePost,
  mockUseUpdatePost,
  mockUsePostComments,
  mockUseCreateComment,
  mockUseTogglePostLike,
  mockUseToggleCommentLike,
  mockUseDeleteComment,
} = vi.hoisted(() => ({
  mockUsePost: vi.fn(),
  mockUseUpdatePost: vi.fn(),
  mockUsePostComments: vi.fn(),
  mockUseCreateComment: vi.fn(),
  mockUseTogglePostLike: vi.fn(),
  mockUseToggleCommentLike: vi.fn(),
  mockUseDeleteComment: vi.fn(),
}));

vi.mock('../hooks/usePosts', () => ({
  usePost: mockUsePost,
  useUpdatePost: mockUseUpdatePost,
}));

vi.mock('../hooks/useComments', () => ({
  usePostComments: mockUsePostComments,
  useCreateComment: mockUseCreateComment,
  useDeleteComment: mockUseDeleteComment,
}));

vi.mock('../hooks/useLikes', () => ({
  useTogglePostLike: mockUseTogglePostLike,
  useToggleCommentLike: mockUseToggleCommentLike,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'tester', displayName: 'Tester' },
  }),
}));

describe('PostDetail', () => {
  beforeEach(() => {
    mockUsePost.mockReturnValue({
      data: {
        success: true,
        data: {
          id: 'post-1',
          content: 'Hello world',
          images: [],
          authorId: 'user-1',
          author: {
            id: 'user-1',
            username: 'tester',
            displayName: 'Tester',
            profileImage: '',
          },
          createdAt: '2026-09-15T00:00:00.000Z',
          _count: { likes: 0, comments: 0 },
        },
      },
      isLoading: false,
      error: null,
    });

    mockUsePostComments.mockReturnValue({
      data: { success: true, data: { items: [], pagination: { total: 0 } } },
      isLoading: false,
    });

    mockUseUpdatePost.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseCreateComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseTogglePostLike.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseToggleCommentLike.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseDeleteComment.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('renders the post author even when the api hook provides an envelope object', () => {
    render(
      <MemoryRouter initialEntries={['/post/post-1']}>
        <Routes>
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Tester/i)).toBeTruthy();
    expect(screen.getByText(/Hello world/i)).toBeTruthy();
  });
});
