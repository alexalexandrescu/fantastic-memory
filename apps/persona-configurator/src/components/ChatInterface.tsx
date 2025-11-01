import { Send } from "lucide-react";
import { MemorySystem, PersonaEngine } from "persona-engine";
import { addMessage, getPersona, updatePersona } from "persona-storage";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "../stores/appStore";

export function ChatInterface() {
  const {
    currentPersona,
    selectedModel,
    isModelLoading,
    setIsModelLoading,
    setModelProgress,
    setCurrentPersona,
  } = useAppStore();
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string; narration?: string; timestamp: Date }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PersonaEngine | null>(null);

  useEffect(() => {
    if (currentPersona) {
      // Load conversation history
      const historyMessages = currentPersona.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        narration: msg.narration,
        timestamp: msg.timestamp,
      }));
      setMessages(historyMessages);
    } else {
      setMessages([]);
    }
  }, [currentPersona]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize engine
    if (selectedModel && !engineRef.current) {
      engineRef.current = new PersonaEngine();
      engineRef.current
        .initModel(selectedModel, progress => {
          setModelProgress(progress.text);
        })
        .then(() => {
          setIsModelLoading(false);
        })
        .catch(err => {
          console.error("Failed to initialize model:", err);
          setIsModelLoading(false);
        });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose().then(() => {
          engineRef.current = null;
        });
      }
    };
  }, [selectedModel]);

  const handleSendMessage = async () => {
    if (!currentPersona || !engineRef.current || !inputValue.trim() || isTyping) {
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    // Add user message to UI
    const newUserMessage = { role: "user", content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Get response from persona
      const response = await engineRef.current.chat({
        persona: currentPersona,
        message: userMessage,
      });

      // Add assistant message to UI
      const assistantMessage = {
        role: "assistant",
        content: response.message,
        narration: response.narration,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save conversation to storage
      if (currentPersona) {
        await addMessage(currentPersona.id, {
          role: "user",
          content: userMessage,
          timestamp: new Date(),
        });
        await addMessage(currentPersona.id, {
          role: "assistant",
          content: response.message,
          narration: response.narration, // Save narration to storage
          timestamp: new Date(),
        });

        // Extract and store memories from the conversation
        const updatedPersona = await getPersona(currentPersona.id);
        if (updatedPersona) {
          const recentMessages = updatedPersona.conversationHistory.slice(-2); // Just the 2 messages we added
          MemorySystem.extractAndStoreMemory(updatedPersona, recentMessages);

          // Save the updated memory back to storage
          await updatePersona(currentPersona.id, { memory: updatedPersona.memory });

          // Update currentPersona in store to refresh UI
          const finalPersona = await getPersona(currentPersona.id);
          if (finalPersona) {
            setCurrentPersona(finalPersona);
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentPersona) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a persona to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{currentPersona.name}</h2>
        <div className="text-sm text-muted-foreground capitalize">
          {currentPersona.type.replace("-", " ")}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => {
            const isAssistant = msg.role === "assistant";

            return (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {isAssistant ? (
                  <div className="max-w-[80%] space-y-2">
                    {msg.narration && (
                      <div className="bg-muted/30 border border-muted rounded-lg px-4 py-2">
                        <div className="text-xs text-muted-foreground mb-1">
                          {currentPersona.name}
                        </div>
                        <div className="text-sm italic">{msg.narration}</div>
                      </div>
                    )}
                    {msg.content && (
                      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-accent text-accent-foreground">
                    {msg.content}
                  </div>
                )}
              </div>
            );
          })}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="h-2 w-2 bg-current rounded-full animate-pulse" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px]"
            disabled={isTyping || isModelLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || isModelLoading || !inputValue.trim()}
            size="icon"
            className="h-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
