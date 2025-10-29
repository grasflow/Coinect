import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HoursDisplay } from "@/components/ui/hours-display";
import { InfoIcon } from "lucide-react";
import type { UnbilledTimeEntriesSelectorProps } from "./types";
import { useTimeEntries } from "@/components/hooks/useTimeEntries";
import type { Currency } from "@/types";

function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function UnbilledTimeEntriesSelector({
  clientId,
  selectedIds,
  onSelectionChange,
}: UnbilledTimeEntriesSelectorProps) {
  const { data, isLoading } = useTimeEntries({
    clientId,
    status: "unbilled",
    page: 1,
    pageSize: 1000,
  });

  const entries = data?.data || [];

  // Sprawdzenie czy wszystkie wpisy mają tę samą walutę
  const currencies = useMemo(() => {
    const uniqueCurrencies = new Set(entries.map((entry) => entry.client?.currency));
    return Array.from(uniqueCurrencies);
  }, [entries]);

  const hasMixedCurrencies = currencies.length > 1;

  // Obliczenie podsumowania zaznaczonych wpisów
  const summary = useMemo(() => {
    const selectedEntries = entries.filter((entry) => selectedIds.includes(entry.id));

    const totalHours = selectedEntries.reduce((sum, entry) => sum + parseFloat(entry.hours), 0);
    const totalAmount = selectedEntries.reduce(
      (sum, entry) => sum + parseFloat(entry.hours) * parseFloat(entry.hourly_rate),
      0
    );

    const currency = selectedEntries.length > 0 ? selectedEntries[0].client?.currency || "PLN" : "PLN";

    return {
      count: selectedEntries.length,
      totalHours,
      totalAmount,
      currency,
    };
  }, [entries, selectedIds]);

  const handleToggleAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      onSelectionChange(entries.map((entry) => entry.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleToggleEntry = (entryId: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      onSelectionChange([...selectedIds, entryId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== entryId));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wpisy czasu do zafakturowania</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wpisy czasu do zafakturowania</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>Brak niezafakturowanych wpisów czasu dla wybranego klienta.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const allSelected = selectedIds.length === entries.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wpisy czasu do zafakturowania</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasMixedCurrencies && (
          <Alert variant="destructive">
            <AlertDescription>
              Uwaga! Znaleziono wpisy w różnych walutach ({currencies.join(", ")}
              ). Faktura może zawierać tylko jedną walutę. Upewnij się, że klient ma przypisaną poprawną walutę.
            </AlertDescription>
          </Alert>
        )}

        {/* Checkbox "Zaznacz wszystkie" */}
        <div className="flex items-center space-x-2 border-b pb-3">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleToggleAll}
            className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <Label htmlFor="select-all" className="font-semibold">
            Zaznacz wszystkie ({entries.length})
          </Label>
        </div>

        {/* Lista wpisów */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {entries.map((entry) => {
            const isSelected = selectedIds.includes(entry.id);
            const amount = parseFloat(entry.hours) * parseFloat(entry.hourly_rate);

            return (
              <div
                key={entry.id}
                className={`flex items-start space-x-3 rounded-md border p-3 transition-colors ${
                  isSelected ? "bg-muted/50" : "hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  id={`entry-${entry.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleToggleEntry(entry.id, checked === true)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={`entry-${entry.id}`} className="cursor-pointer font-normal">
                    <div className="font-medium">{entry.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("pl-PL")} •{" "}
                      <HoursDisplay hours={parseFloat(entry.hours)} /> × {entry.hourly_rate}{" "}
                      {entry.client?.currency || "PLN"}/godz.
                    </div>
                  </Label>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(amount, entry.client?.currency || "PLN")} {entry.client?.currency || "PLN"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Podsumowanie zaznaczonych */}
        {summary.count > 0 && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Zaznaczone wpisy:</span>
              <span>{summary.count}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Suma godzin:</span>
              <span>
                <HoursDisplay hours={summary.totalHours} />
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Suma do zafakturowania:</span>
              <span>
                {formatCurrency(summary.totalAmount, summary.currency)} {summary.currency}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
