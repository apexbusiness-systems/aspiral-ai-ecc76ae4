import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  isEnabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function SpeakingIndicator({
  isSpeaking,
  isEnabled,
  onToggle,
  className
}: SpeakingIndicatorProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        "glass-card rounded-xl px-3 py-2 flex items-center gap-2 transition-colors",
        isSpeaking && "bg-primary/20 border-primary/30",
        className
      )}
      whileTap={{ scale: 0.95 }}
      aria-label={isEnabled ? "Mute AI voice" : "Enable AI voice"}
    >
      {isEnabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}

      {isSpeaking && (
        <div className="flex gap-0.5">
          <motion.div
            className="w-0.5 h-3 bg-primary rounded-full"
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.div
            className="w-0.5 h-3 bg-primary rounded-full"
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
          />
          <motion.div
            className="w-0.5 h-3 bg-primary rounded-full"
            animate={{ scaleY: [1, 1.5, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
          />
        </div>
      )}

      <span className="text-xs font-medium">
        {isEnabled ? (isSpeaking ? "Speaking..." : "Voice") : "Muted"}
      </span>
    </motion.button>
  );
}
