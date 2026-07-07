import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const getWsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
  try {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  } catch (e) {
    return `ws://${window.location.hostname}:3001/ws`;
  }
};

const WS_URL = getWsUrl();
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const POLL_INTERVAL_MS = 4000;

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
  const completedRef = useRef(false);
  const pollTimerRef = useRef(null);

  // Poll the HTTP API when WS is unavailable — handles slow AI models
  const startPolling = (runIdToPoll, isMountedFn) => {
    if (pollTimerRef.current) return; // already polling
    console.log('[WS] Falling back to HTTP polling for run:', runIdToPoll);

    setWsState(prev => ({
      ...prev,
      connected: false,
      message: 'Checking status in background...',
    }));

    pollTimerRef.current = setInterval(async () => {
      if (!isMountedFn()) {
        clearInterval(pollTimerRef.current);
        return;
      }
      try {
        const res = await api.get(`/runs/${runIdToPoll}`);
        const run = res.data;
        if (run.status === 'completed' || run.status === 'error') {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          completedRef.current = true;
          queryClient.invalidateQueries({ queryKey: ['run', runIdToPoll] });
          setWsState(prev => ({
            ...prev,
            stage: run.status,
            message: null,
            error: run.status === 'error' ? 'Run failed on the server.' : null,
          }));
        }
      } catch (e) {
        console.warn('[WS] Polling error:', e.message);
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!runId) return;

    let isMounted = true;
    const isMountedFn = () => isMounted;

    function connect() {
      if (!isMounted) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) return;
        retryCount.current = 0;
        // Clear any fallback polling since WS is back
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        ws.send(JSON.stringify({ type: 'subscribe', runId }));
        setWsState(prev => ({ ...prev, connected: true, error: null, message: null }));
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
          completedRef.current = true;
          queryClient.invalidateQueries({ queryKey: ['run', runId] });
          setWsState(prev => ({ ...prev, error: msg.error }));
          ws.close();
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        if (completedRef.current) return;

        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setWsState(prev => ({
            ...prev,
            connected: false,
            message: `Reconnecting... (${retryCount.current}/${MAX_RETRIES})`,
          }));
          setTimeout(connect, RETRY_DELAY_MS);
        } else {
          // All retries exhausted — fall back to HTTP polling instead of showing error
          startPolling(runId, isMountedFn);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        if (completedRef.current) return;

        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          setTimeout(connect, RETRY_DELAY_MS);
        } else {
          // All retries exhausted — fall back to HTTP polling
          startPolling(runId, isMountedFn);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [runId, queryClient]);

  return wsState;
};

export default useRunWebSocket;
