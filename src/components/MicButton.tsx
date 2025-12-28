import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  onClick: () => void;
}

export function MicButton({
  isRecording,
  isProcessing,
  isSupported,
  onClick,
}: MicButtonProps) {
  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="lg"
        disabled
        className="h-16 w-16 rounded-full glass-card"
      >
        <MicOff className="h-6 w-6 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div className="relative">
      {/* Outer glow ring when not recording */}
      {!isRecording && !isProcessing && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl animate-pulse" />
      )}
      
      <Button
        onClick={onClick}
        disabled={isProcessing}
        size="lg"
        className={cn(
          "relative h-20 w-20 rounded-full transition-all duration-500",
          "border-2 backdrop-blur-sm",
          isRecording
            ? "bg-destructive border-destructive/50 hover:bg-destructive/90 mic-pulse"
            : "bg-gradient-to-br from-primary to-secondary border-primary/30 hover:scale-105 shadow-glow"
        )}
      >
        {isRecording ? (
          <Square className="h-6 w-6 fill-current text-destructive-foreground" />
        ) : (
          <Mic className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
        )}
      </Button>
      
      {/* Recording indicator ring */}
      {isRecording && (
        <div className="absolute -inset-2 rounded-full border-2 border-destructive/50 animate-ping" />
      )}
    </div>
  );
}
