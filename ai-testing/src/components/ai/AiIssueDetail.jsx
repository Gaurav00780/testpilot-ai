import { SeverityBadge } from '../ui/SeverityBadge';
import { BrowserBadge } from '../ui/BrowserBadge';
import { ConfidenceBar } from './ConfidenceBar';
import { CodeBlock } from '../ui/CodeBlock';

export function AiIssueDetail({ issue }) {
  if (!issue) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <SeverityBadge severity={issue.severity} size="sm" />
          <BrowserBadge browser={issue.browser} size="sm" />
          {issue.category && (
            <span className="tp-badge bg-tag-bg text-muted text-xs">{issue.category}</span>
          )}
        </div>
        <h3 className="font-medium text-ink text-sm leading-snug">{issue.title}</h3>
      </div>

      {/* Confidence */}
      <div>
        <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Confidence</p>
        <ConfidenceBar confidence={issue.confidence ?? 0} />
      </div>

      {/* Root Cause */}
      {issue.rootCause && (
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Root Cause</p>
          <p className="text-xs text-ink leading-relaxed bg-tag-bg rounded p-3">{issue.rootCause}</p>
        </div>
      )}

      {/* Affected Property */}
      {issue.affectedProperty && (
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Affected Property</p>
          <code className="text-xs font-mono bg-tag-bg px-2 py-1 rounded text-accent">{issue.affectedProperty}</code>
        </div>
      )}

      {/* Suggested Fix */}
      {issue.suggestedFix && (
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Suggested Fix</p>
          <CodeBlock code={issue.suggestedFix} language="css" />
        </div>
      )}

      {/* Browser Notes */}
      {issue.aiBrowserNotes && (
        <div>
          <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1.5">Browser Notes</p>
          <p className="text-xs text-muted leading-relaxed">{issue.aiBrowserNotes}</p>
        </div>
      )}
    </div>
  );
}
