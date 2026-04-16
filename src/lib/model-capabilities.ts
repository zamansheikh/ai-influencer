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
    reasoning: 'Fast multimodal — vision input + image generation via Imagen',
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
    reasoning: 'Previous gen fast model — vision + image gen',
  },
  'gemini-2.0-flash-lite': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Lightweight — vision input only, no image output',
  },
  'veo-3': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: true,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'Google video generation model — generates high-quality video from text/images',
  },
  'veo-2': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: true,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'Google video generation — previous gen, still high quality',
  },
  'imagen-4': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'Google dedicated image generation model — highest quality image output',
  },
  'imagen-3': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'Google image generation — previous gen',
  },
  'gemini-2.5-flash-preview-native-audio': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Gemini 2.5 Flash with native audio support + image gen',
  },

  // ── OpenAI ──
  'gpt-4o': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Multimodal chat — sees images but cannot generate them',
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
  'gpt-4.1-nano': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Smallest GPT-4.1 — fast, vision input, text only',
  },
  'o3': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'OpenAI reasoning model — strong analysis, no image gen',
  },
  'o4-mini': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Fast reasoning model — vision + analysis',
  },
  'gpt-image-1': {
    visionInput: true,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: true,
    reasoning: 'OpenAI native image generation — edit & create images',
  },
  'dall-e-3': {
    visionInput: false,
    imageGeneration: true,
    videoGeneration: false,
    jsonMode: false,
    multiImageInput: false,
    reasoning: 'Text-to-image only — no vision input, no face reference',
  },

  // ── Anthropic ──
  'claude-sonnet-4-6': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Strong vision analysis, no image generation',
  },
  'claude-opus-4-6': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Most capable Claude — excellent analysis, no image gen',
  },
  'claude-haiku-4-5': {
    visionInput: true,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: true,
    reasoning: 'Fast & cheap Claude — vision, no image gen',
  },

  // ── Qwen (via Dialagram) ──
  'qwen-3.6-plus-thinking': {
    visionInput: false,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: false,
    reasoning: 'Text-only thinking model — no vision input, no image gen',
  },
  'qwen-3.6-plus': {
    visionInput: false,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: false,
    reasoning: 'Text-only Qwen — no vision input, no image gen',
  },
  'qwen-3.5-plus-thinking': {
    visionInput: false,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: false,
    reasoning: 'Text-only thinking model — no vision, no image gen',
  },
  'qwen-3.5-plus': {
    visionInput: false,
    imageGeneration: false,
    videoGeneration: false,
    jsonMode: true,
    multiImageInput: false,
    reasoning: 'Text-only Qwen — no vision, no image gen',
  },
};

export function getModelCapabilities(modelId: string): ModelCapabilities {
  if (!modelId) return DEFAULT_CAPS;

  // Exact match
  if (MODEL_DB[modelId]) return MODEL_DB[modelId];

  // Normalize for matching
  const lower = modelId.toLowerCase().trim();

  // Exact match on lowered keys
  for (const [key, caps] of Object.entries(MODEL_DB)) {
    if (lower === key.toLowerCase()) return caps;
  }

  // Partial match — model contains known key or vice versa
  for (const [key, caps] of Object.entries(MODEL_DB)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return caps;
  }

  // Provider heuristics for truly unknown models
  if (lower.includes('gemini')) return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown Gemini model — assuming vision support' };
  if (lower.includes('gpt')) return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown GPT model — assuming vision support' };
  if (lower.includes('claude')) return { ...DEFAULT_CAPS, visionInput: true, jsonMode: true, reasoning: 'Unknown Claude model — assuming vision support' };
  if (lower.includes('qwen')) return { ...DEFAULT_CAPS, jsonMode: true, reasoning: 'Unknown Qwen model — text-only assumed' };
  if (lower.includes('veo')) return { ...DEFAULT_CAPS, visionInput: true, videoGeneration: true, reasoning: 'Unknown Veo model — assuming video generation' };
  if (lower.includes('imagen')) return { ...DEFAULT_CAPS, visionInput: true, imageGeneration: true, reasoning: 'Unknown Imagen model — assuming image generation' };

  return DEFAULT_CAPS;
}

export function getUnavailableReason(cap: keyof ModelCapabilities, modelId: string): string {
  const caps = getModelCapabilities(modelId);
  switch (cap) {
    case 'imageGeneration':
      if (!caps.imageGeneration) {
        if (caps.visionInput) return `${modelId} can analyze images but cannot generate them. Use Gemini 2.5, Imagen, or gpt-image-1 for image gen.`;
        return `${modelId} is text-only and cannot generate images.`;
      }
      return '';
    case 'visionInput':
      if (!caps.visionInput) return `${modelId} cannot accept image inputs. Face reference photos won't be sent — text description only.`;
      return '';
    case 'multiImageInput':
      if (!caps.multiImageInput) return `${modelId} only accepts a single image or no images.`;
      return '';
    case 'videoGeneration':
      if (!caps.videoGeneration) return `${modelId} cannot generate video. Use Veo 2 or Veo 3 for video generation.`;
      return '';
    default:
      return '';
  }
}

// Get all known models for a provider
export function getModelsForProvider(provider: string): { value: string; label: string; caps: ModelCapabilities }[] {
  const providerMap: Record<string, string[]> = {
    gemini: [
      'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
      'imagen-4', 'imagen-3', 'veo-3', 'veo-2',
    ],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o4-mini', 'gpt-image-1', 'dall-e-3'],
    anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
    qwen: ['qwen-3.6-plus-thinking', 'qwen-3.6-plus', 'qwen-3.5-plus-thinking', 'qwen-3.5-plus'],
  };

  return (providerMap[provider] || []).map((id) => ({
    value: id,
    label: id,
    caps: getModelCapabilities(id),
  }));
}
