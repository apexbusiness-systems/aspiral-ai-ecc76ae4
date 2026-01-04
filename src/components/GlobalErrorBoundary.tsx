
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });

    // Send to analytics (PostHog via wrapper)
    // We can't use hooks here, so we'd need a static method or import usage.
    // For now, we rely on the window.posthog if available or simple logging.
    if ((window as any).posthog) {
       (window as any).posthog.capture('fatal_ui_error', {
           error: error.message,
           stack: error.stack?.substring(0, 1000), // Trim
           componentStack: errorInfo.componentStack?.substring(0, 1000)
       });
    }
  }

  private handleReload = () => {
    // Attempt to recover by clearing some state?
    // Often safer to just reload the page for a clean slate.
    window.location.reload();
  };

  private handleGoHome = () => {
      window.location.href = '/';
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md text-muted-foreground">
            The Spiral got a bit tangled. We've logged this error and are looking into it.
          </p>

          <div className="flex gap-4">
            <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload App
            </Button>
            <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
            </Button>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 max-w-2xl overflow-auto rounded-md bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
              <p className="font-bold text-destructive mb-2">{this.state.error.toString()}</p>
              <pre>{this.state.error.stack}</pre>
              <pre className="mt-4 pt-4 border-t border-border">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
