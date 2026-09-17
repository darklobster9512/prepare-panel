export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anosim_numbers: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          note: string | null
          number: string | null
          order_booking_id: number
          updated_at: string
          vic_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          note?: string | null
          number?: string | null
          order_booking_id: number
          updated_at?: string
          vic_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          note?: string | null
          number?: string | null
          order_booking_id?: number
          updated_at?: string
          vic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anosim_numbers_vic_id_fkey"
            columns: ["vic_id"]
            isOneToOne: false
            referencedRelation: "vics"
            referencedColumns: ["id"]
          },
        ]
      }
      auftraege: {
        Row: {
          admin_only: boolean
          besonderheiten: string | null
          created_at: string
          created_by: string | null
          generate_loginname: boolean
          generate_password: boolean
          id: string
          ident_type: string | null
          images: Json
          logo_path: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          admin_only?: boolean
          besonderheiten?: string | null
          created_at?: string
          created_by?: string | null
          generate_loginname?: boolean
          generate_password?: boolean
          id?: string
          ident_type?: string | null
          images?: Json
          logo_path?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          admin_only?: boolean
          besonderheiten?: string | null
          created_at?: string
          created_by?: string | null
          generate_loginname?: boolean
          generate_password?: boolean
          id?: string
          ident_type?: string | null
          images?: Json
          logo_path?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_recipients: {
        Row: {
          active: boolean
          chat_id: string
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          chat_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          chat_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vic_auftraege: {
        Row: {
          auftrag_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          login_name: string | null
          password: string | null
          postident_link: string | null
          status: string
          updated_at: string
          used_login_name: string | null
          used_password: string | null
          vic_id: string
          webid_link: string | null
        }
        Insert: {
          auftrag_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          login_name?: string | null
          password?: string | null
          postident_link?: string | null
          status?: string
          updated_at?: string
          used_login_name?: string | null
          used_password?: string | null
          vic_id: string
          webid_link?: string | null
        }
        Update: {
          auftrag_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          login_name?: string | null
          password?: string | null
          postident_link?: string | null
          status?: string
          updated_at?: string
          used_login_name?: string | null
          used_password?: string | null
          vic_id?: string
          webid_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vic_auftraege_auftrag_id_fkey"
            columns: ["auftrag_id"]
            isOneToOne: false
            referencedRelation: "auftraege"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vic_auftraege_vic_id_fkey"
            columns: ["vic_id"]
            isOneToOne: false
            referencedRelation: "vics"
            referencedColumns: ["id"]
          },
        ]
      }
      vics: {
        Row: {
          bank: string | null
          birth_date: string | null
          birth_name: string | null
          birth_place: string | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          email_address: string | null
          email_birth_date: string | null
          email_city: string | null
          email_postal_code: string | null
          email_street: string | null
          first_name: string
          id: string
          last_name: string
          marital_status: string | null
          middle_name: string | null
          notes: string | null
          postal_code: string | null
          project_id: string | null
          street: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          bank?: string | null
          birth_date?: string | null
          birth_name?: string | null
          birth_place?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          email_address?: string | null
          email_birth_date?: string | null
          email_city?: string | null
          email_postal_code?: string | null
          email_street?: string | null
          first_name: string
          id?: string
          last_name: string
          marital_status?: string | null
          middle_name?: string | null
          notes?: string | null
          postal_code?: string | null
          project_id?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          bank?: string | null
          birth_date?: string | null
          birth_name?: string | null
          birth_place?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          email_address?: string | null
          email_birth_date?: string | null
          email_city?: string | null
          email_postal_code?: string | null
          email_street?: string | null
          first_name?: string
          id?: string
          last_name?: string
          marital_status?: string | null
          middle_name?: string | null
          notes?: string | null
          postal_code?: string | null
          project_id?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "mitarbeiter"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "mitarbeiter"],
    },
  },
} as const
