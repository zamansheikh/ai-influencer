'use client';

import { useState, useEffect, useMemo } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Image as ImageIcon, Video, Megaphone, Copy, Check, Sparkles, ShoppingBag, Upload, X, Camera, Info, Ban, FileJson,
  Repeat, Shirt, MapPin, User, Layers,
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
import { ScenePicker } from '@/components/features/scene-picker';
import { RatioPicker } from '@/components/features/ratio-picker';
import type { AspectRatio } from '@/lib/aspect-ratios';
import Link from 'next/link';

const contentTabs = [
  { id: 'social', label: 'Social Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'swap', label: 'Swap', icon: <Repeat className="w-4 h-4" /> },
  { id: 'sponsored', label: 'Sponsored', icon: <Megaphone className="w-4 h-4" /> },
];

// Each swap aspect: where does it come from?
// "target" = copy from the uploaded target image
// "influencer" = use the influencer's own (default appearance / AI decides)
// "custom" = user provides a text description
type SwapSource = 'target' | 'influencer' | 'custom';

export default function GeneratePage() {
  const { characters, selectedCharacter, setSelectedCharacter, activeProvider } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [outputFormat, setOutputFormat] = useState<'media' | 'prompt'>('media'); // media = image/video, prompt = text
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'prompt'>('prompt');
  const [fullPrompt, setFullPrompt] = useState<string | null>(null); // The complete prompt sent to AI
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('social');

  const caps = activeProvider ? getModelCapabilities(activeProvider.model) : null;
  const canGenMedia = contentType === 'image' ? caps?.imageGeneration : caps?.videoGeneration;

  // Auto-switch content type based on model capabilities
  useEffect(() => {
    if (!caps) return;
    if (caps.videoGeneration && !caps.imageGeneration) {
      setContentType('video');
    } else if (!caps.videoGeneration) {
      setContentType('image');
    }
    // Reset output to media if model supports it
    setOutputFormat(caps.imageGeneration || caps.videoGeneration ? 'media' : 'prompt');
  }, [activeProvider?.id, caps?.videoGeneration, caps?.imageGeneration]);

  // Sponsorship
  const [sponsorBrand, setSponsorBrand] = useState('');
  const [sponsorProduct, setSponsorProduct] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [previewPromptCopied, setPreviewPromptCopied] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);

  // Swap state — independent aspects, each from target or influencer
  const [swapImage, setSwapImage] = useState<string | null>(null);
  const [swapSceneEnabled, setSwapSceneEnabled] = useState(false);
  // Face is ALWAYS influencer — no toggle needed
  const [swapExpression, setSwapExpression] = useState<SwapSource>('target');   // smile/expression
  const [swapOutfit, setSwapOutfit] = useState<SwapSource>('target');
  const [swapPose, setSwapPose] = useState<SwapSource>('target');
  const [swapBackground, setSwapBackground] = useState<SwapSource>('target');
  const [swapCustomOutfit, setSwapCustomOutfit] = useState('');
  const [swapCustomBackground, setSwapCustomBackground] = useState('');

  const handleSwapImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSwapImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Live prompt preview — builds the full prompt in real-time
  const hasRefImage = !!(selectedCharacter?.referenceImage || selectedCharacter?.avatar);
  const livePrompt = useMemo(() => {
    if (!selectedCharacter) return null;
    const parts: string[] = [];

    if (hasRefImage && caps?.visionInput) {
      parts.push(`[FACE REFERENCE PHOTO ATTACHED] — Match this face EXACTLY: same bone structure, same eyes, same nose, same lips, same jawline, same skin tone. The photo is the absolute source of truth. Do NOT alter any facial feature.`);
      parts.push(`[SUPPLEMENTARY TEXT DESCRIPTION]\n${selectedCharacter.consistencyPrompt || ''}`);
    } else {
      parts.push(`[CHARACTER DESCRIPTION]\n${selectedCharacter.consistencyPrompt || ''}`);
    }

    if (activeTab === 'swap') {
      const swapLines: string[] = ['[SWAP / TRANSFER MODE]'];
      if (swapImage) swapLines.push('[TARGET IMAGE ATTACHED]');
      swapLines.push('Recreate the target image with these specific rules:');

      // Face — always influencer
      swapLines.push('FACE: ALWAYS use the INFLUENCER\'s face (from reference photo). Replace the face in the target image. Match bone structure, eyes, nose, lips, skin tone exactly from the influencer reference. The face identity must be the influencer.');

      // Expression / Smile
      swapLines.push(swapExpression === 'target'
        ? 'EXPRESSION: Copy the EXACT facial expression, smile, and emotion from the TARGET image. The influencer\'s face should show the same smile/expression as the person in the target.'
        : 'EXPRESSION: Use the INFLUENCER\'s natural expression. Do NOT copy the smile or expression from the target image.');

      // Outfit
      if (swapOutfit === 'target') swapLines.push('OUTFIT: Copy the EXACT outfit/clothing from the TARGET image. Replicate every detail — fabric, color, pattern, accessories.');
      else if (swapOutfit === 'custom' && swapCustomOutfit) swapLines.push(`OUTFIT: Dress the person in: ${swapCustomOutfit}`);
      else swapLines.push('OUTFIT: Use the INFLUENCER\'s default/signature style. Do NOT copy the outfit from the target image.');

      // Pose
      swapLines.push(swapPose === 'target'
        ? 'POSE: Match the EXACT body pose, position, and gesture from the TARGET image.'
        : 'POSE: Use a natural, comfortable pose. Do NOT copy the pose from the target image.');

      // Background
      if (swapBackground === 'target') swapLines.push('BACKGROUND: Keep the EXACT scene/background/setting from the TARGET image.');
      else if (swapBackground === 'custom' && swapCustomBackground) swapLines.push(`BACKGROUND: ${swapCustomBackground}`);
      else swapLines.push('BACKGROUND: AI decides the background. Do NOT copy from the target image.');

      parts.push(swapLines.join('\n'));
    }
    if (activeTab === 'sponsored' && sponsorBrand) {
      parts.push(`[SPONSORSHIP] Promoting ${sponsorBrand}'s ${sponsorProduct}. ${sponsorDesc}. Show product naturally integrated.`);
    }
    if (prompt.trim()) {
      parts.push(`[SCENE] ${prompt}`);
    }
    if (selectedRatio) {
      parts.push(`[ASPECT RATIO] ${selectedRatio.ratio} (${selectedRatio.width}x${selectedRatio.height}) — ${selectedRatio.platform} ${selectedRatio.label}. Frame the composition for this exact aspect ratio.`);
    }
    if (hasRefImage && caps?.visionInput) {
      parts.push(`[REMINDER] The face in the reference photo is the IDENTITY. Clothing, background, pose can change — but the FACE must remain identical.`);
    }
    return parts.join('\n\n') || null;
  }, [selectedCharacter, prompt, activeTab, sponsorBrand, sponsorProduct, sponsorDesc, hasRefImage, caps?.visionInput, selectedRatio, swapImage, swapExpression, swapOutfit, swapPose, swapBackground, swapCustomOutfit, swapCustomBackground]);

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
    if (activeTab !== 'swap' && !prompt.trim()) { toast.error('Enter a prompt'); return; }
    if (!activeProvider) { toast.error('Configure an AI provider in Settings'); return; }

    setGenerating(true);
    try {
      const sponsorship = activeTab === 'sponsored' && sponsorBrand
        ? { brand: sponsorBrand, product: sponsorProduct, description: sponsorDesc, productImages: productImages.length > 0 ? productImages : undefined }
        : undefined;

      // Build swap-aware prompt
      let userPrompt = prompt;
      if (activeTab === 'swap') {
        const sp: string[] = ['Recreate the target image with these rules:'];
        sp.push('FACE: Always use influencer face from reference.');
        sp.push(swapExpression === 'target' ? 'EXPRESSION: Copy target smile/expression.' : 'EXPRESSION: Use influencer natural expression.');
        sp.push(swapOutfit === 'target' ? 'OUTFIT: Copy exact outfit from target.' : swapOutfit === 'custom' && swapCustomOutfit ? `OUTFIT: ${swapCustomOutfit}` : 'OUTFIT: Use influencer style.');
        sp.push(swapPose === 'target' ? 'POSE: Match target pose exactly.' : 'POSE: Natural pose.');
        sp.push(swapBackground === 'target' ? 'BACKGROUND: Keep target background.' : swapBackground === 'custom' && swapCustomBackground ? `BACKGROUND: ${swapCustomBackground}` : 'BACKGROUND: AI decides.');
        if (prompt) sp.push(`Additional: ${prompt}`);
        userPrompt = sp.join(' ');
      }

      const res = await generateContent({
        provider: activeProvider,
        consistencyPrompt: selectedCharacter.consistencyPrompt,
        userPrompt,
        referenceImage: selectedCharacter.referenceImage,
        originalAvatar: selectedCharacter.avatar,
        sponsorship,
        forceTextOnly: outputFormat === 'prompt',
        swapImage: activeTab === 'swap' && swapImage ? swapImage : undefined,
      });
      setResult(res.result || res.prompt);
      setResultType(res.type || 'prompt');
      setFullPrompt(res.prompt);
      setShowPrompt(true);

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
                {/* Scene description — always for social/sponsored, toggleable for swap */}
                <Card>
                  {tab === 'swap' && (
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={swapSceneEnabled}
                          onChange={(e) => setSwapSceneEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-border accent-primary"
                        />
                        <span className="text-xs font-medium">Scene Description & Presets</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">{swapSceneEnabled ? 'Enabled' : 'Disabled — using target image as scene'}</span>
                    </div>
                  )}
                  {(tab !== 'swap' || swapSceneEnabled) && (
                    <>
                      <Textarea
                        label={tab === 'swap' ? 'Additional Scene / Instructions' : 'Scene Description'}
                        id="prompt"
                        placeholder={tab === 'swap' ? 'Override scene, add extra instructions...' : 'Describe the scene, pose, setting, mood...'}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={tab === 'swap' ? 2 : 3}
                      />
                      <div className="mt-3">
                        <ScenePicker onSelect={setPrompt} />
                      </div>
                    </>
                  )}
                  {tab !== 'swap' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <RatioPicker selected={selectedRatio} onSelect={setSelectedRatio} />
                    </div>
                  )}
                </Card>

                {/* ── Swap Mode ── */}
                {tab === 'swap' && (
                  <>
                    {/* Upload target */}
                    <Card glow>
                      <div className="flex items-center gap-2 mb-3">
                        <Repeat className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Swap / Transfer</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        Upload a reference image. Choose what to take from it vs your influencer.
                      </p>

                      {swapImage ? (
                        <div className="relative group rounded-xl overflow-hidden">
                          <img src={swapImage} alt="Swap target" className="w-full h-48 object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <button onClick={() => setSwapImage(null)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-destructive rounded-full cursor-pointer">
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                          <Badge className="absolute top-2 left-2">Target Image</Badge>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary/60" />
                          </div>
                          <p className="text-xs font-medium">Upload target image</p>
                          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleSwapImageUpload} />
                        </label>
                      )}
                      {!caps?.visionInput && (
                        <p className="text-[10px] text-warning mt-2 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" /> {activeProvider?.model} has no vision — only text prompt will be generated.
                        </p>
                      )}
                    </Card>

                    {/* 4 independent swap controls */}
                    <Card>
                      <h3 className="text-xs font-semibold mb-1">What to use from where?</h3>
                      <p className="text-[10px] text-muted-foreground mb-4">For each aspect, choose: copy from the <strong>target image</strong>, use the <strong>influencer&apos;s own</strong>, or write <strong>custom</strong>.</p>

                      {/* FACE — always influencer, no toggle */}
                      <div className="mb-3 pb-3 border-b border-border">
                        <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Face</p>
                        <div className="flex gap-1.5">
                          <div className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-primary/10 border border-primary/30 text-primary text-center">
                            Always Influencer
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Face identity is always your influencer character — this cannot be changed.</p>
                      </div>

                      {/* EXPRESSION / SMILE */}
                      <SwapRow
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        label="Expression / Smile"
                        value={swapExpression}
                        onChange={setSwapExpression}
                        options={[
                          { id: 'target', label: 'Copy target expression' },
                          { id: 'influencer', label: 'Influencer natural' },
                        ]}
                      />

                      {/* OUTFIT */}
                      <SwapRow
                        icon={<Shirt className="w-3.5 h-3.5" />}
                        label="Outfit"
                        value={swapOutfit}
                        onChange={setSwapOutfit}
                        options={[
                          { id: 'target', label: 'From target image' },
                          { id: 'influencer', label: 'Influencer style' },
                          { id: 'custom', label: 'Custom' },
                        ]}
                        customValue={swapCustomOutfit}
                        onCustomChange={setSwapCustomOutfit}
                        customPlaceholder="e.g., red silk dress, gold jewelry"
                      />

                      {/* POSE */}
                      <SwapRow
                        icon={<Layers className="w-3.5 h-3.5" />}
                        label="Pose"
                        value={swapPose}
                        onChange={setSwapPose}
                        options={[
                          { id: 'target', label: 'Copy target pose' },
                          { id: 'influencer', label: 'Natural / AI decides' },
                        ]}
                      />

                      {/* BACKGROUND */}
                      <SwapRow
                        icon={<MapPin className="w-3.5 h-3.5" />}
                        label="Background"
                        value={swapBackground}
                        onChange={setSwapBackground}
                        options={[
                          { id: 'target', label: 'From target image' },
                          { id: 'influencer', label: 'AI decides' },
                          { id: 'custom', label: 'Custom' },
                        ]}
                        customValue={swapCustomBackground}
                        onCustomChange={setSwapCustomBackground}
                        customPlaceholder="e.g., sunset beach, modern office"
                        last
                      />
                    </Card>

                    {/* Aspect ratio */}
                    <Card>
                      <RatioPicker selected={selectedRatio} onSelect={setSelectedRatio} />
                    </Card>
                  </>
                )}

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

                {/* Content type: Photo / Video */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Content Type</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContentType('image')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer
                        ${contentType === 'image' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      <ImageIcon className="w-4 h-4" /> Photo
                    </button>
                    <button
                      onClick={() => caps?.videoGeneration && setContentType('video')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border
                        ${contentType === 'video' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground'}
                        ${caps?.videoGeneration ? 'cursor-pointer hover:text-foreground' : 'opacity-40 cursor-not-allowed'}`}
                      title={caps && !caps.videoGeneration ? getUnavailableReason('videoGeneration', activeProvider?.model || '') : undefined}
                    >
                      <Video className="w-4 h-4" /> Video
                      {caps && !caps.videoGeneration && <Ban className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Output format: Image/Video or Prompt */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Output Format</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => canGenMedia && setOutputFormat('media')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border
                        ${outputFormat === 'media' && canGenMedia ? 'bg-success/10 border-success/30 text-success' : 'border-border text-muted-foreground'}
                        ${canGenMedia ? 'cursor-pointer hover:text-foreground' : 'opacity-40 cursor-not-allowed'}`}
                      title={!canGenMedia ? `${activeProvider?.model} cannot generate ${contentType === 'video' ? 'video' : 'images'}` : undefined}
                    >
                      {contentType === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      {contentType === 'video' ? 'Video Output' : 'Image Output'}
                      {canGenMedia && <Badge variant="success" className="text-[8px] px-1 py-0">AI</Badge>}
                      {!canGenMedia && <Ban className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setOutputFormat('prompt')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer
                        ${outputFormat === 'prompt' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      <Copy className="w-3.5 h-3.5" /> Text Prompt
                    </button>
                  </div>
                  {outputFormat === 'prompt' && canGenMedia && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3 shrink-0" /> Will generate a detailed text prompt instead of {contentType === 'video' ? 'video' : 'an image'}. Use it with any external generator.
                    </p>
                  )}
                  {!canGenMedia && outputFormat === 'media' && (
                    <p className="text-[10px] text-warning mt-1.5 flex items-center gap-1">
                      <Info className="w-3 h-3 shrink-0" /> {getUnavailableReason(contentType === 'video' ? 'videoGeneration' : 'imageGeneration', activeProvider?.model || '')}
                    </p>
                  )}
                </div>

                <Button onClick={handleGenerate} loading={generating} className="w-full" size="lg"
                  disabled={!selectedCharacter || (activeTab !== 'swap' && !prompt.trim())}>
                  <Zap className="w-5 h-5" />
                  {generating ? 'Generating...'
                    : outputFormat === 'prompt' ? 'Generate Prompt'
                    : contentType === 'video' ? 'Generate Video'
                    : 'Generate Image'}
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        {/* Right: Prompt Preview + Result */}
        <div className="space-y-4">
          {/* Live Prompt Preview — always visible when character + scene selected */}
          {livePrompt && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-primary" />
                  Prompt Preview
                </h2>
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(livePrompt);
                    if (ok) { setPreviewPromptCopied(true); setTimeout(() => setPreviewPromptCopied(false), 2000); }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {previewPromptCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {previewPromptCopied ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                This is the full prompt that will be sent. Copy it to use in Midjourney, DALL-E, ComfyUI, etc.
              </p>
              <div className="bg-secondary rounded-xl p-3 max-h-40 overflow-y-auto">
                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">{livePrompt}</p>
              </div>
              {!prompt.trim() && activeTab !== 'swap' && (
                <p className="text-[10px] text-warning mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> Type a scene description to complete the prompt</p>
              )}
            </Card>
          )}

          {/* Generated Output */}
          <Card className="lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Output</h2>
              {result && (
                <button onClick={handleCopyResult} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy Result'}
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

            {/* Character info */}
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

          {/* Full Prompt Panel — always visible after generation */}
          {fullPrompt && showPrompt && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-primary" />
                  Full Prompt
                </h2>
                <button
                  onClick={async () => {
                    const ok = await copyToClipboard(fullPrompt);
                    if (ok) { setPromptCopied(true); setTimeout(() => setPromptCopied(false), 2000); }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {promptCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {promptCopied ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                Use this prompt with any AI (Midjourney, DALL-E, ComfyUI, Stable Diffusion, etc.) to recreate the same result.
              </p>
              <div className="bg-secondary rounded-xl p-3 max-h-48 overflow-y-auto">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">{fullPrompt}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable row for swap controls — each aspect (face, outfit, pose, bg)
function SwapRow({ icon, label, value, onChange, options, customValue, onCustomChange, customPlaceholder, last }: {
  icon: React.ReactNode;
  label: string;
  value: SwapSource;
  onChange: (v: SwapSource) => void;
  options: { id: SwapSource; label: string }[];
  customValue?: string;
  onCustomChange?: (v: string) => void;
  customPlaceholder?: string;
  last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-3 pb-3 border-b border-border'}>
      <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1.5">{icon} {label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border text-center
              ${value === opt.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === 'custom' && onCustomChange && (
        <input
          type="text"
          placeholder={customPlaceholder}
          value={customValue || ''}
          onChange={(e) => onCustomChange(e.target.value)}
          className="w-full mt-2 h-8 px-3 rounded-lg bg-input border border-border text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}
