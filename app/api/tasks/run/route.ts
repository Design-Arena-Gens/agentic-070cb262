import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function POST() {
  const now = Date.now();
  const tasks = db.listTasks();
  // For recurring tasks that are due, simulate a run by updating nextRunAt
  const updated: string[] = [];
  for (const t of tasks) {
    if (t.isRecurring && t.nextRunAt && t.nextRunAt <= now) {
      const interval = (t.intervalMinutes || 60) * 60000;
      db.updateTask(t.id, {
        lastRunAt: now,
        nextRunAt: now + interval,
        status: t.status === 'completed' ? 'pending' : t.status, // keep cycling unless closed
      });
      updated.push(t.id);
    }
  }
  return NextResponse.json({ updated });
}
