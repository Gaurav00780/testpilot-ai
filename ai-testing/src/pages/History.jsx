import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRuns } from '../hooks/useRuns';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { BrowserBadge } from '../components/ui/BrowserBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { parseRunId, formatDate, formatDuration, truncate } from '../utils/formatters';
import api from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Trash2, Eye, Plus, Inbox } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

const FILTERS = ['all', 'pass', 'warn', 'fail'];

export default function History() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const LIMIT = 20;

  const { data, isLoading } = useRuns({ page, limit: LIMIT, filter });
  const runs = data?.runs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/runs/${deleteTarget}`);
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      toast.success('Run deleted');
    } catch {
      toast.error('Failed to delete run');
    } finally {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Run History</h1>
        <Link to="/runs/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Run
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilter(f); setPage(1); }}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
        {total > 0 && (
          <span className="ml-auto text-xs text-muted-foreground font-mono">{total} runs</span>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No runs found"
            message={filter !== 'all' ? `No ${filter.toUpperCase()} runs to show.` : 'Start your first visual test.'}
            action={{ label: 'Start your first test', onClick: () => window.location.href = '/runs/new' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Verdict</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Run ID</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">URL</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Browsers</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Issues</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Duration</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const { prefix, id } = parseRunId(run.id);
                return (
                  <TableRow key={run.id} className="hover:bg-muted/30">
                    <TableCell><VerdictBadge verdict={run.verdict} size="sm" /></TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        <span className="text-muted-foreground">{prefix}</span>{id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground max-w-xs block truncate">{truncate(run.url, 45)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(run.browsers || []).map((b) => (
                          <BrowserBadge key={b} browser={b} size="xs" showIcon={false} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-mono font-semibold ${(run.summary?.criticalIssues || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                        {run.summary?.totalIssues ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatDuration(run.createdAt, run.completedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {formatDate(run.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/runs/${run.id}`}>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Dialog open={deleteOpen && deleteTarget === run.id} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-destructive"
                              onClick={() => { setDeleteTarget(run.id); setDeleteOpen(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Run</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this run? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </Button>
          <span className="text-xs text-muted-foreground font-mono">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
