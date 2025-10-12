"use client"

import * as React from "react"
import { FilterIcon, XIcon } from "lucide-react"
import type { ClientDTO } from "@/types"
import type { TimeEntriesFilterState } from "./types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "./DateRangePicker"
import { Card, CardContent } from "@/components/ui/card"

type TimeEntryFiltersProps = {
  filters: TimeEntriesFilterState;
  onFilterChange: (filters: Partial<TimeEntriesFilterState>) => void;
  clients: ClientDTO[];
  isLoadingClients: boolean;
};

export function TimeEntryFilters({
  filters,
  onFilterChange,
  clients,
  isLoadingClients,
}: TimeEntryFiltersProps) {
  const hasActiveFilters = filters.clientId || filters.dateRange || filters.status !== "all";

  const handleClearFilters = () => {
    onFilterChange({
      clientId: undefined,
      dateRange: undefined,
      status: "all",
      page: 1,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-medium">Filtry</h2>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2 lg:px-3"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Wyczyść
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Klient</label>
              <Select
                value={filters.clientId || "all"}
                onValueChange={(value) =>
                  onFilterChange({
                    clientId: value === "all" ? undefined : value,
                    page: 1,
                  })
                }
                disabled={isLoadingClients}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wszyscy klienci" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy klienci</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Zakres dat</label>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) =>
                  onFilterChange({
                    dateRange: range,
                    page: 1,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  onFilterChange({
                    status: value as "all" | "billed" | "unbilled",
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="unbilled">Niezafakturowane</SelectItem>
                  <SelectItem value="billed">Zafakturowane</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

