import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';
import type { User } from '../types';

interface UserSearchResult extends Pick<User, 'id' | 'username' | 'displayName' | 'bio' | 'profileImage'> {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  const usersQuery = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => api.searchUsers(query),
    enabled: query.length >= 2,
  });

  const users = (usersQuery.data?.items ?? []) as UserSearchResult[];

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
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('search.placeholder')}
          value={input}
        />
      </div>

      {usersQuery.isFetching && <p className="text-sm text-muted-foreground">{t('search.loading')}</p>}
      {usersQuery.isError && <p className="text-sm text-destructive">{t('errors.loadFailed')}</p>}
      {!usersQuery.isFetching && query.length >= 2 && users.length === 0 && !usersQuery.isError && (
        <p className="py-10 text-center text-muted-foreground">{t('search.empty')}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {users.map((user) => (
          <Link key={user.id} to={`/profile/${user.id}`}>
            <Card className="h-full transition-colors hover:border-primary/50">
              <CardHeader className="flex-row items-center gap-4 space-y-0 pb-3">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </div>
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
    </div>
  );
};