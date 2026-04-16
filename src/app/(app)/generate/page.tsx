'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Image as ImageIcon,
  Video,
  Megaphone,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { db, type GeneratedContent } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { generateContent } from '@/lib/ai-providers';
import Link from 'next/link';

const contentTabs = [
  { id: 'social', label: 'Social Media', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'sponsored', label: 'Sponsored', icon: <Megaphone className="w-4 h-4" /> },
];

const presetPrompts = [
  { label: 'Casual selfie', prompt: 'Taking a casual selfie in a trendy coffee shop, natural smile, warm lighting' },
  { label: 'Outdoor portrait', prompt: 'Standing in a beautiful park during golden hour, professional portrait style' },
  { label: 'Fitness', prompt: 'At the gym, athletic wear, confident pose, dynamic lighting' },
  { label: 'Business', prompt: 'Professional headshot in a modern office, wearing business attire' },
  { label: 'Travel', prompt: 'Standing in front of a stunning mountain landscape, travel outfit, adventurous vibe' },
  { label: 'Night out', prompt: 'At a stylish rooftop bar at night, city skyline in background, elegant outfit' },
];

export default function GeneratePage() {
  const { characters, selectedCharacter, setSelectedCharacter, activeProvider } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sponsorship
  const [sponsorBrand, setSponsorBrand] = useState('');
  const [sponsorProduct, setSponsorProduct] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');

  const [activeTab, setActiveTab] = useState('social');

  const handleGenerate = async () => {
    if (!selectedCharacter) {
      toast.error('Please select a character first');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    if (!activeProvider) {
      toast.error('Please configure an AI provider in Settings');
      return;
    }

    setGenerating(true);
    try {
      const sponsorship =
        activeTab === 'sponsored' && sponsorBrand
          ? { brand: sponsorBrand, product: sponsorProduct, description: sponsorDesc }
          : undefined;

      const res = await generateContent(
        activeProvider,
        selectedCharacter.consistencyPrompt,
        prompt,
        sponsorship
      );

      setResult(res.result || res.prompt);

      // Save to DB
      const content: GeneratedContent = {
        id: uuid(),
        characterId: selectedCharacter.id,
        type: contentType,
        prompt: res.prompt,
        result: res.result || res.prompt,
        sponsorship: sponsorship
          ? { enabled: true, ...sponsorship }
          : { enabled: false },
        createdAt: Date.now(),
      };
      await db.generatedContent.add(content);

      toast.success('Content generated!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Generate Content</h1>
        <p className="text-sm text-muted-foreground">
          Create stunning photos and videos with your AI influencer characters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-4">
          {/* Character Selection */}
          <Card>
            <h2 className="text-sm font-semibold mb-4">Select Character</h2>
            {characters.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedCharacter(char)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer
                      ${
                        selectedCharacter?.id === char.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/30'
                      }`}
                  >
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <span className="absolute bottom-1.5 left-2 text-xs font-medium text-white">
                      {char.name}
                    </span>
                    {selectedCharacter?.id === char.id && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  No characters yet. Create one first!
                </p>
                <Link href="/create">
                  <Button size="sm">Create Character</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Content Type */}
          <Tabs tabs={contentTabs} defaultTab="social" onChange={setActiveTab}>
            {(tab) => (
              <div className="space-y-4">
                {/* Prompt */}
                <Card>
                  <Textarea
                    label="Scene Description"
                    id="prompt"
                    placeholder="Describe the scene, pose, setting, mood..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />

                  {/* Presets */}
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Quick presets:</p>
                    <div className="flex flex-wrap gap-2">
                      {presetPrompts.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => setPrompt(preset.prompt)}
                          className="px-3 py-1 rounded-lg text-xs bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Sponsorship fields */}
                {tab === 'sponsored' && (
                  <Card glow>
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingBag className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Sponsorship Details</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Brand Name"
                        id="brand"
                        placeholder="e.g., Nike"
                        value={sponsorBrand}
                        onChange={(e) => setSponsorBrand(e.target.value)}
                      />
                      <Input
                        label="Product"
                        id="product"
                        placeholder="e.g., Air Max 2026"
                        value={sponsorProduct}
                        onChange={(e) => setSponsorProduct(e.target.value)}
                      />
                    </div>
                    <div className="mt-4">
                      <Textarea
                        label="Product Description / Notes"
                        id="sponsorDesc"
                        placeholder="Any specific instructions for the product placement..."
                        value={sponsorDesc}
                        onChange={(e) => setSponsorDesc(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </Card>
                )}

                {/* Content type toggle */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setContentType('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border
                      ${contentType === 'image' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Photo
                  </button>
                  <button
                    onClick={() => setContentType('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border
                      ${contentType === 'video' ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    <Video className="w-4 h-4" />
                    Video
                  </button>
                </div>

                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  className="w-full"
                  size="lg"
                  disabled={!selectedCharacter || !prompt.trim()}
                >
                  <Zap className="w-5 h-5" />
                  {generating ? 'Generating...' : 'Generate Content'}
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Generated Output</h2>
              {result && (
                <button
                  onClick={copyResult}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="animate-shimmer w-full h-64 rounded-xl bg-secondary" />
                  <p className="text-xs text-muted-foreground mt-3 animate-pulse">
                    Generating content...
                  </p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {result.startsWith('http') || result.startsWith('data:') ? (
                    <img
                      src={result}
                      alt="Generated content"
                      className="w-full rounded-xl"
                    />
                  ) : (
                    <div className="bg-secondary rounded-xl p-4">
                      <Badge className="mb-2">Generated Prompt</Badge>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {result}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your generated content will appear here
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Character preview */}
            {selectedCharacter && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedCharacter.avatar}
                    alt={selectedCharacter.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium">{selectedCharacter.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCharacter.analysis ? 'Analyzed' : 'No analysis'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
