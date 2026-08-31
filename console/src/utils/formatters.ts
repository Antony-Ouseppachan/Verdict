export function formatTimestamp(ts: number | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number | undefined): string {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatThreatScore(score: number | undefined): { label: string; class: string } {
  if (score === undefined || score === null) return { label: 'N/A', class: 'score-na' };
  if (score >= 70) return { label: `${score}/100 HIGH RISK`, class: 'score-danger' };
  if (score >= 35) return { label: `${score}/100 MEDIUM RISK`, class: 'score-caution' };
  return { label: `${score}/100 LOW RISK`, class: 'score-safe' };
}
