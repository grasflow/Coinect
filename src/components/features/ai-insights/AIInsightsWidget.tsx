import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import type { AIInsightsStatusDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Text, Muted } from "@/components/ui/typography";

async function fetchAIInsightsStatus(): Promise<AIInsightsStatusDTO> {
  const response = await fetch("/api/ai-insights/status");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch AI Insights status");
  }

  return response.json();
}

export default function AIInsightsWidget() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["ai-insights", "status"],
    queryFn: fetchAIInsightsStatus,
    refetchInterval: 60000, // Refetch every minute
  });

  // Check if widget was hidden in localStorage
  React.useEffect(() => {
    const hidden = localStorage.getItem("ai-insights-widget-hidden");
    if (hidden === "true") {
      setIsHidden(true);
    }
  }, []);

  const handleHide = () => {
    setIsHidden(true);
    localStorage.setItem("ai-insights-widget-hidden", "true");
  };

  const handleShow = () => {
    setIsHidden(false);
    localStorage.removeItem("ai-insights-widget-hidden");
  };

  if (isLoading || !status) {
    return null;
  }

  // If hidden, show small button to reopen
  if (isHidden) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="filled"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={handleShow}
          title="Pokaż AI Insights"
        >
          <Sparkles className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <Card className="shadow-xl border-2 border-blue-200">
        <CardContent className="">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <Text className="font-semibold">AI Insights</Text>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="plain" size="icon" className="w-6 h-6" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button variant="plain" size="icon" className="w-6 h-6" onClick={handleHide}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isExpanded && (
            <div className="space-y-3">
              {status.unlocked ? (
                <>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-1">🎉 AI Insights odblokowany!</p>
                    <Muted className="text-xs text-green-700">{status.message}</Muted>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Muted className="text-xs">
                      Funkcja analizy AI jest w przygotowaniu. Wkrótce pojawią się tutaj rekomendacje dotyczące
                      optymalizacji stawek i wzorców pracy.
                    </Muted>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Muted className="text-xs">Postęp odblokowania</Muted>
                      <Text className="text-xs font-semibold">
                        {status.entries_with_notes}/{status.threshold}
                      </Text>
                    </div>
                    <Progress value={status.progress_percentage} />
                  </div>

                  <Muted className="text-xs">{status.message}</Muted>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-xs font-medium text-blue-800 mb-1">💡 Wskazówka</Text>
                    <Muted className="text-xs text-blue-700">
                      Dodawaj prywatne notatki do wpisów czasu, aby AI mógł analizować wzorce Twojej pracy i sugerować
                      optymalizacje stawek.
                    </Muted>
                  </div>
                </>
              )}

              <div className="pt-2 border-t">
                <a href="/time-entries" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Dodaj wpisy czasu →
                </a>
              </div>
            </div>
          )}

          {/* Collapsed state */}
          {!isExpanded && (
            <div className="flex items-center justify-between">
              {status.unlocked ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Text className="text-sm">Gotowy do analizy</Text>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Progress value={status.progress_percentage} className="w-24 h-2" />
                  <Text className="text-xs">
                    {status.entries_with_notes}/{status.threshold}
                  </Text>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
