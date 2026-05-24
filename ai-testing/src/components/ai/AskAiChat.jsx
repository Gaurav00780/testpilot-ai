import { useState, useRef, useEffect } from 'react';
import useAskAi from '../../hooks/useAskAi';

function renderMarkdown(text, isStreaming) {
  if (!text && !isStreaming) return null;
  const lines = (text || '').split('\n');
  let inCodeBlock = false;
  
  const rendered = lines.map((line, i) => {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return null;
    }
    if (inCodeBlock) {
      return <div key={i} className="bg-tag-bg p-2 rounded text-xs font-mono my-1 overflow-x-auto">{line}</div>;
    }
    
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return (
      <div key={i} className="min-h-[1.25rem]">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={j} className="bg-tag-bg px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          }
          return <span key={j}>{part}</span>;
        })}
      </div>
    );
  });

  if (isStreaming) {
    rendered.push(<span key="cursor" className="animate-pulse inline-block ml-1">▌</span>);
  }
  
  return rendered;
}

export function AskAiChat({ runId, issueId }) {
  const [input, setInput] = useState('');
  const { messages, isStreaming, ask, clearMessages } = useAskAi(runId);
  const bottomRef = useRef(null);

  useEffect(() => {
    clearMessages();
  }, [issueId, clearMessages]); // clear messages when issue changes

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput('');
    ask(q, issueId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-mono text-muted uppercase tracking-wider">Ask AI</p>

      {messages.length === 0 ? (
        <div className="py-6 px-4 text-center">
          <p className="text-muted italic text-xs leading-relaxed">
            Ask anything about this issue — root cause, browser compatibility, alternative fixes, or MDN links.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin pr-2 flex flex-col">
          {messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  text-sm p-3 
                  ${msg.role === 'user' 
                    ? 'bg-accent text-white rounded-lg rounded-tr-sm max-w-[80%]' 
                    : 'bg-card border border-border text-ink rounded-lg rounded-tl-sm max-w-[85%]'
                  }
                `}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  renderMarkdown(msg.content, msg.streaming)
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          disabled={isStreaming}
          className="
            flex-1 text-sm px-3 py-2 rounded border border-border bg-paper
            text-ink placeholder-muted outline-none
            focus:border-accent2 transition-colors disabled:opacity-50
          "
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 bg-ink text-white text-sm font-medium rounded hover:bg-accent transition-colors disabled:opacity-40 flex items-center justify-center min-w-[44px]"
        >
          →
        </button>
      </div>
    </div>
  );
}
