export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_insights_data: {
        Row: {
          created_at: string | null
          date: string
          day_of_week: number
          hourly_rate: number
          hours: number
          id: string
          private_note: string | null
          time_entry_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          day_of_week: number
          hourly_rate: number
          hours: number
          id?: string
          private_note?: string | null
          time_entry_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          day_of_week?: number
          hourly_rate?: number
          hours?: number
          id?: string
          private_note?: string | null
          time_entry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_data_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: true
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          default_currency: Database["public"]["Enums"]["currency_enum"] | null
          default_hourly_rate: number | null
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          street: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: Database["public"]["Enums"]["currency_enum"] | null
          default_hourly_rate?: number | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          default_currency?: Database["public"]["Enums"]["currency_enum"] | null
          default_hourly_rate?: number | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rate_cache: {
        Row: {
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          id: string
          rate: number
          rate_date: string
        }
        Insert: {
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          id?: string
          rate: number
          rate_date: string
        }
        Update: {
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"]
          id?: string
          rate?: number
          rate_date?: string
        }
        Relationships: []
      }
      invoice_item_time_entries: {
        Row: {
          created_at: string | null
          invoice_item_id: string
          time_entry_id: string
        }
        Insert: {
          created_at?: string | null
          invoice_item_id: string
          time_entry_id: string
        }
        Update: {
          created_at?: string | null
          invoice_item_id?: string
          time_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_item_time_entries_invoice_item_id_fkey"
            columns: ["invoice_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_item_time_entries_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          net_amount: number
          position: number
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          net_amount: number
          position: number
          quantity: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          net_amount?: number
          position?: number
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at: string | null
          due_date: string | null
          edited_at: string | null
          exchange_rate: number | null
          exchange_rate_date: string | null
          gross_amount: number
          gross_amount_pln: number | null
          gross_amount_words: string | null
          id: string
          invoice_number: string
          is_custom_exchange_rate: boolean | null
          is_edited: boolean | null
          is_imported: boolean | null
          is_manual: boolean
          is_paid: boolean | null
          issue_date: string
          net_amount: number
          net_amount_pln: number | null
          notes: string | null
          payment_status: string | null
          pdf_url: string | null
          sale_date: string
          status: Database["public"]["Enums"]["invoice_status_enum"] | null
          updated_at: string | null
          user_id: string
          vat_amount: number
          vat_amount_pln: number | null
          vat_rate: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          due_date?: string | null
          edited_at?: string | null
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          gross_amount: number
          gross_amount_pln?: number | null
          gross_amount_words?: string | null
          id?: string
          invoice_number: string
          is_custom_exchange_rate?: boolean | null
          is_edited?: boolean | null
          is_imported?: boolean | null
          is_manual?: boolean
          is_paid?: boolean | null
          issue_date: string
          net_amount: number
          net_amount_pln?: number | null
          notes?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          sale_date: string
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          updated_at?: string | null
          user_id: string
          vat_amount: number
          vat_amount_pln?: number | null
          vat_rate: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"]
          deleted_at?: string | null
          due_date?: string | null
          edited_at?: string | null
          exchange_rate?: number | null
          exchange_rate_date?: string | null
          gross_amount?: number
          gross_amount_pln?: number | null
          gross_amount_words?: string | null
          id?: string
          invoice_number?: string
          is_custom_exchange_rate?: boolean | null
          is_edited?: boolean | null
          is_imported?: boolean | null
          is_manual?: boolean
          is_paid?: boolean | null
          issue_date?: string
          net_amount?: number
          net_amount_pln?: number | null
          notes?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          sale_date?: string
          status?: Database["public"]["Enums"]["invoice_status_enum"] | null
          updated_at?: string | null
          user_id?: string
          vat_amount?: number
          vat_amount_pln?: number | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_color: string | null
          bank_account: string | null
          bank_name: string | null
          bank_swift: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          street: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bank_swift?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          client_id: string
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          date: string
          deleted_at: string | null
          hourly_rate: number
          hours: number
          id: string
          invoice_id: string | null
          private_note: string | null
          public_description: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_enum"]
          date: string
          deleted_at?: string | null
          hourly_rate: number
          hours: number
          id?: string
          invoice_id?: string | null
          private_note?: string | null
          public_description?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_enum"]
          date?: string
          deleted_at?: string | null
          hourly_rate?: number
          hours?: number
          id?: string
          invoice_id?: string | null
          private_note?: string | null
          public_description?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_time_entries_invoice_id"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_time_entries_with_valid_notes: {
        Args: { p_user_id: string }
        Returns: number
      }
      soft_delete_client: { Args: { client_id: string }; Returns: undefined }
    }
    Enums: {
      currency_enum: "PLN" | "EUR" | "USD"
      invoice_status_enum: "unpaid" | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      currency_enum: ["PLN", "EUR", "USD"],
      invoice_status_enum: ["unpaid", "paid"],
    },
  },
} as const

