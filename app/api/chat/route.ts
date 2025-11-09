import { NextResponse } from 'next/server';
import { db } from '@/lib/store';
import { ChatMessage, DepartmentId } from '@/lib/types';
import crypto from 'crypto';

function id() { return crypto.randomUUID(); }

function simpleAssistant(departmentId: DepartmentId, user: string): string {
  // Naive, deterministic responses tailored by department
  const lower = user.toLowerCase();
  switch (departmentId) {
    case 'hr':
      if (lower.includes('pto') || lower.includes('vacation')) {
        return 'HR: Our PTO policy grants 15 days annually. You can request via the HR portal. Would you like a link?';
      }
      return 'HR assistant: I can help with onboarding, benefits, and policy questions.';
    case 'it':
      if (lower.includes('vpn')) return 'IT: To access VPN, install the VPN client and use your SSO credentials.';
      return 'IT assistant: I can help with access requests, devices, and troubleshooting.';
    case 'finance':
      if (lower.includes('expense')) return 'Finance: Submit expenses within 30 days. Attach receipts for items over $25.';
      return 'Finance assistant: I can help with expenses, invoices, and approvals.';
    case 'sales':
      if (lower.includes('proposal')) return 'Sales: For proposals, share the client name and scope; I can draft an outline.';
      return 'Sales assistant: I can help with leads, CRM updates, and proposals.';
    case 'ops':
      if (lower.includes('incident')) return 'Ops: Follow SEV runbook. Notify on-call, gather logs, and post updates.';
      return 'Ops assistant: I can help with runbooks, checklists, and escalations.';
    default:
      return 'Assistant ready.';
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') as DepartmentId | null;
  const messages = db.getMessages(departmentId ?? undefined);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const body = await req.json();
  const departmentId = body.departmentId as DepartmentId;
  const content = String(body.content || '').slice(0, 4000);
  const userMsg: ChatMessage = { id: id(), departmentId, role: 'user', content, createdAt: Date.now() };
  db.addMessage(userMsg);

  const reply: ChatMessage = {
    id: id(),
    departmentId,
    role: 'assistant',
    content: simpleAssistant(departmentId, content),
    createdAt: Date.now(),
  };
  db.addMessage(reply);

  const messages = db.getMessages(departmentId);
  return NextResponse.json({ messages });
}
