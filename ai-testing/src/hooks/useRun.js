import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const useRun = (runId) => {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.get(`/runs/${runId}`).then(r => r.data),
    enabled: !!runId,
    // Poll every 3 seconds while run is not complete
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      if (data.status === 'completed' || data.status === 'error') return false;
      return 3000;
    },
    staleTime: 0
  });
};

export default useRun;
