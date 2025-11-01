import { Copy, MessageSquare, Send } from "lucide-react";
import { MemorySystem, PersonaEngine } from "persona-engine";
import { addMessage, getPersona, updatePersona } from "persona-storage";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "../stores/appStore";
import { EmptyState } from "./EmptyState";

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (!currentPersona) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No Persona Selected"
        description="Select a persona from the list to start chatting, or create a new one from templates."
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-bold">
            {currentPersona.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{currentPersona.name}</h2>
            <div className="text-sm text-muted-foreground capitalize">
              {currentPersona.type.replace("-", " ")}
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description={`Start a conversation with ${currentPersona.name}. Try asking about their background, services, or quests they might offer.`}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              const messageKey = `${msg.role}-${idx}-${msg.timestamp.getTime()}`;

              return (
                <div
                  key={messageKey}
                  className={`flex gap-2 animate-slide-in-up ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {isAssistant ? (
                    <div className="max-w-[85%] md:max-w-[75%] space-y-2 group">
                      {msg.narration && (
                        <div className="bg-[var(--chat-narration)] text-[var(--chat-narration-foreground)] border border-muted rounded-lg px-4 py-2.5 transition-smooth">
                          <div className="text-xs font-medium mb-1 flex items-center gap-2">
                            <span>{currentPersona.name}</span>
                            <span className="text-muted-foreground">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm italic">{msg.narration}</div>
                        </div>
                      )}
                      {msg.content && (
                        <div className="relative group/message">
                          <div className="bg-[var(--chat-assistant)] text-[var(--chat-assistant-foreground)] rounded-lg px-4 py-2.5 shadow-sm transition-smooth">
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-1 -right-1 h-7 w-7 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background shadow-sm"
                            onClick={() => copyToClipboard(msg.content)}
                            title="Copy message"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[85%] md:max-w-[75%] relative group/message">
                      <div className="bg-[var(--chat-user)] text-[var(--chat-user-foreground)] rounded-lg px-4 py-2.5 shadow-sm transition-smooth">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                      <div className="absolute -bottom-4 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity text-xs text-muted-foreground">
                        {formatTimestamp(msg.timestamp)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-7 w-7 opacity-0 group-hover/message:opacity-100 transition-opacity bg-background shadow-sm"
                        onClick={() => copyToClipboard(msg.content)}
                        title="Copy message"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted rounded-lg px-4 py-2.5 flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-current rounded-full animate-typing" />
                    <div
                      className="h-2 w-2 bg-current rounded-full animate-typing"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="h-2 w-2 bg-current rounded-full animate-typing"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="flex-1 min-h-[60px] resize-none transition-smooth"
            disabled={isTyping || isModelLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || isModelLoading || !inputValue.trim()}
            size="icon"
            className="h-[60px] w-[60px] transition-smooth animate-scale-in"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
