import type { Character } from "character-storage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
};

export function CharacterSheet() {
  const { currentCharacter } = useCharacterStore();

  if (!currentCharacter) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select or create a character to view sheet
      </div>
    );
  }

  const char = currentCharacter;

  return (
    <div className="flex flex-col h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{char.name}</CardTitle>
                <div className="mt-2 space-x-2">
                  {char.race && <Badge>{char.race}</Badge>}
                  {char.classes.map((c, i) => (
                    <Badge key={i} variant="secondary">
                      {c.name} {c.level}
                    </Badge>
                  ))}
                  {char.background && <Badge variant="outline">{char.background}</Badge>}
                  {char.alignment && <Badge variant="outline">{char.alignment}</Badge>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">Level {char.level}</div>
                <div className="text-sm text-muted-foreground">
                  Proficiency: +{char.proficiencyBonus}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Abilities */}
          <Card>
            <CardHeader>
              <CardTitle>Ability Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ABILITY_NAMES.map(ability => (
                <div key={ability} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{ABILITY_LABELS[ability]}</div>
                    <div className="text-xs text-muted-foreground">
                      {char.abilities[ability]} ({char.abilityModifiers[ability] >= 0 ? "+" : ""}
                      {char.abilityModifiers[ability]})
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    {char.abilityModifiers[ability] >= 0 ? "+" : ""}
                    {char.abilityModifiers[ability]}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Combat Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Combat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Hit Points</div>
                <div className="text-2xl font-bold">
                  {char.hitPoints.current} / {char.hitPoints.maximum}
                  {char.hitPoints.temporary && ` (+${char.hitPoints.temporary} temp)`}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Armor Class</div>
                <div className="text-2xl font-bold">{char.armorClass}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Speed</div>
                <div className="text-xl font-bold">{char.speed} ft</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Hit Dice</div>
                <div className="text-sm font-medium">
                  {char.hitDice.current} / {char.hitDice.total} {char.hitDice.type}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Level</div>
                <div className="font-medium">{char.level}</div>
              </div>
              {char.race && (
                <div>
                  <div className="text-muted-foreground">Race</div>
                  <div className="font-medium">{char.race}</div>
                </div>
              )}
              {char.classes.length > 0 && (
                <div>
                  <div className="text-muted-foreground">Classes</div>
                  <div className="font-medium">
                    {char.classes.map(c => `${c.name} ${c.level}`).join(", ")}
                  </div>
                </div>
              )}
              {char.background && (
                <div>
                  <div className="text-muted-foreground">Background</div>
                  <div className="font-medium">{char.background}</div>
                </div>
              )}
              {char.alignment && (
                <div>
                  <div className="text-muted-foreground">Alignment</div>
                  <div className="font-medium">{char.alignment}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {char.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm whitespace-pre-wrap">{char.notes}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
