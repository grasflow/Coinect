import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Clock,
  ArrowRight,
  Plus,
  FileText,
  LoaderIcon,
  Clock as ClockIcon,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import type { DashboardSummaryDTO } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H1, Muted, Text } from "@/components/ui/typography";
import { Stack } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { HoursDisplay } from "@/components/ui/hours-display";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import QueryProvider from "@/components/QueryProvider";

async function fetchDashboardSummary(): Promise<DashboardSummaryDTO> {
  const response = await fetch("/api/dashboard/summary");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch dashboard summary");
  }

  return response.json();
}

function DashboardViewContent() {
  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
    refetchOnWindowFocus: true,
  });

  React.useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard");
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <Muted>Ładowanie dashboardu...</Muted>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Text>Brak danych do wyświetlenia</Text>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Stack className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <H1>Dashboard</H1>
            <Muted>Przegląd Twojej aktywności</Muted>
            <div className="mt-4 md:hidden">
              <Button variant="filled" size="sm" onClick={() => (window.location.href = "/time-entries")}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj wpis czasu
              </Button>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <Button variant="filled" size="default" onClick={() => (window.location.href = "/time-entries")}>
              <Plus className="w-4 h-4 mr-2" />
              Dodaj wpis czasu
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Clients Count */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/20">
                        <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5">{summary.clients_count}</div>
                    <p className="text-xs text-muted-foreground">Klienci</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Liczba aktywnych klientów w systemie</p>
            </TooltipContent>
          </Tooltip>

          {/* Unbilled Hours */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-900/20">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5">
                      {parseFloat(summary.unbilled_hours).toFixed(1)}h
                    </div>
                    <p className="text-xs text-muted-foreground">Niezafakturowane h</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Godziny pracy, które nie zostały jeszcze zafakturowane
                <br />
                Dokładnie: {parseFloat(summary.unbilled_hours).toFixed(2)}h
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Current Month Invoices */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-green-100 p-1.5 dark:bg-green-900/20">
                        <FileText className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5">
                      {(summary.current_month_invoices.total_gross_amount_pln / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-muted-foreground">Bieżący miesiąc</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Suma faktur z bieżącego miesiąca:{" "}
                {summary.current_month_invoices.total_gross_amount_pln.toLocaleString("pl-PL")} PLN
                <br />
                {summary.current_month_invoices.count}{" "}
                {summary.current_month_invoices.count === 1 ? "faktura" : "faktur"} ({" "}
                {summary.current_month_invoices.manual_count} ręcznych,{" "}
                {summary.current_month_invoices.time_entries_count} z godzin)
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Total Amount */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-primary/5 to-transparent cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-primary/10 p-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5">
                      {(summary.total_amount_pln / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-muted-foreground">Suma wpisów</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Całkowita wartość wszystkich wpisów czasu
                <br />
                {summary.total_amount_pln.toLocaleString("pl-PL")} PLN (zafakturowane + niezafakturowane)
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Unbilled Amount */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-orange-50 to-transparent dark:from-orange-900/10 cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-orange-100 p-1.5 dark:bg-orange-900/20">
                        <DollarSign className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5 text-orange-600 dark:text-orange-400">
                      {(summary.unbilled_amount_pln / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-muted-foreground">Do zafakturowania</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Wartość niezafakturowanych wpisów czasu
                <br />
                {summary.unbilled_amount_pln.toLocaleString("pl-PL")} PLN - wymaga wystawienia faktury
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Billed Amount */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-md bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 cursor-help py-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="rounded-lg bg-emerald-100 p-1.5 dark:bg-emerald-900/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-bold leading-none mb-1.5 text-emerald-600 dark:text-emerald-400">
                      {(summary.billed_amount_pln / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-muted-foreground">Zafakturowane</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                Wartość zafakturowanych wpisów czasu
                <br />
                {summary.billed_amount_pln.toLocaleString("pl-PL")} PLN - już wystawione faktury
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Ostatnie wpisy czasu</CardTitle>
                <CardDescription>5 najnowszych wpisów</CardDescription>
              </div>
              <Button
                variant="plain"
                size="sm"
                className="self-start -ml-3 md:ml-0 md:self-auto"
                onClick={() => (window.location.href = "/time-entries")}
              >
                Zobacz wszystkie
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {summary.recent_time_entries.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <Text className="font-medium mb-2">Brak wpisów czasu</Text>
                <Muted className="mb-4">Dodaj pierwszy wpis czasu pracy</Muted>
                <Button variant="tinted" size="sm" onClick={() => (window.location.href = "/time-entries")}>
                  Dodaj pierwszy wpis
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.recent_time_entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors gap-1.5 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm leading-tight order-2 sm:order-1">
                          {entry.client_name}
                        </span>
                        <Badge className="shrink-0 order-1 sm:order-2">
                          <HoursDisplay hours={entry.hours} />
                        </Badge>
                      </div>
                      {entry.public_description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2 sm:line-clamp-1">
                          {entry.public_description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap self-start sm:self-auto sm:ml-3">
                      {new Date(entry.date).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Ostatnie faktury</CardTitle>
                <CardDescription>5 najnowszych faktur</CardDescription>
              </div>
              <Button
                variant="plain"
                size="sm"
                className="self-start -ml-3 md:ml-0 md:self-auto"
                onClick={() => (window.location.href = "/invoices")}
              >
                Zobacz wszystkie
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {summary.recent_invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <Text className="font-medium mb-2">Brak faktur</Text>
                <Muted className="mb-4">Utwórz swoją pierwszą fakturę</Muted>
                <Button variant="tinted" size="sm" onClick={() => (window.location.href = "/invoices/new")}>
                  Utwórz pierwszą fakturę
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {summary.recent_invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    role="button"
                    tabIndex={0}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 sm:p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors cursor-pointer gap-1.5 sm:gap-4"
                    onClick={() => (window.location.href = `/invoices`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.location.href = `/invoices`;
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm leading-tight">{invoice.invoice_number}</span>
                        {invoice.is_manual && <Badge className="shrink-0">Ręczna</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{invoice.client_name}</p>
                    </div>
                    <div className="text-left sm:text-right sm:ml-3">
                      <p className="font-medium text-sm leading-tight">
                        {invoice.gross_amount.toFixed(2)} {invoice.currency}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap leading-snug">
                        {new Date(invoice.issue_date).toLocaleDateString("pl-PL")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Stack>
    </TooltipProvider>
  );
}

export default function DashboardView() {
  return (
    <QueryProvider>
      <DashboardViewContent />
    </QueryProvider>
  );
}
