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
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "glass-card text-foreground rounded-bl-md",
          message.isStreaming && "animate-pulse"
        )}
      >
        {message.content || (
          <div className="flex gap-1">
            <span className="typing-dot h-2 w-2 rounded-full bg-current opacity-60" />
            <span className="typing-dot h-2 w-2 rounded-full bg-current opacity-60" />
            <span className="typing-dot h-2 w-2 rounded-full bg-current opacity-60" />
          </div>
        )}
      </div>
    </div>
  );
}
