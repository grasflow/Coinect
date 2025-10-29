import AIInsightsWidget from "@/components/features/ai-insights/AIInsightsWidget";
import { Toaster } from "@/components/ui/sonner";

export default function GlobalWidgets() {
  return (
    <>
      <AIInsightsWidget />
      <Toaster />
    </>
  );
}
