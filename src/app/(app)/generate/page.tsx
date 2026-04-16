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
import { db } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { generateContent, type SponsorshipData } from '@/lib/ai-providers';
import { getModelCapabilities } from '@/lib/model-capabilities';
import { ProviderSelector } from '@/components/features/provider-selector';
import { copyToClipboard } from '@/lib/utils';
import { ScenePicker } from '@/components/features/scene-picker';
import { RatioPicker } from '@/components/features/ratio-picker';
import type { AspectRatio } from '@/lib/aspect-ratios';
import type { ScenePreset } from '@/lib/scene-presets';
import Link from 'next/link';

const contentTabs = [
  { id: 'social', label: 'Social Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'swap', label: 'Swap', icon: <Repeat className="w-4 h-4" /> },
  { id: 'sponsored', label: 'Sponsored', icon: <Megaphone className="w-4 h-4" /> },
];

type SwapSource = 'target' | 'influencer' | 'custom';

export default function GeneratePage() {
  const { characters, selectedCharacter, setSelectedCharacter, activeProvider } = useAppStore();

  // ── Structured fields — each controls ONE prompt section, no overlap ──
  const [sceneText, setSceneText] = useState('');           // location, environment, lighting ONLY
  const [outfitText, setOutfitText] = useState('');          // clothing ONLY
  const [poseText, setPoseText] = useState('');              // pose/action ONLY
  const [expressionText, setExpressionText] = useState('');  // facial expression ONLY

  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [outputFormat, setOutputFormat] = useState<'media' | 'prompt'>('media');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'image' | 'prompt'>('prompt');
  const [fullPrompt, setFullPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [previewPromptCopied, setPreviewPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('social');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio | null>(null);

  const caps = activeProvider ? getModelCapabilities(activeProvider.model) : null;
  const canGenMedia = contentType === 'image' ? caps?.imageGeneration : caps?.videoGeneration;

  useEffect(() => {
    if (!caps) return;
    if (caps.videoGeneration && !caps.imageGeneration) setContentType('video');
    else if (!caps.videoGeneration) setContentType('image');
    setOutputFormat(caps.imageGeneration || caps.videoGeneration ? 'media' : 'prompt');
  }, [activeProvider?.id, caps?.videoGeneration, caps?.imageGeneration]);

  // ── Sponsorship ──
  const [sponsorBrand, setSponsorBrand] = useState('');
  const [sponsorProduct, setSponsorProduct] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);

  // ── Swap ──
  const [swapImage, setSwapImage] = useState<string | null>(null);
  const [swapSceneEnabled, setSwapSceneEnabled] = useState(false);
  const [swapExpression, setSwapExpression] = useState<SwapSource>('target');
  const [swapOutfit, setSwapOutfit] = useState<SwapSource>('target');
  const [swapPose, setSwapPose] = useState<SwapSource>('target');
  const [swapCustomOutfit, setSwapCustomOutfit] = useState('');

  const handleSwapImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSwapImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setProductImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  const removeProductImage = (i: number) => setProductImages((prev) => prev.filter((_, idx) => idx !== i));

  // Apply a scene preset — fills separate fields
  const applyPreset = (preset: ScenePreset) => {
    setSceneText(preset.scene);
    if (preset.outfit) setOutfitText(preset.outfit);
    if (preset.pose) setPoseText(preset.pose);
    if (preset.expression) setExpressionText(preset.expression);
  };

  // ── LIVE PROMPT — dynamic image numbering, each control = one section ──
  const hasRefImage = !!(selectedCharacter?.referenceImage || selectedCharacter?.avatar);
  const livePrompt = useMemo(() => {
    if (!selectedCharacter) return null;
    const parts: string[] = [];
    const isSwap = activeTab === 'swap';
    const hasSwapTarget = isSwap && !!swapImage;
    const hasProducts = activeTab === 'sponsored' && productImages.length > 0;

    // ── Dynamic image numbering ──
    let imgNum = 1;
    const faceImgNum = hasRefImage ? imgNum++ : 0;
    const targetImgNum = hasSwapTarget ? imgNum++ : 0;
    const productStartNum = hasProducts ? imgNum : 0;

    // IMAGE MANIFEST — tells the AI exactly what each attached image is
    if (faceImgNum || targetImgNum || productStartNum) {
      const manifest: string[] = ['=== ATTACHED IMAGES ==='];
      if (faceImgNum) manifest.push(`IMAGE ${faceImgNum}: This is the INFLUENCER\'S FACE. This person\'s face must appear in the output. Match every facial feature exactly.`);
      if (targetImgNum) manifest.push(`IMAGE ${targetImgNum}: This is the TARGET REFERENCE IMAGE. Use this image as the primary source for the scene, pose, and outfit.`);
      if (productStartNum) {
        for (let i = 0; i < productImages.length; i++) {
          manifest.push(`IMAGE ${productStartNum + i}: PRODUCT PHOTO #${i + 1} — show this product in the generated image.`);
        }
      }
      manifest.push('');
      manifest.push(`Total images attached: ${imgNum - 1}. Upload them in this exact order.`);
      parts.push(manifest.join('\n'));
    }

    parts.push(`Generate a photorealistic portrait photo.`);

    // SPONSORSHIP
    if (activeTab === 'sponsored' && sponsorBrand) {
      let sp = `[SPONSORSHIP] The person is promoting ${sponsorBrand} ${sponsorProduct}. ${sponsorDesc}. Show the product naturally integrated — the person should interact with or showcase the product in a natural influencer style.`;
      if (productStartNum) sp += ` Match the exact product appearance from the attached product photos.`;
      parts.push(sp);
    }

    // SYNTHESIZE SCENE & IDENTITY
    if (isSwap) {
      const tImg = targetImgNum ? `IMAGE ${targetImgNum}` : 'target';
      const fImg = faceImgNum ? `IMAGE ${faceImgNum}` : 'reference';

      const swapBlock: string[] = [];
      swapBlock.push(`TASK: Recreate ${tImg} but with a different person's face.`);
      swapBlock.push(`Look at ${tImg} carefully. This is your primary reference for the output image.`);
      swapBlock.push('');
      swapBlock.push('WHAT TO COPY FROM EACH IMAGE:');
      swapBlock.push(`FACE: Use the person's face from ${fImg} (the influencer). Replace the face in ${tImg} with this face. Match every facial feature — bone structure, eyes, nose, lips, jawline, skin tone.`);
      swapBlock.push(swapExpression === 'target' && targetImgNum
        ? `EXPRESSION/SMILE: Copy the exact facial expression and smile from ${tImg}. The influencer should show the same emotion as the person in ${tImg}.`
        : `EXPRESSION/SMILE: Use the influencer's natural expression. Do NOT copy the expression from ${tImg}.`);
      swapBlock.push(swapOutfit === 'target' && targetImgNum
        ? `OUTFIT/CLOTHING: Copy the EXACT outfit from ${tImg}. Replicate every detail — the fabric, color, pattern, neckline, sleeves, accessories, jewelry. The person in the output must wear the identical clothing as shown in ${tImg}.`
        : swapOutfit === 'custom' && swapCustomOutfit
        ? `OUTFIT/CLOTHING: Dress the person in: ${swapCustomOutfit}. Ignore the outfit in ${tImg}.`
        : `OUTFIT/CLOTHING: Use the influencer's own signature style. Ignore the outfit in ${tImg}.`);
      swapBlock.push(swapPose === 'target' && targetImgNum
        ? `POSE/BODY POSITION: Match the exact body pose, hand position, and gesture from ${tImg}.`
        : `POSE/BODY POSITION: Use a natural pose. Ignore the pose in ${tImg}.`);
      swapBlock.push(swapSceneEnabled && sceneText.trim()
        ? `BACKGROUND/SCENE: ${sceneText}. Ignore the background in ${tImg}.`
        : targetImgNum
        ? `BACKGROUND/SCENE: Keep the exact background, setting, and lighting from ${tImg}.`
        : `BACKGROUND/SCENE: AI decides.`);

      swapBlock.push('');
      swapBlock.push(`SUBJECT IDENTITY (permanent physical traits):`);
      swapBlock.push(selectedCharacter.consistencyPrompt || '(text only, no photo)');

      parts.push(swapBlock.join('\n'));
    } else {
      const pieces: string[] = [];
      if (sceneText.trim()) pieces.push(`${sceneText}`);
      if (outfitText.trim()) pieces.push(`Outfit: ${outfitText}`);
      if (poseText.trim()) pieces.push(`Pose: ${poseText}`);
      if (expressionText.trim()) pieces.push(`Expression: ${expressionText}`);
      
      parts.push(`SCENE & OUTFIT:\n${pieces.join('. ')}\n\nSUBJECT IDENTITY:\n${selectedCharacter.consistencyPrompt || '(text only, no photo)'}`);
    }

    // RATIO
    if (selectedRatio) {
      parts.push(`[ASPECT RATIO] ${selectedRatio.ratio} (${selectedRatio.width}x${selectedRatio.height}) — ${selectedRatio.platform} ${selectedRatio.label}.`);
    }

    // REMINDER
    if (faceImgNum) {
      parts.push(`CRITICAL RULE: The attached FACE REFERENCE photo is the absolute source of truth for the person's identity. You must match their facial bone structure, eye shape, nose shape, lip shape, jawline, and skin tone identically.`);
    }

    return parts.join('\n\n') || null;
  }, [selectedCharacter, sceneText, outfitText, poseText, expressionText, activeTab, sponsorBrand, sponsorProduct, sponsorDesc, hasRefImage, selectedRatio, swapImage, swapExpression, swapOutfit, swapPose, swapSceneEnabled, swapCustomOutfit, productImages.length]);

  // ── GENERATE ──
  const handleGenerate = async () => {
    if (!selectedCharacter) { toast.error('Select a character first'); return; }
    if (activeTab !== 'swap' && !sceneText.trim()) { toast.error('Enter a scene description'); return; }
    if (!activeProvider) { toast.error('Configure an AI provider in Settings'); return; }

    setGenerating(true);
    try {
      const sponsorship = activeTab === 'sponsored' && sponsorBrand
        ? { brand: sponsorBrand, product: sponsorProduct, description: sponsorDesc, productImages: productImages.length > 0 ? productImages : undefined }
        : undefined;

      let userPrompt: string;
      if (activeTab === 'swap') {
        const sr: string[] = [];
        sr.push('Recreate the TARGET IMAGE but with the influencer\'s face.');
        sr.push(`FACE: From influencer reference.`);
        sr.push(swapExpression === 'target' ? 'EXPRESSION: Copy the exact expression/smile from the TARGET IMAGE.' : 'EXPRESSION: Influencer natural.');
        sr.push(swapOutfit === 'target' ? 'OUTFIT: Copy the EXACT outfit/clothing from the TARGET IMAGE — replicate fabric, color, pattern, neckline, sleeves, jewelry, every detail.' : swapOutfit === 'custom' && swapCustomOutfit ? `OUTFIT: ${swapCustomOutfit}` : 'OUTFIT: Influencer style.');
        sr.push(swapPose === 'target' ? 'POSE: Match exact body pose from TARGET IMAGE.' : 'POSE: Natural.');
        sr.push(swapSceneEnabled && sceneText.trim() ? `BACKGROUND: ${sceneText}` : 'BACKGROUND: Keep exact background from TARGET IMAGE.');
        userPrompt = sr.join('\n');
      } else {
        const pieces: string[] = [];
        if (sceneText.trim()) pieces.push(`Scene: ${sceneText}`);
        if (outfitText.trim()) pieces.push(`Outfit: ${outfitText}`);
        if (poseText.trim()) pieces.push(`Pose: ${poseText}`);
        if (expressionText.trim()) pieces.push(`Expression: ${expressionText}`);
        userPrompt = pieces.join('. ');
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

      await db.generatedContent.add({
        id: uuid(),
        characterId: selectedCharacter.id,
        type: contentType,
        prompt: res.prompt,
        result: res.result || res.prompt,
        sponsorship: sponsorship ? { enabled: true, ...sponsorship } : { enabled: false },
        createdAt: Date.now(),
      });
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

      {/* Provider */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground mb-1 font-medium">AI Provider</p>
          <ProviderSelector />
        </div>
        {!activeProvider && <Link href="/settings"><Button size="sm" variant="outline">Configure Provider</Button></Link>}
      </div>

      {/* Capabilities */}
      {activeProvider && caps && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          {caps.imageGeneration && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success"><Check className="w-3 h-3" /> Image gen</div>}
          {caps.videoGeneration && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success"><Check className="w-3 h-3" /> Video gen</div>}
          {!caps.imageGeneration && !caps.videoGeneration && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-muted border-border text-muted-foreground"><Info className="w-3 h-3" /> Prompt only</div>}
          {caps.visionInput && selectedCharacter && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-success/10 border-success/20 text-success"><Check className="w-3 h-3" /> {selectedCharacter.referenceImage ? 'AI face ref' : 'Photo ref'} sent</div>}
          {!caps.visionInput && <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-warning/10 border-warning/20 text-warning"><Info className="w-3 h-3" /> No vision</div>}
          <span className="flex items-center text-muted-foreground px-1 text-[10px]">{caps.reasoning}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Character */}
          <Card>
            <h2 className="text-sm font-semibold mb-3">Select Character</h2>
            {characters.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {characters.map((char) => (
                  <button key={char.id} onClick={() => setSelectedCharacter(char)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square ${selectedCharacter?.id === char.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}>
                    <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1 left-1.5 right-1 text-[10px] font-medium text-white truncate">{char.name}</span>
                    {selectedCharacter?.id === char.id && <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
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

          {/* Tabs */}
          <Tabs tabs={contentTabs} defaultTab="social" onChange={setActiveTab}>
            {(tab) => (
              <div className="space-y-4">
                {/* ── SCENE + OUTFIT + POSE + EXPRESSION — 4 separate fields ── */}
                {(tab !== 'swap' || swapSceneEnabled) && (
                  <Card>
                    {tab === 'swap' && (
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={swapSceneEnabled} onChange={(e) => setSwapSceneEnabled(e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
                          <span className="text-xs font-medium">Custom Background</span>
                        </label>
                        <span className="text-[10px] text-muted-foreground">Overrides target background</span>
                      </div>
                    )}
                    <Textarea label={tab === 'swap' ? 'Custom Background' : 'Scene / Location'} id="scene"
                      placeholder="Location, environment, lighting, atmosphere..." value={sceneText} onChange={(e) => setSceneText(e.target.value)} rows={2} />
                    <div className="mt-3">
                      <ScenePicker onSelect={applyPreset} mode={tab === 'swap' ? 'scene-only' : 'full'} />
                    </div>

                    {tab !== 'swap' && (
                      <>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input label="Outfit / Clothing" id="outfit" placeholder="e.g., red saree, business suit..." value={outfitText} onChange={(e) => setOutfitText(e.target.value)} />
                          <Input label="Pose / Action" id="pose" placeholder="e.g., standing, selfie, walking..." value={poseText} onChange={(e) => setPoseText(e.target.value)} />
                          <Input label="Expression" id="expression" placeholder="e.g., smiling, serious, laughing..." value={expressionText} onChange={(e) => setExpressionText(e.target.value)} />
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <RatioPicker selected={selectedRatio} onSelect={setSelectedRatio} />
                        </div>
                      </>
                    )}
                  </Card>
                )}
                {tab === 'swap' && !swapSceneEnabled && (
                  <Card>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Background from target image.
                      <button onClick={() => setSwapSceneEnabled(true)} className="text-primary underline cursor-pointer">Change?</button>
                    </p>
                  </Card>
                )}

                {/* ── SWAP CONTROLS ── */}
                {tab === 'swap' && (
                  <>
                    <Card glow>
                      <div className="flex items-center gap-2 mb-3">
                        <Repeat className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Swap / Transfer</h3>
                      </div>
                      {swapImage ? (
                        <div className="relative group rounded-xl overflow-hidden">
                          <img src={swapImage} alt="Target" className="w-full h-48 object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <button onClick={() => setSwapImage(null)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-destructive rounded-full cursor-pointer"><X className="w-4 h-4 text-white" /></button>
                          </div>
                          <Badge className="absolute top-2 left-2">Target Image</Badge>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Upload className="w-6 h-6 text-primary/60" /></div>
                          <p className="text-xs font-medium">Upload target image</p>
                          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleSwapImageUpload} />
                        </label>
                      )}
                    </Card>

                    <Card>
                      <h3 className="text-xs font-semibold mb-1">What to use from where?</h3>
                      <p className="text-[10px] text-muted-foreground mb-4">Face is always the influencer. Choose the rest.</p>

                      <div className="mb-3 pb-3 border-b border-border">
                        <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Face</p>
                        <div className="px-2 py-1.5 rounded-lg text-[10px] font-medium bg-primary/10 border border-primary/30 text-primary text-center">Always Influencer</div>
                      </div>

                      <SwapRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Expression / Smile" value={swapExpression} onChange={setSwapExpression}
                        options={[{ id: 'target', label: 'Copy target' }, { id: 'influencer', label: 'Influencer natural' }]} />
                      <SwapRow icon={<Shirt className="w-3.5 h-3.5" />} label="Outfit" value={swapOutfit} onChange={setSwapOutfit}
                        options={[{ id: 'target', label: 'From target' }, { id: 'influencer', label: 'Influencer style' }, { id: 'custom', label: 'Custom' }]}
                        customValue={swapCustomOutfit} onCustomChange={setSwapCustomOutfit} customPlaceholder="e.g., red silk dress" />
                      <SwapRow icon={<Layers className="w-3.5 h-3.5" />} label="Pose" value={swapPose} onChange={setSwapPose}
                        options={[{ id: 'target', label: 'Copy target' }, { id: 'influencer', label: 'Natural / AI' }]} last />
                    </Card>

                    <Card><RatioPicker selected={selectedRatio} onSelect={setSelectedRatio} /></Card>
                  </>
                )}

                {/* ── SPONSORSHIP ── */}
                {tab === 'sponsored' && (
                  <Card glow>
                    <div className="flex items-center gap-2 mb-3"><ShoppingBag className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Sponsorship</h3></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Brand" id="brand" placeholder="e.g., Nike" value={sponsorBrand} onChange={(e) => setSponsorBrand(e.target.value)} />
                      <Input label="Product" id="product" placeholder="e.g., Air Max 2026" value={sponsorProduct} onChange={(e) => setSponsorProduct(e.target.value)} />
                    </div>
                    <div className="mt-3"><Textarea label="Notes" id="sponsorDesc" placeholder="Product placement instructions..." value={sponsorDesc} onChange={(e) => setSponsorDesc(e.target.value)} rows={2} /></div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-sm font-medium flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" /> Product Photos</p>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Add
                          <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="hidden" />
                        </label>
                      </div>
                      {productImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                          {productImages.map((img, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                              <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                              <button onClick={() => removeProductImage(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      {productImages.length === 0 && (
                        <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer mt-2">
                          <Camera className="w-5 h-5 text-primary/60" />
                          <p className="text-xs font-medium text-muted-foreground">Drop product photos here</p>
                          <input type="file" accept="image/*" multiple onChange={handleProductImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </Card>
                )}

                {/* Content type + Output format + Generate */}
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Content Type</p>
                  <div className="flex gap-2">
                    <button onClick={() => setContentType('image')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer ${contentType === 'image' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                      <ImageIcon className="w-4 h-4" /> Photo
                    </button>
                    <button onClick={() => caps?.videoGeneration && setContentType('video')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border ${contentType === 'video' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground'} ${caps?.videoGeneration ? 'cursor-pointer hover:text-foreground' : 'opacity-40 cursor-not-allowed'}`}>
                      <Video className="w-4 h-4" /> Video {caps && !caps.videoGeneration && <Ban className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Output Format</p>
                  <div className="flex gap-2">
                    <button onClick={() => canGenMedia && setOutputFormat('media')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border ${outputFormat === 'media' && canGenMedia ? 'bg-success/10 border-success/30 text-success' : 'border-border text-muted-foreground'} ${canGenMedia ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                      {contentType === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />} {contentType === 'video' ? 'Video' : 'Image'} Output {canGenMedia && <Badge variant="success" className="text-[8px] px-1 py-0">AI</Badge>} {!canGenMedia && <Ban className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setOutputFormat('prompt')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all border cursor-pointer ${outputFormat === 'prompt' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                      <Copy className="w-3.5 h-3.5" /> Text Prompt
                    </button>
                  </div>
                </div>

                <Button onClick={handleGenerate} loading={generating} className="w-full" size="lg"
                  disabled={!selectedCharacter || (activeTab !== 'swap' && !sceneText.trim())}>
                  <Zap className="w-5 h-5" />
                  {generating ? 'Generating...' : outputFormat === 'prompt' ? 'Generate Prompt' : contentType === 'video' ? 'Generate Video' : 'Generate Image'}
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {livePrompt && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-1.5"><FileJson className="w-4 h-4 text-primary" /> Prompt Preview</h2>
                <button onClick={async () => { const ok = await copyToClipboard(livePrompt); if (ok) { setPreviewPromptCopied(true); setTimeout(() => setPreviewPromptCopied(false), 2000); } }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                  {previewPromptCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {previewPromptCopied ? 'Copied!' : 'Copy Prompt'}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">Full prompt for external tools. Upload influencer photo first, then target.</p>
              <div className="bg-secondary rounded-xl p-3 max-h-40 overflow-y-auto">
                <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">{livePrompt}</p>
              </div>
            </Card>
          )}

          <Card className="lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Output</h2>
              {result && <button onClick={handleCopyResult} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}</button>}
            </div>
            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="animate-shimmer w-full h-48 sm:h-64 rounded-xl bg-secondary" />
                </motion.div>
              ) : result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {(resultType === 'image' && (result.startsWith('http') || result.startsWith('data:')))
                    ? <img src={result} alt="Generated" className="w-full rounded-xl" />
                    : <div className="bg-secondary rounded-xl p-4 max-h-72 overflow-y-auto"><Badge className="mb-2">Generated</Badge><p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{result}</p></div>}
                </motion.div>
              ) : (
                <EmptyState icon={<Sparkles className="w-8 h-8 text-primary/30" />} title="Ready" description="Generated content appears here" />
              )}
            </AnimatePresence>
            {selectedCharacter && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2.5">
                <img src={selectedCharacter.avatar} alt={selectedCharacter.name} className="w-9 h-9 rounded-lg object-cover" />
                {selectedCharacter.referenceImage && <div className="relative"><img src={selectedCharacter.referenceImage} alt="Ref" className="w-9 h-9 rounded-lg object-cover border border-primary/30" /><span className="absolute -top-1 -right-1 text-[7px] bg-primary text-white px-1 rounded-full">AI</span></div>}
                <div className="min-w-0"><p className="text-xs font-medium truncate">{selectedCharacter.name}</p></div>
              </div>
            )}
          </Card>

          {fullPrompt && showPrompt && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold flex items-center gap-1.5"><FileJson className="w-4 h-4 text-primary" /> Sent Prompt</h2>
                <button onClick={async () => { const ok = await copyToClipboard(fullPrompt); if (ok) { setPromptCopied(true); setTimeout(() => setPromptCopied(false), 2000); } }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                  {promptCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {promptCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-secondary rounded-xl p-3 max-h-48 overflow-y-auto"><p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">{fullPrompt}</p></div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SwapRow({ icon, label, value, onChange, options, customValue, onCustomChange, customPlaceholder, last }: {
  icon: React.ReactNode; label: string; value: SwapSource; onChange: (v: SwapSource) => void;
  options: { id: SwapSource; label: string }[]; customValue?: string; onCustomChange?: (v: string) => void; customPlaceholder?: string; last?: boolean;
}) {
  return (
    <div className={last ? '' : 'mb-3 pb-3 border-b border-border'}>
      <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1.5">{icon} {label}</p>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button key={opt.id} onClick={() => onChange(opt.id)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border text-center ${value === opt.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'}`}>
            {opt.label}
          </button>
        ))}
      </div>
      {value === 'custom' && onCustomChange && (
        <input type="text" placeholder={customPlaceholder} value={customValue || ''} onChange={(e) => onCustomChange(e.target.value)}
          className="w-full mt-2 h-8 px-3 rounded-lg bg-input border border-border text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      )}
    </div>
  );
}
