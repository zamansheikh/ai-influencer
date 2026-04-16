'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { CharacterCard } from '@/components/features/character-card';
import { AnalysisDisplay } from '@/components/features/analysis-display';
import { db, type Character } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import Link from 'next/link';

export default function CharactersPage() {
  const router = useRouter();
  const { characters, removeCharacter, setSelectedCharacter } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await db.characters.delete(id);
    removeCharacter(id);
    setDeleteConfirm(null);
    toast.success('Character deleted');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Characters</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {characters.length} character{characters.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link href="/create">
          <Button size="sm">
            <Plus className="w-4 h-4" /> Create Character
          </Button>
        </Link>
      </div>

      {/* Search */}
      {characters.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((character, i) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={i}
                onSelect={() => setViewCharacter(character)}
                onDelete={() => setDeleteConfirm(character.id)}
                onGenerate={() => {
                  setSelectedCharacter(character);
                  router.push('/generate');
                }}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={<Users className="w-10 h-10 text-primary/40" />}
            title={search ? 'No matches found' : 'No characters yet'}
            description={search ? 'Try a different search' : 'Create your first AI influencer character'}
            action={!search ? (
              <Link href="/create"><Button><Plus className="w-4 h-4" /> Create Character</Button></Link>
            ) : undefined}
          />
        )}
      </AnimatePresence>

      {/* View Modal */}
      <Modal open={!!viewCharacter} onClose={() => setViewCharacter(null)} title={viewCharacter?.name} size="xl">
        {viewCharacter && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <img src={viewCharacter.avatar} alt={viewCharacter.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">{viewCharacter.name}</h2>
                {viewCharacter.analysis && (
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>Age: {viewCharacter.analysis.coreIdentity.apparentAge}</p>
                    <p>Gender: {viewCharacter.analysis.coreIdentity.gender}</p>
                    <p>Ethnicity: {viewCharacter.analysis.coreIdentity.ethnicity}</p>
                  </div>
                )}
              </div>
            </div>
            {viewCharacter.analysis && (
              <AnalysisDisplay analysis={viewCharacter.analysis} consistencyPrompt={viewCharacter.consistencyPrompt} />
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Character" size="sm">
        <p className="text-sm text-muted-foreground mb-5">
          Are you sure? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
