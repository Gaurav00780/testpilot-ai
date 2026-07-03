import { Progress } from './progress';

export function ProgressBar({ value = 0, max = 100 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return <Progress value={pct} />;
}
