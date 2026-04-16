'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-sm text-muted-foreground">
            {characters.length} character{characters.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Plus className="w-4 h-4" />
            Create Character
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="font-semibold text-lg">
              {search ? 'No matches found' : 'No characters yet'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              {search
                ? 'Try adjusting your search query'
                : 'Create your first AI influencer character by uploading a reference photo'}
            </p>
            {!search && (
              <Link href="/create" className="mt-4">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create First Character
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Character Modal */}
      <Modal
        open={!!viewCharacter}
        onClose={() => setViewCharacter(null)}
        title={viewCharacter?.name || 'Character Details'}
        size="xl"
      >
        {viewCharacter && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <img
                src={viewCharacter.avatar}
                alt={viewCharacter.name}
                className="w-32 h-32 rounded-2xl object-cover"
              />
              <div>
                <h2 className="text-xl font-bold">{viewCharacter.name}</h2>
                {viewCharacter.analysis && (
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p>Age: {viewCharacter.analysis.coreIdentity.apparentAge}</p>
                    <p>Gender: {viewCharacter.analysis.coreIdentity.gender}</p>
                    <p>Ethnicity: {viewCharacter.analysis.coreIdentity.ethnicity}</p>
                  </div>
                )}
              </div>
            </div>
            {viewCharacter.analysis && (
              <AnalysisDisplay
                analysis={viewCharacter.analysis}
                consistencyPrompt={viewCharacter.consistencyPrompt}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Character"
        size="sm"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete this character? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
