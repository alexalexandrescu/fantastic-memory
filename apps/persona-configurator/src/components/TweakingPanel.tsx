import { RotateCcw, Settings } from "lucide-react";
import { updatePersona } from "persona-storage";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "../stores/appStore";
import { EmptyState } from "./EmptyState";

export function TweakingPanel() {
  const { currentPersona, setCurrentPersona } = useAppStore();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(512);
  const [personality, setPersonality] = useState({
    friendliness: 5,
    formality: 5,
    verbosity: 5,
    humor: 5,
  });

  useEffect(() => {
    if (currentPersona) {
      setSystemPrompt(currentPersona.systemPrompt);
      setUserPrompt(currentPersona.userPromptTemplate);
      setTemperature(currentPersona.modelParams.temperature);
      setTopP(currentPersona.modelParams.topP);
      setMaxTokens(currentPersona.modelParams.maxTokens);
      setPersonality(currentPersona.personality);
    }
  }, [currentPersona]);

  const hasUnsavedChanges = useMemo(() => {
    if (!currentPersona) return false;
    return (
      systemPrompt !== currentPersona.systemPrompt ||
      userPrompt !== currentPersona.userPromptTemplate ||
      temperature !== currentPersona.modelParams.temperature ||
      topP !== currentPersona.modelParams.topP ||
      maxTokens !== currentPersona.modelParams.maxTokens ||
      personality.friendliness !== currentPersona.personality.friendliness ||
      personality.formality !== currentPersona.personality.formality ||
      personality.verbosity !== currentPersona.personality.verbosity ||
      personality.humor !== currentPersona.personality.humor
    );
  }, [currentPersona, systemPrompt, userPrompt, temperature, topP, maxTokens, personality]);

  const handleSave = async () => {
    if (!currentPersona) return;

    const updates = {
      systemPrompt,
      userPromptTemplate: userPrompt,
      modelParams: {
        temperature,
        topP,
        maxTokens,
      },
      personality,
      updatedAt: new Date(),
    };

    try {
      await updatePersona(currentPersona.id, updates);
      setCurrentPersona({ ...currentPersona, ...updates });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error("Save error:", error);
    }
  };

  const resetToDefault = () => {
    if (!currentPersona) return;
    setSystemPrompt(currentPersona.systemPrompt);
    setUserPrompt(currentPersona.userPromptTemplate);
    setTemperature(currentPersona.modelParams.temperature);
    setTopP(currentPersona.modelParams.topP);
    setMaxTokens(currentPersona.modelParams.maxTokens);
    setPersonality(currentPersona.personality);
    toast.info("Reset to saved values");
  };

  if (!currentPersona) {
    return (
      <EmptyState
        icon={Settings}
        title="No Persona Selected"
        description="Select a persona from the list to configure its settings, prompts, and personality traits."
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold">Persona Settings</h2>
            <div className="text-sm text-muted-foreground">{currentPersona.name}</div>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-xs animate-pulse-glow">
              Unsaved
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 custom-scrollbar">
        <Tabs defaultValue="prompts">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-4 h-auto">
            <TabsTrigger value="prompts" className="text-xs md:text-sm">
              Prompts
            </TabsTrigger>
            <TabsTrigger value="params" className="text-xs md:text-sm">
              Params
            </TabsTrigger>
            <TabsTrigger value="personality" className="text-xs md:text-sm">
              Traits
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs md:text-sm">
              Memory
            </TabsTrigger>
            <TabsTrigger value="quests" className="text-xs md:text-sm">
              Quests
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs md:text-sm">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="animate-fade-in">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefault}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  className="min-h-[150px] transition-smooth font-mono text-sm"
                  placeholder="Define the persona's core behavior and personality..."
                />
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-prompt">User Prompt Template</Label>
                </div>
                <Textarea
                  id="user-prompt"
                  value={userPrompt}
                  onChange={e => setUserPrompt(e.target.value)}
                  className="min-h-[100px] transition-smooth font-mono text-sm"
                  placeholder="Template for user messages with {context} and {message} placeholders..."
                />
                <Button
                  onClick={handleSave}
                  className="w-full transition-smooth"
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="params" className="animate-fade-in">
            <Card>
              <CardContent className="p-4 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Temperature</Label>
                    <Badge variant="secondary" className="text-xs">
                      {temperature.toFixed(1)}
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={vals => setTemperature(vals[0])}
                    className="transition-smooth"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Higher = more creative, Lower = more focused
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Top P</Label>
                    <Badge variant="secondary" className="text-xs">
                      {topP.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[topP]}
                    onValueChange={vals => setTopP(vals[0])}
                    className="transition-smooth"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Nucleus sampling parameter
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Max Tokens</Label>
                    <Badge variant="secondary" className="text-xs">
                      {maxTokens}
                    </Badge>
                  </div>
                  <Slider
                    min={128}
                    max={2048}
                    step={128}
                    value={[maxTokens]}
                    onValueChange={vals => setMaxTokens(vals[0])}
                    className="transition-smooth"
                  />
                  <div className="text-xs text-muted-foreground mt-1">Maximum response length</div>
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full transition-smooth"
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="animate-fade-in">
            <Card>
              <CardContent className="p-4 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Friendliness</Label>
                    <Badge variant="secondary" className="text-xs">
                      {personality.friendliness}/10
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.friendliness]}
                    onValueChange={vals =>
                      setPersonality({ ...personality, friendliness: vals[0] })
                    }
                    className="transition-smooth"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Formality</Label>
                    <Badge variant="secondary" className="text-xs">
                      {personality.formality}/10
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.formality]}
                    onValueChange={vals => setPersonality({ ...personality, formality: vals[0] })}
                    className="transition-smooth"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Verbosity</Label>
                    <Badge variant="secondary" className="text-xs">
                      {personality.verbosity}/10
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.verbosity]}
                    onValueChange={vals => setPersonality({ ...personality, verbosity: vals[0] })}
                    className="transition-smooth"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Humor</Label>
                    <Badge variant="secondary" className="text-xs">
                      {personality.humor}/10
                    </Badge>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.humor]}
                    onValueChange={vals => setPersonality({ ...personality, humor: vals[0] })}
                    className="transition-smooth"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  className="w-full transition-smooth"
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="animate-fade-in">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Memory system stores important facts and conversation context automatically.
                </div>
                {currentPersona.memory.length > 0 ? (
                  <div className="space-y-2">
                    {currentPersona.memory.map((memory, idx) => (
                      <Card
                        key={memory.id}
                        className="animate-slide-in-up transition-smooth"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <CardContent className="p-3">
                          <div className="text-sm leading-relaxed">{memory.content}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-8">
                    No memories yet. Memories are automatically created during conversations.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quests" className="animate-fade-in">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Quest tracking for the persona. Quests can be generated through conversation.
                </div>
                {currentPersona.quests.length > 0 ? (
                  <div className="space-y-2">
                    {currentPersona.quests.map((quest, idx) => (
                      <Card
                        key={quest.id}
                        className="animate-slide-in-up transition-smooth border-l-4"
                        style={{
                          animationDelay: `${idx * 0.05}s`,
                          borderLeftColor:
                            quest.status === "active"
                              ? "var(--success)"
                              : quest.status === "completed"
                                ? "var(--info)"
                                : "var(--muted-foreground)",
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-medium text-sm">{quest.title}</div>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {quest.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {quest.description}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-center text-muted-foreground py-8">
                    No quests yet. Quests can be generated through conversation with the persona.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-sm text-muted-foreground">
                  Export and import functionality coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
