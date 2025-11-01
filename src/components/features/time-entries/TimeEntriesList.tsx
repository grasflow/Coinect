import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Edit2Icon, Trash2Icon, LoaderIcon, FileTextIcon } from "lucide-react";
import type { TimeEntryWithRelationsDTO, PaginatedResponse, Currency } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HoursDisplay } from "@/components/ui/hours-display";
import { Text, Muted } from "@/components/ui/typography";

interface TimeEntriesListProps {
  data: PaginatedResponse<TimeEntryWithRelationsDTO>;
  isLoading: boolean;
  onEdit: (entry: TimeEntryWithRelationsDTO) => void;
  onDelete: (entryId: string) => void;
  onPageChange: (page: number) => void;
}

export function TimeEntriesList({ data, isLoading, onEdit, onDelete, onPageChange }: TimeEntriesListProps) {
  const totalPages = Math.ceil(data.total / data.limit);
  const currentPage = Math.floor(data.offset / data.limit) + 1;

  // Calculate totals by currency
  const totals = React.useMemo(() => {
    const hoursByEntry = data.data.reduce((sum, entry) => sum + parseFloat(entry.hours?.toString() || "0"), 0);
    
    const amountsByCurrency: Record<Currency, number> = {
      PLN: 0,
      EUR: 0,
      USD: 0,
    };

    data.data.forEach((entry) => {
      const hours = parseFloat(entry.hours?.toString() || "0");
      const hourlyRate = parseFloat(entry.hourly_rate?.toString() || "0");
      const amount = hours * hourlyRate;

      if (hourlyRate > 0 && entry.currency) {
        amountsByCurrency[entry.currency] = (amountsByCurrency[entry.currency] || 0) + amount;
      }
    });

    return {
      hours: hoursByEntry,
      amounts: amountsByCurrency,
    };
  }, [data.data]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Text className="text-center">Nie znaleziono wpisów czasu.</Text>
          <Muted className="text-center mt-2">Zmień filtry lub dodaj nowy wpis.</Muted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="leading-none font-semibold">Wpisy czasu ({data.total})</h2>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Klient</TableHead>
              <TableHead className="text-right">Godziny</TableHead>
              <TableHead className="text-right">Stawka</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead className="text-center">Notatka</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((entry) => {
              const isInvoiced = !!entry.invoice_id && entry.invoice && entry.invoice.deleted_at === null;
              const amount = entry.hours * (entry.hourly_rate || 0);
              const hasPrivateNote = entry.private_note && entry.private_note.trim() !== "";

              return (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), "dd MMM yyyy", { locale: pl })}</TableCell>
                  <TableCell>{entry.client?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <HoursDisplay hours={entry.hours} />
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.hourly_rate ? `${entry.hourly_rate.toFixed(2)} ${entry.currency || "PLN"}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.hourly_rate ? `${amount.toFixed(2)} ${entry.currency || "PLN"}` : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.public_description || "-"}</TableCell>
                  <TableCell className="text-center">
                    {hasPrivateNote ? (
                      <span title="Ma notatkę prywatną dla AI">
                        <FileTextIcon className="h-4 w-4 text-blue-600 inline-block" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isInvoiced ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Zafakturowane
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Niezafakturowane
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="plain"
                        size="icon"
                        onClick={() => onEdit(entry)}
                        disabled={!!isInvoiced}
                        title={isInvoiced ? "Nie można edytować zafakturowanego wpisu" : "Edytuj"}
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="plain"
                        size="icon"
                        onClick={() => onDelete(entry.id)}
                        disabled={!!isInvoiced}
                        title={isInvoiced ? "Nie można usunąć zafakturowanego wpisu" : "Usuń"}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Podsumowanie
              </TableCell>
              <TableCell className="text-right font-semibold">
                <HoursDisplay hours={totals.hours.toFixed(2)} />
              </TableCell>
              <TableCell colSpan={2} className="text-right font-semibold">
                {Object.entries(totals.amounts)
                  .filter(([_, amount]) => amount > 0)
                  .map(([currency, amount]) => (
                    <div key={currency}>
                      {amount.toFixed(2)} {currency}
                    </div>
                  ))}
                {Object.values(totals.amounts).every((amount) => amount === 0) && (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell colSpan={4}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Strona {currentPage} z {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Następna
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
