import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Clock, ArrowRight, Plus, FileText, LoaderIcon, Clock as ClockIcon } from "lucide-react";
import type { DashboardSummaryDTO } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H1, Muted, Text } from "@/components/ui/typography";
import { Stack } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { HoursDisplay } from "@/components/ui/hours-display";
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
    <Stack className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Dashboard</H1>
          <Muted>Przegląd Twojej aktywności</Muted>
        </div>
        <div className="flex gap-3">
          <Button variant="filled" size="default" onClick={() => (window.location.href = "/time-entries")}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj wpis czasu
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clients Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klienci</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.clients_count}</div>
            <Muted className="text-xs">Aktywnych klientów</Muted>
          </CardContent>
        </Card>

        {/* Unbilled Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Niezafakturowane godziny</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <HoursDisplay hours={summary.unbilled_hours} />
            </div>
            <Muted className="text-xs">Do zafakturowania</Muted>
          </CardContent>
        </Card>

        {/* Current Month Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faktury - bieżący miesiąc</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.current_month_invoices.total_gross_amount_pln.toFixed(2)} PLN
            </div>
            <Muted className="text-xs">
              {summary.current_month_invoices.count} faktur ({summary.current_month_invoices.manual_count} ręcznych,{" "}
              {summary.current_month_invoices.time_entries_count} z godzin)
            </Muted>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ostatnie wpisy czasu</CardTitle>
              <CardDescription>5 najnowszych wpisów</CardDescription>
            </div>
            <Button variant="plain" size="sm" onClick={() => (window.location.href = "/time-entries")}>
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
            <div className="space-y-3">
              {summary.recent_time_entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium">{entry.client_name}</Text>
                      <Badge>
                        <HoursDisplay hours={entry.hours} />
                      </Badge>
                    </div>
                    {entry.public_description && <Muted className="text-sm truncate">{entry.public_description}</Muted>}
                  </div>
                  <Muted className="text-sm ml-4 whitespace-nowrap">
                    {new Date(entry.date).toLocaleDateString("pl-PL")}
                  </Muted>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ostatnie faktury</CardTitle>
              <CardDescription>5 najnowszych faktur</CardDescription>
            </div>
            <Button variant="plain" size="sm" onClick={() => (window.location.href = "/invoices")}>
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
            <div className="space-y-3">
              {summary.recent_invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/invoices`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      window.location.href = `/invoices`;
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium">{invoice.invoice_number}</Text>
                      {invoice.is_manual && <Badge>Ręczna</Badge>}
                    </div>
                    <Muted className="text-sm truncate">{invoice.client_name}</Muted>
                  </div>
                  <div className="text-right ml-4">
                    <Text className="font-medium">
                      {invoice.gross_amount.toFixed(2)} {invoice.currency}
                    </Text>
                    <Muted className="text-sm whitespace-nowrap">
                      {new Date(invoice.issue_date).toLocaleDateString("pl-PL")}
                    </Muted>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function DashboardView() {
  return (
    <QueryProvider>
      <DashboardViewContent />
    </QueryProvider>
  );
}
