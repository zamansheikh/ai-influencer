// Character Export/Import system
// Supports: single character JSON, bulk export, external LLM-generated import

import { v4 as uuid } from 'uuid';
import type { Character, CharacterAnalysis } from './db';

// ─── Export Format ───
// This is the portable format that can be shared, backed up, or generated externally.
export interface CharacterExport {
  _format: 'ai-influencer-character';
  _version: 1;
  name: string;
  avatar?: string;          // base64 data URL (optional for external generation)
  referenceImage?: string;  // base64 data URL
  analysis: CharacterAnalysis | null;
  consistencyPrompt: string;
  exportedAt: string;       // ISO date
}

export interface BulkExport {
  _format: 'ai-influencer-characters-bulk';
  _version: 1;
  characters: CharacterExport[];
  exportedAt: string;
}

// ─── Export ───

export function exportCharacter(char: Character): CharacterExport {
  return {
    _format: 'ai-influencer-character',
    _version: 1,
    name: char.name,
    avatar: char.avatar,
    referenceImage: char.referenceImage,
    analysis: char.analysis,
    consistencyPrompt: char.consistencyPrompt,
    exportedAt: new Date().toISOString(),
  };
}

export function exportCharacters(chars: Character[]): BulkExport {
  return {
    _format: 'ai-influencer-characters-bulk',
    _version: 1,
    characters: chars.map(exportCharacter),
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import & Validation ───

export interface ImportResult {
  success: boolean;
  characters: Character[];
  errors: string[];
  warnings: string[];
}

const REQUIRED_ANALYSIS_KEYS = [
  'coreIdentity', 'faceShape', 'eyes', 'nose', 'mouth', 'hair',
  'uniqueFeatures', 'buildStyle', 'photoStyle',
];

function validateAnalysis(analysis: unknown): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!analysis || typeof analysis !== 'object') return { valid: false, warnings: ['Analysis is missing or not an object'] };

  const obj = analysis as Record<string, unknown>;
  for (const key of REQUIRED_ANALYSIS_KEYS) {
    if (!(key in obj)) {
      warnings.push(`Missing analysis field: ${key}`);
    }
  }

  return { valid: warnings.length < 5, warnings }; // Allow partial — up to 4 missing fields
}

function validateSingleCharacter(data: unknown): { char: Character | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { char: null, errors: ['Invalid data: not an object'], warnings };
  }

  const obj = data as Record<string, unknown>;

  // Check format marker (optional — external tools might not include it)
  if (obj._format && obj._format !== 'ai-influencer-character') {
    warnings.push(`Unknown format: ${obj._format} — attempting import anyway`);
  }

  // Name
  const name = (obj.name as string) || '';
  if (!name) errors.push('Missing required field: name');

  // Consistency prompt
  const consistencyPrompt = (obj.consistencyPrompt as string) || '';
  if (!consistencyPrompt) warnings.push('Missing consistencyPrompt — character may not generate consistent content');

  // Analysis
  let analysis: CharacterAnalysis | null = null;
  if (obj.analysis) {
    const result = validateAnalysis(obj.analysis);
    if (result.valid) {
      analysis = obj.analysis as CharacterAnalysis;
    }
    warnings.push(...result.warnings);
  } else {
    warnings.push('No analysis data — character won\'t have forensic details');
  }

  // Images
  const avatar = (obj.avatar as string) || '';
  const referenceImage = (obj.referenceImage as string) || undefined;

  if (!avatar && !referenceImage) {
    warnings.push('No avatar or reference image — you can add one after import');
  }

  if (errors.length > 0) {
    return { char: null, errors, warnings };
  }

  return {
    char: {
      id: uuid(),
      name,
      avatar: avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzI3MjcyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzcxNzE3YSIgZm9udC1zaXplPSI0MCI+PzwvdGV4dD48L3N2Zz4=', // placeholder SVG
      referenceImage,
      analysis,
      consistencyPrompt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    errors,
    warnings,
  };
}

export function parseImport(jsonString: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const characters: Character[] = [];

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    return { success: false, characters: [], errors: ['Invalid JSON — could not parse the file'], warnings: [] };
  }

  if (!data || typeof data !== 'object') {
    return { success: false, characters: [], errors: ['Invalid data format'], warnings: [] };
  }

  const obj = data as Record<string, unknown>;

  // Bulk import
  if (obj._format === 'ai-influencer-characters-bulk' && Array.isArray(obj.characters)) {
    for (let i = 0; i < obj.characters.length; i++) {
      const result = validateSingleCharacter(obj.characters[i]);
      if (result.char) {
        characters.push(result.char);
        warnings.push(...result.warnings.map((w) => `Character ${i + 1}: ${w}`));
      } else {
        errors.push(...result.errors.map((e) => `Character ${i + 1}: ${e}`));
      }
    }
    return { success: characters.length > 0, characters, errors, warnings };
  }

  // Single character import (with or without format marker)
  const result = validateSingleCharacter(data);
  if (result.char) {
    characters.push(result.char);
    warnings.push(...result.warnings);
  } else {
    errors.push(...result.errors);
  }

  return { success: characters.length > 0, characters, errors, warnings };
}

// ─── Template for External LLMs ───
// This is the prompt/schema users can give to any LLM to generate a character JSON

export const EXTERNAL_GENERATION_TEMPLATE = `Generate an AI influencer character in this exact JSON structure. Fill every field with detailed, specific information:

{
  "_format": "ai-influencer-character",
  "_version": 1,
  "name": "Character Name",
  "analysis": {
    "coreIdentity": {
      "apparentAge": "20-25",
      "gender": "Female",
      "ethnicity": "specific heritage",
      "skinTone": "exact shade + undertone"
    },
    "faceShape": {
      "overall": "oval/round/heart/square",
      "forehead": "height, width, shape",
      "cheekbones": "prominence and position",
      "jawline": "shape and sharpness",
      "chin": "shape and projection"
    },
    "eyes": {
      "shape": "almond/round/hooded etc",
      "color": "exact color with flecks",
      "sizeSpacing": "size and distance apart",
      "eyelidType": "hooded/monolid/double etc",
      "eyebrows": "thickness, shape, arch, color"
    },
    "nose": "shape, length, width, bridge type, nostril shape",
    "mouth": {
      "lipShape": "fullness upper and lower, cupid's bow",
      "lipColor": "natural color",
      "teeth": "visibility and shape if visible"
    },
    "hair": {
      "color": "exact shade",
      "texture": "straight/wavy/curly/coily",
      "lengthStyle": "length and style description",
      "hairline": "shape and parting",
      "details": "highlights, styling details"
    },
    "uniqueFeatures": {
      "marks": "moles, freckles, scars, dimples with exact locations",
      "asymmetry": "any distinctive asymmetric traits"
    },
    "buildStyle": {
      "bodyType": "slender/athletic/curvy etc",
      "height": "estimated height"
    }
  },
  "consistencyPrompt": "A photorealistic portrait of [name]: [write one ultra-detailed paragraph combining ALL biological details from the analysis above]. Perfect face consistency, identical facial features, same person every time. Do NOT include clothing or background details."
}

IMPORTANT: The consistencyPrompt must be a single dense paragraph that captures EVERY permanent biological visual detail (face structure, eyes, nose, lips, hair, skin tone) so any AI image generator can recreate this exact person consistently. DO NOT include clothing, outfits, jewelry, poses, or backgrounds.`;
