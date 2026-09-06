import React, { useState, useEffect, useCallback } from 'react';
import { socket } from '../socket';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

export type ConnectionState = 'Connected' | 'Disconnected' | 'Connecting';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>(() => {
    if (socket.connected) return 'Connected';
    // If socket is actively attempting to connect
    return socket.active ? 'Connecting' : 'Connecting';
  });
  const [latency, setLatency] = useState<number | null>(null);
  const [transport, setTransport] = useState<string>('websocket');

  const checkLatency = useCallback(() => {
    if (!socket.connected) {
      setLatency(null);
      return;
    }
    const start = performance.now();
    socket.emit('ping_check', () => {
      const delta = Math.round(performance.now() - start);
      setLatency(delta);
      const activeTransport = socket.io.engine?.transport?.name || 'websocket';
      setTransport(activeTransport);
    });
  }, []);

  const reconnect = useCallback(() => {
    setStatus('Connecting');
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setStatus('Connected');
      checkLatency();
    };

    const handleDisconnect = (reason: string) => {
      console.warn('[Socket] Disconnected:', reason);
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        setStatus('Disconnected');
      } else {
        // Socket.io will automatically try to reconnect for other reasons
        setStatus('Connecting');
      }
      setLatency(null);
    };

    const handleConnectError = (error: Error) => {
      console.warn('[Socket] Connect error:', error.message);
      setStatus('Disconnected');
      setLatency(null);
    };

    const handleReconnectAttempt = () => {
      setStatus('Connecting');
    };

    const handleReconnect = () => {
      setStatus('Connected');
      checkLatency();
    };

    const handleReconnectFailed = () => {
      setStatus('Disconnected');
    };

    const handleOnline = () => {
      setStatus('Connecting');
      socket.connect();
    };

    const handleOffline = () => {
      setStatus('Disconnected');
      setLatency(null);
    };

    // Initial state check
    if (socket.connected) {
      setStatus('Connected');
      checkLatency();
    } else {
      setStatus('Connecting');
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic latency health check every 12 seconds when connected
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        checkLatency();
      }
    }, 12000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, [checkLatency]);

  return { status, latency, transport, reconnect };
}

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionStatus({ className = '', showDetails = true }: ConnectionStatusProps) {
  const { status, latency, transport, reconnect } = useConnectionStatus();

  return (
    <div 
      id="connection-status-indicator"
      className={clsx(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 border transition-all select-none",
        status === 'Connected' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        status === 'Connecting' && "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse",
        status === 'Disconnected' && "bg-rose-500/15 text-rose-400 border-rose-500/40",
        className
      )}
      title={
        status === 'Connected' 
          ? `WebSocket Connected (${transport}${latency !== null ? ` | ${latency}ms latency` : ''})`
          : status === 'Connecting'
          ? 'Attempting WebSocket handshake with duel arena node...'
          : 'Disconnected from arena server. Click to retry connection.'
      }
    >
      {/* State Icon & Indicator Dot */}
      <div className="flex items-center gap-1.5">
        {status === 'Connected' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
        {status === 'Connecting' && (
          <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
        )}
        {status === 'Disconnected' && (
          <WifiOff className="w-3 h-3 text-rose-400" />
        )}

        {/* State Label: Connected | Connecting | Disconnected */}
        <span className="tracking-widest font-black">
          {status}
        </span>
      </div>

      {/* Latency and Details */}
      {showDetails && status === 'Connected' && latency !== null && (
        <span className="hidden sm:inline-block text-[9px] text-zinc-500 border-l border-emerald-500/20 pl-1.5 font-mono">
          {latency}ms
        </span>
      )}

      {/* Reconnect Action button when disconnected */}
      {status === 'Disconnected' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reconnect();
          }}
          className="ml-1 px-1.5 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:border-rose-400 text-[9px] font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
          title="Attempt immediate reconnection to arena socket server"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>RETRY</span>
        </button>
      )}
    </div>
  );
}
