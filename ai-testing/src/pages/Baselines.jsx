import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { EmptyState } from '../components/ui/EmptyState';
import { parseRunId, formatDate } from '../utils/formatters';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, Bookmark } from 'lucide-react';

function BaselineCard({ baseline }) {
  const { prefix, id } = parseRunId(baseline.runId || baseline.run_id);

  return (
    <Card className="transition-shadow">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {baseline.branch && (
              <Badge variant="outline" className="mb-2 text-xs">
                {baseline.branch}
              </Badge>
            )}
            <p className="text-xs text-foreground break-all leading-snug font-medium">{baseline.url}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-mono uppercase tracking-wide text-[10px]">Run </span>
            <span className="font-mono"><span className="text-muted-foreground">{prefix}</span>{id}</span>
          </div>
          <span className="font-mono">{formatDate(baseline.createdAt || baseline.created_at)}</span>
        </div>

        {baseline.runId && (
          <Link to={`/runs/${baseline.runId}`}>
            <Button variant="link" size="sm" className="px-0 text-xs">
              View Run →
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Baselines</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage reference screenshots for visual comparison</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : baselines.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No baselines yet"
          message="Promote a completed run to baseline to track visual regressions."
          action={{ label: 'View Run History', onClick: () => window.location.href = '/history' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baselines.map((b, i) => (
            <BaselineCard key={b.id || i} baseline={b} />
          ))}
        </div>
      )}
    </div>
  );
}
