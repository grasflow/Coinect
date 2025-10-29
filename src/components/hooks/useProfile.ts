import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfileDTO, UpdateProfileCommand } from "@/types";

// Fetch profile
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileDTO> => {
      const response = await fetch("/api/profile");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch profile");
      }

      return response.json();
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: UpdateProfileCommand) => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const error = await response.json();
        // Obsługa błędów walidacji - wyświetl pierwszy błąd lub ogólny komunikat
        if (error.error?.code === "VALIDATION_ERROR" && error.error?.details?.length > 0) {
          const firstError = error.error.details[0];
          throw new Error(firstError.message || "Błąd walidacji danych");
        }
        throw new Error(error.error?.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// Upload logo mutation
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/profile/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to upload logo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
