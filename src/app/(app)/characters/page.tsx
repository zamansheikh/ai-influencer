'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Users, Download, Upload, FileJson, Copy, Check, AlertCircle, CheckCircle2, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { CharacterCard } from '@/components/features/character-card';
import { AnalysisDisplay } from '@/components/features/analysis-display';
import { db, type Character } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { copyToClipboard } from '@/lib/utils';
import {
  exportCharacter, exportCharacters, downloadJson,
  parseImport, EXTERNAL_GENERATION_TEMPLATE,
  type ImportResult,
} from '@/lib/character-io';
import Link from 'next/link';

export default function CharactersPage() {
  const router = useRouter();
  const { characters, removeCharacter, setSelectedCharacter, addCharacter, setCharacters } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importImageFile, setImportImageFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // Template modal
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await db.characters.delete(id);
    removeCharacter(id);
    setDeleteConfirm(null);
    toast.success('Character deleted');
  };

  // ── Export ──
  const handleExportOne = (char: Character) => {
    const data = exportCharacter(char);
    downloadJson(data, `${char.name.replace(/\s+/g, '-').toLowerCase()}.json`);
    toast.success(`Exported ${char.name}`);
  };

  const handleExportAll = () => {
    if (characters.length === 0) { toast.error('No characters to export'); return; }
    const data = exportCharacters(characters);
    downloadJson(data, `ai-influencer-characters-${Date.now()}.json`);
    toast.success(`Exported ${characters.length} characters`);
  };

  // ── Import ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setImportJson(text);
      validateImport(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportImageFile(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const validateImport = (json: string) => {
    const result = parseImport(json);
    setImportResult(result);
  };

  const handleValidateManual = () => {
    if (!importJson.trim()) { toast.error('Paste JSON first'); return; }
    validateImport(importJson);
  };

  const handleConfirmImport = async () => {
    if (!importResult?.success || importResult.characters.length === 0) return;
    setImporting(true);
    try {
      const chars = importResult.characters.map((c) => ({
        ...c,
        // If user uploaded an avatar image, apply it to the first character (or all if single)
        avatar: (importResult.characters.length === 1 && importImageFile) ? importImageFile : c.avatar,
      }));

      for (const char of chars) {
        await db.characters.add(char);
        addCharacter(char);
      }

      toast.success(`Imported ${chars.length} character${chars.length > 1 ? 's' : ''}!`);
      setImportOpen(false);
      setImportJson('');
      setImportResult(null);
      setImportImageFile(null);
    } catch {
      toast.error('Failed to import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Characters</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {characters.length} character{characters.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTemplateOpen(true)}>
            <FileJson className="w-4 h-4" /> Template
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setImportOpen(true); setImportResult(null); setImportJson(''); setImportImageFile(null); }}>
            <Upload className="w-4 h-4" /> Import
          </Button>
          {characters.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleExportAll}>
              <Download className="w-4 h-4" /> Export All
            </Button>
          )}
          <Link href="/create">
            <Button size="sm"><Plus className="w-4 h-4" /> Create</Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      {characters.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((character, i) => (
              <CharacterCard
                key={character.id}
                character={character}
                index={i}
                onSelect={() => setViewCharacter(character)}
                onDelete={() => setDeleteConfirm(character.id)}
                onGenerate={() => { setSelectedCharacter(character); router.push('/generate'); }}
                onExport={() => handleExportOne(character)}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState
            icon={<Users className="w-10 h-10 text-primary/40" />}
            title={search ? 'No matches found' : 'No characters yet'}
            description={search ? 'Try a different search' : 'Create, import, or generate a character externally'}
            action={!search ? (
              <div className="flex gap-2">
                <Link href="/create"><Button size="sm"><Plus className="w-4 h-4" /> Create</Button></Link>
                <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4" /> Import</Button>
              </div>
            ) : undefined}
          />
        )}
      </AnimatePresence>

      {/* ── View Character Modal ── */}
      <Modal open={!!viewCharacter} onClose={() => setViewCharacter(null)} title={viewCharacter?.name} size="xl">
        {viewCharacter && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <img src={viewCharacter.avatar} alt={viewCharacter.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold truncate">{viewCharacter.name}</h2>
                {viewCharacter.analysis && (
                  <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                    <p>Age: {viewCharacter.analysis.coreIdentity.apparentAge}</p>
                    <p>Gender: {viewCharacter.analysis.coreIdentity.gender}</p>
                    <p>Ethnicity: {viewCharacter.analysis.coreIdentity.ethnicity}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => handleExportOne(viewCharacter)}>
                    <Download className="w-3.5 h-3.5" /> Export
                  </Button>
                </div>
              </div>
            </div>
            {viewCharacter.analysis && (
              <AnalysisDisplay analysis={viewCharacter.analysis} consistencyPrompt={viewCharacter.consistencyPrompt} />
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Character" size="sm">
        <p className="text-sm text-muted-foreground mb-5">Are you sure? This cannot be undone.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Character" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import a character from a JSON file exported from this app, or generated by any LLM using our template.
          </p>

          {/* File upload */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Upload JSON File
            </Button>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
              <FileJson className="w-4 h-4" /> View Template
            </Button>
          </div>

          {/* Or paste JSON */}
          <Textarea
            id="importJson"
            label="Or paste JSON here"
            placeholder='{"_format": "ai-influencer-character", "name": "...", ...}'
            value={importJson}
            onChange={(e) => { setImportJson(e.target.value); setImportResult(null); }}
            rows={8}
            className="font-mono text-xs"
          />

          {/* Optional avatar image */}
          <div>
            <p className="text-xs font-medium mb-1.5">Attach Avatar Image (optional)</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => imageRef.current?.click()}>
                <Upload className="w-4 h-4" /> Upload Image
              </Button>
              <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              {importImageFile && (
                <div className="flex items-center gap-2">
                  <img src={importImageFile} alt="Avatar" className="w-10 h-10 rounded-lg object-cover" />
                  <button onClick={() => setImportImageFile(null)} className="text-xs text-destructive cursor-pointer">Remove</button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">If the JSON has no avatar, this image will be used.</p>
          </div>

          {/* Validate button */}
          <Button variant="secondary" size="sm" onClick={handleValidateManual} disabled={!importJson.trim()}>
            <Check className="w-4 h-4" /> Validate JSON
          </Button>

          {/* Validation results */}
          {importResult && (
            <Card className={importResult.success ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}>
              <div className="flex items-start gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {importResult.success
                      ? `Valid! ${importResult.characters.length} character${importResult.characters.length > 1 ? 's' : ''} ready to import`
                      : 'Validation failed'}
                  </p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> {e}
                    </p>
                  ))}
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-warning flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" /> {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Preview imported characters */}
              {importResult.success && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  {importResult.characters.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {c.avatar && !c.avatar.includes('svg+xml') ? (
                        <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground">?</div>
                      )}
                      <div>
                        <p className="font-medium text-xs">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.analysis ? 'Has analysis' : 'No analysis'}
                          {c.consistencyPrompt ? ' + prompt' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Import button */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmImport}
              loading={importing}
              disabled={!importResult?.success}
            >
              <Download className="w-4 h-4" /> Import {importResult?.characters.length || 0} Character{(importResult?.characters.length || 0) > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Template Modal ── */}
      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="Character JSON Template" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this template with any LLM (ChatGPT, Claude, Gemini, etc.) to generate a character externally.
            Copy the prompt below, give it to an AI, then import the JSON result.
          </p>

          <div className="relative">
            <pre className="bg-secondary rounded-xl p-4 text-xs text-muted-foreground overflow-auto max-h-80 whitespace-pre-wrap font-mono">
              {EXTERNAL_GENERATION_TEMPLATE}
            </pre>
            <button
              onClick={async () => {
                const ok = await copyToClipboard(EXTERNAL_GENERATION_TEMPLATE);
                if (ok) { setTemplateCopied(true); setTimeout(() => setTemplateCopied(false), 2000); }
              }}
              className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
            >
              {templateCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {templateCopied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

          <Card className="py-3 px-4">
            <p className="text-xs font-medium mb-1.5">How to use:</p>
            <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the template prompt above</li>
              <li>Paste it into any AI chat (ChatGPT, Claude, Gemini, etc.)</li>
              <li>Optionally describe the character you want, or attach a photo for the AI to analyze</li>
              <li>Copy the JSON response from the AI</li>
              <li>Click <strong>Import</strong> and paste the JSON</li>
              <li>Optionally attach an avatar image during import</li>
            </ol>
          </Card>
        </div>
      </Modal>
    </div>
  );
}
