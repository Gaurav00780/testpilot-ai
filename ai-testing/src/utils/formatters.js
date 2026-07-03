/**
 * Format a date string into a human-readable relative time
 * @param {string|Date} date
 * @returns {string}
 */
export function formatTimeAgo(date) {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60)  return 'just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a full date+time
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a mismatch percent value
 * @param {number} pct  — raw number e.g. 0.042
 * @returns {string}    — e.g. "4.20%"
 */
export function formatMismatch(pct) {
  if (pct === null || pct === undefined) return '—';
  return pct.toFixed(2) + '%';
}

/**
 * Format duration between two dates
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
export function formatDuration(start, end) {
  if (!start || !end) return '—';
  const ms = new Date(end) - new Date(start);
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60)  return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

/**
 * Truncate a string to maxLen chars
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 48) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Format a run ID for display — splits at "run_" prefix
 * Returns { prefix: "run_", id: "xk92pqm" }
 */
export function parseRunId(runId) {
  if (!runId) return { prefix: '', id: '' };
  if (runId.startsWith('run_')) {
    return { prefix: 'run_', id: runId.slice(4) };
  }
  return { prefix: '', id: runId };
}
