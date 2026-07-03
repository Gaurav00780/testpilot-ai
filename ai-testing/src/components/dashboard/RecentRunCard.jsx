import { Link } from 'react-router-dom';
import { VerdictBadge } from '../ui/VerdictBadge';
import { formatTimeAgo, truncate } from '../../utils/formatters';
import { getBrowserConfig } from '../../utils/browserIcons';

export function RecentRunCard({ run }) {
  const duration = run.duration ? `${Math.round(run.duration / 1000)}s` : '-';
  const issues = run.summary?.totalIssues || 0;

  return (
    <div className="group block hover:bg-muted/30 transition-colors">
      <Link to={`/runs/${run.id}`} className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-4 px-5 py-3 items-center text-sm">
        <div className="col-span-1 truncate font-medium text-foreground">
          {truncate(run.url, 30)}
        </div>

        <div className="col-span-1 hidden sm:flex justify-center gap-1">
          {run.browsers?.map(b => {
            const { Icon, color } = getBrowserConfig(b);
            return <Icon key={b} size={16} style={{ color }} />;
          })}
        </div>

        <div className="col-span-1 flex justify-center">
          <VerdictBadge verdict={run.verdict} size="sm" />
        </div>

        <div className="col-span-1 text-center font-mono text-xs hidden md:block">
          <span className={issues > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {issues}
          </span>
        </div>

        <div className="col-span-1 text-right font-mono text-xs text-muted-foreground hidden sm:block">
          {duration}
        </div>

        <div className="col-span-1 text-right text-xs text-muted-foreground truncate">
          {formatTimeAgo(run.createdAt)}
        </div>
      </Link>
    </div>
  );
}
