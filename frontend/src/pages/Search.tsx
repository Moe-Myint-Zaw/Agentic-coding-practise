import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { api, resolveMediaUrl } from '../lib/api';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const usersQuery = useQuery({
    queryKey: ['search', query, peoplePage, postsPage, commentsPage],
    queryFn: () => api.search(query, { page: peoplePage, postsPage, commentsPage, limit: 20 }),
    enabled: query.length >= 2,
  });

  const users = usersQuery.data?.users.items ?? [];
  const posts = usersQuery.data?.posts.items ?? [];
  const comments = usersQuery.data?.comments.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">{t('nav.search')}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{t('search.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('search.description')}</p>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          aria-label={t('search.inputLabel')}
          className="h-12 pl-10 text-base"
          onChange={(event) => { setInput(event.target.value); setPeoplePage(1); setPostsPage(1); setCommentsPage(1); }}
          placeholder={t('search.placeholder')}
          value={input}
        />
      </div>

      {usersQuery.isFetching && <p className="text-sm text-muted-foreground">{t('search.loading')}</p>}
      {usersQuery.isError && <p className="text-sm text-destructive">{t('errors.loadFailed')}</p>}
      {!usersQuery.isFetching && query.length >= 2 && users.length === 0 && posts.length === 0 && comments.length === 0 && !usersQuery.isError && (
        <p className="py-10 text-center text-muted-foreground">{t('search.empty')}</p>
      )}

      {query.length >= 2 && <>
        <section aria-labelledby="search-people-heading" className="space-y-3">
          <h2 id="search-people-heading" className="text-lg font-semibold">{t('search.people')}</h2>
          {users.length === 0 ? <p className="text-sm text-muted-foreground">{t('search.noPeople')}</p> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {users.map((user) => (
                <Link key={user.id} to={`/profile/${user.id}`}>
                  <Card className="h-full transition-colors hover:border-primary/50">
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
                      {user.profileImage ? <img src={resolveMediaUrl(user.profileImage)} alt="" className="h-12 w-12 rounded-full object-cover" /> : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary"><UserRound className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{user.displayName || user.username}</CardTitle>
                        <CardDescription className="truncate">@{user.username}</CardDescription>
                      </div>
                    </CardHeader>
                    {user.bio && <CardContent className="pt-0"><p className="line-clamp-2 text-sm text-muted-foreground">{user.bio}</p></CardContent>}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section aria-labelledby="search-posts-heading" className="space-y-3">
          <h2 id="search-posts-heading" className="text-lg font-semibold">{t('search.posts')}</h2>
          {posts.length === 0 ? <p className="text-sm text-muted-foreground">{t('search.noPosts')}</p> : (
            <div className="space-y-3">
              {posts.map((post) => <Link key={post.id} to={`/post/${post.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <CardDescription>{post.author.displayName || post.author.username} · @{post.author.username}</CardDescription>
                  </CardHeader>
                  <CardContent><p className="whitespace-pre-wrap">{post.content}</p></CardContent>
                </Card>
              </Link>)}
            </div>
          )}
        </section>
        <section aria-labelledby="search-comments-heading" className="space-y-3">
          <h2 id="search-comments-heading" className="text-lg font-semibold">{t('search.comments')}</h2>
          {comments.length === 0 ? <p className="text-sm text-muted-foreground">{t('search.noComments')}</p> : (
            <div className="space-y-3">
              {comments.map((comment) => <Link key={comment.id} to={`/post/${comment.postId}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="pb-2"><CardDescription>{comment.author.displayName || comment.author.username} · @{comment.author.username}</CardDescription></CardHeader>
                  <CardContent><p className="whitespace-pre-wrap">{comment.content}</p></CardContent>
                </Card>
              </Link>)}
            </div>
          )}
        </section>
        {usersQuery.data && usersQuery.data.users.pagination.totalPages > 1 && <div className="flex items-center justify-between">
          <Button variant="outline" disabled={peoplePage <= 1 || usersQuery.isFetching} onClick={() => setPeoplePage((current) => current - 1)}>{t('search.previous')}</Button>
          <span className="text-sm text-muted-foreground">{t('search.peoplePage', { page: peoplePage, total: usersQuery.data.users.pagination.totalPages })}</span>
          <Button variant="outline" disabled={peoplePage >= usersQuery.data.users.pagination.totalPages || usersQuery.isFetching} onClick={() => setPeoplePage((current) => current + 1)}>{t('search.next')}</Button>
        </div>}
        {usersQuery.data && usersQuery.data.posts.pagination.totalPages > 1 && <div className="flex items-center justify-between">
          <Button variant="outline" disabled={postsPage <= 1 || usersQuery.isFetching} onClick={() => setPostsPage((current) => current - 1)}>{t('search.previous')}</Button>
          <span className="text-sm text-muted-foreground">{t('search.postsPage', { page: postsPage, total: usersQuery.data.posts.pagination.totalPages })}</span>
          <Button variant="outline" disabled={postsPage >= usersQuery.data.posts.pagination.totalPages || usersQuery.isFetching} onClick={() => setPostsPage((current) => current + 1)}>{t('search.next')}</Button>
        </div>}
        {usersQuery.data && usersQuery.data.comments.pagination.totalPages > 1 && <div className="flex items-center justify-between">
          <Button variant="outline" disabled={commentsPage <= 1 || usersQuery.isFetching} onClick={() => setCommentsPage((current) => current - 1)}>{t('search.previous')}</Button>
          <span className="text-sm text-muted-foreground">{t('search.commentsPage', { page: commentsPage, total: usersQuery.data.comments.pagination.totalPages })}</span>
          <Button variant="outline" disabled={commentsPage >= usersQuery.data.comments.pagination.totalPages || usersQuery.isFetching} onClick={() => setCommentsPage((current) => current + 1)}>{t('search.next')}</Button>
        </div>}
      </>}
    </div>
  );
};