import { create } from 'zustand';
import type { Character, AIProvider } from './db';

interface AppState {
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  providers: AIProvider[];
  setProviders: (providers: AIProvider[]) => void;
  activeProvider: AIProvider | null;
  setActiveProvider: (provider: AIProvider | null) => void;

  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) =>
    set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      selectedCharacter:
        state.selectedCharacter?.id === id ? null : state.selectedCharacter,
    })),

  providers: [],
  setProviders: (providers) => set({ providers }),
  activeProvider: null,
  setActiveProvider: (provider) => set({ activeProvider: provider }),

  selectedCharacter: null,
  setSelectedCharacter: (character) => set({ selectedCharacter: character }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
