import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InvoiceSummaryPanelProps } from "./types";

function formatCurrency(amount: number, _currency: string): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const InvoiceSummaryPanel = memo(function InvoiceSummaryPanel({
  summary,
  onAction,
  actionLabel,
  actionDisabled,
  isLoading = false,
}: InvoiceSummaryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Podsumowanie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Suma netto:</span>
            <span>
              {formatCurrency(summary.netAmount, summary.currency)} {summary.currency}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({summary.vatRate}%):</span>
            <span>
              {formatCurrency(summary.vatAmount, summary.currency)} {summary.currency}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Suma brutto:</span>
            <span>
              {formatCurrency(summary.grossAmount, summary.currency)} {summary.currency}
            </span>
          </div>

          {summary.exchangeRate && summary.grossAmountPLN && (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Kurs waluty:</span>
                <span>{formatCurrency(summary.exchangeRate, "PLN")}</span>
              </div>

              <div className="flex justify-between border-t pt-2 text-sm font-medium">
                <span>Suma brutto w PLN:</span>
                <span>{formatCurrency(summary.grossAmountPLN, "PLN")} PLN</span>
              </div>
            </>
          )}
        </div>

        <Button onClick={onAction} disabled={actionDisabled || isLoading} className="w-full">
          {isLoading ? "Proszę czekać..." : actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
});
