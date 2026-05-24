import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRuns } from '../hooks/useRuns';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { BrowserBadge } from '../components/ui/BrowserBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { parseRunId, formatDate, formatDuration, truncate } from '../utils/formatters';
import api from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';

const FILTERS = ['all', 'pass', 'warn', 'fail'];

export default function History() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage]     = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useRuns({ page, limit: LIMIT, filter });
  const runs  = data?.runs  || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleDelete = async (runId) => {
    if (!confirm('Delete this run?')) return;
    try {
      await api.delete(`/runs/${runId}`);
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    } catch {
      alert('Failed to delete run');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-ink">Run History</h1>
        <Link
          to="/runs/new"
          className="bg-accent text-white text-sm px-4 py-2 rounded font-semibold hover:bg-opacity-90 transition-colors"
        >
          + New Run
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded border transition-colors capitalize font-medium ${
              filter === f
                ? 'border-ink bg-ink text-white'
                : 'border-border text-muted hover:border-ink hover:text-ink'
            }`}
          >
            {f}
          </button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-xs text-muted font-mono">{total} runs</span>
        )}
      </div>

      {/* Table */}
      <div className="tp-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No runs found"
            message={filter !== 'all' ? `No ${filter.toUpperCase()} runs to show.` : 'Start your first visual test.'}
            action={{ label: 'Start your first test →', onClick: () => window.location.href = '/runs/new' }}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-paper">
                {['Verdict', 'Run ID', 'URL', 'Browsers', 'Issues', 'Duration', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const { prefix, id } = parseRunId(run.id);
                return (
                  <tr key={run.id} className="border-b border-border last:border-0 hover:bg-tag-bg transition-colors">
                    <td className="px-4 py-3">
                      <VerdictBadge verdict={run.verdict} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        <span className="text-muted">{prefix}</span>{id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted max-w-xs block truncate">{truncate(run.url, 45)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(run.browsers || []).map((b) => (
                          <BrowserBadge key={b} browser={b} size="xs" showIcon={false} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-semibold ${
                        (run.summary?.criticalIssues || 0) > 0 ? 'text-red' : 'text-muted'
                      }`}>
                        {run.summary?.totalIssues ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted">
                        {formatDuration(run.createdAt, run.completedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted whitespace-nowrap">
                        {formatDate(run.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/runs/${run.id}`}
                          className="text-xs text-accent2 hover:text-accent font-semibold transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(run.id)}
                          className="text-xs text-muted hover:text-red transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-ink hover:border-ink transition-colors disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
