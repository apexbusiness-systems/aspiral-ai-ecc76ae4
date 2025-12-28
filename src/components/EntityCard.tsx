/**
 * EntityCard - Phase 4 Cinematic Polish
 * 
 * 2D representation of an entity in the chat interface.
 * Uses matching layoutId with EntityOrbWithLayoutId for smooth morphing.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Entity } from "@/lib/types";

interface EntityCardProps {
  entity: Entity;
  isSelected?: boolean;
  onClick?: (entity: Entity) => void;
  className?: string;
}

const entityColors: Record<string, { bg: string; border: string; text: string }> = {
  problem: { 
    bg: "bg-red-500/10", 
    border: "border-red-500/30", 
    text: "text-red-400" 
  },
  emotion: { 
    bg: "bg-purple-500/10", 
    border: "border-purple-500/30", 
    text: "text-purple-400" 
  },
  value: { 
    bg: "bg-emerald-500/10", 
    border: "border-emerald-500/30", 
    text: "text-emerald-400" 
  },
  action: { 
    bg: "bg-blue-500/10", 
    border: "border-blue-500/30", 
    text: "text-blue-400" 
  },
  friction: { 
    bg: "bg-orange-500/10", 
    border: "border-orange-500/30", 
    text: "text-orange-400" 
  },
  grease: { 
    bg: "bg-green-500/10", 
    border: "border-green-500/30", 
    text: "text-green-400" 
  },
};

const entityIcons: Record<string, string> = {
  problem: "⚠️",
  emotion: "💭",
  value: "✨",
  action: "🎯",
  friction: "⚙️",
  grease: "💧",
};

export function EntityCard({ 
  entity, 
  isSelected = false, 
  onClick,
  className,
}: EntityCardProps) {
  const colors = entityColors[entity.type] || entityColors.problem;
  const icon = entityIcons[entity.type] || "●";

  return (
    <motion.div
      layoutId={`entity-${entity.id}`}
      className={cn(
        "relative px-3 py-2 rounded-xl border cursor-pointer",
        "transition-all duration-200",
        colors.bg,
        colors.border,
        isSelected && "ring-2 ring-offset-2 ring-offset-background",
        isSelected && colors.text.replace("text-", "ring-"),
        "hover:scale-105 hover:shadow-lg",
        className
      )}
      onClick={() => onClick?.(entity)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ 
        boxShadow: `0 0 20px ${colors.text.includes('red') ? 'rgba(239, 68, 68, 0.3)' : 
                            colors.text.includes('purple') ? 'rgba(139, 92, 246, 0.3)' :
                            colors.text.includes('emerald') ? 'rgba(16, 185, 129, 0.3)' :
                            colors.text.includes('blue') ? 'rgba(59, 130, 246, 0.3)' :
                            colors.text.includes('orange') ? 'rgba(249, 115, 22, 0.3)' :
                            'rgba(34, 197, 94, 0.3)'}` 
      }}
    >
      {/* Icon */}
      <span className="mr-2" aria-hidden="true">
        {icon}
      </span>
      
      {/* Label */}
      <span className={cn("text-sm font-medium", colors.text)}>
        {entity.label}
      </span>
      
      {/* Type Badge */}
      <span className={cn(
        "ml-2 text-xs opacity-60 uppercase tracking-wide",
        colors.text
      )}>
        {entity.type}
      </span>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className={cn(
            "absolute -inset-px rounded-xl border-2",
            colors.border.replace("/30", "/60")
          )}
          layoutId={`entity-selection-${entity.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}

/**
 * EntityCardList - Displays a list of entity cards with stagger animation
 */
export function EntityCardList({
  entities,
  selectedId,
  onEntityClick,
  className,
}: {
  entities: Entity[];
  selectedId?: string;
  onEntityClick?: (entity: Entity) => void;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("flex flex-wrap gap-2", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {entities.map((entity) => (
        <EntityCard
          key={entity.id}
          entity={entity}
          isSelected={entity.id === selectedId}
          onClick={onEntityClick}
        />
      ))}
    </motion.div>
  );
}
