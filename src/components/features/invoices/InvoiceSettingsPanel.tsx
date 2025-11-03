import { useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import type { InvoiceSettingsPanelProps } from "./types";
import { useExchangeRate } from "@/components/hooks/useExchangeRate";
import { PaymentTermSelector } from "./PaymentTermSelector";
import { safeFormatDateToISO } from "@/lib/helpers/invoice.helpers";

const VAT_RATES = [
  { value: 23, label: "23%" },
  { value: 8, label: "8%" },
  { value: 5, label: "5%" },
  { value: 0, label: "0% (zwolniony)" },
];

function formatDate(date: Date): string {
  return safeFormatDateToISO(date) || new Date().toISOString().split("T")[0];
}

export const InvoiceSettingsPanel = memo(
  function InvoiceSettingsPanel({ settings, onChange, currency }: InvoiceSettingsPanelProps) {
    const shouldFetchExchangeRate = currency === "EUR" || currency === "USD";

    const { data: exchangeRateData, isLoading: isLoadingRate } = useExchangeRate(
      currency,
      settings.issueDate,
      shouldFetchExchangeRate && !settings.isCustomExchangeRate
    );

    // Automatyczne ustawienie kursu z API
    useEffect(() => {
      if (exchangeRateData && !settings.isCustomExchangeRate && shouldFetchExchangeRate) {
        const newRate = parseFloat(exchangeRateData.rate);
        if (settings.exchangeRate !== newRate) {
          onChange({
            exchangeRate: newRate,
          });
        }
      }
    }, [exchangeRateData, settings.isCustomExchangeRate, settings.exchangeRate, shouldFetchExchangeRate, onChange]);

    const handleIssueDateChange = (dateStr: string) => {
      onChange({ issueDate: new Date(dateStr) });
    };

    const handleSaleDateChange = (dateStr: string) => {
      onChange({ saleDate: new Date(dateStr) });
    };

    const handleVatRateChange = (value: string) => {
      onChange({ vatRate: parseInt(value, 10) });
    };

    const handleCustomExchangeRateChange = (value: string) => {
      const rate = parseFloat(value) || null;
      onChange({
        exchangeRate: rate,
        isCustomExchangeRate: true,
      });
    };

    const handleNotesChange = (value: string) => {
      onChange({ notes: value || undefined });
    };

    const handlePaymentTermChange = (dueDate: Date, paymentTermDays: number | "immediate" | "custom" | "month") => {
      onChange({ dueDate, paymentTermDays });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Ustawienia faktury</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data wystawienia */}
          <div className="space-y-2">
            <Label htmlFor="issue-date">Data wystawienia</Label>
            <Input
              id="issue-date"
              type="date"
              value={formatDate(settings.issueDate)}
              onChange={(e) => handleIssueDateChange(e.target.value)}
            />
          </div>

          {/* Data sprzedaży */}
          <div className="space-y-2">
            <Label htmlFor="sale-date">Data sprzedaży</Label>
            <Input
              id="sale-date"
              type="date"
              value={formatDate(settings.saleDate)}
              onChange={(e) => handleSaleDateChange(e.target.value)}
            />
          </div>

          {/* Termin płatności */}
          <PaymentTermSelector
            issueDate={settings.issueDate}
            dueDate={settings.dueDate}
            paymentTermDays={settings.paymentTermDays}
            onChange={handlePaymentTermChange}
          />

          {/* Stawka VAT */}
          <div className="space-y-2">
            <Label htmlFor="vat-rate">Stawka VAT</Label>
            <Select value={String(settings.vatRate)} onValueChange={handleVatRateChange}>
              <SelectTrigger id="vat-rate">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAT_RATES.map((rate) => (
                  <SelectItem key={rate.value} value={String(rate.value)}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kurs waluty (tylko dla EUR/USD) */}
          {shouldFetchExchangeRate && (
            <div className="space-y-2">
              <Label htmlFor="exchange-rate">
                Kurs {currency}/PLN{" "}
                {isLoadingRate && <span className="text-xs text-muted-foreground">(pobieranie...)</span>}
              </Label>
              <Input
                id="exchange-rate"
                type="number"
                step="0.0001"
                min="0"
                value={settings.exchangeRate || ""}
                onChange={(e) => handleCustomExchangeRateChange(e.target.value)}
                placeholder="Np. 4.2500"
              />
              {exchangeRateData && !settings.isCustomExchangeRate && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Kurs z tabeli NBP z dnia{" "}
                    {new Date(exchangeRateData.date || settings.issueDate).toLocaleDateString("pl-PL")}:{" "}
                    {exchangeRateData.rate} PLN
                  </AlertDescription>
                </Alert>
              )}
              {settings.isCustomExchangeRate && (
                <p className="text-xs text-muted-foreground">Kurs został wprowadzony ręcznie</p>
              )}
            </div>
          )}

          {/* Uwagi na fakturze */}
          <div className="space-y-2">
            <Label htmlFor="notes">Uwagi (opcjonalnie)</Label>
            <Textarea
              id="notes"
              value={settings.notes || ""}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Dodatkowe informacje wyświetlane na dole faktury..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Uwagi będą wyświetlane na dole faktury, pod informacjami o płatności
            </p>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - re-render tylko gdy settings lub currency się zmieni
    return (
      prevProps.currency === nextProps.currency &&
      JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings)
    );
  }
);
