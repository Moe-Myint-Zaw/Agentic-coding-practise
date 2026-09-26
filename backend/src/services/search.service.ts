import prisma from '../config/database';

const searchableUserSelect = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  profileImage: true,
  coverImage: true,
  createdAt: true,
  _count: { select: { followers: true, following: true } },
};

export const searchContent = async (
  query: string,
  viewerId: string,
  usersPage = 1,
  postsPage = usersPage,
  commentsPage = usersPage,
  limit = 20,
) => {
  const usersSkip = (usersPage - 1) * limit;
  const postsSkip = (postsPage - 1) * limit;
  const commentsSkip = (commentsPage - 1) * limit;
  const userWhere = {
    isBanned: false,
    OR: [
      { username: { contains: query } },
      { displayName: { contains: query } },
      { bio: { contains: query } },
    ],
  };
  const postWhere = {
    isDeleted: false,
    author: { isBanned: false },
    content: { contains: query },
  };
  const commentWhere = {
    isDeleted: false,
    author: { isBanned: false },
    post: { isDeleted: false, author: { isBanned: false } },
    content: { contains: query },
  };

  const [users, userTotal, posts, postTotal, comments, commentTotal, following] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: searchableUserSelect,
      skip: usersSkip,
      take: limit,
      orderBy: { username: 'asc' },
    }),
    prisma.user.count({ where: userWhere }),
    prisma.post.findMany({
      where: postWhere,
      select: {
        id: true,
        content: true,
        images: true,
        authorId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImage: true,
          },
        },
        _count: { select: { comments: { where: { isDeleted: false } }, likes: true } },
      },
      skip: postsSkip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where: postWhere }),
    prisma.comment.findMany({
      where: commentWhere,
      select: {
        id: true,
        content: true,
        postId: true,
        authorId: true,
        createdAt: true,
        author: { select: { id: true, username: true, displayName: true, profileImage: true } },
      },
      skip: commentsSkip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where: commentWhere }),
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
  ]);

  const followingIds = new Set(following.map(({ followingId }) => followingId));

  return {
    users: {
      items: users.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        createdAt: user.createdAt,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: followingIds.has(user.id),
      })),
      pagination: { page: usersPage, limit, total: userTotal, totalPages: Math.ceil(userTotal / limit) },
    },
    posts: {
      items: posts.map((post) => ({
        ...post,
        images: parseImages(post.images),
      })),
      pagination: { page: postsPage, limit, total: postTotal, totalPages: Math.ceil(postTotal / limit) },
    },
    comments: {
      items: comments,
      pagination: { page: commentsPage, limit, total: commentTotal, totalPages: Math.ceil(commentTotal / limit) },
    },
  };
};

const parseImages = (images: string) => {
  try {
    const parsed: unknown = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};