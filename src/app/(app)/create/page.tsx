'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Save, ArrowLeft, Loader2, AlertCircle, Zap, ArrowRight,
  CheckCircle2, Image as ImageIcon, Copy, Check, Info, Camera, Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ImageUpload } from '@/components/features/image-upload';
import { AnalysisDisplay } from '@/components/features/analysis-display';
import { ProviderSelector } from '@/components/features/provider-selector';
import { ScenePicker } from '@/components/features/scene-picker';
import { db, type Character, type CharacterAnalysis } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { analyzeImage, generateReferenceImage, generateContent } from '@/lib/ai-providers';
import { getModelCapabilities, getUnavailableReason } from '@/lib/model-capabilities';
import { copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

type Step = 'upload' | 'analyzing' | 'analyzed' | 'generating-ref' | 'saved' | 'generate';

export default function CreateCharacterPage() {
  const router = useRouter();
  const { activeProvider, addCharacter, setSelectedCharacter } = useAppStore();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [analysis, setAnalysis] = useState<CharacterAnalysis | null>(null);
  const [consistencyPrompt, setConsistencyPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedCharacter, setSavedCharacter] = useState<Character | null>(null);

  // Generate content state
  const [genPrompt, setGenPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genResultType, setGenResultType] = useState<'image' | 'prompt'>('prompt');
  const [genFullPrompt, setGenFullPrompt] = useState<string | null>(null);
  const [genCopied, setGenCopied] = useState(false);
  const [genPromptCopied, setGenPromptCopied] = useState(false);

  const caps = activeProvider ? getModelCapabilities(activeProvider.model) : null;

  const handleAnalyze = async () => {
    if (!imageBase64) { toast.error('Upload a reference photo first'); return; }
    if (!activeProvider) { toast.error('Configure an AI provider in Settings'); return; }

    setStep('analyzing');
    setError('');

    try {
      const result = await analyzeImage(activeProvider, imageBase64);
      setAnalysis(result.analysis as unknown as CharacterAnalysis);
      setConsistencyPrompt(result.consistencyPrompt);

      // If model can generate images, create a reference face image
      const modelCaps = getModelCapabilities(activeProvider.model);
      if (modelCaps.imageGeneration && result.consistencyPrompt) {
        setStep('generating-ref');
        toast.success('Analysis complete! Generating reference face...');
        try {
          const refImg = await generateReferenceImage(activeProvider, result.consistencyPrompt, imageBase64);
          if (refImg) {
            setReferenceImage(refImg);
            toast.success('Reference face generated!');
          }
        } catch (err) {
          console.warn('Reference image generation failed:', err);
          toast.info('Could not generate reference face — will use original photo');
        }
      } else {
        toast.success('Character analyzed!');
      }

      setStep('analyzed');
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
        referenceImage: referenceImage || undefined,
        analysis,
        consistencyPrompt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.characters.add(character);
      addCharacter(character);
      setSavedCharacter(character);
      setSelectedCharacter(character);
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
      const res = await generateContent({
        provider: activeProvider,
        consistencyPrompt: savedCharacter.consistencyPrompt,
        userPrompt: genPrompt,
        referenceImage: savedCharacter.referenceImage,
        originalAvatar: savedCharacter.avatar,
      });
      setGenResult(res.result || res.prompt);
      setGenResultType(res.type || 'prompt');
      setGenFullPrompt(res.prompt);
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // removed — using ScenePicker component instead

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/characters" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Create Character</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Upload a photo to extract forensic-level details</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        {(['Upload', 'Analyze', 'Reference', 'Save', 'Generate'] as const).map((label, i) => {
          const stepMap: Record<string, number> = { upload: 0, analyzing: 1, 'generating-ref': 2, analyzed: 2, saved: 3, generate: 4 };
          const current = stepMap[step] ?? 0;
          const isComplete = i < current;
          const isActive = i === current;
          const isSkipped = label === 'Reference' && caps && !caps.imageGeneration;
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              {i > 0 && <div className={`w-4 sm:w-8 h-px ${isComplete || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors text-[11px]
                ${isSkipped ? 'border-border/50 text-muted-foreground/50 line-through' : isComplete ? 'bg-primary/15 border-primary/30 text-primary' : isActive ? 'bg-primary/10 border-primary/20 text-foreground' : 'border-border text-muted-foreground'}`}>
                {isComplete ? <CheckCircle2 className="w-3 h-3" /> : isSkipped ? <Ban className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                <span className="font-medium">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capability Info Banner */}
      {activeProvider && caps && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${caps.visionInput ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            {caps.visionInput ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
            Vision Input
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${caps.imageGeneration ? 'bg-success/10 border-success/20 text-success' : 'bg-muted border-border text-muted-foreground'}`}>
            {caps.imageGeneration ? <Check className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            Image Gen {!caps.imageGeneration && '(unavailable)'}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${caps.multiImageInput ? 'bg-success/10 border-success/20 text-success' : 'bg-muted border-border text-muted-foreground'}`}>
            {caps.multiImageInput ? <Check className="w-3 h-3" /> : <Info className="w-3 h-3" />}
            Multi-Image
          </div>
          <span className="flex items-center text-muted-foreground px-1">{caps.reasoning}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Upload & Analyze */}
        {(step === 'upload' || step === 'analyzing' || step === 'generating-ref' || step === 'analyzed') && (
          <motion.div key="create-flow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <h2 className="text-sm font-semibold mb-3">Reference Photo</h2>
                <ImageUpload
                  onImageSelect={(img) => { setImageBase64(img); setStep('upload'); setAnalysis(null); setReferenceImage(null); }}
                  currentImage={imageBase64}
                  onClear={() => { setImageBase64(null); setAnalysis(null); setConsistencyPrompt(''); setReferenceImage(null); setStep('upload'); }}
                />
              </Card>

              {/* AI-Generated Reference Face */}
              {referenceImage && (
                <Card glow>
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold">AI Reference Face</h3>
                    <Badge variant="success">Generated</Badge>
                  </div>
                  <img src={referenceImage} alt="AI Reference" className="w-full rounded-xl" />
                  <p className="text-[10px] text-muted-foreground mt-2">This AI-generated reference will be used for face consistency in all future content.</p>
                </Card>
              )}

              <Card>
                <Input label="Character Name" id="charName" placeholder="e.g., Luna Martinez" value={name} onChange={(e) => setName(e.target.value)} />
              </Card>

              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">AI Provider</p>
                <ProviderSelector />
                {!activeProvider && (
                  <p className="text-[11px] text-warning mt-1">No provider. <Link href="/settings" className="underline">Set up</Link></p>
                )}
              </div>

              {error && (
                <Card className="border-destructive/30 bg-destructive/5 py-3 px-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                </Card>
              )}

              {/* Image gen unavailable notice */}
              {activeProvider && caps && !caps.imageGeneration && step === 'analyzed' && (
                <Card className="border-warning/20 bg-warning/5 py-3 px-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-xs text-warning">
                      <p className="font-medium">No reference face generated</p>
                      <p className="text-muted-foreground mt-0.5">{getUnavailableReason('imageGeneration', activeProvider.model)}</p>
                      <p className="text-muted-foreground mt-0.5">The original uploaded photo will be used as face reference instead.</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || !activeProvider || step === 'analyzing' || step === 'generating-ref'}
                  loading={step === 'analyzing' || step === 'generating-ref'}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {step === 'analyzing' ? 'Analyzing...' : step === 'generating-ref' ? 'Generating face...' : 'Analyze'}
                </Button>
                <Button variant="secondary" onClick={handleSave} disabled={!imageBase64 || !name.trim()} loading={saving}>
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-3">
              {(step === 'analyzing' || step === 'generating-ref') && (
                <div className="flex flex-col items-center justify-center py-16 sm:py-20">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {step === 'generating-ref' ? 'Generating reference face image...' : 'Performing forensic-level analysis...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step === 'generating-ref' ? 'Creating a clean AI reference for consistency' : 'Extracting every visual detail'}
                  </p>
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

        {/* Saved + Generate */}
        {(step === 'saved' || step === 'generate') && savedCharacter && (
          <motion.div key="post-save" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            <Card glow>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex gap-2 shrink-0">
                  <img src={savedCharacter.avatar} alt={savedCharacter.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover" />
                  {savedCharacter.referenceImage && (
                    <div className="relative">
                      <img src={savedCharacter.referenceImage} alt="AI Ref" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-primary/30" />
                      <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-white px-1 rounded-full">AI</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <h2 className="text-lg font-bold truncate">{savedCharacter.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {savedCharacter.referenceImage ? 'Saved with AI reference face for consistency!' : 'Saved! Using original photo as reference.'}
                  </p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <Badge variant="success">Analyzed</Badge>
                    {savedCharacter.referenceImage && <Badge>AI Face Ref</Badge>}
                    {savedCharacter.analysis && (
                      <>
                        <Badge variant="outline">{savedCharacter.analysis.coreIdentity.gender}</Badge>
                        <Badge variant="outline">{savedCharacter.analysis.coreIdentity.apparentAge}</Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <Link href="/characters" className="flex-1 sm:flex-none">
                    <Button variant="outline" size="sm" className="w-full">Library</Button>
                  </Link>
                  <Button size="sm" onClick={() => setStep('generate')} className="flex-1 sm:flex-none">
                    <Zap className="w-4 h-4" /> Generate
                  </Button>
                </div>
              </div>
            </Card>

            {step === 'generate' && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Generate Content
                  </h3>

                  {/* Capability chips */}
                  {caps && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {caps.imageGeneration ? (
                        <Badge variant="success">Will generate image</Badge>
                      ) : (
                        <Badge variant="outline">Will generate prompt (no image gen)</Badge>
                      )}
                      {caps.visionInput && <Badge variant="success">Face ref sent</Badge>}
                    </div>
                  )}

                  <Textarea id="genPrompt" placeholder="Describe the scene, pose, setting..." value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} rows={3} />
                  <div className="mt-3">
                    <ScenePicker onSelect={setGenPrompt} />
                  </div>
                  <Button onClick={handleGenerate} loading={generating} disabled={!genPrompt.trim()} className="w-full mt-4">
                    <Zap className="w-4 h-4" /> {generating ? 'Generating...' : caps?.imageGeneration ? 'Generate Image' : 'Generate Prompt'}
                  </Button>
                  <Link href="/generate" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <ArrowRight className="w-3.5 h-3.5" /> Advanced (Sponsorship + Product Photos)
                    </Button>
                  </Link>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <h3 className="text-sm font-semibold mb-3">Output</h3>
                    {generating ? (
                      <div className="animate-shimmer w-full h-48 rounded-xl bg-secondary" />
                    ) : genResult ? (
                      <div>
                        {(genResultType === 'image' && (genResult.startsWith('http') || genResult.startsWith('data:'))) ? (
                          <img src={genResult} alt="Generated" className="w-full rounded-xl" />
                        ) : (
                          <div className="bg-secondary rounded-xl p-4 max-h-64 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                              <Badge>AI Response</Badge>
                              <button
                                onClick={async () => { const ok = await copyToClipboard(genResult); if (ok) { setGenCopied(true); setTimeout(() => setGenCopied(false), 2000); } }}
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
                      <EmptyState icon={<ImageIcon className="w-8 h-8 text-primary/30" />} title="Ready" description="Generated content will appear here" />
                    )}
                  </Card>

                  {/* Full prompt — for use in external tools */}
                  {genFullPrompt && (
                    <Card>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5">
                          <Copy className="w-4 h-4 text-primary" /> Full Prompt
                        </h3>
                        <button
                          onClick={async () => { const ok = await copyToClipboard(genFullPrompt); if (ok) { setGenPromptCopied(true); setTimeout(() => setGenPromptCopied(false), 2000); } }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {genPromptCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {genPromptCopied ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Use this with Midjourney, DALL-E, Stable Diffusion, or any AI to recreate the same character.
                      </p>
                      <div className="bg-secondary rounded-xl p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">{genFullPrompt}</p>
                      </div>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
