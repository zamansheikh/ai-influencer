'use client';

import { motion } from 'framer-motion';
import { Trash2, Copy, Zap, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Character } from '@/lib/db';

interface CharacterCardProps {
  character: Character;
  onSelect?: () => void;
  onDelete?: () => void;
  onGenerate?: () => void;
  index?: number;
}

export function CharacterCard({ character, onSelect, onDelete, onGenerate, index = 0 }: CharacterCardProps) {
  const timeAgo = getTimeAgo(character.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Avatar */}
      <div
        className="relative h-56 overflow-hidden cursor-pointer"
        onClick={onSelect}
      >
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {character.analysis && <Badge variant="success">Analyzed</Badge>}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-lg">{character.name}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </div>
          </div>
        </div>

        {character.analysis && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline">{character.analysis.coreIdentity.gender}</Badge>
            <Badge variant="outline">{character.analysis.coreIdentity.apparentAge}</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onGenerate}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Generate
          </button>
          <button
            onClick={() => {
              if (character.consistencyPrompt) {
                navigator.clipboard.writeText(character.consistencyPrompt);
              }
            }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            title="Copy consistency prompt"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            title="Delete character"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
