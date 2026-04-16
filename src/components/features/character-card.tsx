'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Zap, Clock, Check, Eye, Download, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { copyToClipboard, getTimeAgo } from '@/lib/utils';
import type { Character } from '@/lib/db';

interface CharacterCardProps {
  character: Character;
  onSelect?: () => void;
  onDelete?: () => void;
  onGenerate?: () => void;
  onExport?: () => void;
  onEdit?: () => void;
  index?: number;
}

export function CharacterCard({ character, onSelect, onDelete, onGenerate, onExport, onEdit, index = 0 }: CharacterCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (character.consistencyPrompt) {
      const ok = await copyToClipboard(character.consistencyPrompt);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="relative h-48 sm:h-52 overflow-hidden cursor-pointer" onClick={onSelect}>
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {character.analysis && <Badge variant="success">Analyzed</Badge>}
        </div>

        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
            className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-foreground text-sm truncate">{character.name}</h3>
        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {getTimeAgo(character.createdAt)}
        </div>

        {character.analysis && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            <Badge variant="outline">{character.analysis.coreIdentity.gender}</Badge>
            <Badge variant="outline">{character.analysis.coreIdentity.apparentAge}</Badge>
          </div>
        )}

        <div className="flex gap-1 mt-3">
          <button
            onClick={onGenerate}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            Generate
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Copy prompt"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onExport?.(); }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Export"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer shrink-0"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
