'use client';

import { useState } from 'react';
import { ChevronDown, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENE_CATEGORIES, ALL_PRESETS, type ScenePreset } from '@/lib/scene-presets';

interface ScenePickerProps {
  onSelect: (preset: ScenePreset) => void;
  mode?: 'full' | 'scene-only';  // scene-only = only set the scene field (for swap)
}

export function ScenePicker({ onSelect, mode = 'full' }: ScenePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const randomScene = () => {
    const preset = ALL_PRESETS[Math.floor(Math.random() * ALL_PRESETS.length)];
    onSelect(preset);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-medium">
          {mode === 'scene-only' ? 'Background Presets' : 'Scene Presets'}
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={randomScene}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3 h-3" /> Random
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {expanded ? 'Less' : `All ${ALL_PRESETS.length}`}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {!expanded && (
        <div className="flex flex-wrap gap-1.5">
          {['Coffee shop selfie', 'Corporate headshot', 'Beach paradise', 'Gym workout', 'Neon portrait', 'Pohela Boishakh'].map((label) => {
            const preset = ALL_PRESETS.find((p) => p.label === label);
            if (!preset) return null;
            return (
              <button
                key={label}
                onClick={() => onSelect(preset)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                title={preset.scene}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {SCENE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0
                    ${activeCategory === cat.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  <span>{cat.emoji}</span> {cat.name}
                  <span className="text-[9px] opacity-60">{cat.presets.length}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {(activeCategory
                ? SCENE_CATEGORIES.find((c) => c.id === activeCategory)?.presets || []
                : ALL_PRESETS
              ).map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onSelect(preset)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] bg-secondary text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                  title={preset.scene}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
