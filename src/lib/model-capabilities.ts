// Central registry of what each known model can actually do.
// This drives the UI: available actions, warnings, and explanations.

export interface ModelCapabilities {
  visionInput: boolean;      // Can accept images as input
  imageGeneration: boolean;  // Can generate/output images
  videoGeneration: boolean;  // Can generate video
  jsonMode: boolean;         // Supports structured JSON output
  multiImageInput: boolean;  // Can accept multiple images at once
  reasoning: string;         // Brief note on model strength
}

// Default: text-only chat model with no vision/generation
const DEFAULT_CAPS: ModelCapabilities = {
  visionInput: false,
  imageGeneration: false,
  videoGeneration: false,
  jsonMode: false,
  multiImageInput: false,
  reasoning: 'Unknown model — capabilities not verified',
};

const MODEL_DB: Record<string, ModelCapabilities> = {
  // ── Gemini ──
  'gemini-2.5-flash': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Fast multimodal model with image generation via Imagen',
  },
  'gemini-2.5-pro': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Most capable Gemini — vision + image gen + long context',
  },
  'gemini-2.0-flash': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Previous gen fast model with image generation',
  },
  'gemini-2.0-flash-lite': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Lightweight model — vision input only, no image output',
  },

  // ── OpenAI ──
  'gpt-4o': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Multimodal chat — sees images but cannot generate them. Use DALL-E for generation.',
  },
  'gpt-4o-mini': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Smaller GPT-4o — vision input, no image output',
  },
  'gpt-4.1': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Latest GPT — vision input, text output only',
  },
  'gpt-4.1-mini': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Compact GPT-4.1 — vision input, text output only',
  },
  'gpt-image-1': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'OpenAI native image generation model (replaces DALL-E)',
  },
  'dall-e-3': {
    visionInput: false,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: false,
    reasoning: 'Text-to-image only — no vision input, no face reference support',
  },

  // ── Anthropic ──
  'claude-sonnet-4-6': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Strong vision analysis but no image generation',
  },
  'claude-opus-4-6': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Most capable Claude — excellent analysis, no image generation',
  },
  'claude-haiku-4-5': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Fast & cheap Claude — vision input, no image generation',
  },

  // ── Qwen (via Dialagram) ──
  'qwen-3.6-plus-thinking': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Extended thinking model with vision — analysis only, no image gen',
  },
  'qwen-3.6-plus': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Fast Qwen with vision — analysis only, no image gen',
  },
  'qwen-3.5-plus-thinking': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Previous gen thinking model — vision input, text output',
  },
  'qwen-3.5-plus': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Previous gen Qwen — vision input, text output',
  },
};

export function getModelCapabilities(modelId: string): ModelCapabilities {
  // Exact match first
  if (MODEL_DB[modelId]) return MODEL_DB[modelId];

  // Fuzzy match: check if model name contains a known key
  const lower = modelId.toLowerCase();
  for (const [key, caps] of Object.entries(MODEL_DB)) {
    if (lower.includes(key) || key.includes(lower)) return caps;
  }

  // Provider-based heuristics
  if (lower.includes('gemini')) {
    return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown Gemini model — assuming vision support' };
  }
  if (lower.includes('gpt')) {
    return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown GPT model — assuming vision support' };
  }
  if (lower.includes('claude')) {
    return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown Claude model — assuming vision support' };
  }
  if (lower.includes('qwen')) {
    return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown Qwen model — assuming vision support' };
  }

  return DEFAULT_CAPS;
}

// Human-readable explanations for why something is unavailable
export function getUnavailableReason(cap: keyof ModelCapabilities, modelId: string): string {
  const caps = getModelCapabilities(modelId);

  switch (cap) {
    case 'imageGeneration':
      if (!caps.imageGeneration) {
        if (caps.visionInput) return `${modelId} can analyze images but cannot generate them. Use Gemini 2.5 or gpt-image-1 for image generation.`;
        return `${modelId} is text-only and cannot generate images.`;
      }
      return '';
    case 'visionInput':
      if (!caps.visionInput) return `${modelId} cannot accept image inputs. Face reference photos won't be sent.`;
      return '';
    case 'multiImageInput':
      if (!caps.multiImageInput) return `${modelId} only accepts a single image. Only the face reference will be sent (no product photos).`;
      return '';
    case 'videoGeneration':
      return `${modelId} does not support video generation. No current models in this platform support video output yet.`;
    default:
      return '';
  }
}

// Get all known models for a provider
export function getModelsForProvider(provider: string): { value: string; label: string; caps: ModelCapabilities }[] {
  const providerMap: Record<string, string[]> = {
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-image-1', 'dall-e-3'],
    anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
    qwen: ['qwen-3.6-plus-thinking', 'qwen-3.6-plus', 'qwen-3.5-plus-thinking', 'qwen-3.5-plus'],
  };

  return (providerMap[provider] || []).map((id) => ({
    value: id,
    label: id,
    caps: getModelCapabilities(id),
  }));
}
