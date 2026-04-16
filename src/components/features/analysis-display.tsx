'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Scan,
  Eye,
  Wind,
  Smile,
  Scissors,
  Fingerprint,
  Shirt,
  Sun,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CharacterAnalysis } from '@/lib/db';

interface AnalysisDisplayProps {
  analysis: CharacterAnalysis;
  consistencyPrompt: string;
}

const sections = [
  { key: 'coreIdentity', label: 'Core Identity', icon: User },
  { key: 'faceShape', label: 'Face Shape & Structure', icon: Scan },
  { key: 'eyes', label: 'Eyes', icon: Eye },
  { key: 'nose', label: 'Nose', icon: Wind },
  { key: 'mouth', label: 'Mouth & Lips', icon: Smile },
  { key: 'hair', label: 'Hair', icon: Scissors },
  { key: 'uniqueFeatures', label: 'Unique Features', icon: Fingerprint },
  { key: 'buildStyle', label: 'Build & Style', icon: Shirt },
  { key: 'photoStyle', label: 'Photo Style', icon: Sun },
] as const;

export function AnalysisDisplay({ analysis, consistencyPrompt }: AnalysisDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(consistencyPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(({ key, label, icon: Icon }, i) => {
          const data = analysis[key];
          if (!data) return null;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{label}</h3>
                </div>
                {typeof data === 'string' ? (
                  <p className="text-sm text-muted-foreground">{data}</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(data).map(([subKey, value]) => (
                      <div key={subKey}>
                        <span className="text-xs font-medium text-primary/70 capitalize">
                          {subKey.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="text-sm text-muted-foreground">{renderValue(value)}</p>
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
      <Card glow className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge>Consistency Prompt</Badge>
            <span className="text-xs text-muted-foreground">Ready to use with any AI generator</span>
          </div>
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {consistencyPrompt}
        </p>
      </Card>
    </div>
  );
}
