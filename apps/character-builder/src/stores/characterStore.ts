import type { Character } from "character-storage";
import { create } from "zustand";

interface CharacterState {
  // Current character
  currentCharacter: Character | null;
  setCurrentCharacter: (character: Character | null) => void;

  // Characters list
  characters: Character[];
  setCharacters: (characters: Character[]) => void;

  // View mode (editor or sheet)
  viewMode: "editor" | "sheet";
  setViewMode: (mode: "editor" | "sheet") => void;
}

export const useCharacterStore = create<CharacterState>(set => ({
  // Current character
  currentCharacter: null,
  setCurrentCharacter: character => set({ currentCharacter: character }),

  // Characters list
  characters: [],
  setCharacters: characters => set({ characters }),

  // View mode
  viewMode: "editor",
  setViewMode: mode => set({ viewMode: mode }),
}));
