'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import {
  Sparkles, Brain, Cpu, Globe, Trash2, Check, Shield, Bot, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, type AIProvider } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { getModelsForProvider, getModelCapabilities } from '@/lib/model-capabilities';

const providerOptions = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'qwen', label: 'Qwen (Dialagram Router)' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

const defaultModels: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  qwen: 'qwen-3.6-plus-thinking',
  custom: '',
};

const defaultBaseUrls: Record<string, string> = {
  qwen: 'https://www.dialagram.me/router/v1',
};

const providerIcons: Record<string, typeof Sparkles> = {
  gemini: Sparkles,
  openai: Brain,
  anthropic: Cpu,
  qwen: Bot,
  custom: Globe,
};

export function ProviderSetup() {
  const { providers, setProviders, setActiveProvider, activeProvider } = useAppStore();
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(defaultModels.gemini);
  const [baseUrl, setBaseUrl] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const knownModels = getModelsForProvider(provider);
  const selectedCaps = getModelCapabilities(model);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setModel(defaultModels[value] || '');
    setBaseUrl(defaultBaseUrls[value] || '');
  };

  const handleModelChange = (value: string) => {
    setModel(value);
  };

  const saveProvider = async () => {
    if (!apiKey.trim()) { toast.error('API key is required'); return; }
    if (!model.trim()) { toast.error('Model is required'); return; }
    setSaving(true);

    try {
      // Auto-detect capabilities from model registry
      const caps = getModelCapabilities(model);
      const autoCapabilities: AIProvider['capabilities'] = ['chat'];
      if (caps.visionInput) autoCapabilities.push('analyze');
      if (caps.imageGeneration) autoCapabilities.push('generate-image');
      if (caps.videoGeneration) autoCapabilities.push('generate-video');

      const newProvider: AIProvider = {
        id: uuid(),
        name: name || `${provider} — ${model}`,
        provider: provider as AIProvider['provider'],
        apiKey,
        model,
        baseUrl: baseUrl || undefined,
        isActive: providers.length === 0,
        capabilities: autoCapabilities,
      };

      await db.aiProviders.add(newProvider);
      const all = await db.aiProviders.toArray();
      setProviders(all);
      if (newProvider.isActive) setActiveProvider(newProvider);

      toast.success('AI provider added!');
      setApiKey('');
      setName('');
      setBaseUrl('');
    } catch {
      toast.error('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (id: string) => {
    await db.aiProviders.delete(id);
    const all = await db.aiProviders.toArray();
    setProviders(all);
    if (activeProvider?.id === id) setActiveProvider(all.find((p) => p.isActive) || null);
    toast.success('Provider removed');
  };

  const setActive = async (id: string) => {
    await db.aiProviders.toCollection().modify({ isActive: false });
    await db.aiProviders.update(id, { isActive: true });
    const all = await db.aiProviders.toArray();
    setProviders(all);
    setActiveProvider(all.find((p) => p.id === id) || null);
    toast.success('Active provider updated');
  };

  return (
    <div className="space-y-8">
      {/* Add Provider */}
      <Card glow>
        <h2 className="text-lg font-semibold mb-6">Add AI Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Provider"
            id="provider"
            options={providerOptions}
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          />
          <Input
            label="Display Name"
            id="name"
            placeholder={`My ${provider} key`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="API Key"
            id="apiKey"
            type="password"
            placeholder="Enter your API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />

          {/* Model selector */}
          {knownModels.length > 0 ? (
            <Select
              label="Model"
              id="model"
              options={knownModels.map((m) => ({ value: m.value, label: `${m.label}${m.caps.imageGeneration ? ' (image gen)' : ''}` }))}
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
            />
          ) : (
            <Input
              label="Model"
              id="model"
              placeholder={defaultModels[provider] || 'model-name'}
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
            />
          )}

          {(provider === 'custom' || provider === 'openai' || provider === 'qwen') && (
            <div className="md:col-span-2">
              <Input
                label={provider === 'qwen' ? 'Router Endpoint' : 'Base URL (optional)'}
                id="baseUrl"
                placeholder={defaultBaseUrls[provider] || 'https://api.example.com/v1'}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              {provider === 'qwen' && <p className="text-xs text-muted-foreground mt-1.5">Dialagram Nexum router (OpenAI-compatible)</p>}
            </div>
          )}
        </div>

        {/* Auto-detected capabilities */}
        {model && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" />
              Detected capabilities for <code className="text-primary">{model}</code>
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <CapBadge ok={selectedCaps.visionInput} label="Vision Input" />
              <CapBadge ok={selectedCaps.imageGeneration} label="Image Generation" />
              <CapBadge ok={selectedCaps.videoGeneration} label="Video Generation" />
              <CapBadge ok={selectedCaps.multiImageInput} label="Multi-Image" />
              <CapBadge ok={selectedCaps.jsonMode} label="JSON Mode" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{selectedCaps.reasoning}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={saveProvider} loading={saving}>
            <Shield className="w-4 h-4" /> Save Provider
          </Button>
          <p className="text-xs text-muted-foreground">Keys stored locally in your browser</p>
        </div>
      </Card>

      {/* Saved Providers */}
      {providers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Saved Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p, i) => {
              const Icon = providerIcons[p.provider] || Globe;
              const pCaps = getModelCapabilities(p.model);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={p.isActive ? 'border-primary/30 bg-primary/5' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">{p.model}</p>
                        </div>
                      </div>
                      {p.isActive && <Badge variant="success">Active</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <CapBadge ok={pCaps.visionInput} label="Vision" small />
                      <CapBadge ok={pCaps.imageGeneration} label="Img Gen" small />
                      <CapBadge ok={pCaps.multiImageInput} label="Multi-Img" small />
                    </div>

                    <div className="flex gap-2 mt-4">
                      {!p.isActive && (
                        <Button variant="secondary" size="sm" onClick={() => setActive(p.id)}>
                          <Check className="w-3.5 h-3.5" /> Set Active
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => deleteProvider(p.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CapBadge({ ok, label, small }: { ok: boolean; label: string; small?: boolean }) {
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium
      ${small ? 'text-[10px]' : 'text-[11px]'}
      ${ok ? 'bg-success/10 border-success/20 text-success' : 'bg-muted border-border text-muted-foreground'}`}>
      {ok ? <Check className="w-2.5 h-2.5" /> : <span className="w-2.5 h-2.5 text-center">—</span>}
      {label}
    </span>
  );
}
