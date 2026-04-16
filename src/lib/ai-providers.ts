import type { AIProvider } from './db';
import { getModelCapabilities } from './model-capabilities';

const ANALYSIS_SYSTEM_PROMPT = `You are an expert forensic-level character analyst specialized in creating perfectly consistent AI-generated characters. Your job is to extract EVERY single visual detail of the person in the uploaded reference photo so that any AI image generator can recreate the exact same person with 100% consistency in every future image.

Analyze the face and overall appearance with maximum precision and output the description in this exact structured JSON format:

{
  "coreIdentity": {
    "apparentAge": "",
    "gender": "",
    "ethnicity": "",
    "skinTone": ""
  },
  "faceShape": {
    "overall": "",
    "forehead": "",
    "cheekbones": "",
    "jawline": "",
    "chin": ""
  },
  "eyes": {
    "shape": "",
    "color": "",
    "sizeSpacing": "",
    "eyelidType": "",
    "eyebrows": ""
  },
  "nose": "",
  "mouth": {
    "lipShape": "",
    "lipColor": "",
    "teeth": ""
  },
  "hair": {
    "color": "",
    "texture": "",
    "lengthStyle": "",
    "hairline": "",
    "details": ""
  },
  "uniqueFeatures": {
    "marks": "",
    "asymmetry": ""
  },
  "buildStyle": {
    "bodyType": "",
    "height": "",
    "pose": "",
    "clothing": "",
    "makeup": ""
  },
  "photoStyle": {
    "lighting": "",
    "style": ""
  },
  "consistencyPrompt": "A photorealistic portrait of the exact same person as the reference photo: [insert every detail above in one flowing, extremely dense paragraph]. Perfect face consistency, identical facial features, same person every time, no changes to face or identity..."
}

Be extremely detailed in every field. The consistency prompt should be a single ultra-detailed paragraph incorporating ALL details.`;

// ─── Proxy ───
async function proxyFetch(
  targetUrl: string,
  headers: Record<string, string>,
  payload: unknown
) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl, headers, payload }),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || `API error (${response.status})`);
  return data;
}

// ─── Helpers ───
function extractBase64(dataUrl: string): { data: string; mimeType: string } {
  const data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const mimeType = dataUrl.includes('data:') ? dataUrl.split(';')[0].split(':')[1] : 'image/jpeg';
  return { data, mimeType };
}

function parseJsonFromText(text: string): Record<string, unknown> {
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse JSON from response');
}

// ═══════════════════════════════════════════════════════════
// 1. ANALYZE IMAGE — extract forensic character data
// ═══════════════════════════════════════════════════════════
export async function analyzeImage(
  provider: AIProvider,
  imageBase64: string
): Promise<{ analysis: Record<string, unknown>; consistencyPrompt: string }> {
  const { data: base64Data, mimeType } = extractBase64(imageBase64);

  switch (provider.provider) {
    case 'gemini':
      return analyzeWithGemini(provider, base64Data, mimeType);
    case 'openai':
      return analyzeWithOpenAI(provider, imageBase64);
    case 'anthropic':
      return analyzeWithAnthropic(provider, base64Data, mimeType);
    case 'qwen':
      return analyzeWithQwen(provider, imageBase64);
    default:
      return analyzeWithOpenAICompat(provider, imageBase64);
  }
}

async function analyzeWithGemini(provider: AIProvider, base64Data: string, mimeType: string) {
  const model = provider.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;
  const data = await proxyFetch(url, {}, {
    contents: [{ parts: [
      { text: ANALYSIS_SYSTEM_PROMPT },
      { inlineData: { mimeType, data: base64Data } },
    ]}],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  });
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  const parsed = JSON.parse(text);
  return { analysis: parsed, consistencyPrompt: parsed.consistencyPrompt || '' };
}

async function analyzeWithOpenAI(provider: AIProvider, imageBase64: string) {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const data = await proxyFetch(`${baseUrl}/chat/completions`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model: provider.model || 'gpt-4o',
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: 'Analyze this person in the photo with forensic-level detail.' },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ]},
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');
  const parsed = JSON.parse(text);
  return { analysis: parsed, consistencyPrompt: parsed.consistencyPrompt || '' };
}

async function analyzeWithAnthropic(provider: AIProvider, base64Data: string, mimeType: string) {
  const baseUrl = provider.baseUrl || 'https://api.anthropic.com/v1';
  const data = await proxyFetch(`${baseUrl}/messages`, {
    'x-api-key': provider.apiKey,
    'anthropic-version': '2023-06-01',
  }, {
    model: provider.model || 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
      { type: 'text', text: 'Analyze this person with forensic-level detail. Return JSON only.' },
    ]}],
  });
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No response from Anthropic');
  const parsed = parseJsonFromText(text);
  return { analysis: parsed, consistencyPrompt: (parsed.consistencyPrompt as string) || '' };
}

async function analyzeWithQwen(provider: AIProvider, imageBase64: string) {
  const baseUrl = provider.baseUrl || 'https://www.dialagram.me/router/v1';
  const data = await proxyFetch(`${baseUrl}/chat/completions`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model: provider.model || 'qwen-3.6-plus-thinking',
    stream: false,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: 'Analyze this person in the photo with forensic-level detail.' },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ]},
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Qwen');
  const parsed = parseJsonFromText(text);
  return { analysis: parsed, consistencyPrompt: (parsed.consistencyPrompt as string) || '' };
}

async function analyzeWithOpenAICompat(provider: AIProvider, imageBase64: string) {
  if (!provider.baseUrl) throw new Error('Custom provider requires a base URL');
  const data = await proxyFetch(`${provider.baseUrl}/chat/completions`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model: provider.model,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: 'Analyze this person in the photo with forensic-level detail.' },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ]},
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from custom provider');
  const parsed = JSON.parse(text);
  return { analysis: parsed, consistencyPrompt: parsed.consistencyPrompt || '' };
}

// ═══════════════════════════════════════════════════════════
// 2. GENERATE REFERENCE IMAGE — create a clean face reference
//    Only works with models that support image generation
// ═══════════════════════════════════════════════════════════
export async function generateReferenceImage(
  provider: AIProvider,
  consistencyPrompt: string,
  originalImage: string,
): Promise<string | null> {
  const caps = getModelCapabilities(provider.model);
  if (!caps.imageGeneration) return null;

  const refPrompt = `Generate a clean, high-quality, front-facing headshot portrait photo of this exact person. Studio lighting, neutral background, sharp focus on face. Use this description for perfect accuracy:\n\n${consistencyPrompt}\n\nThis is a reference photo for future AI generation consistency. Make it photorealistic with perfect clarity.`;

  switch (provider.provider) {
    case 'gemini':
      return generateRefWithGemini(provider, refPrompt, originalImage);
    case 'openai':
      return generateRefWithOpenAI(provider, refPrompt, originalImage);
    default:
      return null;
  }
}

async function generateRefWithGemini(provider: AIProvider, prompt: string, originalImage: string) {
  const model = provider.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;
  const { data: base64Data, mimeType } = extractBase64(originalImage);

  const data = await proxyFetch(url, {}, {
    contents: [{ parts: [
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } },
    ]}],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  // Gemini returns image in parts
  const parts = data.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
}

async function generateRefWithOpenAI(provider: AIProvider, prompt: string, _originalImage: string) {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const model = provider.model;

  // gpt-image-1 uses the images/generations endpoint
  if (model === 'gpt-image-1') {
    const data = await proxyFetch(`${baseUrl}/images/generations`, { Authorization: `Bearer ${provider.apiKey}` }, {
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    });
    return data.data?.[0]?.url || data.data?.[0]?.b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : data.data?.[0]?.url || null;
  }

  // DALL-E 3 fallback
  const data = await proxyFetch(`${baseUrl}/images/generations`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
  });
  return data.data?.[0]?.url || null;
}

// ═══════════════════════════════════════════════════════════
// 3. GENERATE CONTENT — create photos/videos for the character
//    Sends face reference image + forensic data when model supports it
// ═══════════════════════════════════════════════════════════
export interface SponsorshipData {
  brand: string;
  product: string;
  description: string;
  productImages?: string[];
}

export interface GenerateOptions {
  provider: AIProvider;
  consistencyPrompt: string;
  userPrompt: string;
  referenceImage?: string;    // AI-generated face reference
  originalAvatar?: string;    // original uploaded photo
  sponsorship?: SponsorshipData;
}

export async function generateContent(opts: GenerateOptions) {
  const { provider, consistencyPrompt, userPrompt, referenceImage, originalAvatar, sponsorship } = opts;
  const caps = getModelCapabilities(provider.model);

  // Build the text prompt
  let fullPrompt = consistencyPrompt;

  if (sponsorship) {
    fullPrompt += `\n\nThe person is promoting ${sponsorship.brand}'s ${sponsorship.product}. ${sponsorship.description}. Show the product naturally integrated into the scene. The person should be interacting with or showcasing the product in a natural, influencer-style way.`;
    if (sponsorship.productImages?.length) {
      fullPrompt += `\n\nReference product images are attached. Match the exact product appearance, logo, colors, and packaging.`;
    }
  }

  fullPrompt += `\n\nScene: ${userPrompt}`;

  // Collect all reference images to send (face ref + product photos)
  const images: string[] = [];
  if (caps.visionInput) {
    if (referenceImage) images.push(referenceImage);
    else if (originalAvatar) images.push(originalAvatar);
  }
  if (caps.multiImageInput && sponsorship?.productImages) {
    images.push(...sponsorship.productImages);
  }

  switch (provider.provider) {
    case 'gemini':
      return genWithGemini(provider, fullPrompt, images, caps.imageGeneration);
    case 'openai':
      return genWithOpenAI(provider, fullPrompt, images, caps.imageGeneration);
    case 'qwen':
      return genWithQwen(provider, fullPrompt, images);
    default:
      return { prompt: fullPrompt, result: null, type: 'prompt' as const };
  }
}

async function genWithGemini(provider: AIProvider, prompt: string, images: string[], canGenImage: boolean) {
  const model = provider.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const parts: Record<string, unknown>[] = [];

  // Add face reference context
  if (images.length > 0) {
    parts.push({ text: 'Reference images for the person and/or products (use these for visual consistency):' });
    for (const img of images) {
      const { data, mimeType } = extractBase64(img);
      parts.push({ inlineData: { mimeType, data } });
    }
  }

  parts.push({ text: (canGenImage ? 'Generate an image' : 'Generate a detailed image prompt') + ` based on this description:\n\n${prompt}` });

  const data = await proxyFetch(url, {}, {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: canGenImage ? ['IMAGE', 'TEXT'] : ['TEXT'],
    },
  });

  // Check if response contains generated image
  const resParts = data.candidates?.[0]?.content?.parts || [];
  for (const part of resParts) {
    if (part.inlineData) {
      return {
        prompt,
        result: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        type: 'image' as const,
      };
    }
  }

  return {
    prompt,
    result: resParts[0]?.text || prompt,
    type: 'prompt' as const,
  };
}

async function genWithOpenAI(provider: AIProvider, prompt: string, images: string[], canGenImage: boolean) {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const model = provider.model || 'gpt-4o';

  // If model generates images (gpt-image-1 / dall-e-3)
  if (canGenImage && (model === 'gpt-image-1' || model === 'dall-e-3')) {
    const data = await proxyFetch(`${baseUrl}/images/generations`, { Authorization: `Bearer ${provider.apiKey}` }, {
      model,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: model === 'gpt-image-1' ? 'high' : 'hd',
    });
    const imgResult = data.data?.[0]?.b64_json
      ? `data:image/png;base64,${data.data[0].b64_json}`
      : data.data?.[0]?.url || null;
    return { prompt, result: imgResult, type: 'image' as const };
  }

  // Vision model: send images + get text prompt back
  const content: Record<string, unknown>[] = [];
  if (images.length > 0) {
    content.push({ type: 'text', text: 'Reference images for the person (maintain face consistency):' });
    for (const img of images) {
      content.push({ type: 'image_url', image_url: { url: img } });
    }
  }
  content.push({ type: 'text', text: `Generate a detailed image prompt:\n\n${prompt}\n\nReturn only the refined prompt.` });

  const data = await proxyFetch(`${baseUrl}/chat/completions`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model,
    messages: [{ role: 'user', content }],
    temperature: 0.7,
  });

  return {
    prompt,
    result: data.choices?.[0]?.message?.content || prompt,
    type: 'prompt' as const,
  };
}

async function genWithQwen(provider: AIProvider, prompt: string, images: string[]) {
  const baseUrl = provider.baseUrl || 'https://www.dialagram.me/router/v1';
  const model = provider.model || 'qwen-3.6-plus-thinking';

  const content: Record<string, unknown>[] = [];
  if (images.length > 0) {
    content.push({ type: 'text', text: 'Reference images for the person (maintain face consistency):' });
    for (const img of images) {
      content.push({ type: 'image_url', image_url: { url: img } });
    }
  }
  content.push({ type: 'text', text: `Generate a detailed image prompt:\n\n${prompt}\n\nReturn only the refined prompt.` });

  const data = await proxyFetch(`${baseUrl}/chat/completions`, { Authorization: `Bearer ${provider.apiKey}` }, {
    model,
    stream: false,
    messages: [{ role: 'user', content }],
    temperature: 0.7,
  });

  return {
    prompt,
    result: data.choices?.[0]?.message?.content || prompt,
    type: 'prompt' as const,
  };
}
