'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ImageUpload } from '@/components/features/image-upload';
import { AnalysisDisplay } from '@/components/features/analysis-display';
import { db, type Character, type CharacterAnalysis } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { analyzeImage } from '@/lib/ai-providers';
import Link from 'next/link';

export default function CreateCharacterPage() {
  const router = useRouter();
  const { activeProvider, addCharacter } = useAppStore();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState<CharacterAnalysis | null>(null);
  const [consistencyPrompt, setConsistencyPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!imageBase64) {
      toast.error('Please upload a reference photo first');
      return;
    }
    if (!activeProvider) {
      toast.error('Please configure an AI provider in Settings first');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const result = await analyzeImage(activeProvider, imageBase64);
      setAnalysis(result.analysis as unknown as CharacterAnalysis);
      setConsistencyPrompt(result.consistencyPrompt);
      toast.success('Character analyzed successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please give your character a name');
      return;
    }
    if (!imageBase64) {
      toast.error('Please upload a reference photo');
      return;
    }

    setSaving(true);
    try {
      const character: Character = {
        id: uuid(),
        name: name.trim(),
        avatar: imageBase64,
        analysis,
        consistencyPrompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.characters.add(character);
      addCharacter(character);
      toast.success(`${character.name} saved successfully!`);
      router.push('/characters');
    } catch (err) {
      toast.error('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/characters"
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Character</h1>
          <p className="text-sm text-muted-foreground">
            Upload a reference photo to extract forensic-level character details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Upload & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-4">Reference Photo</h2>
            <ImageUpload
              onImageSelect={setImageBase64}
              currentImage={imageBase64}
              onClear={() => {
                setImageBase64(null);
                setAnalysis(null);
                setConsistencyPrompt('');
              }}
            />
          </Card>

          <Card>
            <Input
              label="Character Name"
              id="charName"
              placeholder="e.g., Luna Martinez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Card>

          {/* Provider status */}
          <Card className={activeProvider ? 'border-success/30' : 'border-warning/30'}>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2.5 h-2.5 rounded-full ${activeProvider ? 'bg-success' : 'bg-warning'}`} />
              {activeProvider ? (
                <span>
                  Using <strong>{activeProvider.name}</strong> ({activeProvider.model})
                </span>
              ) : (
                <span className="text-warning">
                  No AI provider configured.{' '}
                  <Link href="/settings" className="underline">
                    Set up now
                  </Link>
                </span>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={!imageBase64 || !activeProvider}
              loading={analyzing}
              className="flex-1"
            >
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Analyzing...' : 'Analyze Character'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={!imageBase64 || !name.trim()}
              loading={saving}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Right: Analysis Results */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {analyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <Sparkles className="w-5 h-5 text-primary absolute top-0 right-0 animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Performing forensic-level analysis...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Extracting every visual detail for perfect consistency
                </p>
              </motion.div>
            )}

            {error && !analyzing && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Analysis Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {analysis && !analyzing && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AnalysisDisplay
                  analysis={analysis}
                  consistencyPrompt={consistencyPrompt}
                />
              </motion.div>
            )}

            {!analysis && !analyzing && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-primary/50" />
                </div>
                <h3 className="font-semibold text-lg">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Upload a reference photo and click &quot;Analyze Character&quot; to extract
                  every visual detail for AI consistency.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
