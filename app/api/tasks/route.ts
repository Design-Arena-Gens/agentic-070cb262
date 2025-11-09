import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { BackgroundTask, DepartmentId } from '@/lib/types';
import { initDepartments } from '@/lib/toolRegistry';
import crypto from 'crypto';

function id() { return crypto.randomUUID(); }

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') as DepartmentId | null;
  const status = searchParams.get('status');
  const tasks = db.listTasks({ departmentId: departmentId ?? undefined, status: status ?? undefined });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  initDepartments();
  const body = await req.json();
  if (body.kind === 'tool') {
    const departmentId = body.departmentId as DepartmentId;
    const toolId = String(body.toolId);
    const payload = body.payload as Record<string, unknown>;
    const department = db.getDepartments().find((d) => d.id === departmentId);
    if (!department) return NextResponse.json({ error: 'Department not found' }, { status: 400 });
    const tool = department.tools.find((t) => t.id === toolId);
    if (!tool) return NextResponse.json({ error: 'Tool not found' }, { status: 400 });

    // Simulate tool outcomes
    if (tool.onSubmitBehavior === 'immediate_action') {
      const t: BackgroundTask = {
        id: id(),
        departmentId,
        title: `${tool.name} executed`,
        details: `Request accepted with payload: ${JSON.stringify(payload)}`,
        status: 'completed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        payload,
      };
      db.addTask(t);
      return NextResponse.json({ task: t });
    }

    if (tool.onSubmitBehavior === 'create_task') {
      const isRecurring = toolId === 'daily-checklist';
      const intervalMinutes = isRecurring ? Math.max(5, Number((payload as any).interval || 60)) : undefined;
      const t: BackgroundTask = {
        id: id(),
        departmentId,
        title: tool.name,
        details: `Submitted via ${department.name} ? ${tool.name}`,
        status: tool.defaultTaskStatus || 'pending',
        isRecurring,
        intervalMinutes,
        lastRunAt: isRecurring ? Date.now() : undefined,
        nextRunAt: isRecurring && intervalMinutes ? Date.now() + intervalMinutes * 60000 : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        payload,
      };
      db.addTask(t);
      return NextResponse.json({ task: t });
    }

    // chat_hint -> add a message to guide chat
    const hint = `Hint: Use the ${tool.name} capability. ${tool.description}`;
    // We surface this as a task requiring attention to guide the human
    const t: BackgroundTask = {
      id: id(),
      departmentId,
      title: `${tool.name} (chat hint)`,
      details: hint,
      status: 'attention_required',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      payload,
    };
    db.addTask(t);
    return NextResponse.json({ task: t });
  }

  // Direct task creation
  const t: BackgroundTask = {
    id: id(),
    departmentId: body.departmentId as DepartmentId,
    title: String(body.title || 'Task'),
    details: String(body.details || ''),
    status: (body.status || 'pending'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    payload: body.payload || undefined,
  };
  db.addTask(t);
  return NextResponse.json({ task: t });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, updates } = body as { id: string; updates: Partial<BackgroundTask> };
  const updated = db.updateTask(id, updates);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ task: updated });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const ok = db.deleteTask(body.id);
  return NextResponse.json({ ok });
}
