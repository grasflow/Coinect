import * as React from "react";
import { PlusIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import type { TimeEntryWithRelationsDTO } from "@/types";
import type { TimeEntriesFilterState, TimeEntryFormViewModel } from "./types";
import {
  useTimeEntries,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
} from "@/components/hooks/useTimeEntries";
import { useClients } from "@/components/hooks/useClients";
import { TimeEntryFilters } from "./TimeEntryFilters";
import { TimeEntriesList } from "./TimeEntriesList";
import { TimeEntryForm } from "./TimeEntryForm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import QueryProvider from "@/components/QueryProvider";

function TimeEntriesViewContent() {
  const [filters, setFilters] = React.useState<TimeEntriesFilterState>({
    clientId: "all",
    status: "all",
    page: 1,
    pageSize: 20,
  });

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<TimeEntryWithRelationsDTO | undefined>();
  const [deletingEntryId, setDeletingEntryId] = React.useState<string | undefined>();

  const { data: timeEntriesData, isLoading: isLoadingTimeEntries } = useTimeEntries(filters);
  const { data: clients = [], isLoading: isLoadingClients } = useClients();

  const createMutation = useCreateTimeEntry();
  const updateMutation = useUpdateTimeEntry();
  const deleteMutation = useDeleteTimeEntry();

  const handleFilterChange = (newFilters: Partial<TimeEntriesFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleAddNew = () => {
    setEditingEntry(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (entry: TimeEntryWithRelationsDTO) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (entryId: string) => {
    setDeletingEntryId(entryId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntryId) return;

    try {
      await deleteMutation.mutateAsync(deletingEntryId);
      toast.success("Wpis czasu został usunięty");
      setIsDeleteDialogOpen(false);
      setDeletingEntryId(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się usunąć wpisu");
    }
  };

  const handleFormSubmit = async (data: TimeEntryFormViewModel) => {
    try {
      if (data.id || editingEntry?.id) {
        const entryId = (data.id || editingEntry?.id) as string;
        const command = {
          date: data.date.toISOString().split("T")[0],
          hours: Number(data.hours),
          hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
          currency: data.currency as "PLN" | "EUR" | "USD" | undefined,
          public_description: data.public_description || undefined,
          private_note: data.private_note?.trim() || undefined,
        };
        await updateMutation.mutateAsync({
          entryId,
          command,
        });
        toast.success("Wpis czasu został zaktualizowany");
      } else {
        const command = {
          client_id: data.client_id,
          date: data.date.toISOString().split("T")[0],
          hours: Number(data.hours),
          hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
          currency: data.currency as "PLN" | "EUR" | "USD" | undefined,
          public_description: data.public_description || undefined,
          private_note: data.private_note?.trim() || undefined,
        };
        await createMutation.mutateAsync(command);
        toast.success("Wpis czasu został dodany");
      }
      setIsFormOpen(false);
      setEditingEntry(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać wpisu");
    }
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();

      if (filters.clientId && filters.clientId !== "all") {
        queryParams.append("client_id", filters.clientId);
      }

      if (filters.dateRange) {
        queryParams.append("date_from", filters.dateRange.from.toISOString().split("T")[0]);
        queryParams.append("date_to", filters.dateRange.to.toISOString().split("T")[0]);
      }

      if (filters.status && filters.status !== "all") {
        queryParams.append("is_invoiced", filters.status === "billed" ? "true" : "false");
      }

      const response = await fetch(`/api/time-entries/export?${queryParams.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Nie udało się wyeksportować wpisów");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wpisy-czasu_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Wpisy czasu zostały wyeksportowane");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się wyeksportować wpisów");
    }
  };

  const paginatedData = timeEntriesData || {
    data: [],
    total: 0,
    limit: filters.pageSize,
    offset: 0,
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <H1>Wpisy Czasu</H1>
          <Muted>Zarządzaj swoimi wpisami czasu pracy</Muted>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button variant="outline" size="sm" className="md:h-10 md:px-4" onClick={handleExport}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Eksportuj CSV
          </Button>
          <Button size="sm" className="md:h-10 md:px-4" onClick={handleAddNew}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Dodaj wpis
          </Button>
        </div>
      </div>

      <TimeEntryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        clients={clients}
        isLoadingClients={isLoadingClients}
      />

      <TimeEntriesList
        data={paginatedData}
        isLoading={isLoadingTimeEntries}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onPageChange={handlePageChange}
      />

      <TimeEntryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEntry(undefined);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEntry}
        clients={clients}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingEntryId(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

export default function TimeEntriesView() {
  return (
    <QueryProvider>
      <TimeEntriesViewContent />
    </QueryProvider>
  );
}
