import { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, Trash2, Search, Filter, ArrowDown, Loader2 } from 'lucide-react';
import { socketService } from '../services/socket';
import { getLogs } from '../services/api';
import type { LogEntry } from '../types';

const MAX_LOGS = 500;

type LogLevel = 'all' | 'info' | 'warn' | 'error';

export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<LogLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const pausedRef = useRef(false);

  // Keep pausedRef in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Load initial logs
  useEffect(() => {
    getLogs({ limit: MAX_LOGS })
      .then((data) => {
        setLogs(data);
        setInitialLoading(false);
      })
      .catch(() => {
        setInitialLoading(false);
      });
  }, []);

  // Subscribe to real-time logs
  useEffect(() => {
    const unsub = socketService.onLog((entry) => {
      if (pausedRef.current) return;
      setLogs((prev) => {
        const next = [...prev, entry];
        if (next.length > MAX_LOGS) {
          return next.slice(next.length - MAX_LOGS);
        }
        return next;
      });
    });

    return unsub;
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current && !paused) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 60;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      shouldAutoScroll.current = true;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.level !== filter) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const levelColorClass = (level: string) => {
    switch (level) {
      case 'info':
        return 'log-info';
      case 'warn':
        return 'log-warn';
      case 'error':
        return 'log-error';
      default:
        return 'text-text-secondary';
    }
  };

  const levelBadge = (level: string) => {
    const base = 'inline-flex items-center justify-center w-12 text-[0.6rem] font-bold uppercase rounded px-1 py-0.5';
    switch (level) {
      case 'info':
        return `${base} bg-info/15 text-info`;
      case 'warn':
        return `${base} bg-warning/15 text-warning`;
      case 'error':
        return `${base} bg-error/15 text-error`;
      default:
        return `${base} bg-surface-hover text-text-muted`;
    }
  };

  const filterButtons: { id: LogLevel; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'info', label: 'Info' },
    { id: 'warn', label: 'Warn' },
    { id: 'error', label: 'Error' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary">Logs</h2>
        <p className="text-sm text-text-secondary mt-1">
          Registro de actividad en tiempo real — {logs.length} entradas
        </p>
      </div>

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-text-muted mr-1" />
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              id={`log-filter-${btn.id}`}
              onClick={() => setFilter(btn.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === btn.id
                  ? 'bg-whatsapp/15 text-whatsapp'
                  : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="log-search"
            type="text"
            placeholder="Buscar en logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-surface-hover/60 border border-border pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-whatsapp/30 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:ml-auto">
          <button
            id="log-pause"
            onClick={() => setPaused(!paused)}
            className={`rounded-lg p-2 transition-colors ${
              paused
                ? 'bg-warning/15 text-warning'
                : 'text-text-muted hover:bg-surface-hover hover:text-text-secondary'
            }`}
            title={paused ? 'Reanudar' : 'Pausar'}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            id="log-scroll-bottom"
            onClick={scrollToBottom}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-secondary transition-colors"
            title="Ir al final"
          >
            <ArrowDown size={14} />
          </button>
          <button
            id="log-clear"
            onClick={clearLogs}
            className="rounded-lg p-2 text-text-muted hover:bg-error/15 hover:text-error transition-colors"
            title="Limpiar vista"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Paused indicator */}
      {paused && (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/10 border border-warning/20 px-3 py-1.5 mb-3 text-xs text-warning font-medium shrink-0">
          <Pause size={12} />
          Streaming pausado — los nuevos logs se ignoran
        </div>
      )}

      {/* Log Terminal */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 glass rounded-2xl overflow-y-auto log-terminal p-4 space-y-0.5 min-h-0"
      >
        {initialLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="text-whatsapp animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">
            {logs.length === 0 ? 'Sin logs disponibles' : 'Sin resultados para el filtro actual'}
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div
              key={`${log.timestamp}-${i}`}
              className="flex items-start gap-2 py-0.5 px-1 rounded hover:bg-surface-hover/30 transition-colors group"
            >
              <span className="text-text-muted shrink-0 text-[0.65rem] mt-0.5 w-[70px]">
                {new Date(log.timestamp).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={`shrink-0 mt-0.5 ${levelBadge(log.level)}`}>
                {log.level}
              </span>
              <span className={`${levelColorClass(log.level)} break-all leading-relaxed`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
