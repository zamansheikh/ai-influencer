'use client';

import { Sparkles, Brain, Cpu, Bot, Globe, Check, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getModelCapabilities } from '@/lib/model-capabilities';
import type { AIProvider } from '@/lib/db';
import { useAppStore } from '@/lib/store';

const icons: Record<string, typeof Sparkles> = {
  gemini: Sparkles,
  openai: Brain,
  anthropic: Cpu,
  qwen: Bot,
  custom: Globe,
};

export function ProviderSelector() {
  const { providers, activeProvider, setActiveProvider } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (p: AIProvider) => {
    // Update active in DB
    const { db } = await import('@/lib/db');
    await db.aiProviders.toCollection().modify({ isActive: false });
    await db.aiProviders.update(p.id, { isActive: true });
    const all = await db.aiProviders.toArray();

    // Update store
    const { useAppStore } = await import('@/lib/store');
    useAppStore.getState().setProviders(all);
    setActiveProvider(all.find((x) => x.id === p.id) || null);
    setOpen(false);
  };

  if (providers.length <= 1) {
    if (!activeProvider) return null;
    const Icon = icons[activeProvider.provider] || Globe;
    const caps = getModelCapabilities(activeProvider.model);
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-xs">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="font-medium truncate">{activeProvider.name}</span>
        <span className="text-muted-foreground hidden sm:inline">({activeProvider.model})</span>
        {caps.imageGeneration && <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-medium">img</span>}
        {caps.videoGeneration && <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-medium">video</span>}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-xs hover:border-primary/30 transition-colors cursor-pointer w-full"
      >
        {activeProvider && (() => {
          const Icon = icons[activeProvider.provider] || Globe;
          const caps = getModelCapabilities(activeProvider.model);
          return (
            <>
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium truncate flex-1 text-left">{activeProvider.name}</span>
              <span className="text-muted-foreground hidden sm:inline">({activeProvider.model})</span>
              {caps.imageGeneration && <span className="px-1.5 py-0.5 rounded bg-success/15 text-success text-[9px] font-medium shrink-0">img</span>}
              {caps.videoGeneration && <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-medium shrink-0">video</span>}
            </>
          );
        })()}
        {!activeProvider && <span className="text-muted-foreground">Select a provider...</span>}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {providers.map((p) => {
              const Icon = icons[p.provider] || Globe;
              const caps = getModelCapabilities(p.model);
              const isActive = activeProvider?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-left transition-colors cursor-pointer
                    ${isActive ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.model}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {caps.visionInput && <span className="px-1 py-0.5 rounded bg-secondary text-[8px] text-muted-foreground">vis</span>}
                    {caps.imageGeneration && <span className="px-1 py-0.5 rounded bg-success/15 text-success text-[8px]">img</span>}
                    {caps.videoGeneration && <span className="px-1 py-0.5 rounded bg-primary/15 text-primary text-[8px]">vid</span>}
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
