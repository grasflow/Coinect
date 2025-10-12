import { useQuery } from "@tanstack/react-query";
import type { TagDTO } from "@/types";

async function fetchTags(): Promise<TagDTO[]> {
  const response = await fetch("/rest/v1/tags?select=*&order=name.asc", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać tagów");
  }

  return response.json();
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: fetchTags,
  });
}
