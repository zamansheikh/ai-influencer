import type { AIProvider } from './db';

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

export async function analyzeImage(
  provider: AIProvider,
  imageBase64: string
): Promise<{ analysis: Record<string, unknown>; consistencyPrompt: string }> {
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;
  const mimeType = imageBase64.includes('data:')
    ? imageBase64.split(';')[0].split(':')[1]
    : 'image/jpeg';

  switch (provider.provider) {
    case 'gemini':
      return analyzeWithGemini(provider, base64Data, mimeType);
    case 'openai':
      return analyzeWithOpenAI(provider, imageBase64);
    case 'anthropic':
      return analyzeWithAnthropic(provider, base64Data, mimeType);
    default:
      return analyzeWithCustom(provider, imageBase64);
  }
}

async function analyzeWithGemini(
  provider: AIProvider,
  base64Data: string,
  mimeType: string
) {
  const model = provider.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: ANALYSIS_SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');

  const parsed = JSON.parse(text);
  return {
    analysis: parsed,
    consistencyPrompt: parsed.consistencyPrompt || '',
  };
}

async function analyzeWithOpenAI(provider: AIProvider, imageBase64: string) {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const model = provider.model || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this person in the photo with forensic-level detail.' },
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from OpenAI');

  const parsed = JSON.parse(text);
  return {
    analysis: parsed,
    consistencyPrompt: parsed.consistencyPrompt || '',
  };
}

async function analyzeWithAnthropic(
  provider: AIProvider,
  base64Data: string,
  mimeType: string
) {
  const baseUrl = provider.baseUrl || 'https://api.anthropic.com/v1';
  const model = provider.model || 'claude-sonnet-4-6';

  const response = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Analyze this person with forensic-level detail. Return JSON only.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('No response from Anthropic');

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from Anthropic response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    analysis: parsed,
    consistencyPrompt: parsed.consistencyPrompt || '',
  };
}

async function analyzeWithCustom(provider: AIProvider, imageBase64: string) {
  if (!provider.baseUrl) throw new Error('Custom provider requires a base URL');

  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this person in the photo with forensic-level detail.' },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Custom API error: ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from custom provider');

  const parsed = JSON.parse(text);
  return {
    analysis: parsed,
    consistencyPrompt: parsed.consistencyPrompt || '',
  };
}

export async function generateContent(
  provider: AIProvider,
  characterPrompt: string,
  userPrompt: string,
  sponsorship?: { brand: string; product: string; description: string }
) {
  let fullPrompt = characterPrompt;

  if (sponsorship) {
    fullPrompt += `\n\nThe person is promoting ${sponsorship.brand}'s ${sponsorship.product}. ${sponsorship.description}. Show the product naturally integrated into the scene. The person should be interacting with or showcasing the product in a natural, influencer-style way.`;
  }

  fullPrompt += `\n\nScene: ${userPrompt}`;

  switch (provider.provider) {
    case 'gemini':
      return generateWithGemini(provider, fullPrompt);
    case 'openai':
      return generateWithOpenAI(provider, fullPrompt);
    default:
      return { prompt: fullPrompt, result: null };
  }
}

async function generateWithGemini(provider: AIProvider, prompt: string) {
  const model = provider.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image based on this description:\n\n${prompt}` }] }],
      generationConfig: { responseModalities: ['TEXT'] },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini generation error: ${err}`);
  }

  const data = await response.json();
  return {
    prompt,
    result: data.candidates?.[0]?.content?.parts?.[0]?.text || prompt,
  };
}

async function generateWithOpenAI(provider: AIProvider, prompt: string) {
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI image generation error: ${err}`);
  }

  const data = await response.json();
  return {
    prompt,
    result: data.data?.[0]?.url || null,
  };
}
