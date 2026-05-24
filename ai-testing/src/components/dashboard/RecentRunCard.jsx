import { Link } from 'react-router-dom';
import { VerdictBadge } from '../ui/VerdictBadge';
import { formatTimeAgo, truncate } from '../../utils/formatters';
import { getBrowserConfig } from '../../utils/browserIcons';

export function RecentRunCard({ run }) {
  const duration = run.duration ? `${Math.round(run.duration / 1000)}s` : '-';
  const issues = run.summary?.totalIssues || 0;

  return (
    <div className="group block hover:bg-gray-50/50 transition-colors">
      <Link to={`/runs/${run.id}`} className="grid grid-cols-6 gap-4 px-5 py-3 items-center text-sm">
        {/* URL */}
        <div className="col-span-1 truncate font-medium text-ink">
          {truncate(run.url, 30)}
        </div>

        {/* Browsers */}
        <div className="col-span-1 flex justify-center gap-1">
          {run.browsers?.map(b => {
            const { Icon, color } = getBrowserConfig(b);
            return <Icon key={b} size={16} style={{ color }} />;
          })}
        </div>

        {/* Status */}
        <div className="col-span-1 flex justify-center">
          <VerdictBadge verdict={run.verdict} size="sm" />
        </div>

        {/* Issues */}
        <div className="col-span-1 text-center font-mono text-xs">
          <span className={issues > 0 ? 'text-red font-medium' : 'text-muted'}>
            {issues}
          </span>
        </div>

        {/* Duration */}
        <div className="col-span-1 text-right font-mono text-xs text-muted">
          {duration}
        </div>

        {/* Started At */}
        <div className="col-span-1 text-right text-xs text-muted">
          {formatTimeAgo(run.createdAt)}
        </div>
      </Link>
    </div>
  );
}
