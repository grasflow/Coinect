"use client"

import * as React from "react"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Edit2Icon, Trash2Icon, LoaderIcon } from "lucide-react"
import type { TimeEntryWithRelationsDTO, PaginatedResponse } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TimeEntriesListProps = {
  data: PaginatedResponse<TimeEntryWithRelationsDTO>;
  isLoading: boolean;
  onEdit: (entry: TimeEntryWithRelationsDTO) => void;
  onDelete: (entryId: string) => void;
  onPageChange: (page: number) => void;
};

export function TimeEntriesList({
  data,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
}: TimeEntriesListProps) {
  const totalPages = Math.ceil(data.total / data.limit);
  const currentPage = Math.floor(data.offset / data.limit) + 1;

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
          <p className="text-muted-foreground text-center">
            Nie znaleziono wpisów czasu.
          </p>
          <p className="text-muted-foreground text-sm text-center mt-2">
            Zmień filtry lub dodaj nowy wpis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="leading-none font-semibold">
          Wpisy czasu ({data.total})
        </h2>
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((entry) => {
              const isInvoiced = !!entry.invoice_id;
              const amount = entry.hours * (entry.hourly_rate || 0);

              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    {format(new Date(entry.date), "dd MMM yyyy", { locale: pl })}
                  </TableCell>
                  <TableCell>
                    {entry.client?.name || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.hours.toFixed(2)}h
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.hourly_rate
                      ? `${entry.hourly_rate.toFixed(2)} ${entry.currency || "PLN"}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.hourly_rate
                      ? `${amount.toFixed(2)} ${entry.currency || "PLN"}`
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {entry.public_description || "-"}
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
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(entry)}
                        disabled={isInvoiced}
                        title={isInvoiced ? "Nie można edytować zafakturowanego wpisu" : "Edytuj"}
                      >
                        <Edit2Icon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(entry.id)}
                        disabled={isInvoiced}
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

