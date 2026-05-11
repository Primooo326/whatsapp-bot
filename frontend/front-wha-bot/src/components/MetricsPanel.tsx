import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  MessageSquare, MessageSquareX, Users, AlertTriangle, Image, FileText,
  Globe, Clock, RefreshCw, TrendingUp, Loader2,
} from 'lucide-react';
import { getMetrics, getMonthlyReport } from '../services/api';
import type { MetricsData, MonthlyReport } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon, color, bgColor }: StatCardProps) {
  return (
    <div className="glass glass-hover rounded-2xl p-5 transition-all duration-200 cursor-default flex flex-col justify-between h-full min-h-[110px]">
      <div className="flex items-start justify-between w-full">
        <p className="text-[0.8rem] text-text-muted font-semibold tracking-wide uppercase">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold mt-3 ${color}`}>
        {value.toLocaleString('es-CO')}
      </p>
    </div>
  );
}

const CHART_COLORS = ['#25D366', '#ef4444', '#06b6d4', '#f59e0b'];

export function MetricsPanel() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [metricsData, monthlyData] = await Promise.all([
        getMetrics(),
        getMonthlyReport(new Date().getFullYear(), new Date().getMonth() + 1),
      ]);
      setMetrics(metricsData);
      setMonthly(monthlyData);
    } catch (err: any) {
      setError(err.message || 'Error cargando métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <Loader2 size={32} className="text-whatsapp animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-fade-in">
        <AlertTriangle size={32} className="text-warning mx-auto mb-3" />
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={fetchAll}
          className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-surface-hover px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  const { today } = metrics;

  const statCards: StatCardProps[] = [
    { label: 'Mensajes Enviados', value: today.messagesSent, icon: <MessageSquare size={16} className="text-success" />, color: 'text-success', bgColor: 'bg-success/10' },
    { label: 'Mensajes Fallidos', value: today.messagesFailed, icon: <MessageSquareX size={16} className="text-error" />, color: 'text-error', bgColor: 'bg-error/10' },
    { label: 'Grupos Enviados', value: today.groupMessagesSent, icon: <Users size={16} className="text-info" />, color: 'text-info', bgColor: 'bg-info/10' },
    { label: 'Grupos Fallidos', value: today.groupMessagesFailed, icon: <AlertTriangle size={16} className="text-warning" />, color: 'text-warning', bgColor: 'bg-warning/10' },
    { label: 'Media Enviados', value: today.mediaSent, icon: <Image size={16} className="text-accent-light" />, color: 'text-accent-light', bgColor: 'bg-accent/10' },
    { label: 'Media Fallidos', value: today.mediaFailed, icon: <Image size={16} className="text-error" />, color: 'text-error', bgColor: 'bg-error/10' },
    { label: 'Archivos Enviados', value: today.filesSent, icon: <FileText size={16} className="text-whatsapp" />, color: 'text-whatsapp', bgColor: 'bg-whatsapp/10' },
    { label: 'Archivos Fallidos', value: today.filesFailed, icon: <FileText size={16} className="text-error" />, color: 'text-error', bgColor: 'bg-error/10' },
    { label: 'API Requests', value: today.apiRequests, icon: <Globe size={16} className="text-info" />, color: 'text-info', bgColor: 'bg-info/10' },
    { label: 'API Errors', value: today.apiErrors, icon: <AlertTriangle size={16} className="text-error" />, color: 'text-error', bgColor: 'bg-error/10' },
  ];

  // Chart data from monthly breakdown
  const chartData = monthly?.dailyBreakdown?.slice(-7).map((d) => ({
    date: new Date(d.date + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    Enviados: d.messagesSent + d.groupMessagesSent,
    Fallidos: d.messagesFailed + d.groupMessagesFailed,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Métricas</h2>
          <p className="text-sm text-text-secondary mt-1">Estadísticas de uso del bot — hoy</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Clock size={12} />
          <span>Avg Response: {metrics.avgResponseTimeMs.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-whatsapp" />
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Últimos 7 días
            </h3>
          </div>
          <div className="h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Enviados" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[0]} />
                  ))}
                </Bar>
                <Bar dataKey="Fallidos" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Recipients & Groups */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Top Recipients */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Top Destinatarios
          </h3>
          {metrics.topRecipients.sent.length === 0 ? (
            <p className="text-sm text-text-muted">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {metrics.topRecipients.sent.slice(0, 5).map((r, i) => (
                <div key={r.recipient} className="flex items-center justify-between rounded-xl bg-surface/40 hover:bg-surface/60 transition-colors px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-whatsapp/10 text-[0.65rem] font-bold text-whatsapp">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary font-mono">{r.recipient}</span>
                  </div>
                  <span className="rounded-lg bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                    {r.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Groups */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Top Grupos
          </h3>
          {metrics.topGroups.sent.length === 0 ? (
            <p className="text-sm text-text-muted">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {metrics.topGroups.sent.slice(0, 5).map((g, i) => (
                <div key={g.groupId} className="flex items-center justify-between rounded-xl bg-surface/40 hover:bg-surface/60 transition-colors px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-info/10 text-[0.65rem] font-bold text-info">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary truncate max-w-[160px]">
                      {g.groupName || g.groupId}
                    </span>
                  </div>
                  <span className="rounded-lg bg-info/10 px-2 py-0.5 text-xs font-semibold text-info">
                    {g.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
