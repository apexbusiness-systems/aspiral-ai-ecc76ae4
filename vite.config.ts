import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  // Production optimizations
  esbuild: {
    // CRITICAL FIX: Only drop logs/debug, KEEP errors and warnings for mobile debugging
    pure: mode === "production" ? ["console.log", "console.debug", "console.info"] : [],
    drop: mode === "production" ? ["debugger"] : [],
  },
  build: {
    // Source maps for error tracking in production
    sourcemap: mode === "production" ? "hidden" : true,
    // Optimize for production
    minify: mode === "production" ? "esbuild" : false,
    // Target modern browsers for smaller bundles
    target: "es2020",
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt", // Changed from autoUpdate to prompt to allow user control
      includeAssets: [
        "icons/icon.svg",
        "icons/favicon-32x32.png",
        "icons/favicon-16x16.png",
        "icons/apple-touch-icon.png"
      ],
      manifest: {
        name: "aSpiral - Transform Confusion into Clarity",
        short_name: "aSpiral",
        description: "Voice-first AI coaching that visualizes your thoughts and guides you to breakthrough clarity",
        theme_color: "#4a1a6b",
        background_color: "#4a1a6b",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        id: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,woff2}"],
        globIgnores: ["**/demo-video*", "**/aspiral-heromark*"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        // Safety: Ensure we don't cache index.html too aggressively
        // This is crucial for PWA updates to be detected
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add build define for VersionStamp
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    // In a real CI/CD, this would be injected. Fallback for local.
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify('DEV-' + Math.random().toString(36).substring(7))
  }
}));
