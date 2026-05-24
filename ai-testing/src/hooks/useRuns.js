import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Fetch all runs with optional pagination.
 */
export function useRuns({ page = 1, limit = 20, filter = 'all' } = {}) {
  return useQuery({
    queryKey: ['runs', page, limit, filter],
    queryFn: async () => {
      const res = await api.get('/runs', { params: { page, limit, filter } });
      return res.data;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
