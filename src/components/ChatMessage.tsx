import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-fade-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-3.5 text-fluid-base leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-lg shadow-lg shadow-primary/20"
            : "glass-card text-foreground rounded-bl-lg",
          message.isStreaming && "animate-pulse"
        )}
      >
        {message.content || (
          <div className="flex gap-1.5 py-1">
            <span className="typing-dot h-2 w-2 rounded-full bg-current" />
            <span className="typing-dot h-2 w-2 rounded-full bg-current" />
            <span className="typing-dot h-2 w-2 rounded-full bg-current" />
          </div>
        )}
      </div>
    </div>
  );
}
