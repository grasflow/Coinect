import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  DollarSign,
  Lightbulb,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { AIInsightsStatusDTO, AIInsightsAnalysisDTO } from "@/types";
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

async function generateAIAnalysis(): Promise<AIInsightsAnalysisDTO> {
  const response = await fetch("/api/ai-insights/analyze", {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate AI analysis");
  }

  return response.json();
}

export default function AIInsightsWidget() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isHidden, setIsHidden] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<AIInsightsAnalysisDTO | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["ai-insights", "status"],
    queryFn: fetchAIInsightsStatus,
    refetchInterval: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const analysisMutation = useMutation({
    mutationFn: generateAIAnalysis,
    onSuccess: (data) => {
      setAnalysis(data);
    },
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

  const handleGenerateAnalysis = () => {
    analysisMutation.mutate();
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
    <div className="fixed bottom-6 right-6 z-50 w-96">
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
                    <p className="text-sm font-medium text-green-800 mb-1">AI Insights odblokowany!</p>
                    <Muted className="text-xs text-green-700">{status.message}</Muted>
                  </div>

                  {/* Generate Analysis Button */}
                  <Button
                    variant="filled"
                    className="w-full"
                    onClick={handleGenerateAnalysis}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generowanie analizy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {analysis ? "Odśwież analizę" : "Wygeneruj analizę AI"}
                      </>
                    )}
                  </Button>

                  {/* Error State */}
                  {analysisMutation.isError && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <Text className="text-xs font-medium text-red-800">Błąd generowania analizy</Text>
                          <Muted className="text-xs text-red-700">
                            {analysisMutation.error?.message || "Spróbuj ponownie później"}
                          </Muted>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Results */}
                  {analysis && !analysisMutation.isPending && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {/* Summary */}
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Text className="text-xs font-medium text-blue-800 mb-1">Podsumowanie</Text>
                        <Muted className="text-xs text-blue-700">{analysis.summary}</Muted>
                      </div>

                      {/* Work Patterns */}
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <Text className="text-xs font-medium text-purple-800">Wzorce pracy</Text>
                        </div>
                        <div className="space-y-1">
                          <Muted className="text-xs text-purple-700">
                            Średnio: {analysis.work_patterns.average_hours_per_week.toFixed(1)} godz./tydzień
                          </Muted>
                          <Muted className="text-xs text-purple-700">
                            Najaktywniejsze dni: {analysis.work_patterns.peak_days.join(", ")}
                          </Muted>
                          <Muted className="text-xs text-purple-700">
                            Regularność: {analysis.work_patterns.consistency_score}/10
                          </Muted>
                          {analysis.work_patterns.insights.map((insight, idx) => (
                            <Muted key={idx} className="text-xs text-purple-700">
                              • {insight}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Rate Analysis */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <Text className="text-xs font-medium text-green-800">Analiza stawek</Text>
                        </div>
                        <div className="space-y-1">
                          <Muted className="text-xs text-green-700">
                            Średnia stawka: {analysis.rate_analysis.current_average_rate.toFixed(0)} PLN/godz.
                          </Muted>
                          <Muted className="text-xs text-green-700">
                            Zakres: {analysis.rate_analysis.rate_range.min}-{analysis.rate_analysis.rate_range.max}{" "}
                            PLN/godz.
                          </Muted>
                          <Muted className="text-xs text-green-700 font-medium">
                            {analysis.rate_analysis.optimization_potential}
                          </Muted>
                          {analysis.rate_analysis.recommendations.map((rec, idx) => (
                            <Muted key={idx} className="text-xs text-green-700">
                              • {rec}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Productivity Insights */}
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                          <Text className="text-xs font-medium text-orange-800">Produktywność</Text>
                        </div>
                        <div className="space-y-1">
                          {analysis.productivity_insights.most_productive_periods.length > 0 && (
                            <Muted className="text-xs text-orange-700">
                              Najproduktywniejsze: {analysis.productivity_insights.most_productive_periods.join(", ")}
                            </Muted>
                          )}
                          {analysis.productivity_insights.suggestions.map((suggestion, idx) => (
                            <Muted key={idx} className="text-xs text-orange-700">
                              • {suggestion}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Action Items */}
                      {analysis.action_items.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600" />
                            <Text className="text-xs font-medium text-yellow-800">Rekomendowane działania</Text>
                          </div>
                          <div className="space-y-1">
                            {analysis.action_items.map((action, idx) => (
                              <Muted key={idx} className="text-xs text-yellow-700">
                                {idx + 1}. {action}
                              </Muted>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <Muted className="text-xs text-gray-500 text-center">
                        Wygenerowano: {new Date(analysis.generated_at).toLocaleString("pl-PL")}
                      </Muted>
                    </div>
                  )}
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
                    <Text className="text-xs font-medium text-blue-800 mb-1">Wskazówka</Text>
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
                  <Text className="text-sm">{analysis ? "Analiza gotowa" : "Kliknij aby wygenerować analizę"}</Text>
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
