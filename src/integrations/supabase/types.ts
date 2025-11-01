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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          col_index: number | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          row_index: number | null
          spreadsheet_id: string
          user_id: string
        }
        Insert: {
          action: string
          col_index?: number | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          row_index?: number | null
          spreadsheet_id: string
          user_id: string
        }
        Update: {
          action?: string
          col_index?: number | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          row_index?: number | null
          spreadsheet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheets"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          col_index: number
          created_at: string
          format: Json | null
          formula: string | null
          id: string
          row_index: number
          spreadsheet_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          col_index: number
          created_at?: string
          format?: Json | null
          formula?: string | null
          id?: string
          row_index: number
          spreadsheet_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          col_index?: number
          created_at?: string
          format?: Json | null
          formula?: string | null
          id?: string
          row_index?: number
          spreadsheet_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cells_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheets"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          cell_id: string
          comment: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cell_id: string
          comment: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cell_id?: string
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      spreadsheet_permissions: {
        Row: {
          created_at: string
          id: string
          permission_level: string
          spreadsheet_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          permission_level: string
          spreadsheet_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          permission_level?: string
          spreadsheet_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spreadsheet_permissions_spreadsheet_id_fkey"
            columns: ["spreadsheet_id"]
            isOneToOne: false
            referencedRelation: "spreadsheets"
            referencedColumns: ["id"]
          },
        ]
      }
      spreadsheets: {
        Row: {
          access_code: string | null
          created_at: string
          id: string
          is_public: boolean | null
          is_template: boolean | null
          name: string
          notes: string | null
          template_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name: string
          notes?: string | null
          template_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          name?: string
          notes?: string | null
          template_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_spreadsheet: {
        Args: { _spreadsheet_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit_spreadsheet: {
        Args: { _spreadsheet_id: string; _user_id: string }
        Returns: boolean
      }
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
  public: {
    Enums: {},
  },
} as const
