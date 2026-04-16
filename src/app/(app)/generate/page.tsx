'use client';

import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Image as ImageIcon, Video, Megaphone, Copy, Check, Sparkles, ShoppingBag, Upload, X, Camera, Info, Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { db, type GeneratedContent } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { generateContent, type SponsorshipData } from '@/lib/ai-providers';
import { getModelCapabilities, getUnavailableReason } from '@/lib/model-capabilities';
import { ProviderSelector } from '@/components/features/provider-selector';
import { copyToClipboard } from '@/lib/utils';
import Link from 'next/link';

const contentTabs = [
  { id: 'social', label: 'Social Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'sponsored', label: 'Sponsored', icon: <Megaphone className="w-4 h-4" /> },
];

const presetPrompts = [
  { label: 'Casual selfie', prompt: 'Taking a casual selfie in a trendy coffee shop, natural smile, warm lighting' },
  { label: 'Outdoor', prompt: 'Standing in a beautiful park during golden hour, professional portrait' },
  { label: 'Fitness', prompt: 'At the gym, athletic wear, confident pose, dynamic lighting' },
  { label: 'Business', prompt: 'Professional headshot in a modern office, business attire' },
  { label: 'Travel', prompt: 'Stunning mountain landscape, travel outfit, adventurous vibe' },
  { label: 'Night out', prompt: 'Stylish rooftop bar at night, city skyline, elegant outfit' },
];

export default function GeneratePage() {
  const { characters, selectedCharacter, setSelectedCharacter, activeProvider } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'prompt'>('prompt');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('social');

  const caps = activeProvider ? getModelCapabilities(activeProvider.model) : null;

  // Auto-switch content type based on model capabilities
  useEffect(() => {
    if (!caps) return;
    if (caps.videoGeneration && !caps.imageGeneration) {
      setContentType('video');
    } else if (caps.imageGeneration && !caps.videoGeneration) {
      setContentType('image');
    }
  }, [activeProvider?.id, caps?.videoGeneration, caps?.imageGeneration]);

  // Sponsorship
  const [sponsorBrand, setSponsorBrand] = useState('');
  const [sponsorProduct, setSponsorProduct] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setProductImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!selectedCharacter) { toast.error('Select a character first'); return; }
    if (!prompt.trim()) { toast.error('Enter a prompt'); return; }
    if (!activeProvider) { toast.error('Configure an AI provider in Settings'); return; }

    setGenerating(true);
    try {
      const sponsorship = activeTab === 'sponsored' && sponsorBrand
        ? { brand: sponsorBrand, product: sponsorProduct, description: sponsorDesc, productImages: productImages.length > 0 ? productImages : undefined }
        : undefined;

      const res = await generateContent({
        provider: activeProvider,
        consistencyPrompt: selectedCharacter.consistencyPrompt,
        userPrompt: prompt,
        referenceImage: selectedCharacter.referenceImage,
        originalAvatar: selectedCharacter.avatar,
        sponsorship,
      });
      setResult(res.result || res.prompt);
      setResultType(res.type || 'prompt');

      const content: GeneratedContent = {
        id: uuid(),
        characterId: selectedCharacter.id,
        type: contentType,
        prompt: res.prompt,
        result: res.result || res.prompt,
        sponsorship: sponsorship ? { enabled: true, ...sponsorship } : { enabled: false },
        createdAt: Date.now(),
      };
      await db.generatedContent.add(content);
      toast.success('Content generated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyResult = async () => {
    if (result) {
      const ok = await copyToClipboard(result);
      if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Generate Content</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Create photos and videos with your AI influencer characters</p>
      </div>

      {/* Provider Selector */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground mb-1 font-medium">AI Provider</p>
          <ProviderSelector />
        </div>
        {!activeProvider && (
          <Link href="/settings"><Button size="sm" variant="outline">Configure Provider</Button></Link>
        )}
      </div>

      {/* Capability Banner */}
      {activeProvider && caps && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {caps.imageGeneration && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success">
              <Check className="w-3 h-3" /> Image generation
            </div>
          )}
          {caps.videoGeneration && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success">
              <Check className="w-3 h-3" /> Video generation
            </div>
          )}
          {!caps.imageGeneration && !caps.videoGeneration && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-muted border-border text-muted-foreground">
              <Info className="w-3 h-3" /> Prompt only (no media gen)
            </div>
          )}
          {caps.visionInput && selectedCharacter && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success">
              <Check className="w-3 h-3" /> {selectedCharacter.referenceImage ? 'AI face ref sent' : 'Photo ref sent'}
            </div>
          )}
          {!caps.visionInput && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-warning/10 border-warning/20 text-warning">
              <Info className="w-3 h-3" /> No vision — text only
            </div>
          )}
          <span className="flex items-center text-muted-foreground px-1 text-[10px]">{caps.reasoning}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Config */}
        <div className="lg:col-span-2 space-y-4">
          {/* Character Selection */}
          <Card>
            <h2 className="text-sm font-semibold mb-3">Select Character</h2>
            {characters.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square
                      ${selectedCharacter?.id === char.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30'}`}
                  >
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1 left-1.5 right-1 text-[10px] font-medium text-white truncate">
                      {char.name}
                    </span>
                    {selectedCharacter?.id === char.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground mb-3">No characters yet</p>
                <Link href="/create"><Button size="sm">Create Character</Button></Link>
              </div>
            )}
          </Card>

          {/* Content Tabs */}
          <Tabs tabs={contentTabs} defaultTab="social" onChange={setActiveTab}>
            {(tab) => (
              <div className="space-y-4">
                <Card>
                  <Textarea
                    label="Scene Description"
                    id="prompt"
                    placeholder="Describe the scene, pose, setting, mood..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                  <div className="mt-2.5">
                    <p className="text-[11px] text-muted-foreground mb-1.5">Quick presets:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {presetPrompts.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => setPrompt(p.prompt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {tab === 'sponsored' && (
                  <Card glow>
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Sponsorship</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Brand" id="brand" placeholder="e.g., Nike" value={sponsorBrand} onChange={(e) => setSponsorBrand(e.target.value)} />
                      <Input label="Product" id="product" placeholder="e.g., Air Max 2026" value={sponsorProduct} onChange={(e) => setSponsorProduct(e.target.value)} />
                    </div>
                    <div className="mt-3">
                      <Textarea label="Notes" id="sponsorDesc" placeholder="Product placement instructions..." value={sponsorDesc} onChange={(e) => setSponsorDesc(e.target.value)} rows={2} />
                    </div>

                    {/* Product Photo Upload */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-primary" />
                            Product Photos
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Upload product images for AI reference (supported by Gemini, GPT-4o, Qwen)
                          </p>
                        </div>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          Add Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {productImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                          {productImages.map((img, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                              <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeProductImage(i)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[9px] text-white text-center py-0.5">
                                #{i + 1}
                              </div>
                            </div>
                          ))}
                          {/* Add more button */}
                          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors cursor-pointer aspect-square">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground mt-1">Add more</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleProductImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {productImages.length === 0 && (
                        <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer mt-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-primary/60" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground">Drop product photos here</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WebP</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </Card>
                )}

                {/* Content type */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setContentType('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                      ${!caps?.videoGeneration || caps?.imageGeneration ? 'cursor-pointer' : 'cursor-pointer'}
                      ${contentType === 'image' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    <ImageIcon className="w-4 h-4" /> Photo
                    {caps?.imageGeneration && <Badge variant="success" className="text-[9px] px-1.5 py-0">AI Gen</Badge>}
                    {caps && !caps.imageGeneration && <span className="text-[9px] text-muted-foreground">(prompt)</span>}
                  </button>
                  <button
                    onClick={() => caps?.videoGeneration && setContentType('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                      ${contentType === 'video' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground'}
                      ${caps?.videoGeneration ? 'cursor-pointer hover:text-foreground' : 'opacity-40 cursor-not-allowed'}`}
                    title={caps && !caps.videoGeneration ? getUnavailableReason('videoGeneration', activeProvider?.model || '') : undefined}
                  >
                    <Video className="w-4 h-4" /> Video
                    {caps?.videoGeneration && <Badge variant="success" className="text-[9px] px-1.5 py-0">AI Gen</Badge>}
                    {caps && !caps.videoGeneration && <Ban className="w-3 h-3" />}
                  </button>
                </div>
                {caps && !caps.videoGeneration && contentType === 'image' && !caps.imageGeneration && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" /> This model generates text prompts only. Use the prompt with an image generator.</p>
                )}

                <Button onClick={handleGenerate} loading={generating} className="w-full" size="lg" disabled={!selectedCharacter || !prompt.trim()}>
                  <Zap className="w-5 h-5" />
                  {generating ? 'Generating...'
                    : contentType === 'video' && caps?.videoGeneration ? 'Generate Video'
                    : caps?.imageGeneration ? 'Generate Image'
                    : 'Generate Prompt'}
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        {/* Right: Result */}
        <div>
          <Card className="lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Output</h2>
              {result && (
                <button onClick={handleCopyResult} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="animate-shimmer w-full h-48 sm:h-64 rounded-xl bg-secondary" />
                  <p className="text-xs text-muted-foreground text-center animate-pulse">Generating...</p>
                </motion.div>
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {(resultType === 'image' && (result.startsWith('http') || result.startsWith('data:'))) ? (
                    <img src={result} alt="Generated" className="w-full rounded-xl" />
                  ) : (
                    <div className="bg-secondary rounded-xl p-4 max-h-72 overflow-y-auto">
                      <Badge className="mb-2">Generated Prompt</Badge>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8 text-primary/30" />}
                  title="Ready"
                  description="Generated content appears here"
                />
              )}
            </AnimatePresence>

            {selectedCharacter && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2.5">
                <img src={selectedCharacter.avatar} alt={selectedCharacter.name} className="w-9 h-9 rounded-lg object-cover" />
                {selectedCharacter.referenceImage && (
                  <div className="relative">
                    <img src={selectedCharacter.referenceImage} alt="AI Ref" className="w-9 h-9 rounded-lg object-cover border border-primary/30" />
                    <span className="absolute -top-1 -right-1 text-[7px] bg-primary text-white px-1 rounded-full">AI</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{selectedCharacter.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedCharacter.referenceImage ? 'AI face ref' : selectedCharacter.analysis ? 'Original photo ref' : 'No analysis'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
