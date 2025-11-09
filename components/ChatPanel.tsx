"use client";
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, DepartmentDefinition, DepartmentId } from '@/lib/types';

export function ChatPanel({ department }: { department: DepartmentDefinition }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`/api/chat?departmentId=${department.id}`);
      const data = await res.json();
      setMessages(data.messages);
    };
    run();
  }, [department.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentId: department.id, content }),
    });
    const data = await res.json();
    setMessages(data.messages);
  };

  return (
    <div className="panel card h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Chat ? {department.name}</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`max-w-3xl ${m.role === 'assistant' ? '' : 'ml-auto'}`}>
            <div className={`rounded-lg px-3 py-2 text-sm ${
              m.role === 'assistant' ? 'bg-gray-100 dark:bg-gray-800' : 'bg-brand-600 text-white'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <input
          className="input"
          placeholder="Ask or type / to use a tool..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button onClick={send} className="btn">Send</button>
      </div>
    </div>
  );
}
