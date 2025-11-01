import { Text, Muted } from "@/components/ui/typography";

interface InvoiceSummaryProps {
  netAmount: number;
  grossAmount: number;
  count: number;
  currency?: string;
}

export function InvoiceSummary({ netAmount, grossAmount, count, currency = "PLN" }: InvoiceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
      <div className="text-center">
        <Muted className="text-xs">Razem faktur</Muted>
        <Text className="text-base md:text-lg font-semibold">{count}</Text>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <Muted className="text-xs">Kwota netto</Muted>
          <Text className="text-base md:text-lg font-semibold">{formatCurrency(netAmount)}</Text>
        </div>

        <div className="text-center">
          <Muted className="text-xs">Kwota brutto</Muted>
          <Text className="text-base md:text-lg font-semibold">{formatCurrency(grossAmount)}</Text>
        </div>
      </div>
    </div>
  );
}
