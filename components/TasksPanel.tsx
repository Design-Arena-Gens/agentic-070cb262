"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { BackgroundTask, DepartmentDefinition, DepartmentId, TaskStatus } from '@/lib/types';

function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, string> = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
    attention_required: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    needs_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[status]}`}>{status.replace('_',' ')}</span>;
}

export function TasksPanel({ department }: { department: DepartmentDefinition }) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const q = new URLSearchParams({ departmentId: department.id });
    if (filter !== 'all') q.set('status', filter);
    const res = await fetch('/api/tasks?' + q.toString());
    const data = await res.json();
    setTasks(data.tasks);
  };

  useEffect(() => { load(); }, [department.id, filter]);

  const act = async (id: string, updates: Partial<BackgroundTask>) => {
    setLoading(true);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      await load();
    } finally { setLoading(false); }
  };

  const runScheduler = async () => {
    setLoading(true);
    try {
      await fetch('/api/tasks/run', { method: 'POST' });
      await load();
    } finally { setLoading(false); }
  };

  return (
    <div className="panel card h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-medium">Background Tasks ? {department.name}</h2>
        <div className="flex items-center gap-2">
          <select className="input h-9 w-44" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="attention_required">Needs Attention</option>
            <option value="needs_review">Needs Review</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn-outline" onClick={runScheduler} disabled={loading}>Simulate Scheduler</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-sm text-gray-500">No tasks found.</div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  {t.details && <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t.details}</div>}
                  <div className="text-xs text-gray-500 mt-1">Updated {new Date(t.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button className="btn-outline" onClick={() => act(t.id, { status: 'in_progress' })}>Start</button>
                <button className="btn-outline" onClick={() => act(t.id, { status: 'attention_required' })}>Flag</button>
                <button className="btn-outline" onClick={() => act(t.id, { status: 'needs_review' })}>Mark Needs Review</button>
                <button className="btn" onClick={() => act(t.id, { status: 'completed' })}>Complete</button>
                {t.isRecurring && (
                  <button className="btn-outline" onClick={() => act(t.id, { lastRunAt: Date.now(), nextRunAt: Date.now() + (t.intervalMinutes || 60) * 60000 })}>Run Now</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
