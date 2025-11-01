import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateTimeEntryCommand,
  CreateTimeEntryResponse,
  UpdateTimeEntryCommand,
  UpdateTimeEntryResponse,
  PaginatedResponse,
  TimeEntryWithRelationsDTO,
} from "@/types";
import { NotFoundError, ForbiddenError } from "@/lib/errors";

export class TimeEntryService {
  constructor(private supabase: SupabaseClient) {}

  async createTimeEntry(userId: string, command: CreateTimeEntryCommand): Promise<CreateTimeEntryResponse> {
    const client = await this.getAndValidateClient(command.client_id, userId);

    const entryData = {
      user_id: userId,
      client_id: command.client_id,
      date: command.date,
      hours: command.hours,
      hourly_rate: command.hourly_rate ?? client.default_hourly_rate ?? 0,
      currency: command.currency ?? client.default_currency ?? "PLN",
      public_description: command.public_description ?? null,
      private_note: command.private_note?.trim() || null,
    } as const;

    const { data: timeEntry, error: insertError } = await this.supabase
      .from("time_entries")
      .insert(entryData)
      .select()
      .single();

    if (insertError) throw insertError;

    return timeEntry;
  }

  private async getAndValidateClient(clientId: string, userId: string) {
    const { data: client, error } = await this.supabase
      .from("clients")
      .select("id, default_hourly_rate, default_currency")
      .eq("id", clientId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error || !client) {
      throw new NotFoundError("Client not found");
    }

    return client;
  }

  async getTimeEntries(
    userId: string,
    options: {
      clientId?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: "billed" | "unbilled" | "all";
      page: number;
      pageSize: number;
    }
  ): Promise<PaginatedResponse<TimeEntryWithRelationsDTO>> {
    let query = this.supabase
      .from("time_entries")
      .select(
        `
        *,
        client:clients(name),
        invoice:invoices(id, deleted_at)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.dateFrom) {
      query = query.gte("date", options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte("date", options.dateTo);
    }

    if (options.status === "billed") {
      query = query.not("invoice_id", "is", null);
    } else if (options.status === "unbilled") {
      query = query.is("invoice_id", null);
    }

    const offset = (options.page - 1) * options.pageSize;
    query = query.order("date", { ascending: false }).range(offset, offset + options.pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      limit: options.pageSize,
      offset,
    };
  }

  async updateTimeEntry(
    userId: string,
    entryId: string,
    command: UpdateTimeEntryCommand
  ): Promise<UpdateTimeEntryResponse> {
    const { data: existingEntry, error: fetchError } = await this.supabase
      .from("time_entries")
      .select("id, user_id, invoice_id")
      .eq("id", entryId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingEntry) {
      throw new NotFoundError("Time entry not found");
    }

    if (existingEntry.user_id !== userId) {
      throw new ForbiddenError("Not authorized to update this time entry");
    }

    // Sprawdź czy faktura nadal istnieje (nie została usunięta)
    if (existingEntry.invoice_id) {
      const { data: invoice, error: invoiceError } = await this.supabase
        .from("invoices")
        .select("id")
        .eq("id", existingEntry.invoice_id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      // Jeśli faktura nadal istnieje, zabroń edycji wpisu
      if (!invoiceError && invoice) {
        throw new ForbiddenError("Cannot update invoiced time entry");
      }
      // Jeśli faktura została usunięta lub nie istnieje, pozwól na edycję wpisu
    }

    const updateData: Record<string, unknown> = {};
    if (command.date !== undefined) updateData.date = command.date;
    if (command.hours !== undefined) updateData.hours = command.hours;
    if (command.hourly_rate !== undefined) updateData.hourly_rate = command.hourly_rate;
    if (command.currency !== undefined) updateData.currency = command.currency;
    if (command.public_description !== undefined) updateData.public_description = command.public_description;
    if (command.private_note !== undefined) updateData.private_note = command.private_note?.trim() || null;

    const { data: updatedEntry, error: updateError } = await this.supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", entryId)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedEntry;
  }

  async deleteTimeEntry(userId: string, entryId: string): Promise<void> {
    const { data: existingEntry, error: fetchError } = await this.supabase
      .from("time_entries")
      .select("id, user_id, invoice_id")
      .eq("id", entryId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !existingEntry) {
      throw new NotFoundError("Time entry not found");
    }

    if (existingEntry.user_id !== userId) {
      throw new ForbiddenError("Not authorized to delete this time entry");
    }

    // Sprawdź czy faktura nadal istnieje (nie została usunięta)
    if (existingEntry.invoice_id) {
      const { data: invoice, error: invoiceError } = await this.supabase
        .from("invoices")
        .select("id")
        .eq("id", existingEntry.invoice_id)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      // Jeśli faktura nadal istnieje, zabroń usunięcia wpisu
      if (!invoiceError && invoice) {
        throw new ForbiddenError("Cannot delete invoiced time entry");
      }
      // Jeśli faktura została usunięta lub nie istnieje, pozwól na usunięcie wpisu
    }

    const { error } = await this.supabase
      .from("time_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", entryId);

    if (error) throw error;
  }
}
