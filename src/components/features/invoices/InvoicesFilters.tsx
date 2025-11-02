import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DateRangePicker } from "@/components/features/time-entries/DateRangePicker";
import type { InvoicesFiltersProps } from "./types";
import type { Currency } from "@/types";

const CURRENCIES: { value: Currency | "all"; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "PLN", label: "PLN" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
];

export function InvoicesFilters({ filters, onChange, clients }: InvoicesFiltersProps) {
  const hasActiveFilters =
    filters.clientId !== "all" || filters.dateRange || filters.status !== "all" || filters.currency !== "all";

  const handleClearFilters = () => {
    onChange({
      clientId: "all",
      status: "all",
      currency: "all",
      dateRange: undefined,
      page: 1,
      pageSize: filters.pageSize,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Filtr klienta */}
        <div className="space-y-2">
          <Label htmlFor="filter-client">Klient</Label>
          <Select
            value={filters.clientId || "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                clientId: value === "all" ? undefined : value,
                page: 1,
              })
            }
          >
            <SelectTrigger id="filter-client">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtr statusu */}
        <div className="space-y-2">
          <Label htmlFor="filter-status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value: "all" | "paid" | "unpaid") => onChange({ ...filters, status: value, page: 1 })}
          >
            <SelectTrigger id="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="unpaid">Niezapłacone</SelectItem>
              <SelectItem value="paid">Zapłacone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtr waluty */}
        <div className="space-y-2">
          <Label htmlFor="filter-currency">Waluta</Label>
          <Select
            value={filters.currency || "all"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                currency: value === "all" ? undefined : (value as Currency),
                page: 1,
              })
            }
          >
            <SelectTrigger id="filter-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zakres dat */}
        <div className="space-y-2">
          <Label>Zakres dat</Label>
          <DateRangePicker
            value={filters.dateRange}
            onChange={(range) => onChange({ ...filters, dateRange: range, page: 1 })}
          />
        </div>
      </div>

      {/* Przycisk czyszczenia filtrów */}
      {hasActiveFilters && (
        <div className="flex justify-start md:justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Wyczyść filtry
          </Button>
        </div>
      )}
    </div>
  );
}
