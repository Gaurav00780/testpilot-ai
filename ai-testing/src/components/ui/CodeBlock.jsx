export function CodeBlock({ code, language = 'css' }) {
  if (!code) return null;
  return (
    <div className="relative">
      <div className="bg-ink rounded-[6px] overflow-auto max-h-64 scrollbar-thin">
        {language && (
          <div className="px-3 py-1 border-b border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
              {language}
            </span>
          </div>
        )}
        <pre className="p-4 text-xs font-mono text-white/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
