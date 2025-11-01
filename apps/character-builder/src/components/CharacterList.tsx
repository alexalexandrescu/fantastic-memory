import type { Character } from "character-storage";
import {
  addCharacter,
  calculateAbilityModifiers,
  deleteCharacter,
  getAllCharacters,
} from "character-storage";
import { Plus, Search, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCharacterStore } from "../stores/characterStore";

export function CharacterList() {
  const { currentCharacter, setCurrentCharacter, setCharacters } = useCharacterStore();
  const [characters, setCharactersLocal] = useState<Character[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const loaded = await getAllCharacters();
      setCharactersLocal(loaded);
      setCharacters(loaded);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCharacter = (character: Character) => {
    setCurrentCharacter(character);
  };

  const handleDeleteCharacter = useCallback(
    async (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        await deleteCharacter(id);
        if (currentCharacter?.id === id) {
          setCurrentCharacter(null);
        }
        await loadCharacters();
        toast.success(`Deleted ${name}`);
      }
    },
    [currentCharacter, setCurrentCharacter]
  );

  const handleCreateNew = async () => {
    const newCharacter: Character = {
      id: crypto.randomUUID(),
      name: "New Character",
      level: 1,
      classes: [],
      abilities: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      abilityModifiers: calculateAbilityModifiers({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      }),
      skills: [],
      hitPoints: {
        current: 8,
        maximum: 8,
      },
      armorClass: 10,
      speed: 30,
      hitDice: {
        type: "d8",
        total: 1,
        current: 1,
      },
      proficiencyBonus: 2,
      weapons: [],
      armor: [],
      equipment: [],
      inventory: [],
      spells: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addCharacter(newCharacter);
    await loadCharacters();
    setCurrentCharacter(newCharacter);
    toast.success("Created new character");
  };

  const filteredCharacters = useMemo(
    () =>
      characters.filter(
        c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.race?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.classes.some(cl => cl.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [characters, searchQuery]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="text-muted-foreground">Loading characters...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="h-5 w-5" />
          Characters
        </h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleCreateNew} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          New Character
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {filteredCharacters.map(character => (
            <Card
              key={character.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                currentCharacter?.id === character.id ? "border-primary shadow-md bg-accent" : ""
              }`}
              onClick={() => handleSelectCharacter(character)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{character.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Level {character.level}
                      {character.race && ` • ${character.race}`}
                      {character.classes.length > 0 &&
                        ` • ${character.classes.map(c => c.name).join(", ")}`}
                    </div>
                    {character.hitPoints && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          HP: {character.hitPoints.current}/{character.hitPoints.maximum}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCharacter(character.id, character.name);
                    }}
                    className="h-6 w-6 shrink-0 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCharacters.length === 0 && (
          <div className="text-center text-muted-foreground p-4">
            No characters found. Create a new one!
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
