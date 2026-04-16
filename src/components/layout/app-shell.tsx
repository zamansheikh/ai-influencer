'use client';

import { useEffect, type ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Toaster } from 'sonner';
import { db } from '@/lib/db';
import { useAppStore } from '@/lib/store';

export function AppShell({ children }: { children: ReactNode }) {
  const { setCharacters, setProviders, setActiveProvider } = useAppStore();

  useEffect(() => {
    async function loadData() {
      const [chars, providers] = await Promise.all([
        db.characters.orderBy('updatedAt').reverse().toArray(),
        db.aiProviders.toArray(),
      ]);
      setCharacters(chars);
      setProviders(providers);
      const active = providers.find((p) => p.isActive);
      if (active) setActiveProvider(active);
    }
    loadData();
  }, [setCharacters, setProviders, setActiveProvider]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />
    </div>
  );
}
