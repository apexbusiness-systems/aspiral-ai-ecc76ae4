
import React, { useEffect, useState } from "react";
// virtual import as per vite-plugin-pwa docs for some versions
// If 'vite-plugin-pwa/react' fails, we try 'virtual:pwa-register/react'
// However, TypeScript might complain about virtual module.
// Let's try to verify if I can just use the standard one, or if I need to use the virtual one.
// The error was "No known conditions for ./react".
// This suggests I should use virtual:pwa-register/react if the package doesn't expose it.
// BUT, to make TS happy, I need a declaration. `vite-plugin-pwa/client` usually has it.
// Let's try 'virtual:pwa-register/react' and see if build passes (TS might fail but build might pass if ignore).

// Actually, let's check node_modules/vite-plugin-pwa/package.json if possible
// cat node_modules/vite-plugin-pwa/package.json

import { useRegisterSW } from "virtual:pwa-register/react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function UpdatePrompt() {
  const { toast } = useToast();
  // useRegisterSW signature might vary slightly, but usually it returns { needRefresh: [bool, setBool], updateServiceWorker, ... }
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error: any) {
      console.error("SW Registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: "Update available",
        description: "A new version of aSpiral is available.",
        duration: Infinity,
        action: (
          <ToastAction
            altText="Update"
            onClick={() => updateServiceWorker(true)}
          >
            Update
          </ToastAction>
        ),
      });
    }
  }, [needRefresh, updateServiceWorker, toast]);

  return null;
}
