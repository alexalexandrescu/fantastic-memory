import { Eraser, MessageSquare, Plus, Search, Trash2, UserPlus } from "lucide-react";
import type { Persona, PersonaType } from "persona-storage";
import {
  addPersona,
  clearAllHistories,
  createPersonaFromTemplate,
  deletePersona,
  getAllPersonas,
  personaTemplates,
} from "persona-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAppStore } from "../stores/appStore";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";

function getPersonaTypeColor(type: PersonaType): string {
  const colorMap: Record<string, string> = {
    barkeep: "var(--persona-barkeep)",
    shopkeep: "var(--persona-shopkeep)",
    "quest-npc": "var(--persona-quest-giver)",
    "town-guard": "var(--persona-guard)",
    "tavern-patron": "var(--persona-barkeep)",
    blacksmith: "var(--persona-shopkeep)",
    healer: "var(--persona-healer)",
    "mysterious-stranger": "var(--persona-noble)",
    "village-elder": "var(--persona-noble)",
    "merchant-caravan": "var(--persona-shopkeep)",
    "dungeon-boss": "var(--persona-guard)",
    custom: "var(--primary)",
  };
  return colorMap[type] || "var(--primary)";
}

export function PersonaList() {
  const { currentPersona, setCurrentPersona } = useAppStore();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const loaded = await getAllPersonas();
      setPersonas(loaded);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setCurrentPersona(persona);
  };

  const handleDeletePersona = useCallback(
    async (id: string, name: string) => {
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        await deletePersona(id);
        if (currentPersona?.id === id) {
          setCurrentPersona(null);
        }
        await loadPersonas();
        toast.success(`Deleted ${name}`);
      }
    },
    [currentPersona, setCurrentPersona]
  );

  const handleCreateFromTemplate = async (template: (typeof personaTemplates)[0]) => {
    const newPersona = createPersonaFromTemplate(template);
    await addPersona(newPersona);
    await loadPersonas();
    setCurrentPersona(newPersona);
    setShowTemplates(false);
  };

  const handleClearAllHistories = useCallback(async () => {
    const totalMessages = personas.reduce((sum, p) => sum + p.conversationHistory.length, 0);
    if (totalMessages === 0) {
      toast.info("No conversation histories to clear.");
      return;
    }

    const confirmMessage = `This will permanently delete all conversation histories from ALL ${personas.length} persona(s). This action cannot be undone.\n\nTotal messages: ${totalMessages}\n\nAre you absolutely sure?`;
    if (confirm(confirmMessage)) {
      await clearAllHistories();
      await loadPersonas();
      if (currentPersona && currentPersona.conversationHistory.length > 0) {
        setCurrentPersona({ ...currentPersona, conversationHistory: [] });
      }
      toast.success("All conversation histories have been cleared.");
    }
  }, [personas, currentPersona, setCurrentPersona]);

  const filteredPersonas = useMemo(
    () =>
      personas.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [personas, searchQuery]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Personas
        </h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full"
          variant={showTemplates ? "secondary" : "default"}
        >
          {showTemplates ? (
            <>
              <Plus className="h-4 w-4 mr-2 rotate-45" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Template Persona
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {showTemplates && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Templates</h3>
            <div className="space-y-2">
              {personaTemplates.map(template => (
                <Card
                  key={template.name}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <CardContent className="p-3">
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {template.type.replace("-", " ")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredPersonas.map(persona => (
            <Card
              key={persona.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                currentPersona?.id === persona.id ? "border-primary shadow-md bg-accent" : ""
              }`}
              onClick={() => handleSelectPersona(persona)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{persona.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {persona.type.replace("-", " ")}
                    </div>
                    {persona.conversationHistory.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {persona.conversationHistory.length} messages
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeletePersona(persona.id);
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

        {filteredPersonas.length === 0 && !showTemplates && (
          <div className="text-center text-muted-foreground p-4">
            No personas found. Add one from templates!
          </div>
        )}
      </ScrollArea>

      {/* Settings Section */}
      <div className="border-t p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Settings</h3>
        <Button
          onClick={handleClearAllHistories}
          variant="outline"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Eraser className="h-4 w-4 mr-2" />
          Clear All Histories
        </Button>
      </div>
    </div>
  );
}
