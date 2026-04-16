'use client';

import { useState } from 'react';
import { ChevronDown, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RATIO_CATEGORIES, type AspectRatio } from '@/lib/aspect-ratios';

interface RatioPickerProps {
  selected: AspectRatio | null;
  onSelect: (ratio: AspectRatio | null) => void;
}

export function RatioPicker({ selected, onSelect }: RatioPickerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
          <Monitor className="w-3 h-3" /> Aspect Ratio
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {expanded ? 'Less' : 'All platforms'}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Selected display */}
      {selected && (
        <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
          <RatioPreview ratio={selected.ratio} size={20} />
          <span className="font-medium text-primary">{selected.platform} — {selected.label}</span>
          <span className="text-muted-foreground">{selected.width}x{selected.height}</span>
          <button onClick={() => onSelect(null)} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">Clear</button>
        </div>
      )}

      {/* Quick presets (collapsed) */}
      {!expanded && (
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ig-square', shortLabel: '1:1 Square' },
            { id: 'ig-portrait', shortLabel: '4:5 IG Post' },
            { id: 'ig-story', shortLabel: '9:16 Story' },
            { id: 'yt-thumb', shortLabel: '16:9 Wide' },
            { id: 'fb-cover', shortLabel: 'FB Cover' },
            { id: 'pin-standard', shortLabel: '2:3 Pin' },
          ].map(({ id, shortLabel }) => {
            const ratio = RATIO_CATEGORIES.flatMap((c) => c.ratios).find((r) => r.id === id);
            if (!ratio) return null;
            return (
              <button
                key={id}
                onClick={() => onSelect(selected?.id === id ? null : ratio)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer border
                  ${selected?.id === id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <RatioPreview ratio={ratio.ratio} size={14} />
                {shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded: all platforms */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {RATIO_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <p className="text-[11px] font-semibold text-foreground mb-1.5">{cat.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.ratios.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onSelect(selected?.id === r.id ? null : r)}
                        title={`${r.description} — ${r.width}x${r.height}`}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer border
                          ${selected?.id === r.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}
                      >
                        <RatioPreview ratio={r.ratio} size={12} />
                        <span>{r.label}</span>
                        <span className="opacity-50">{r.ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RatioPreview({ ratio, size }: { ratio: string; size: number }) {
  const [w, h] = ratio.split(':').map(Number);
  const aspect = w / h;
  const boxW = aspect >= 1 ? size : size * aspect;
  const boxH = aspect >= 1 ? size / aspect : size;

  return (
    <div
      className="border border-current rounded-[2px] shrink-0 opacity-60"
      style={{ width: `${boxW}px`, height: `${boxH}px` }}
    />
  );
}
