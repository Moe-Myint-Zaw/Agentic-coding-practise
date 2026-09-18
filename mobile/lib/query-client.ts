import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-client';
import { authStorage } from './auth-storage';
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 2 } } });
export async function clearSessionQueries() { await authStorage.clear(); queryClient.clear(); }