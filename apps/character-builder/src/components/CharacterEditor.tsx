import type { Character } from "character-storage";
import { calculateAbilityModifiers, updateCharacter } from "character-storage";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCharacterStore } from "../stores/characterStore";

const ABILITY_NAMES: Array<keyof Character["abilities"]> = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

const ABILITY_LABELS: Record<keyof Character["abilities"], string> = {
  strength: "Strength (STR)",
  dexterity: "Dexterity (DEX)",
  constitution: "Constitution (CON)",
  intelligence: "Intelligence (INT)",
  wisdom: "Wisdom (WIS)",
  charisma: "Charisma (CHA)",
};

export function CharacterEditor() {
  const { currentCharacter, setCurrentCharacter } = useCharacterStore();
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    setCharacter(currentCharacter);
  }, [currentCharacter]);

  if (!character) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select or create a character to edit
      </div>
    );
  }

  const updateField = async <K extends keyof Character>(field: K, value: Character[K]) => {
    if (!character) return;

    const updated = { ...character, [field]: value, updatedAt: new Date() };
    setCharacter(updated);
    await updateCharacter(character.id, { [field]: value, updatedAt: new Date() });
    setCurrentCharacter(updated);
  };

  const updateAbilities = async (ability: keyof Character["abilities"], value: number) => {
    if (!character) return;

    const newAbilities = { ...character.abilities, [ability]: value };
    const newModifiers = calculateAbilityModifiers(newAbilities);
    const updated = {
      ...character,
      abilities: newAbilities,
      abilityModifiers: newModifiers,
      updatedAt: new Date(),
    };
    setCharacter(updated);
    await updateCharacter(character.id, {
      abilities: newAbilities,
      abilityModifiers: newModifiers,
      updatedAt: new Date(),
    });
    setCurrentCharacter(updated);
  };

  const updateHP = async (field: "current" | "maximum" | "temporary", value: number) => {
    if (!character) return;

    const newHP = { ...character.hitPoints, [field]: value };
    const updated = { ...character, hitPoints: newHP, updatedAt: new Date() };
    setCharacter(updated);
    await updateCharacter(character.id, { hitPoints: newHP, updatedAt: new Date() });
    setCurrentCharacter(updated);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Character Editor</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="abilities">Abilities</TabsTrigger>
            <TabsTrigger value="combat">Combat</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={character.name}
                    onChange={e => updateField("name", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input
                      id="level"
                      type="number"
                      min="1"
                      value={character.level}
                      onChange={e => updateField("level", parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="race">Race</Label>
                    <Input
                      id="race"
                      value={character.race || ""}
                      onChange={e => updateField("race", e.target.value || undefined)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background">Background</Label>
                  <Input
                    id="background"
                    value={character.background || ""}
                    onChange={e => updateField("background", e.target.value || undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alignment">Alignment</Label>
                  <Select
                    value={character.alignment || ""}
                    onValueChange={value =>
                      updateField("alignment", (value as Character["alignment"]) || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lawful good">Lawful Good</SelectItem>
                      <SelectItem value="neutral good">Neutral Good</SelectItem>
                      <SelectItem value="chaotic good">Chaotic Good</SelectItem>
                      <SelectItem value="lawful neutral">Lawful Neutral</SelectItem>
                      <SelectItem value="true neutral">True Neutral</SelectItem>
                      <SelectItem value="chaotic neutral">Chaotic Neutral</SelectItem>
                      <SelectItem value="lawful evil">Lawful Evil</SelectItem>
                      <SelectItem value="neutral evil">Neutral Evil</SelectItem>
                      <SelectItem value="chaotic evil">Chaotic Evil</SelectItem>
                      <SelectItem value="unaligned">Unaligned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="abilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ability Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ABILITY_NAMES.map(ability => (
                  <div key={ability} className="grid grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label htmlFor={ability}>{ABILITY_LABELS[ability]}</Label>
                      <Input
                        id={ability}
                        type="number"
                        min="1"
                        max="30"
                        value={character.abilities[ability]}
                        onChange={e => updateAbilities(ability, parseInt(e.target.value, 10) || 10)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modifier</Label>
                      <div className="h-9 px-3 py-2 rounded-md border bg-muted flex items-center justify-center font-semibold">
                        {character.abilityModifiers[ability] >= 0 ? "+" : ""}
                        {character.abilityModifiers[ability]}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="combat" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Combat Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hp-current">Current HP</Label>
                    <Input
                      id="hp-current"
                      type="number"
                      value={character.hitPoints.current}
                      onChange={e => updateHP("current", parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hp-max">Maximum HP</Label>
                    <Input
                      id="hp-max"
                      type="number"
                      value={character.hitPoints.maximum}
                      onChange={e => updateHP("maximum", parseInt(e.target.value, 10) || 0)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ac">Armor Class (AC)</Label>
                    <Input
                      id="ac"
                      type="number"
                      value={character.armorClass}
                      onChange={e => updateField("armorClass", parseInt(e.target.value, 10) || 10)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="speed">Speed</Label>
                    <Input
                      id="speed"
                      type="number"
                      value={character.speed}
                      onChange={e => updateField("speed", parseInt(e.target.value, 10) || 30)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proficiency">Proficiency Bonus</Label>
                  <Input
                    id="proficiency"
                    type="number"
                    value={character.proficiencyBonus}
                    onChange={e =>
                      updateField("proficiencyBonus", parseInt(e.target.value, 10) || 2)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Equipment management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="spells" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Spells</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Spell management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
