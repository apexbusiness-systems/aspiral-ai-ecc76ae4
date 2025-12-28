import { Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface UltraFastToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function UltraFastToggle({ isEnabled, onToggle, className }: UltraFastToggleProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card",
      className
    )}>
      <Zap className={cn(
        "h-3.5 w-3.5 transition-colors",
        isEnabled ? "text-warning" : "text-muted-foreground"
      )} />
      <span className={cn(
        "text-xs font-medium transition-colors",
        isEnabled ? "text-warning" : "text-muted-foreground"
      )}>
        Ultra-fast
      </span>
      <Switch
        checked={isEnabled}
        onCheckedChange={onToggle}
        className="scale-75 data-[state=checked]:bg-warning"
      />
    </div>
  );
}
