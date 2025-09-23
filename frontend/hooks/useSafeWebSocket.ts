"use client";
import { useEffect, useRef } from "react";

export type WSHandlers = {
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (ev: MessageEvent) => void;
  onError?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
};

export function useSafeWebSocket(url: string, handlers: WSHandlers = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const inited = useRef(false); // StrictMode: 이펙트 2회 보호
  const ignoreFirstCleanup = useRef(true); // 첫 cleanup 무시
  const retryRef = useRef(0);
  const pingTimer = useRef<any>(null);
  const reconnectTimer = useRef<any>(null);

  const connect = () => {
    // 중복 연결 방지
    if (
      wsRef.current &&
      [WebSocket.OPEN, WebSocket.CONNECTING].includes(
        wsRef.current.readyState as 0 | 1
      )
    )
      return;

    try {
      wsRef.current = new WebSocket(url);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    wsRef.current.onopen = () => {
      retryRef.current = 0;
      // keepalive (선택)
      pingTimer.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send('{"kind":"ping"}');
        }
      }, 25000);
      handlers.onOpen?.(wsRef.current!);
    };

    wsRef.current.onmessage = (ev) => handlers.onMessage?.(ev);
    wsRef.current.onerror = (ev) => handlers.onError?.(ev); // 여기서 close() 호출 X
    wsRef.current.onclose = (ev) => {
      clearInterval(pingTimer.current);
      handlers.onClose?.(ev);
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    const delay = Math.min(30000, 1000 * Math.pow(2, retryRef.current++));
    clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(connect, delay);
  };

  useEffect(() => {
    if (inited.current) return; // StrictMode 2회 실행 방지
    inited.current = true;

    connect();

    return () => {
      // StrictMode의 "첫 번째 cleanup"은 무시
      if (ignoreFirstCleanup.current) {
        ignoreFirstCleanup.current = false;
        return;
      }
      clearInterval(pingTimer.current);
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
