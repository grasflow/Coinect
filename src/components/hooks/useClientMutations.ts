import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateClientCommand, UpdateClientCommand } from "@/types";
import { ClientClientService } from "@/lib/services/client.client.service";

/**
 * Custom hook dla mutacji klientów (create, update, delete)
 * Automatycznie zarządza cache invalidation i wyświetla komunikaty toast
 */
export function useClientMutations(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateClientCommand) => ClientClientService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klient został dodany pomyślnie");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientCommand }) =>
      ClientClientService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klient został zaktualizowany pomyślnie");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ClientClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Klient został usunięty pomyślnie");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
