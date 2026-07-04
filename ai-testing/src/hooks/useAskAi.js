import { useState } from 'react';

const useAskAi = (runId) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const ask = async (question, issueId = null) => {
    // 1. Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      id: Date.now()
    }]);

    // 2. Add empty AI message placeholder
    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, {
      role: 'ai',
      content: '',
      id: aiMsgId,
      streaming: true
    }]);

    setIsStreaming(true);

    try {
      // 3. Fetch SSE stream
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${baseUrl}/runs/${runId}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, issueId })
        }
      );

      // 4. Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.chunk) {
              // Append chunk to the AI message
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId
                  ? { ...m, content: m.content + payload.chunk }
                  : m
              ));
            }

            if (payload.done) {
              // Mark message as complete
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? { ...m, streaming: false } : m
              ));
              setIsStreaming(false);
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? { ...m, content: m.content || 'Failed to connect to AI.', streaming: false, error: true } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, isStreaming, ask, clearMessages };
};

export default useAskAi;
