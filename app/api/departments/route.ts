import { NextResponse } from 'next/server';
import { initDepartments } from '@/lib/toolRegistry';
import { db } from '@/lib/store';

export async function GET() {
  initDepartments();
  return NextResponse.json({ departments: db.getDepartments() });
}
