import type { AIProvider } from './db';
import { getModelCapabilities } from './model-capabilities';

const ANALYSIS_SYSTEM_PROMPT = `You are an expert forensic-level character analyst. Extract EVERY visual detail from the uploaded reference photo for AI image generation consistency.

Output in this exact JSON format:

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
  "consistencyPrompt": ""
}

CRITICAL RULES for the consistencyPrompt field:
1. Start with: "IMPORTANT: If a reference photo is attached, the FACE in the photo is the absolute source of truth. Match the face EXACTLY — same bone structure, same eyes, same nose, same lips, same skin. The text description below is supplementary detail only. The photo face MUST be preserved pixel-perfectly."
2. Then write: "Person description: [extremely dense paragraph with ALL visual details from analysis]"
3. End with: "CONSISTENCY RULES: Same face in every image. Never alter facial bone structure, eye shape, nose shape, or lip shape. The reference photo face is the identity — never deviate from it."

Be extremely detailed in every analysis field.`;

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

  const payload = {
    contents: [{ parts: [
      { text: prompt },
      { inlineData: { mimeType, data: base64Data } },
    ]}],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  };

  // Try with IMAGE output first; if model doesn't support it, return null
  try {
    const data = await proxyFetch(url, {}, payload);
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    // "only supports text output" = model can't generate images
    if (msg.includes('text output') || msg.includes('INVALID_ARGUMENT') || msg.includes('not supported')) {
      console.warn(`[Ref Image] ${model} does not support image output, skipping.`);
      return null;
    }
    throw err; // re-throw unexpected errors
  }
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
  forceTextOnly?: boolean;    // Force text prompt output even if model can gen images
}

export async function generateContent(opts: GenerateOptions) {
  const { provider, consistencyPrompt, userPrompt, referenceImage, originalAvatar, sponsorship, forceTextOnly } = opts;
  const caps = getModelCapabilities(provider.model);
  const hasRefImage = !!(referenceImage || originalAvatar);

  // Build photo-first prompt
  const promptParts: string[] = [];

  // 1. Photo reference instruction (highest priority)
  if (hasRefImage && caps.visionInput) {
    promptParts.push(`[FACE REFERENCE PHOTO ATTACHED] — The attached photo shows the EXACT person to generate. You MUST match this face precisely: same bone structure, same eye shape, same nose, same lips, same jawline, same skin tone. The photo is the absolute source of truth for the face. Do NOT imagine a different face. Do NOT alter any facial feature. Copy the face from the photo exactly.`);
  }

  // 2. Text description (supplementary to photo, or primary if no photo)
  if (hasRefImage && caps.visionInput) {
    promptParts.push(`[SUPPLEMENTARY TEXT DESCRIPTION — use only to fill in details not visible in the photo]\n${consistencyPrompt}`);
  } else {
    promptParts.push(`[CHARACTER DESCRIPTION — no reference photo available, follow this text exactly]\n${consistencyPrompt}`);
  }

  // 3. Sponsorship
  if (sponsorship) {
    let sp = `\n[SPONSORSHIP] The person is promoting ${sponsorship.brand}'s ${sponsorship.product}. ${sponsorship.description}. Show the product naturally integrated — the person should interact with or showcase the product in a natural influencer style.`;
    if (sponsorship.productImages?.length) {
      sp += ` Product reference images are attached — match the exact product appearance, logo, colors, and packaging.`;
    }
    promptParts.push(sp);
  }

  // 4. Scene
  promptParts.push(`\n[SCENE] ${userPrompt}`);

  // 5. Final reminder
  if (hasRefImage && caps.visionInput) {
    promptParts.push(`\n[REMINDER] The face in the attached reference photo is the IDENTITY. Every other detail (clothing, background, pose) can change for the scene, but the FACE must remain identical to the reference photo.`);
  }

  const fullPrompt = promptParts.join('\n\n');

  // Collect reference images
  const images: string[] = [];
  if (caps.visionInput) {
    if (referenceImage) images.push(referenceImage);
    else if (originalAvatar) images.push(originalAvatar);
  }
  if (caps.multiImageInput && sponsorship?.productImages) {
    images.push(...sponsorship.productImages);
  }

  const wantMedia = !forceTextOnly;

  switch (provider.provider) {
    case 'gemini':
      return genWithGemini(provider, fullPrompt, images, wantMedia && caps.imageGeneration);
    case 'openai':
      return genWithOpenAI(provider, fullPrompt, images, wantMedia && caps.imageGeneration);
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

  // Face reference image FIRST — so the model sees it before the text
  if (images.length > 0) {
    parts.push({ text: 'FACE REFERENCE PHOTO — this is the person. Match this face EXACTLY in the generated image:' });
    const { data: faceData, mimeType: faceMime } = extractBase64(images[0]);
    parts.push({ inlineData: { mimeType: faceMime, data: faceData } });

    // Additional images (product photos etc.)
    for (let i = 1; i < images.length; i++) {
      const { data, mimeType } = extractBase64(images[i]);
      parts.push({ inlineData: { mimeType, data } });
    }
  }

  // If model claims image gen, try IMAGE output first
  if (canGenImage) {
    parts.push({ text: `Generate an image of this EXACT person (from the reference photo above) in a new scene:\n\n${prompt}` });
    try {
      const data = await proxyFetch(url, {}, {
        contents: [{ parts }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      });
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
      // Got text back instead of image
      return { prompt, result: resParts[0]?.text || prompt, type: 'prompt' as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('text output') || msg.includes('INVALID_ARGUMENT') || msg.includes('not supported')) {
        // Model doesn't actually support image output — fall through to text-only
        console.warn(`[GenImage] ${model} rejected IMAGE modality, falling back to text.`);
      } else {
        throw err;
      }
    }
  }

  // Text-only fallback
  // Replace the last text part if we already added "Generate an image..."
  const lastPart = parts[parts.length - 1];
  if (lastPart && typeof lastPart.text === 'string' && lastPart.text.startsWith('Generate an image')) {
    parts[parts.length - 1] = { text: `Generate a detailed image prompt based on this description:\n\n${prompt}` };
  } else {
    parts.push({ text: `Generate a detailed image prompt based on this description:\n\n${prompt}` });
  }

  const data = await proxyFetch(url, {}, {
    contents: [{ parts }],
    generationConfig: { responseModalities: ['TEXT'] },
  });

  return {
    prompt,
    result: data.candidates?.[0]?.content?.parts?.[0]?.text || prompt,
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

  // Vision model: send face reference + get text prompt back
  const content: Record<string, unknown>[] = [];
  if (images.length > 0) {
    content.push({ type: 'text', text: 'FACE REFERENCE PHOTO — this is the exact person. Describe this face with extreme precision so any AI can recreate it:' });
    content.push({ type: 'image_url', image_url: { url: images[0] } });
    for (let i = 1; i < images.length; i++) {
      content.push({ type: 'image_url', image_url: { url: images[i] } });
    }
  }
  content.push({ type: 'text', text: `Based on the reference photo above, generate an ultra-detailed image prompt that would recreate this EXACT same person in a new scene. The prompt must start with face details from the photo. Include:\n\n${prompt}\n\nReturn only the refined prompt. Start with the face description from the photo.` });

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
    content.push({ type: 'text', text: 'FACE REFERENCE PHOTO — this is the exact person. Describe this face with extreme precision so any AI can recreate it:' });
    content.push({ type: 'image_url', image_url: { url: images[0] } });
    for (let i = 1; i < images.length; i++) {
      content.push({ type: 'image_url', image_url: { url: images[i] } });
    }
  }
  content.push({ type: 'text', text: `Based on the reference photo above, generate an ultra-detailed image prompt that would recreate this EXACT same person in a new scene. The prompt must start with face details from the photo. Include:\n\n${prompt}\n\nReturn only the refined prompt. Start with the face description from the photo.` });

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
