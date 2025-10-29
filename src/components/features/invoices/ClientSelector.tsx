import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ClientSelectorProps } from "./types";
import { useClients } from "@/components/hooks/useClients";
import { useClientsWithUnbilledTimeEntries } from "@/components/hooks/useClientsWithUnbilledTimeEntries";

export function ClientSelector({
  value,
  onChange,
  disabled: externalDisabled = false,
  mode = "all",
}: ClientSelectorProps) {
  const { data: allClients, isLoading: isLoadingAll } = useClients();
  const { data: clientsWithUnbilled, isLoading: isLoadingUnbilled } = useClientsWithUnbilledTimeEntries();

  const clients = mode === "with_unbilled_time_entries" ? clientsWithUnbilled : allClients;
  const isLoading = mode === "with_unbilled_time_entries" ? isLoadingUnbilled : isLoadingAll;

  // W trybie time_entries select jest disabled jeśli nie ma klientów z niewyfakturowanymi wpisami
  const isDisabledByMode = mode === "with_unbilled_time_entries" && clients?.length === 0;
  const disabled = externalDisabled || isDisabledByMode;

  const placeholder = (() => {
    if (mode === "with_unbilled_time_entries" && clients?.length === 0) {
      return "Brak klientów z niewyfakturowanymi wpisami czasu";
    }
    return "Wybierz klienta";
  })();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Klient</Label>
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="client-select">Klient</Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="client-select">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clients?.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              {client.name}
              {client.tax_id && <span className="ml-2 text-xs text-muted-foreground">(NIP: {client.tax_id})</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
