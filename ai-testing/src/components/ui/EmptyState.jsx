export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4" role="img" aria-label={title}>{icon}</div>
      <h3 className="font-serif text-xl text-ink mb-2">{title}</h3>
      {message && <p className="text-muted text-sm max-w-xs mb-6">{message}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="bg-accent text-white px-4 py-2 rounded text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
