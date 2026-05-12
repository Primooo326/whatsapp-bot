import type {
  ApiResponse,
  HealthResponse,
  MetricsData,
  MonthlyReport,
  SessionStatus,
  LogEntry,
} from '../types';

const BASE = '/api/wha';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Health ──────────────────────────────────
export async function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>(`${BASE}/health`);
}

// ─── Metrics ─────────────────────────────────
export async function getMetrics(): Promise<MetricsData> {
  const res = await request<ApiResponse<MetricsData>>(`${BASE}/metrics`);
  return res.data!;
}

export async function getMetricsRange(
  startDate: string,
  endDate: string
): Promise<{ total: number; byType: Record<string, number> }> {
  const res = await request<ApiResponse<{ total: number; byType: Record<string, number> }>>(
    `${BASE}/metrics/range?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data!;
}

export async function getMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyReport> {
  const res = await request<ApiResponse<MonthlyReport>>(
    `${BASE}/metrics/monthly?year=${year}&month=${month}`
  );
  return res.data!;
}

// ─── Session ─────────────────────────────────
export async function getSessionStatus(): Promise<SessionStatus> {
  const res = await request<ApiResponse<SessionStatus>>(`${BASE}/session/status`);
  return res.data!;
}

export async function restartSession(): Promise<void> {
  await request<ApiResponse>(`${BASE}/session/restart`, { method: 'POST' });
}

export async function logoutSession(): Promise<void> {
  await request<ApiResponse>(`${BASE}/session/logout`, { method: 'POST' });
}

export async function clearSession(): Promise<void> {
  await request<ApiResponse>(`${BASE}/session/clear`, { method: 'POST' });
}

// ─── Logs ────────────────────────────────────
export async function getLogs(options?: {
  limit?: number;
  level?: string;
  since?: string;
}): Promise<LogEntry[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.level) params.set('level', options.level);
  if (options?.since) params.set('since', options.since);

  const qs = params.toString();
  const res = await request<ApiResponse<LogEntry[]>>(
    `${BASE}/logs${qs ? `?${qs}` : ''}`
  );
  return res.data!;
}
