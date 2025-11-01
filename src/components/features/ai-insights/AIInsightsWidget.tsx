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
    <div className="fixed bottom-6 right-6 z-50 w-72">
      <Card className="shadow-xl border-2 border-blue-200 py-3 px-2">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <Text className="text-sm font-semibold">AI Insights</Text>
            </div>
            <div className="flex items-center gap-0.5">
              <Button variant="plain" size="icon" className="w-5 h-5" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="plain" size="icon" className="w-5 h-5" onClick={handleHide}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          {isExpanded && (
            <div className="space-y-2">
              {status.unlocked ? (
                <>
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs font-medium text-green-800 mb-0.5">AI Insights odblokowany!</p>
                    <Muted className="text-[10px] leading-tight text-green-700">{status.message}</Muted>
                  </div>

                  {/* Generate Analysis Button */}
                  <Button
                    variant="filled"
                    className="w-full h-8 text-xs"
                    onClick={handleGenerateAnalysis}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                        Generowanie analizy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        {analysis ? "Odśwież analizę" : "Wygeneruj analizę AI"}
                      </>
                    )}
                  </Button>

                  {/* Error State */}
                  {analysisMutation.isError && (
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <Text className="text-[10px] font-medium text-red-800">Błąd generowania analizy</Text>
                          <Muted className="text-[10px] leading-tight text-red-700">
                            {analysisMutation.error?.message || "Spróbuj ponownie później"}
                          </Muted>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Results */}
                  {analysis && !analysisMutation.isPending && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {/* Summary */}
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <Text className="text-[10px] font-medium text-blue-800 mb-0.5">Podsumowanie</Text>
                        <Muted className="text-[10px] leading-tight text-blue-700">{analysis.summary}</Muted>
                      </div>

                      {/* Work Patterns */}
                      <div className="p-2 bg-purple-50 rounded border border-purple-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <Text className="text-[10px] font-medium text-purple-800">Wzorce pracy</Text>
                        </div>
                        <div className="space-y-0.5">
                          <Muted className="text-[10px] leading-tight text-purple-700">
                            Średnio: {analysis.work_patterns.average_hours_per_week.toFixed(1)} godz./tydzień
                          </Muted>
                          <Muted className="text-[10px] leading-tight text-purple-700">
                            Najaktywniejsze dni: {analysis.work_patterns.peak_days.join(", ")}
                          </Muted>
                          <Muted className="text-[10px] leading-tight text-purple-700">
                            Regularność: {analysis.work_patterns.consistency_score}/10
                          </Muted>
                          {analysis.work_patterns.insights.map((insight, idx) => (
                            <Muted key={idx} className="text-[10px] leading-tight text-purple-700">
                              • {insight}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Rate Analysis */}
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <Text className="text-[10px] font-medium text-green-800">Analiza stawek</Text>
                        </div>
                        <div className="space-y-0.5">
                          <Muted className="text-[10px] leading-tight text-green-700">
                            Średnia stawka: {analysis.rate_analysis.current_average_rate.toFixed(0)} PLN/godz.
                          </Muted>
                          <Muted className="text-[10px] leading-tight text-green-700">
                            Zakres: {analysis.rate_analysis.rate_range.min}-{analysis.rate_analysis.rate_range.max}{" "}
                            PLN/godz.
                          </Muted>
                          <Muted className="text-[10px] leading-tight text-green-700 font-medium">
                            {analysis.rate_analysis.optimization_potential}
                          </Muted>
                          {analysis.rate_analysis.recommendations.map((rec, idx) => (
                            <Muted key={idx} className="text-[10px] leading-tight text-green-700">
                              • {rec}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Productivity Insights */}
                      <div className="p-2 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-orange-600" />
                          <Text className="text-[10px] font-medium text-orange-800">Produktywność</Text>
                        </div>
                        <div className="space-y-0.5">
                          {analysis.productivity_insights.most_productive_periods.length > 0 && (
                            <Muted className="text-[10px] leading-tight text-orange-700">
                              Najproduktywniejsze: {analysis.productivity_insights.most_productive_periods.join(", ")}
                            </Muted>
                          )}
                          {analysis.productivity_insights.suggestions.map((suggestion, idx) => (
                            <Muted key={idx} className="text-[10px] leading-tight text-orange-700">
                              • {suggestion}
                            </Muted>
                          ))}
                        </div>
                      </div>

                      {/* Action Items */}
                      {analysis.action_items.length > 0 && (
                        <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="w-3 h-3 text-yellow-600" />
                            <Text className="text-[10px] font-medium text-yellow-800">Rekomendowane działania</Text>
                          </div>
                          <div className="space-y-0.5">
                            {analysis.action_items.map((action, idx) => (
                              <Muted key={idx} className="text-[10px] leading-tight text-yellow-700">
                                {idx + 1}. {action}
                              </Muted>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <Muted className="text-[10px] text-gray-500 text-center">
                        Wygenerowano: {new Date(analysis.generated_at).toLocaleString("pl-PL")}
                      </Muted>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Muted className="text-[10px]">Postęp odblokowania</Muted>
                      <Text className="text-[10px] font-semibold">
                        {status.entries_with_notes}/{status.threshold}
                      </Text>
                    </div>
                    <Progress value={status.progress_percentage} />
                  </div>

                  <Muted className="text-[10px] leading-tight">{status.message}</Muted>

                  <div className="p-2 bg-blue-50 rounded border border-blue-200">
                    <Text className="text-[10px] font-medium text-blue-800 mb-0.5">Wskazówka</Text>
                    <Muted className="text-[10px] leading-tight text-blue-700">
                      Dodawaj prywatne notatki do wpisów czasu, aby AI mógł analizować wzorce Twojej pracy i sugerować
                      optymalizacje stawek.
                    </Muted>
                  </div>
                </>
              )}

              <div className="pt-1.5 border-t">
                <a href="/time-entries" className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                  Dodaj wpisy czasu →
                </a>
              </div>
            </div>
          )}

          {/* Collapsed state */}
          {!isExpanded && (
            <div
              className="flex items-center gap-2 cursor-pointer rounded-md px-1 py-1 -mx-1 hover:bg-accent/50 transition-colors min-h-[28px]"
              onClick={() => setIsExpanded(true)}
            >
              {status.unlocked ? (
                <>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    analysis
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {analysis ? "✓ Gotowe" : "Nowa analiza"}
                  </span>
                  <Text className="!text-xs text-foreground/80 flex-1">
                    {analysis ? "Kliknij aby zobaczyć" : "Kliknij aby wygenerować"}
                  </Text>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700">
                      {status.entries_with_notes}/{status.threshold}
                    </span>
                    <Progress value={status.progress_percentage} className="flex-1 h-1.5" />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
