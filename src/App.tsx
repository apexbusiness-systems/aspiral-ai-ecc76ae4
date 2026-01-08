// FILE: src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LayoutShell from "./components/layout/LayoutShell";
import SafeErrorBoundary from "./components/errors/SafeErrorBoundary";
// CRITICAL: Index route must be eager (not lazy) for immediate FCP on homepage
import Index from "./pages/Index";
import { paths } from "./routes/paths";

// PERFORMANCE: Route-based code splitting - lazy load all routes except Index (critical)
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Features = lazy(() => import("./pages/Features"));
const Compare = lazy(() => import("./pages/Compare"));
const Security = lazy(() => import("./pages/Security"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthLanding = lazy(() => import("./pages/AuthLanding"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const CallCenter = lazy(() => import("./pages/CallCenter"));
const CallLogs = lazy(() => import("./pages/CallLogs"));
const Integrations = lazy(() => import("./pages/Integrations"));
const ClientNumberOnboarding = lazy(() => import("./pages/ops/ClientNumberOnboarding"));
const VoiceSettings = lazy(() => import("./pages/ops/VoiceSettings"));
const TeamInvite = lazy(() => import("./pages/TeamInvite"));
const PhoneApps = lazy(() => import("./pages/PhoneApps"));
const ForwardingWizard = lazy(() => import("./routes/ForwardingWizard"));
const Scene3DDemo = lazy(() => import("./pages/Scene3DDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));

const routeEntries: Array<{ path: string; element: React.ReactNode }> = [
  { path: paths.home, element: <Index /> },
  { path: paths.pricing, element: <Pricing /> },
  { path: paths.faq, element: <FAQ /> },
  { path: paths.features, element: <Features /> },
  { path: paths.compare, element: <Compare /> },
  { path: paths.security, element: <Security /> },
  { path: paths.contact, element: <Contact /> },
  { path: paths.auth, element: <Auth /> },
  { path: '/auth-landing', element: <AuthLanding /> },
  { path: paths.dashboard, element: <ClientDashboard /> },
  { path: paths.calls, element: <CallCenter /> },
  { path: paths.callCenterLegacy, element: <CallCenter /> },
  { path: paths.callLogs, element: <CallLogs /> },
  { path: paths.addNumber, element: <ClientNumberOnboarding /> },
  { path: paths.numbersLegacy, element: <ClientNumberOnboarding /> },
  { path: paths.voiceSettings, element: <VoiceSettings /> },
  { path: paths.teamInvite, element: <TeamInvite /> },
  { path: paths.integrations, element: <Integrations /> },
  { path: paths.phoneApps, element: <PhoneApps /> },
  { path: paths.forwardingWizard, element: <ForwardingWizard /> },
  { path: '/scene-3d-demo', element: <Scene3DDemo /> },
  { path: paths.notFound, element: <NotFound /> },
];

export const appRoutePaths = new Set(routeEntries.map(({ path }) => path));

// Loading fallback component for better UX during lazy loading
const LoadingFallback = () => (
  <div
    style={{
      minHeight: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.125rem",
      color: "hsl(var(--muted-foreground))",
    }}
  >
    Loading...
  </div>
);

export default function App() {
  return (
    <SafeErrorBoundary>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <BrowserRouter>
          {/* Suspense prevents a white screen if any child is lazy elsewhere */}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route element={<LayoutShell />}>
                {routeEntries.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
    </SafeErrorBoundary>
  );
}
