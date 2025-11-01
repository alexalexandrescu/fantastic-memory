import { downloadCharacters, loadCharactersFromFile } from "character-storage";
import { Edit, FileDown, FileText, FileUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCharacterStore } from "../stores/characterStore";
import { CharacterEditor } from "./CharacterEditor";
import { CharacterList } from "./CharacterList";
import { CharacterSheet } from "./CharacterSheet";
import { ThemeToggle } from "./ThemeToggle";

export function App() {
  const { viewMode, setViewMode } = useCharacterStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleExport = async () => {
    try {
      await downloadCharacters();
      toast.success("Characters exported successfully");
    } catch (error) {
      toast.error("Failed to export characters");
      console.error(error);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        await loadCharactersFromFile(file, false);
        toast.success("Characters imported successfully");
        window.location.reload(); // Reload to refresh character list
      } catch (error) {
        toast.error("Failed to import characters");
        console.error(error);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                TTRPG Character Builder
              </h1>
              <div className="text-xs md:text-sm text-muted-foreground">
                Create and manage your characters
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                variant={viewMode === "editor" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewMode("editor")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant={viewMode === "sheet" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewMode("sheet")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Sheet
              </Button>
            </div>
            <ThemeToggle />
          </div>
        </div>
        {/* Mobile actions */}
        <div className="md:hidden border-t px-4 py-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="flex-1">
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} className="flex-1">
            <FileUp className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant={viewMode === "editor" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("editor")}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "sheet" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setViewMode("sheet")}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Characters</h2>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CharacterList />
        </SheetContent>
      </Sheet>

      {/* Main content - responsive layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop: Left pane - Character List */}
        <div className="hidden lg:block w-80 border-r flex flex-col animate-slide-in-left">
          <CharacterList />
        </div>

        {/* Mobile: Conditional panel rendering */}
        {mobileMenuOpen && (
          <div className="lg:hidden w-full flex flex-col animate-slide-in-left">
            <CharacterList />
          </div>
        )}

        {/* Center pane - Editor or Sheet */}
        <div className="flex-1 flex flex-col animate-scale-in">
          {viewMode === "editor" ? <CharacterEditor /> : <CharacterSheet />}
        </div>
      </div>
    </div>
  );
}
