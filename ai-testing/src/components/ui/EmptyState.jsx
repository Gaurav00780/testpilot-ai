import { Button } from './button';
import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
        {Icon ? (
          typeof Icon === 'string'
            ? <Inbox className="w-6 h-6 text-muted-foreground" />
            : <Icon className="w-6 h-6 text-muted-foreground" />
        ) : (
          <Inbox className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      {title && <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>}
      {message && <p className="text-muted-foreground text-sm max-w-xs mb-6">{message}</p>}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
