import { Eraser, MessageSquare, Plus, Search, Trash2, UserPlus } from "lucide-react";
import type { Persona } from "persona-storage";
import {
  addPersona,
  clearAllHistories,
  createPersonaFromTemplate,
  deletePersona,
  getAllPersonas,
  personaTemplates,
} from "persona-storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "../stores/appStore";

export function PersonaList() {
  const { currentPersona, setCurrentPersona } = useAppStore();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    const loaded = await getAllPersonas();
    setPersonas(loaded);
  };

  const handleSelectPersona = (persona: Persona) => {
    setCurrentPersona(persona);
  };

  const handleDeletePersona = async (id: string) => {
    if (confirm("Are you sure you want to delete this persona?")) {
      await deletePersona(id);
      if (currentPersona?.id === id) {
        setCurrentPersona(null);
      }
      await loadPersonas();
    }
  };

  const handleCreateFromTemplate = async (template: (typeof personaTemplates)[0]) => {
    const newPersona = createPersonaFromTemplate(template);
    await addPersona(newPersona);
    await loadPersonas();
    setCurrentPersona(newPersona);
    setShowTemplates(false);
  };

  const handleClearAllHistories = async () => {
    const totalMessages = personas.reduce((sum, p) => sum + p.conversationHistory.length, 0);
    if (totalMessages === 0) {
      alert("No conversation histories to clear.");
      return;
    }

    const confirmMessage = `This will permanently delete all conversation histories from ALL ${personas.length} persona(s). This action cannot be undone.\n\nTotal messages: ${totalMessages}\n\nAre you absolutely sure?`;
    if (confirm(confirmMessage)) {
      await clearAllHistories();
      // Reload personas to update the UI
      await loadPersonas();
      // Clear current persona if it had history
      if (currentPersona && currentPersona.conversationHistory.length > 0) {
        setCurrentPersona({ ...currentPersona, conversationHistory: [] });
      }
      alert("All conversation histories have been cleared.");
    }
  };

  const filteredPersonas = personas.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
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
