/**
 * Ability scores (standard D&D attributes)
 */
export interface Abilities {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

/**
 * Ability modifiers (calculated from scores)
 */
export interface AbilityModifiers {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

/**
 * Proficiency level for skills
 */
export type ProficiencyLevel = "none" | "proficient" | "expertise" | "half";

/**
 * Skill definition with associated ability
 */
export interface Skill {
  id: string;
  name: string;
  ability: keyof Abilities;
  proficiency: ProficiencyLevel;
  bonus?: number; // Custom bonus modifier
}

/**
 * Weapon item
 */
export interface Weapon {
  id: string;
  name: string;
  type: string; // e.g., "melee", "ranged", "finesse"
  damage: string; // e.g., "1d6", "1d8+3"
  damageType?: string; // e.g., "slashing", "piercing"
  properties?: string[]; // e.g., ["versatile", "finesse"]
  range?: string; // e.g., "30/120" for ranged weapons
  notes?: string;
}

/**
 * Armor item
 */
export interface Armor {
  id: string;
  name: string;
  type: string; // e.g., "light", "medium", "heavy", "shield"
  armorClass: number;
  maxDexBonus?: number; // For medium/heavy armor
  stealthDisadvantage?: boolean;
  notes?: string;
}

/**
 * Generic item (for inventory)
 */
export interface Item {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  weight?: number; // Weight in lbs/kg
  value?: number; // Value in gold pieces
  properties?: Record<string, unknown>; // Custom properties
}

/**
 * Spell definition
 */
export interface Spell {
  id: string;
  name: string;
  level: number; // 0 for cantrips
  school?: string; // e.g., "evocation", "enchantment"
  castingTime?: string;
  range?: string;
  components?: string;
  duration?: string;
  description?: string;
  prepared?: boolean; // For prepared spellcasters
}

/**
 * Spell slot tracking
 */
export interface SpellSlots {
  level1: number;
  level2?: number;
  level3?: number;
  level4?: number;
  level5?: number;
  level6?: number;
  level7?: number;
  level8?: number;
  level9?: number;
}

/**
 * Hit dice configuration
 */
export interface HitDice {
  type: string; // e.g., "d8", "d10"
  total: number; // Total number of hit dice
  current: number; // Available hit dice for short rest
}

/**
 * Character class
 */
export interface CharacterClass {
  name: string;
  level: number;
  hitDie?: string; // e.g., "d8"
  spellcastingAbility?: keyof Abilities;
}

/**
 * Alignment options
 */
export type Alignment =
  | "lawful good"
  | "neutral good"
  | "chaotic good"
  | "lawful neutral"
  | "true neutral"
  | "chaotic neutral"
  | "lawful evil"
  | "neutral evil"
  | "chaotic evil"
  | "unaligned";

/**
 * Main Character interface
 */
export interface Character {
  id: string;
  name: string;
  level: number;
  race?: string;
  classes: CharacterClass[];
  background?: string;
  alignment?: Alignment;
  abilities: Abilities;
  abilityModifiers: AbilityModifiers;
  skills: Skill[];
  hitPoints: {
    current: number;
    maximum: number;
    temporary?: number;
  };
  armorClass: number;
  speed: number; // Base speed in feet
  initiative?: number;
  hitDice: HitDice;
  proficiencyBonus: number;
  weapons: Weapon[];
  armor: Armor[];
  equipment: Item[]; // Other equipment items
  inventory: Item[];
  spells: Spell[];
  spellSlots?: SpellSlots;
  notes?: string;
  customFields?: Record<string, unknown>; // System-specific data
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Export format (dates as strings)
 */
export interface ExportCharacter extends Omit<Character, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

/**
 * Export bundle for multiple characters
 */
export interface ExportBundle {
  version: string;
  characters: ExportCharacter[];
  exportedAt: string;
}
