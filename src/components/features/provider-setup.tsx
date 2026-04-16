'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import {
  Sparkles,
  Brain,
  Cpu,
  Globe,
  Trash2,
  Check,
  Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db, type AIProvider } from '@/lib/db';
import { useAppStore } from '@/lib/store';

const providerOptions = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI (GPT-4o / DALL-E)' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

const defaultModels: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-6',
  custom: '',
};

const providerIcons: Record<string, typeof Sparkles> = {
  gemini: Sparkles,
  openai: Brain,
  anthropic: Cpu,
  custom: Globe,
};

const capabilityOptions = [
  { value: 'analyze', label: 'Image Analysis' },
  { value: 'generate-image', label: 'Image Generation' },
  { value: 'generate-video', label: 'Video Generation' },
  { value: 'chat', label: 'Chat / Text' },
];

export function ProviderSetup() {
  const { providers, setProviders, setActiveProvider, activeProvider } = useAppStore();
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(defaultModels.gemini);
  const [baseUrl, setBaseUrl] = useState('');
  const [name, setName] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>(['analyze', 'chat']);
  const [saving, setSaving] = useState(false);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setModel(defaultModels[value] || '');
  };

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const saveProvider = async () => {
    if (!apiKey.trim()) {
      toast.error('API key is required');
      return;
    }
    setSaving(true);

    try {
      const newProvider: AIProvider = {
        id: uuid(),
        name: name || `${provider} Provider`,
        provider: provider as AIProvider['provider'],
        apiKey,
        model,
        baseUrl: baseUrl || undefined,
        isActive: providers.length === 0,
        capabilities: capabilities as AIProvider['capabilities'],
      };

      await db.aiProviders.add(newProvider);
      const all = await db.aiProviders.toArray();
      setProviders(all);

      if (newProvider.isActive) setActiveProvider(newProvider);

      toast.success('AI provider added successfully');
      setApiKey('');
      setName('');
      setBaseUrl('');
    } catch (err) {
      toast.error('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (id: string) => {
    await db.aiProviders.delete(id);
    const all = await db.aiProviders.toArray();
    setProviders(all);
    if (activeProvider?.id === id) {
      setActiveProvider(all.find((p) => p.isActive) || null);
    }
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
      {/* Add New Provider */}
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
            placeholder="My Gemini Key"
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
          <Input
            label="Model"
            id="model"
            placeholder={defaultModels[provider]}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          {(provider === 'custom' || provider === 'openai') && (
            <Input
              label="Base URL (optional)"
              id="baseUrl"
              placeholder="https://api.example.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="md:col-span-2"
            />
          )}
        </div>

        {/* Capabilities */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Capabilities</p>
          <div className="flex flex-wrap gap-2">
            {capabilityOptions.map((cap) => (
              <button
                key={cap.value}
                onClick={() => toggleCapability(cap.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border
                  ${
                    capabilities.includes(cap.value)
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground'
                  }`}
              >
                {cap.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={saveProvider} loading={saving}>
            <Shield className="w-4 h-4" />
            Save Provider
          </Button>
          <p className="text-xs text-muted-foreground">
            Keys are stored locally in your browser only
          </p>
        </div>
      </Card>

      {/* Saved Providers */}
      {providers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Saved Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p, i) => {
              const Icon = providerIcons[p.provider] || Globe;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={p.isActive ? 'border-primary/30 bg-primary/5' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{p.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {p.model} &middot; {p.provider}
                          </p>
                        </div>
                      </div>
                      {p.isActive && <Badge variant="success">Active</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline">
                          {cap}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-4">
                      {!p.isActive && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setActive(p.id)}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProvider(p.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
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
