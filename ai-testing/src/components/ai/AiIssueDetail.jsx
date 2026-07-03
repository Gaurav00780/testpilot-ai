import { SeverityBadge } from '../ui/SeverityBadge';
import { BrowserBadge } from '../ui/BrowserBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { CodeBlock } from '../ui/CodeBlock';
import { Badge } from '../ui/badge';

export function AiIssueDetail({ issue }) {
  if (!issue) return null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <SeverityBadge severity={issue.severity} size="sm" />
          <BrowserBadge browser={issue.browser} size="sm" />
          {issue.category && (
            <Badge variant="secondary" className="text-xs">{issue.category}</Badge>
          )}
        </div>
        <h3 className="font-medium text-foreground text-sm leading-snug">{issue.title}</h3>
      </div>

      <div>
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Confidence</p>
        <ConfidenceBar confidence={issue.confidence ?? 0} />
      </div>

      {issue.rootCause && (
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Root Cause</p>
          <p className="text-xs text-foreground leading-relaxed bg-muted/30 rounded p-3">{issue.rootCause}</p>
        </div>
      )}

      {issue.affectedProperty && (
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Affected Property</p>
          <code className="text-xs font-mono bg-muted/30 px-2 py-1 rounded text-accent">{issue.affectedProperty}</code>
        </div>
      )}

      {issue.suggestedFix && (
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Suggested Fix</p>
          <CodeBlock code={issue.suggestedFix} language="css" />
        </div>
      )}

      {issue.aiBrowserNotes && (
        <div>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Browser Notes</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{issue.aiBrowserNotes}</p>
        </div>
      )}
    </div>
  );
}
