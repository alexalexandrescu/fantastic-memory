import { ModelManager } from "persona-engine";
import { migratePersonas } from "persona-storage";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "../stores/appStore";
import { ChatInterface } from "./ChatInterface";
import { PersonaList } from "./PersonaList";
import { ThemeToggle } from "./ThemeToggle";
import { TweakingPanel } from "./TweakingPanel";

export function App() {
  const {
    selectedModel,
    setSelectedModel,
    isModelLoading,
    setIsModelLoading,
    setModelProgress,
    modelProgress,
  } = useAppStore();

  const availableModels = ModelManager.getAvailableModels();

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelLoading(true);
    // Model initialization will happen in ChatInterface
  };

  useEffect(() => {
    // Run migration on app startup
    migratePersonas().catch(err => console.error("Migration failed:", err));

    // Set default model
    if (!selectedModel && availableModels.length > 0) {
      handleModelSelect(availableModels[0].id);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-2xl font-bold">TTRPG Persona Configurator</h1>
          <div className="text-sm text-muted-foreground">AI-Powered NPC Management</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="text-sm">
              Model:
            </label>
            <Select
              value={selectedModel || ""}
              onValueChange={handleModelSelect}
              disabled={isModelLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.size})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isModelLoading && (
            <div className="text-sm text-muted-foreground">{modelProgress || "Loading..."}</div>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content - tri-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left pane - Personas */}
        <div className="w-80 border-r flex flex-col">
          <PersonaList />
        </div>

        {/* Center pane - Chat */}
        <div className="flex-1 border-r flex flex-col">
          <ChatInterface />
        </div>

        {/* Right pane - Tweaking */}
        <div className="w-96 flex flex-col">
          <TweakingPanel />
        </div>
      </div>
    </div>
  );
}
