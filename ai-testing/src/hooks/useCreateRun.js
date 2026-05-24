import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

/**
 * Mutation to create a new test run.
 * On success, invalidates the runs list cache.
 */
export function useCreateRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/runs', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}
