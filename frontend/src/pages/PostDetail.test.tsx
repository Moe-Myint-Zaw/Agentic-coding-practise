import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PostDetail } from './PostDetail';

const mockUsePost = vi.fn();
const mockUsePostComments = vi.fn();
const mockUseCreateComment = vi.fn();
const mockUseTogglePostLike = vi.fn();
const mockUseToggleCommentLike = vi.fn();
const mockUseDeleteComment = vi.fn();

vi.mock('../hooks/usePosts', () => ({
  usePost: mockUsePost,
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
