import { Sidebar } from '@/components/Sidebar';
import { ChatPanel } from '@/components/ChatPanel';
import { ToolsPanel } from '@/components/ToolsPanel';
import { TasksPanel } from '@/components/TasksPanel';
import { initDepartments } from '@/lib/toolRegistry';
import { db } from '@/lib/store';
import { DepartmentDefinition, DepartmentId } from '@/lib/types';
import React from 'react';

function getInitialDepartment(): DepartmentDefinition {
  initDepartments();
  const departments = db.getDepartments();
  return departments[0];
}

export default function Home() {
  const initial = getInitialDepartment();

  return (
    <main className="container-app">
      <ClientApp initialDepartmentId={initial.id} />
    </main>
  );
}

"use client";
import { useEffect, useState } from 'react';

function ClientApp({ initialDepartmentId }: { initialDepartmentId: DepartmentId }) {
  const [departments, setDepartments] = useState<DepartmentDefinition[]>([]);
  const [current, setCurrent] = useState<DepartmentId>(initialDepartmentId);

  useEffect(() => {
    const run = async () => {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments);
      if (!data.departments.find((d: any) => d.id === current) && data.departments.length) {
        setCurrent(data.departments[0].id);
      }
    };
    run();
  }, []);

  const currentDepartment = departments.find((d) => d.id === current);
  if (!currentDepartment) return null;

  return (
    <>
      <Sidebar departments={departments} current={current} onSelect={setCurrent} />
      <div className="main p-3 gap-3">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <ChatPanel department={currentDepartment} />
          <ToolsPanel department={currentDepartment} />
        </div>
        <div className="grid grid-cols-1">
          <TasksPanel department={currentDepartment} />
        </div>
      </div>
    </>
  );
}
