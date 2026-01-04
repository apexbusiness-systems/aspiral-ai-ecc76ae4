
import { useEffect, useState } from "react";

interface SafeAreaInsets {
  top: string;
  bottom: string;
  left: string;
  right: string;
  hasNotch: boolean;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: "0px",
    bottom: "0px",
    left: "0px",
    right: "0px",
    hasNotch: false,
  });

  useEffect(() => {
    const updateInsets = () => {
      // Use CSS environment variables directly in JS if needed,
      // but usually we return strings to be used in style props.
      // However, reading them from JS is tricky without a computed style on an element.
      // A better approach is to rely on CSS classes, but this hook provides
      // values if we need them for JS calculations (like canvas sizing).

      // For now, we'll return CSS variable strings that can be used in style={{ paddingTop: insets.top }}
      setInsets({
        top: "env(safe-area-inset-top, 0px)",
        bottom: "env(safe-area-inset-bottom, 0px)",
        left: "env(safe-area-inset-left, 0px)",
        right: "env(safe-area-inset-right, 0px)",
        // Heuristic: if top safe area is significant (we can't easily know in pure JS without a DOM probe)
        // We'll leave hasNotch as false for now, or check window.screen logic if critical.
        hasNotch: false,
      });
    };

    updateInsets();
    window.addEventListener("resize", updateInsets);
    return () => window.removeEventListener("resize", updateInsets);
  }, []);

  return insets;
}
