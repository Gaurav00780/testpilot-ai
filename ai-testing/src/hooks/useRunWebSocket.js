import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_URL = 'ws://localhost:3001/ws';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const useRunWebSocket = (runId) => {
  const [wsState, setWsState] = useState({
    stage: null,
    message: null,
    liveIssues: {},
    error: null,
    connected: false,
  });

  const queryClient = useQueryClient();
  const retryCount = useRef(0);
  const wsRef = useRef(null);
  const completedRef = useRef(false); // track if run:completed was received

  useEffect(() => {
    if (!runId) return;

    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        retryCount.current = 0;
        ws.send(JSON.stringify({ type: 'subscribe', runId }));
        setWsState(prev => ({ ...prev, connected: true, error: null }));
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }

        if (msg.event === 'run:progress') {
          setWsState(prev => ({
            ...prev,
            stage: msg.stage,
            message: msg.message,
          }));
        }

        if (msg.event === 'run:ai_issues') {
          setWsState(prev => ({
            ...prev,
            liveIssues: {
              ...prev.liveIssues,
              [msg.browser]: msg.issues,
            },
          }));
        }

        if (msg.event === 'run:completed') {
          completedRef.current = true;
          queryClient.invalidateQueries({ queryKey: ['run', runId] });
          setWsState(prev => ({ ...prev, stage: 'completed', message: null, error: null }));
          ws.close();
        }

        if (msg.event === 'run:error') {
          setWsState(prev => ({ ...prev, error: msg.error }));
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        // Don't show error if the run already completed successfully
        if (completedRef.current) return;

        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setWsState(prev => ({
            ...prev,
            connected: false,
            message: `Connection lost, retrying (${retryCount.current}/${MAX_RETRIES})...`,
          }));
          setTimeout(connect, RETRY_DELAY_MS);
        } else {
          setWsState(prev => ({
            ...prev,
            connected: false,
            error: 'WebSocket connection failed after multiple retries. The run may still be processing.',
          }));
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        // Normal close after completion — do nothing
        if (completedRef.current) return;

        // Unexpected close — retry
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setTimeout(connect, RETRY_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent retry loop on intentional unmount
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [runId, queryClient]);

  return wsState;
};

export default useRunWebSocket;
