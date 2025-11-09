"use client";
import React from 'react';
import { DepartmentDefinition, DepartmentId } from '@/lib/types';

export function Sidebar({
  departments,
  current,
  onSelect,
}: {
  departments: DepartmentDefinition[];
  current: DepartmentId;
  onSelect: (id: DepartmentId) => void;
}) {
  return (
    <aside className="sidebar p-4">
      <h1 className="text-xl font-semibold mb-4">Company Assistant</h1>
      <nav className="space-y-1">
        {departments.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-gray-800 ${
              current === d.id ? 'bg-brand-100 dark:bg-gray-800 font-medium' : ''
            }`}
          >
            <div className="text-sm">{d.name}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{d.description}</div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
