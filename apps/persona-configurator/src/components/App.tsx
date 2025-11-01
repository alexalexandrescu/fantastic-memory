import { Menu, X } from "lucide-react";
import { ModelManager } from "persona-engine";
import { migratePersonas } from "persona-storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
    modelProgress,
  } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"personas" | "chat" | "tweaking">("chat");

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
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="animate-slide-in-left">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
                TTRPG Persona Configurator
              </h1>
              <div className="text-xs md:text-sm text-muted-foreground">
                AI-Powered NPC Management
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <label htmlFor="model-select" className="text-sm whitespace-nowrap">
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
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                {modelProgress || "Loading..."}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile model selector */}
        <div className="md:hidden border-t px-4 py-2">
          <div className="flex items-center gap-2">
            <label htmlFor="model-select-mobile" className="text-xs whitespace-nowrap">
              Model:
            </label>
            <Select
              value={selectedModel || ""}
              onValueChange={handleModelSelect}
              disabled={isModelLoading}
            >
              <SelectTrigger className="flex-1">
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
            {isModelLoading && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-2 space-y-2">
            <Button
              variant={activePanel === "personas" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActivePanel("personas");
                setMobileMenuOpen(false);
              }}
            >
              Personas
            </Button>
            <Button
              variant={activePanel === "chat" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActivePanel("chat");
                setMobileMenuOpen(false);
              }}
            >
              Chat
            </Button>
            <Button
              variant={activePanel === "tweaking" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => {
                setActivePanel("tweaking");
                setMobileMenuOpen(false);
              }}
            >
              Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content - responsive layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Left pane - Personas */}
        <div className="hidden lg:block w-80 border-r flex flex-col animate-slide-in-left">
          <PersonaList />
        </div>

        {/* Mobile: Conditional panel rendering */}
        {activePanel === "personas" && (
          <div className="lg:hidden w-full flex flex-col animate-slide-in-left">
            <PersonaList />
          </div>
        )}

        {/* Desktop: Center pane - Chat */}
        <div className="hidden lg:flex flex-1 border-r flex-col animate-scale-in">
          <ChatInterface />
        </div>

        {/* Mobile: Chat panel */}
        {activePanel === "chat" && (
          <div className="lg:hidden w-full flex flex-col animate-scale-in">
            <ChatInterface />
          </div>
        )}

        {/* Desktop: Right pane - Tweaking */}
        <div className="hidden lg:block w-96 flex flex-col animate-slide-in-right">
          <TweakingPanel />
        </div>

        {/* Mobile: Tweaking panel */}
        {activePanel === "tweaking" && (
          <div className="lg:hidden w-full flex flex-col animate-slide-in-right">
            <TweakingPanel />
          </div>
        )}
      </div>
    </div>
  );
}
