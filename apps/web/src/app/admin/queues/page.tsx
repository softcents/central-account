'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { apiFetch } from '@/lib/api';

interface QueueMetric {
  id: string;
  title: string;
  status: 'HEALTHY' | 'PAUSED' | 'OFFLINE' | 'ERROR';
  counts: Record<string, number>;
  error?: string;
}

interface FailedJob {
  id: string;
  name: string;
  data: any;
  failedReason: string;
  stacktrace?: string[];
  timestamp: number;
  attemptsMade: number;
}

export default function AdminQueuesPage() {
  const { token } = useAdminAuth();
  const [queues, setQueues] = useState<QueueMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchQueues = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch<QueueMetric[]>('/admin/queues', {}, token);
      if (res.ok && Array.isArray(res.data)) {
        setQueues(res.data);
      }
    } catch (e: any) {
      console.error('Failed to load queue telemetry', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQueues();
    }
  }, [token]);

  useEffect(() => {
    if (!autoRefresh || !token) return;
    const interval = setInterval(() => {
      fetchQueues(true);
      if (selectedQueue) {
        fetchFailedJobs(selectedQueue, true);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, token, selectedQueue]);

  const fetchFailedJobs = async (queueName: string, silent = false) => {
    if (!silent) setLoadingFailed(true);
    try {
      const res = await apiFetch<FailedJob[]>(`/admin/queues/${queueName}/failed`, {}, token);
      if (res.ok && Array.isArray(res.data)) {
        setFailedJobs(res.data);
      }
    } catch (e: any) {
      console.error('Failed to load failed jobs', e);
    } finally {
      if (!silent) setLoadingFailed(false);
    }
  };

  const handleOpenFailedModal = (queueName: string) => {
    setSelectedQueue(queueName);
    fetchFailedJobs(queueName);
  };

  const handleRetryJob = async (queueName: string, jobId: string) => {
    setActionLoading(`retry_${jobId}`);
    try {
      const res = await apiFetch<any>(
        `/admin/queues/${queueName}/retry/${jobId}`,
        { method: 'POST' },
        token,
      );
      if (res.ok) {
        setMessage({ text: `Job ${jobId} successfully re-enqueued`, type: 'success' });
        fetchQueues(true);
        fetchFailedJobs(queueName);
      } else {
        setMessage({ text: res.data?.message || 'Failed to retry job', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error retrying job', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanQueue = async (queueName: string) => {
    if (!confirm(`Are you sure you want to clean completed/failed jobs from ${queueName}?`)) return;
    setActionLoading(`clean_${queueName}`);
    try {
      const res = await apiFetch<any>(
        `/admin/queues/${queueName}/clean`,
        { method: 'POST' },
        token,
      );
      if (res.ok) {
        setMessage({ text: `Queue ${queueName} cleaned`, type: 'success' });
        fetchQueues(true);
        if (selectedQueue === queueName) {
          fetchFailedJobs(queueName);
        }
      } else {
        setMessage({ text: res.data?.message || 'Failed to clean queue', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error cleaning queue', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  // Aggregated totals
  const totalWaiting = queues.reduce((sum, q) => sum + (q.counts?.waiting || 0), 0);
  const totalActive = queues.reduce((sum, q) => sum + (q.counts?.active || 0), 0);
  const totalCompleted = queues.reduce((sum, q) => sum + (q.counts?.completed || 0), 0);
  const totalFailed = queues.reduce((sum, q) => sum + (q.counts?.failed || 0), 0);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              BullMQ Distributed Queue Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Redis Cluster 6379
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, job concurrency limits, exponential backoff retries, and dead-letter monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:bg-slate-800/80 transition-colors">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Auto Refresh (3s)</span>
          </label>

          <button
            onClick={() => fetchQueues()}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Waiting in Queue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalWaiting}</div>
          <p className="text-[10px] text-slate-500 mt-1">Pending worker pickup</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Workers</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-2">{totalActive}</div>
          <p className="text-[10px] text-slate-500 mt-1">Concurrent execution slots</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed (Stored)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{totalCompleted}</div>
          <p className="text-[10px] text-slate-500 mt-1">Processed successfully</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Dead Letters / Failed</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{totalFailed}</div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting retry or review</p>
        </div>
      </div>

      {/* Queues Detail Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Active Background Queues ({queues.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {queues.map((q) => {
            const waiting = q.counts?.waiting || 0;
            const active = q.counts?.active || 0;
            const completed = q.counts?.completed || 0;
            const failed = q.counts?.failed || 0;
            const delayed = q.counts?.delayed || 0;

            const isHealthy = q.status === 'HEALTHY';
            const isPaused = q.status === 'PAUSED';

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold tracking-wide">
                        {q.id}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5 leading-snug">{q.title}</h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 uppercase tracking-wider ${
                        isHealthy
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isPaused
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  {/* Counts Grid */}
                  <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50 text-center">
                      <span className="block text-[10px] text-slate-400 font-medium">Wait</span>
                      <span className="text-sm font-bold text-amber-400">{waiting}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50 text-center">
                      <span className="block text-[10px] text-slate-400 font-medium">Active</span>
                      <span className="text-sm font-bold text-indigo-400">{active}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50 text-center">
                      <span className="block text-[10px] text-slate-400 font-medium">Done</span>
                      <span className="text-sm font-bold text-emerald-400">{completed}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/50 text-center">
                      <span className="block text-[10px] text-slate-400 font-medium">Failed</span>
                      <span className={`text-sm font-bold ${failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {failed}
                      </span>
                    </div>
                  </div>

                  {delayed > 0 && (
                    <div className="mt-2 text-[10px] text-slate-400 text-center">
                      Delayed jobs awaiting schedule: <strong className="text-slate-200">{delayed}</strong>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => handleOpenFailedModal(q.id)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>Failed ({failed})</span>
                  </button>

                  <button
                    onClick={() => handleCleanQueue(q.id)}
                    disabled={actionLoading === `clean_${q.id}`}
                    title="Clean completed and failed history"
                    className="py-1.5 px-3 rounded-xl bg-slate-800/40 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failed Jobs Inspector Modal */}
      {selectedQueue && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                  Dead Letter Queue
                </span>
                <h3 className="text-base font-bold text-white">
                  Failed Jobs in <span className="font-mono text-indigo-300">{selectedQueue}</span>
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchFailedJobs(selectedQueue)}
                  disabled={loadingFailed}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFailed ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedQueue(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {loadingFailed ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Loading dead-letter jobs...
                </div>
              ) : failedJobs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">No Failed Jobs</p>
                  <p className="text-xs text-slate-500">
                    This queue is operating cleanly without any active dead-letter jobs.
                  </p>
                </div>
              ) : (
                failedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            Job #{job.id}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Attempts: {job.attemptsMade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Failed on: {new Date(job.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRetryJob(selectedQueue, job.id)}
                        disabled={actionLoading === `retry_${job.id}`}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${
                            actionLoading === `retry_${job.id}` ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Retry Job</span>
                      </button>
                    </div>

                    {/* Failure Reason */}
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/30 text-xs text-rose-300 font-mono">
                      <strong>Failure Reason:</strong> {job.failedReason || 'Unknown error'}
                    </div>

                    {/* Stacktrace snippet if available */}
                    {job.stacktrace && job.stacktrace.length > 0 && (
                      <details className="text-[11px] text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-200 font-medium">
                          View stack trace
                        </summary>
                        <pre className="mt-2 p-2 rounded bg-black/60 border border-slate-800/60 overflow-x-auto text-[10px] text-slate-300 font-mono">
                          {job.stacktrace.join('\n')}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
