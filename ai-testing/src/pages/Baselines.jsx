import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { parseRunId, formatDate } from '../utils/formatters';

function BaselineCard({ baseline }) {
  const { prefix, id } = parseRunId(baseline.runId || baseline.run_id);

  return (
    <div className="tp-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {baseline.branch && (
            <span className="tp-badge bg-tag-bg text-muted text-xs mb-2 inline-block">
              {baseline.branch}
            </span>
          )}
          <p className="text-xs text-ink break-all leading-snug font-medium">{baseline.url}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted">
        <div>
          <span className="font-mono uppercase tracking-wide text-[10px]">Run </span>
          <span className="font-mono"><span className="text-muted">{prefix}</span>{id}</span>
        </div>
        <span className="font-mono">{formatDate(baseline.createdAt || baseline.created_at)}</span>
      </div>

      {baseline.runId && (
        <Link
          to={`/runs/${baseline.runId}`}
          className="inline-block text-xs text-accent2 hover:text-accent font-semibold transition-colors"
        >
          View Run →
        </Link>
      )}
    </div>
  );
}

export default function Baselines() {
  const { data, isLoading } = useQuery({
    queryKey: ['baselines'],
    queryFn: async () => {
      const res = await api.get('/baselines');
      return res.data;
    },
    staleTime: 60_000,
  });

  const baselines = data?.baselines || data || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Baselines</h1>
        <p className="text-sm text-muted mt-1">Manage reference screenshots for visual comparison</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : baselines.length === 0 ? (
        <EmptyState
          icon="📌"
          title="No baselines yet"
          message="Promote a completed run to baseline to track visual regressions."
          action={{ label: 'View Run History', onClick: () => window.location.href = '/history' }}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {baselines.map((b, i) => (
            <BaselineCard key={b.id || i} baseline={b} />
          ))}
        </div>
      )}
    </div>
  );
}
