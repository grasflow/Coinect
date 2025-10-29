export interface TimeEntriesFilterState {
  clientId: string;
  dateRange?: { from: Date; to: Date };
  status: "billed" | "unbilled" | "all";
  page: number;
  pageSize: number;
}

export interface TimeEntryFormViewModel {
  id?: string;
  client_id: string;
  date: Date;
  hours: string;
  minutes?: string;
  hourly_rate?: string;
  currency?: string;
  public_description?: string;
  private_note?: string;
  tag_ids?: string[];
}
