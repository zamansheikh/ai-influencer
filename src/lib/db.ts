import Dexie, { type EntityTable } from 'dexie';

export interface Character {
  id: string;
  name: string;
  avatar: string; // base64 data URL
  analysis: CharacterAnalysis | null;
  consistencyPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterAnalysis {
  coreIdentity: {
    apparentAge: string;
    gender: string;
    ethnicity: string;
    skinTone: string;
  };
  faceShape: {
    overall: string;
    forehead: string;
    cheekbones: string;
    jawline: string;
    chin: string;
  };
  eyes: {
    shape: string;
    color: string;
    sizeSpacing: string;
    eyelidType: string;
    eyebrows: string;
  };
  nose: string;
  mouth: {
    lipShape: string;
    lipColor: string;
    teeth: string;
  };
  hair: {
    color: string;
    texture: string;
    lengthStyle: string;
    hairline: string;
    details: string;
  };
  uniqueFeatures: {
    marks: string;
    asymmetry: string;
  };
  buildStyle: {
    bodyType: string;
    height: string;
    pose: string;
    clothing: string;
    makeup: string;
  };
  photoStyle: {
    lighting: string;
    style: string;
  };
}

export interface GeneratedContent {
  id: string;
  characterId: string;
  type: 'image' | 'video';
  prompt: string;
  result: string; // URL or base64
  sponsorship: {
    enabled: boolean;
    brand?: string;
    product?: string;
    description?: string;
  } | null;
  createdAt: number;
}

export interface AIProvider {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'stability' | 'custom';
  apiKey: string;
  model: string;
  baseUrl?: string;
  isActive: boolean;
  capabilities: ('analyze' | 'generate-image' | 'generate-video' | 'chat')[];
}

const db = new Dexie('AIInfluencerDB') as Dexie & {
  characters: EntityTable<Character, 'id'>;
  generatedContent: EntityTable<GeneratedContent, 'id'>;
  aiProviders: EntityTable<AIProvider, 'id'>;
};

db.version(1).stores({
  characters: 'id, name, createdAt, updatedAt',
  generatedContent: 'id, characterId, type, createdAt',
  aiProviders: 'id, provider, isActive',
});

export { db };
