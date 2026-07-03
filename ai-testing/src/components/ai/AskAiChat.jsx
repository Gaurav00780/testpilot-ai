import { useState, useRef, useEffect } from 'react';
import useAskAi from '../../hooks/useAskAi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

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
      return <div key={i} className="bg-muted/30 p-2 rounded text-xs font-mono my-1 overflow-x-auto">{line}</div>;
    }

    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    return (
      <div key={i} className="min-h-[1.25rem]">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={j} className="bg-muted/30 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

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
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ask AI</p>

      {messages.length === 0 ? (
        <div className="py-6 px-4 text-center">
          <p className="text-muted-foreground italic text-xs leading-relaxed">
            Ask anything about this issue — root cause, browser compatibility, alternative fixes, or MDN links.
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-64 pr-2">
          <div className="space-y-4 flex flex-col">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    text-sm p-3
                    ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-lg rounded-tr-sm max-w-[80%]'
                      : 'bg-card border text-card-foreground rounded-lg rounded-tl-sm max-w-[85%]'
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
        </ScrollArea>
      )}

      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          disabled={isStreaming}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          size="icon"
        >
          →
        </Button>
      </div>
    </div>
  );
}
