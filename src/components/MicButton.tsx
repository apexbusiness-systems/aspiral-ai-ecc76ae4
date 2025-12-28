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
        className="h-16 w-16 rounded-full"
      >
        <MicOff className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={isProcessing}
      size="lg"
      className={cn(
        "h-20 w-20 rounded-full transition-all duration-300",
        isRecording
          ? "bg-destructive hover:bg-destructive/90 mic-pulse"
          : "gradient-spiral hover:opacity-90 spiral-glow"
      )}
    >
      {isRecording ? (
        <Square className="h-6 w-6 fill-current" />
      ) : (
        <Mic className="h-8 w-8" />
      )}
    </Button>
  );
}
