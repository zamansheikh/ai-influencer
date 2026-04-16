'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Save, ArrowLeft, Loader2, AlertCircle, Zap, ArrowRight, CheckCircle2, Image as ImageIcon, Video, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ImageUpload } from '@/components/features/image-upload';
import { AnalysisDisplay } from '@/components/features/analysis-display';
import { db, type Character, type CharacterAnalysis } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { analyzeImage, generateContent } from '@/lib/ai-providers';
import { copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

type Step = 'upload' | 'analyzing' | 'analyzed' | 'saved' | 'generate';

export default function CreateCharacterPage() {
  const router = useRouter();
  const { activeProvider, addCharacter } = useAppStore();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState<CharacterAnalysis | null>(null);
  const [consistencyPrompt, setConsistencyPrompt] = useState('');
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedCharacter, setSavedCharacter] = useState<Character | null>(null);

  // Generate content state
  const [genPrompt, setGenPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genCopied, setGenCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!imageBase64) { toast.error('Upload a reference photo first'); return; }
    if (!activeProvider) { toast.error('Configure an AI provider in Settings'); return; }

    setStep('analyzing');
    setError('');

    try {
      const result = await analyzeImage(activeProvider, imageBase64);
      setAnalysis(result.analysis as unknown as CharacterAnalysis);
      setConsistencyPrompt(result.consistencyPrompt);
      setStep('analyzed');
      toast.success('Character analyzed successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      setStep('upload');
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Give your character a name'); return; }
    if (!imageBase64) { toast.error('Upload a reference photo'); return; }

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
      setSavedCharacter(character);
      setStep('saved');
      toast.success(`${character.name} saved!`);
    } catch {
      toast.error('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim() || !savedCharacter || !activeProvider) return;
    setGenerating(true);
    try {
      const res = await generateContent(activeProvider, savedCharacter.consistencyPrompt, genPrompt);
      setGenResult(res.result || res.prompt);
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const quickPrompts = [
    'Casual selfie in a trendy coffee shop, warm lighting',
    'Standing in a park during golden hour, portrait style',
    'Professional headshot, modern office, business attire',
    'Rooftop bar at night, city skyline, elegant outfit',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/characters" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Create Character</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Upload a photo to extract forensic-level character details
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        {(['Upload', 'Analyze', 'Save', 'Generate'] as const).map((label, i) => {
          const stepMap: Record<string, number> = { upload: 0, analyzing: 1, analyzed: 1, saved: 2, generate: 3 };
          const current = stepMap[step] ?? 0;
          const isComplete = i < current;
          const isActive = i === current;
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              {i > 0 && <div className={`w-6 sm:w-10 h-px ${isComplete || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors
                ${isComplete ? 'bg-primary/15 border-primary/30 text-primary' : isActive ? 'bg-primary/10 border-primary/20 text-foreground' : 'border-border text-muted-foreground'}`}>
                {isComplete ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                <span className="font-medium">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step: Upload & Analyze */}
      <AnimatePresence mode="wait">
        {(step === 'upload' || step === 'analyzing' || step === 'analyzed') && (
          <motion.div
            key="create-flow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6"
          >
            {/* Left panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <h2 className="text-sm font-semibold mb-3">Reference Photo</h2>
                <ImageUpload
                  onImageSelect={(img) => { setImageBase64(img); setStep('upload'); setAnalysis(null); }}
                  currentImage={imageBase64}
                  onClear={() => { setImageBase64(null); setAnalysis(null); setConsistencyPrompt(''); setStep('upload'); }}
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

              <Card className={`py-3 px-4 ${activeProvider ? 'border-success/20' : 'border-warning/20'}`}>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${activeProvider ? 'bg-success' : 'bg-warning'}`} />
                  {activeProvider ? (
                    <span className="truncate">Using <strong>{activeProvider.name}</strong> ({activeProvider.model})</span>
                  ) : (
                    <span className="text-warning">No AI provider. <Link href="/settings" className="underline">Set up</Link></span>
                  )}
                </div>
              </Card>

              {error && (
                <Card className="border-destructive/30 bg-destructive/5 py-3 px-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || !activeProvider || step === 'analyzing'}
                  loading={step === 'analyzing'}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {step === 'analyzing' ? 'Analyzing...' : 'Analyze'}
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

            {/* Right panel: results */}
            <div className="lg:col-span-3">
              {step === 'analyzing' && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Performing forensic-level analysis...</p>
                  <p className="text-xs text-muted-foreground mt-1">Extracting every visual detail</p>
                </div>
              )}

              {step === 'analyzed' && analysis && (
                <AnalysisDisplay analysis={analysis} consistencyPrompt={consistencyPrompt} compact />
              )}

              {step === 'upload' && !analysis && (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" />}
                  title="Ready to Analyze"
                  description="Upload a reference photo and click Analyze to extract every visual detail."
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Step: Saved — show success + generate options */}
        {(step === 'saved' || step === 'generate') && savedCharacter && (
          <motion.div
            key="post-save"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Success banner */}
            <Card glow>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  src={savedCharacter.avatar}
                  alt={savedCharacter.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <h2 className="text-lg font-bold truncate">{savedCharacter.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">Character saved successfully! Now generate content.</p>
                  {savedCharacter.analysis && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <Badge variant="success">Analyzed</Badge>
                      <Badge variant="outline">{savedCharacter.analysis.coreIdentity.gender}</Badge>
                      <Badge variant="outline">{savedCharacter.analysis.coreIdentity.apparentAge}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <Link href="/characters" className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full">View Library</Button>
                  </Link>
                  <Button size="sm" onClick={() => setStep('generate')} className="flex-1 sm:flex-none">
                    <Zap className="w-4 h-4" /> Generate
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick generate */}
            {step === 'generate' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              >
                {/* Prompt area */}
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Generate Content
                  </h3>
                  <Textarea
                    id="genPrompt"
                    placeholder="Describe the scene, pose, setting..."
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-3">
                    <p className="text-[11px] text-muted-foreground mb-2">Quick ideas:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => setGenPrompt(p)}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {p.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    loading={generating}
                    disabled={!genPrompt.trim()}
                    className="w-full mt-4"
                  >
                    <Zap className="w-4 h-4" />
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/generate`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <ArrowRight className="w-3.5 h-3.5" /> Advanced Generate (Sponsorship)
                      </Button>
                    </Link>
                  </div>
                </Card>

                {/* Result */}
                <Card>
                  <h3 className="text-sm font-semibold mb-3">Output</h3>
                  {generating ? (
                    <div className="animate-shimmer w-full h-48 rounded-xl bg-secondary" />
                  ) : genResult ? (
                    <div>
                      {genResult.startsWith('http') || genResult.startsWith('data:') ? (
                        <img src={genResult} alt="Generated" className="w-full rounded-xl" />
                      ) : (
                        <div className="bg-secondary rounded-xl p-4 max-h-64 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <Badge>Generated Prompt</Badge>
                            <button
                              onClick={async () => {
                                const ok = await copyToClipboard(genResult);
                                if (ok) { setGenCopied(true); setTimeout(() => setGenCopied(false), 2000); }
                              }}
                              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 cursor-pointer"
                            >
                              {genCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {genCopied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{genResult}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<ImageIcon className="w-8 h-8 text-primary/30" />}
                      title="Ready"
                      description="Generated content will appear here"
                    />
                  )}
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
