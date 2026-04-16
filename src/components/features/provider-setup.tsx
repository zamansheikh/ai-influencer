'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import {
  Sparkles, Brain, Cpu, Globe, Trash2, Check, Shield, Bot, Info, Pencil, X, Save,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
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

export const providerIcons: Record<string, typeof Sparkles> = {
  gemini: Sparkles,
  openai: Brain,
  anthropic: Cpu,
  qwen: Bot,
  custom: Globe,
};

function buildCapabilities(model: string): AIProvider['capabilities'] {
  const caps = getModelCapabilities(model);
  const result: AIProvider['capabilities'] = ['chat'];
  if (caps.visionInput) result.push('analyze');
  if (caps.imageGeneration) result.push('generate-image');
  if (caps.videoGeneration) result.push('generate-video');
  return result;
}

export function ProviderSetup() {
  const { providers, setProviders, setActiveProvider, activeProvider } = useAppStore();
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(defaultModels.gemini);
  const [baseUrl, setBaseUrl] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editProvider, setEditProvider] = useState<AIProvider | null>(null);
  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const knownModels = getModelsForProvider(provider);
  const selectedCaps = getModelCapabilities(model);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    setModel(defaultModels[value] || '');
    setBaseUrl(defaultBaseUrls[value] || '');
  };

  const saveProvider = async () => {
    if (!apiKey.trim()) { toast.error('API key is required'); return; }
    if (!model.trim()) { toast.error('Model is required'); return; }
    setSaving(true);
    try {
      const newProvider: AIProvider = {
        id: uuid(),
        name: name || `${provider} — ${model}`,
        provider: provider as AIProvider['provider'],
        apiKey, model,
        baseUrl: baseUrl || undefined,
        isActive: providers.length === 0,
        capabilities: buildCapabilities(model),
      };
      await db.aiProviders.add(newProvider);
      const all = await db.aiProviders.toArray();
      setProviders(all);
      if (newProvider.isActive) setActiveProvider(newProvider);
      toast.success('AI provider added!');
      setApiKey(''); setName(''); setBaseUrl('');
    } catch { toast.error('Failed to save provider'); }
    finally { setSaving(false); }
  };

  const openEdit = (p: AIProvider) => {
    setEditProvider(p);
    setEditName(p.name);
    setEditModel(p.model);
    setEditApiKey('');  // Don't pre-fill — keep hidden
    setEditBaseUrl(p.baseUrl || '');
  };

  const saveEdit = async () => {
    if (!editProvider) return;
    setEditSaving(true);
    try {
      const updates: Partial<AIProvider> = {
        name: editName || editProvider.name,
        model: editModel || editProvider.model,
        baseUrl: editBaseUrl || undefined,
        capabilities: buildCapabilities(editModel || editProvider.model),
      };
      // Only update API key if user entered a new one
      if (editApiKey.trim()) updates.apiKey = editApiKey;
      await db.aiProviders.update(editProvider.id, updates);
      const all = await db.aiProviders.toArray();
      setProviders(all);
      const updated = all.find((p) => p.id === editProvider.id);
      if (updated?.isActive) setActiveProvider(updated);
      setEditProvider(null);
      toast.success('Provider updated!');
    } catch { toast.error('Failed to update'); }
    finally { setEditSaving(false); }
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

  const editKnownModels = editProvider ? getModelsForProvider(editProvider.provider) : [];
  const editCaps = getModelCapabilities(editModel);

  return (
    <div className="space-y-8">
      {/* Add Provider */}
      <Card glow>
        <h2 className="text-lg font-semibold mb-6">Add AI Provider</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Provider" id="provider" options={providerOptions} value={provider} onChange={(e) => handleProviderChange(e.target.value)} />
          <Input label="Display Name" id="name" placeholder={`My ${provider} key`} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="API Key" id="apiKey" type="password" placeholder="Enter your API key..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          {knownModels.length > 0 ? (
            <Select label="Model" id="model"
              options={knownModels.map((m) => {
                const tags = [m.caps.imageGeneration && 'img', m.caps.videoGeneration && 'video', m.caps.visionInput && 'vision'].filter(Boolean).join('+');
                return { value: m.value, label: `${m.label}${tags ? ` (${tags})` : ''}` };
              })}
              value={model} onChange={(e) => setModel(e.target.value)} />
          ) : (
            <Input label="Model" id="model" placeholder={defaultModels[provider] || 'model-name'} value={model} onChange={(e) => setModel(e.target.value)} />
          )}
          {(provider === 'custom' || provider === 'openai' || provider === 'qwen') && (
            <div className="md:col-span-2">
              <Input label={provider === 'qwen' ? 'Router Endpoint' : 'Base URL (optional)'} id="baseUrl"
                placeholder={defaultBaseUrls[provider] || 'https://api.example.com/v1'} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
          )}
        </div>

        {model && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-primary" />
              Capabilities: <code className="text-primary">{model}</code>
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <CapBadge ok={selectedCaps.visionInput} label="Vision Input" />
              <CapBadge ok={selectedCaps.imageGeneration} label="Image Gen" />
              <CapBadge ok={selectedCaps.videoGeneration} label="Video Gen" />
              <CapBadge ok={selectedCaps.multiImageInput} label="Multi-Image" />
              <CapBadge ok={selectedCaps.jsonMode} label="JSON Mode" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{selectedCaps.reasoning}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={saveProvider} loading={saving}><Shield className="w-4 h-4" /> Save Provider</Button>
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">{p.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{p.model}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-mono">{maskKey(p.apiKey)}</p>
                        </div>
                      </div>
                      {p.isActive && <Badge variant="success">Active</Badge>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <CapBadge ok={pCaps.visionInput} label="Vision" small />
                      <CapBadge ok={pCaps.imageGeneration} label="Img Gen" small />
                      <CapBadge ok={pCaps.videoGeneration} label="Video" small />
                      <CapBadge ok={pCaps.multiImageInput} label="Multi-Img" small />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {!p.isActive && (
                        <Button variant="secondary" size="sm" onClick={() => setActive(p.id)}>
                          <Check className="w-3.5 h-3.5" /> Set Active
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
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

      {/* Edit Modal */}
      <Modal open={!!editProvider} onClose={() => setEditProvider(null)} title="Edit Provider" size="lg">
        {editProvider && (
          <div className="space-y-4">
            <Input label="Display Name" id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input label="API Key" id="editApiKey" type="password" value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} placeholder={`Current: ${maskKey(editProvider.apiKey)} — leave empty to keep`} />
            {editKnownModels.length > 0 ? (
              <Select label="Model" id="editModel"
                options={editKnownModels.map((m) => {
                  const tags = [m.caps.imageGeneration && 'img', m.caps.videoGeneration && 'video', m.caps.visionInput && 'vision'].filter(Boolean).join('+');
                  return { value: m.value, label: `${m.label}${tags ? ` (${tags})` : ''}` };
                })}
                value={editModel} onChange={(e) => setEditModel(e.target.value)} />
            ) : (
              <Input label="Model" id="editModel" value={editModel} onChange={(e) => setEditModel(e.target.value)} />
            )}
            {(editProvider.provider === 'custom' || editProvider.provider === 'openai' || editProvider.provider === 'qwen') && (
              <Input label="Base URL" id="editBaseUrl" value={editBaseUrl} onChange={(e) => setEditBaseUrl(e.target.value)} />
            )}

            {editModel && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                <p className="text-xs font-semibold mb-2">Capabilities: <code className="text-primary">{editModel}</code></p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <CapBadge ok={editCaps.visionInput} label="Vision" />
                  <CapBadge ok={editCaps.imageGeneration} label="Img Gen" />
                  <CapBadge ok={editCaps.videoGeneration} label="Video" />
                  <CapBadge ok={editCaps.multiImageInput} label="Multi-Img" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{editCaps.reasoning}</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setEditProvider(null)}>Cancel</Button>
              <Button onClick={saveEdit} loading={editSaving}><Save className="w-4 h-4" /> Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
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
