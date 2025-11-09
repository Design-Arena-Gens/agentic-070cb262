"use client";
import React, { useState } from 'react';
import { DepartmentDefinition, ToolDefinition } from '@/lib/types';

function Field({ field, value, onChange }: any) {
  if (field.type === 'select') {
    return (
      <select className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {field.options?.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  const common = {
    className: 'input',
    placeholder: field.placeholder,
    required: field.required,
    value: value ?? '',
    onChange: (e: any) => onChange(e.target.value),
  } as any;
  switch (field.type) {
    case 'textarea':
      return <textarea {...common} rows={4} />;
    case 'number':
      return <input {...common} type="number" />;
    default:
      return <input {...common} type={field.type === 'email' ? 'email' : 'text'} />;
  }
}

export function ToolsPanel({ department }: { department: DepartmentDefinition }) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, Record<string, any>>>({});

  const handleSubmit = async (tool: ToolDefinition) => {
    setSubmitting(tool.id);
    try {
      const payload = formState[tool.id] || {};
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'tool', departmentId: department.id, toolId: tool.id, payload }),
      });
      if (!res.ok) throw new Error('Failed');
      // Optionally: show toast
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="panel card h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Tools ? {department.name}</h2>
      </div>
      <div className="flex-1 overflow-auto divide-y divide-gray-200 dark:divide-gray-800">
        {department.tools.map((t) => (
          <div key={t.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-500">{t.description}</div>
              </div>
              {t.form ? (
                <button
                  className="btn"
                  disabled={submitting === t.id}
                  onClick={() => handleSubmit(t)}
                >{submitting === t.id ? 'Submitting?' : 'Run'}</button>
              ) : (
                <div className="text-xs text-gray-500">Use via chat</div>
              )}
            </div>
            {t.form && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {t.form.map((f) => (
                  <label key={f.name} className="space-y-1">
                    <div className="label">{f.label}{f.required ? ' *' : ''}</div>
                    <Field
                      field={f}
                      value={formState[t.id]?.[f.name]}
                      onChange={(v: any) => setFormState((s) => ({
                        ...s,
                        [t.id]: { ...(s[t.id] || {}), [f.name]: v },
                      }))}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
