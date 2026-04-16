'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Scan, Eye, Wind, Smile, Scissors, Fingerprint, Shirt, Sun, Copy, Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { copyToClipboard } from '@/lib/utils';
import type { CharacterAnalysis } from '@/lib/db';

interface AnalysisDisplayProps {
  analysis: CharacterAnalysis;
  consistencyPrompt: string;
  compact?: boolean;
}

const sections = [
  { key: 'coreIdentity', label: 'Core Identity', icon: User },
  { key: 'faceShape', label: 'Face & Structure', icon: Scan },
  { key: 'eyes', label: 'Eyes', icon: Eye },
  { key: 'nose', label: 'Nose', icon: Wind },
  { key: 'mouth', label: 'Mouth & Lips', icon: Smile },
  { key: 'hair', label: 'Hair', icon: Scissors },
  { key: 'uniqueFeatures', label: 'Unique Features', icon: Fingerprint },
  { key: 'buildStyle', label: 'Build & Style', icon: Shirt },
  { key: 'photoStyle', label: 'Photo Style', icon: Sun },
] as const;

export function AnalysisDisplay({ analysis, consistencyPrompt, compact }: AnalysisDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(consistencyPrompt);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {sections.map(({ key, label, icon: Icon }, i) => {
          const data = analysis[key];
          if (!data) return null;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="h-full p-4!">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">{label}</h3>
                </div>
                {typeof data === 'string' ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">{data}</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(data).map(([subKey, value]) => (
                      <div key={subKey}>
                        <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">
                          {subKey.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Consistency Prompt */}
      {consistencyPrompt && (
        <Card glow className="p-4!">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Badge>Consistency Prompt</Badge>
              <span className="text-[10px] text-muted-foreground hidden sm:inline truncate">
                Ready for any AI image generator
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {consistencyPrompt}
          </p>
        </Card>
      )}
    </div>
  );
}
