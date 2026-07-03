import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }[size];

  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizeClass, className)}
      role="status"
      aria-label="Loading"
    />
  );
}
