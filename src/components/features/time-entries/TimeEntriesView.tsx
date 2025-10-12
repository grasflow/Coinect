"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
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
import { useTags } from "@/components/hooks/useTags";
import { TimeEntryFilters } from "./TimeEntryFilters";
import { TimeEntriesList } from "./TimeEntriesList";
import { TimeEntryForm } from "./TimeEntryForm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

function TimeEntriesViewContent() {
  const [filters, setFilters] = React.useState<TimeEntriesFilterState>({
    page: 1,
    pageSize: 20,
    status: "all",
  });

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<TimeEntryWithRelationsDTO | undefined>();
  const [deletingEntryId, setDeletingEntryId] = React.useState<string | undefined>();

  const { data: timeEntriesData, isLoading: isLoadingTimeEntries } = useTimeEntries(filters);
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: tags = [] } = useTags();

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
      if (data.id) {
        await updateMutation.mutateAsync({
          entryId: data.id,
          command: {
            date: data.date.toISOString().split("T")[0],
            hours: Number(data.hours),
            hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
            currency: data.currency,
            public_description: data.public_description || undefined,
            private_note: data.private_note || undefined,
            tag_ids: data.tag_ids,
          },
        });
        toast.success("Wpis czasu został zaktualizowany");
      } else {
        await createMutation.mutateAsync({
          client_id: data.client_id,
          date: data.date.toISOString().split("T")[0],
          hours: Number(data.hours),
          hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : undefined,
          currency: data.currency,
          public_description: data.public_description || undefined,
          private_note: data.private_note || undefined,
          tag_ids: data.tag_ids,
        });
        toast.success("Wpis czasu został dodany");
      }
      setIsFormOpen(false);
      setEditingEntry(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać wpisu");
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wpisy Czasu</h1>
          <p className="text-muted-foreground mt-2">Zarządzaj swoimi wpisami czasu pracy</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Dodaj wpis
        </Button>
      </header>

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
        tags={tags}
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

      <Toaster position="bottom-right" />
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
