import { updatePersona } from "persona-storage";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "../stores/appStore";

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

    await updatePersona(currentPersona.id, updates);
    setCurrentPersona({ ...currentPersona, ...updates });
  };

  if (!currentPersona) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a persona to tweak settings
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Persona Settings</h2>
        <div className="text-sm text-muted-foreground">{currentPersona.name}</div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Tabs defaultValue="prompts">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="params">Params</TabsTrigger>
            <TabsTrigger value="personality">Traits</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    className="mt-2 min-h-[150px]"
                    placeholder="Define the persona's core behavior and personality..."
                  />
                </div>
                <div>
                  <Label htmlFor="user-prompt">User Prompt Template</Label>
                  <Textarea
                    id="user-prompt"
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                    className="mt-2 min-h-[100px]"
                    placeholder="Template for user messages with {context} and {message} placeholders..."
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="params">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Temperature: {temperature}</Label>
                  <Slider
                    min={0}
                    max={2}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={vals => setTemperature(vals[0])}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Higher = more creative, Lower = more focused
                  </div>
                </div>
                <div>
                  <Label>Top P: {topP}</Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[topP]}
                    onValueChange={vals => setTopP(vals[0])}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Nucleus sampling parameter
                  </div>
                </div>
                <div>
                  <Label>Max Tokens: {maxTokens}</Label>
                  <Slider
                    min={128}
                    max={2048}
                    step={128}
                    value={[maxTokens]}
                    onValueChange={vals => setMaxTokens(vals[0])}
                    className="mt-2"
                  />
                  <div className="text-xs text-muted-foreground mt-1">Maximum response length</div>
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Friendliness: {personality.friendliness}</Label>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.friendliness]}
                    onValueChange={vals =>
                      setPersonality({ ...personality, friendliness: vals[0] })
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Formality: {personality.formality}</Label>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.formality]}
                    onValueChange={vals => setPersonality({ ...personality, formality: vals[0] })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Verbosity: {personality.verbosity}</Label>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.verbosity]}
                    onValueChange={vals => setPersonality({ ...personality, verbosity: vals[0] })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Humor: {personality.humor}</Label>
                  <Slider
                    min={0}
                    max={10}
                    value={[personality.humor]}
                    onValueChange={vals => setPersonality({ ...personality, humor: vals[0] })}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Memory system stores important facts and conversation context.
                </div>
                <div className="mt-4 space-y-2">
                  {currentPersona.memory.map(memory => (
                    <div key={memory.id} className="text-sm p-2 bg-muted rounded">
                      {memory.content}
                    </div>
                  ))}
                  {currentPersona.memory.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No memories yet. Memories are automatically created during conversations.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quests">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Quest tracking for the persona.</div>
                <div className="mt-4 space-y-2">
                  {currentPersona.quests.map(quest => (
                    <div key={quest.id} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">{quest.title}</div>
                      <div className="text-xs text-muted-foreground">{quest.description}</div>
                      <div className="text-xs mt-1">
                        Status: <span className="capitalize">{quest.status}</span>
                      </div>
                    </div>
                  ))}
                  {currentPersona.quests.length === 0 && (
                    <div className="text-sm text-muted-foreground">No quests yet.</div>
                  )}
                </div>
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
