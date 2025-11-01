export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  narration?: string;
  timestamp: Date;
}

export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "failed";
  partySize: number;
  level: number;
  rewards?: string;
  createdAt: Date;
}

export interface Personality {
  friendliness: number;
  formality: number;
  verbosity: number;
  humor: number;
}

export interface ModelParams {
  temperature: number;
  topP: number;
  maxTokens: number;
}

export type PersonaType =
  | "barkeep"
  | "shopkeep"
  | "quest-npc"
  | "town-guard"
  | "tavern-patron"
  | "blacksmith"
  | "healer"
  | "mysterious-stranger"
  | "village-elder"
  | "merchant-caravan"
  | "dungeon-boss"
  | "custom";

export interface Persona {
  id: string;
  name: string;
  type: PersonaType;
  personality: Personality;
  systemPrompt: string;
  userPromptTemplate: string;
  modelParams: ModelParams;
  conversationHistory: Message[];
  memory: MemoryEntry[];
  quests: Quest[];
  schemaVersion?: string; // Schema version for chat history compatibility
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportPersona extends Omit<Persona, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

export interface ExportBundle {
  version: string;
  personas: ExportPersona[];
  exportedAt: string;
}
