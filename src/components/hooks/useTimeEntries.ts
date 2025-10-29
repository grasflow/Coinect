import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TimeEntryWithRelationsDTO,
  CreateTimeEntryCommand,
  CreateTimeEntryResponse,
  UpdateTimeEntryCommand,
  UpdateTimeEntryResponse,
  PaginatedResponse,
} from "@/types";
import type { TimeEntriesFilterState } from "../features/time-entries/types";

const API_BASE = "/api/time-entries";

async function fetchTimeEntries(
  filters: TimeEntriesFilterState
): Promise<PaginatedResponse<TimeEntryWithRelationsDTO>> {
  const params = new URLSearchParams();

  if (filters.clientId && filters.clientId !== "all") {
    params.append("client_id", filters.clientId);
  }

  if (filters.dateRange) {
    params.append("date_from", filters.dateRange.from.toISOString().split("T")[0]);
    params.append("date_to", filters.dateRange.to.toISOString().split("T")[0]);
  }

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
  }

  params.append("page", String(filters.page));
  params.append("page_size", String(filters.pageSize));

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać wpisów czasu");
  }

  return response.json();
}

async function createTimeEntry(command: CreateTimeEntryCommand): Promise<CreateTimeEntryResponse> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Nie udało się utworzyć wpisu");
  }

  return response.json();
}

async function updateTimeEntry(entryId: string, command: UpdateTimeEntryCommand): Promise<UpdateTimeEntryResponse> {
  const response = await fetch(`${API_BASE}/${entryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Nie udało się zaktualizować wpisu");
  }

  return response.json();
}

async function deleteTimeEntry(entryId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${entryId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć wpisu");
  }
}

export function useTimeEntries(filters: TimeEntriesFilterState) {
  return useQuery({
    queryKey: ["time-entries", filters],
    queryFn: () => fetchTimeEntries(filters),
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, command }: { entryId: string; command: UpdateTimeEntryCommand }) =>
      updateTimeEntry(entryId, command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights"] });
    },
  });
}
