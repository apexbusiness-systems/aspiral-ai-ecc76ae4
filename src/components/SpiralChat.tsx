import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { MicButton } from "@/components/MicButton";
import { useChat } from "@/hooks/useChat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useSessionStore } from "@/stores/sessionStore";
import { useToast } from "@/hooks/use-toast";

export function SpiralChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { createSession, currentSession, isProcessing } = useSessionStore();
  const { messages, sendMessage, isStreaming } = useChat({
    onError: (error) => {
      toast({
        title: "Connection Issue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { isRecording, isSupported, transcript, toggleRecording } = useVoiceInput({
    onTranscript: (text) => {
      if (text.trim()) {
        sendMessage(text);
      }
    },
  });

  // Initialize session on mount
  useEffect(() => {
    if (!currentSession) {
      createSession("anonymous");
    }
  }, [currentSession, createSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="py-12 text-center">
              <h2 className="text-2xl font-semibold text-gradient-spiral mb-2">
                Welcome to aSpiral
              </h2>
              <p className="text-muted-foreground">
                Share what's on your mind. I'll help you untangle it.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Voice Transcript Preview */}
      {isRecording && transcript && (
        <div className="border-t border-border bg-muted/50 px-4 py-2">
          <p className="text-sm text-muted-foreground animate-pulse">
            {transcript}...
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="mx-auto max-w-2xl">
          {/* Mic Button */}
          <div className="mb-4 flex justify-center">
            <MicButton
              isRecording={isRecording}
              isProcessing={isProcessing || isStreaming}
              isSupported={isSupported}
              onClick={toggleRecording}
            />
          </div>

          {/* Text Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Or type your thoughts here..."
              disabled={isProcessing || isRecording}
              className="bg-input"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="gradient-spiral"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
