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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          code: string
          created_at: string
          id: string
          practice_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          practice_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          practice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          created_at: string
          display_name: string
          id: string
          practice_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          practice_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          practice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinicians_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      enabled_tests: {
        Row: {
          created_at: string
          practice_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          practice_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          practice_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enabled_tests_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sequence_test_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          practice_id: string
          sequence_test_id: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          practice_id: string
          sequence_test_id: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          practice_id?: string
          sequence_test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_test_notes_created_by_fkey"
            columns: ["created_by", "practice_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id", "practice_id"]
          },
          {
            foreignKeyName: "sequence_test_notes_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_test_notes_sequence_test_fkey"
            columns: ["sequence_test_id", "practice_id"]
            isOneToOne: false
            referencedRelation: "sequence_tests"
            referencedColumns: ["id", "practice_id"]
          },
        ]
      }
      sequence_tests: {
        Row: {
          browser_scores: Json | null
          completed_at: string | null
          created_at: string
          id: string
          position: number
          practice_id: string
          raw_data: Json | null
          scores: Json | null
          screen_height: number | null
          screen_width: number | null
          sequence_id: string
          sheets: Json | null
          started_at: string | null
          status: string
          stop_reason: string | null
          stopped_by: string | null
          test_id: string
          test_version: string | null
        }
        Insert: {
          browser_scores?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          position: number
          practice_id: string
          raw_data?: Json | null
          scores?: Json | null
          screen_height?: number | null
          screen_width?: number | null
          sequence_id: string
          sheets?: Json | null
          started_at?: string | null
          status?: string
          stop_reason?: string | null
          stopped_by?: string | null
          test_id: string
          test_version?: string | null
        }
        Update: {
          browser_scores?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          position?: number
          practice_id?: string
          raw_data?: Json | null
          scores?: Json | null
          screen_height?: number | null
          screen_width?: number | null
          sequence_id?: string
          sheets?: Json | null
          started_at?: string | null
          status?: string
          stop_reason?: string | null
          stopped_by?: string | null
          test_id?: string
          test_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sequence_tests_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sequence_tests_sequence_fkey"
            columns: ["sequence_id", "practice_id"]
            isOneToOne: false
            referencedRelation: "sequences"
            referencedColumns: ["id", "practice_id"]
          },
          {
            foreignKeyName: "sequence_tests_stopped_by_fkey"
            columns: ["stopped_by", "practice_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id", "practice_id"]
          },
          {
            foreignKeyName: "sequence_tests_test_fkey"
            columns: ["practice_id", "test_id"]
            isOneToOne: false
            referencedRelation: "enabled_tests"
            referencedColumns: ["practice_id", "test_id"]
          },
        ]
      }
      sequences: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          id: string
          link_token: string
          practice_id: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          link_token?: string
          practice_id: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          link_token?: string
          practice_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequences_client_fkey"
            columns: ["client_id", "practice_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "practice_id"]
          },
          {
            foreignKeyName: "sequences_created_by_fkey"
            columns: ["created_by", "practice_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id", "practice_id"]
          },
          {
            foreignKeyName: "sequences_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
