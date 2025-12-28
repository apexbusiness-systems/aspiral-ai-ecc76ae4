import { SpiralChat } from "@/components/SpiralChat";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient-spiral">aSpiral</h1>
          <span className="text-xs text-muted-foreground">
            Enterprise Decision Intelligence
          </span>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1">
        <SpiralChat />
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
