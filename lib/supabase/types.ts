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
      cases: {
        Row: {
          case_ref: string
          closed_at: string | null
          created_at: string
          id: string
          mode: string
          notes: string | null
          opened_at: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          case_ref: string
          closed_at?: string | null
          created_at?: string
          id?: string
          mode: string
          notes?: string | null
          opened_at?: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          case_ref?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          mode?: string
          notes?: string | null
          opened_at?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_memberships: {
        Row: {
          created_at: string
          family_id: string
          id: string
          membership_role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          membership_role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          membership_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_memberships_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      nurses: {
        Row: {
          active: boolean
          certifications: string[] | null
          created_at: string
          display_name: string
          hospital: string | null
          id: string
          license_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          certifications?: string[] | null
          created_at?: string
          display_name: string
          hospital?: string | null
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          certifications?: string[] | null
          created_at?: string
          display_name?: string
          hospital?: string | null
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age_band: string | null
          created_at: string
          deleted_at: string | null
          display_label: string
          district: string | null
          family_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          age_band?: string | null
          created_at?: string
          deleted_at?: string | null
          display_label: string
          district?: string | null
          family_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          age_band?: string | null
          created_at?: string
          deleted_at?: string | null
          display_label?: string
          district?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          preferred_locale: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          preferred_locale?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          preferred_locale?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      summary_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          visit_summary_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
          visit_summary_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          visit_summary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_share_links_visit_summary_id_fkey"
            columns: ["visit_summary_id"]
            isOneToOne: false
            referencedRelation: "visit_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_summaries: {
        Row: {
          coordinator_note: string | null
          created_at: string
          done_body: string | null
          finalised: boolean
          id: string
          meds_administered: string[] | null
          next_visit_body: string | null
          observations_body: string | null
          published_at: string | null
          sent_back_reason: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          visit_id: string
          vitals: Json
          watch_items: string[] | null
          written_at: string
        }
        Insert: {
          coordinator_note?: string | null
          created_at?: string
          done_body?: string | null
          finalised?: boolean
          id?: string
          meds_administered?: string[] | null
          next_visit_body?: string | null
          observations_body?: string | null
          published_at?: string | null
          sent_back_reason?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          visit_id: string
          vitals?: Json
          watch_items?: string[] | null
          written_at?: string
        }
        Update: {
          coordinator_note?: string | null
          created_at?: string
          done_body?: string | null
          finalised?: boolean
          id?: string
          meds_administered?: string[] | null
          next_visit_body?: string | null
          observations_body?: string | null
          published_at?: string | null
          sent_back_reason?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          visit_id?: string
          vitals?: Json
          watch_items?: string[] | null
          written_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_summary_events: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
          visit_summary_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
          visit_summary_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
          visit_summary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_summary_events_visit_summary_id_fkey"
            columns: ["visit_summary_id"]
            isOneToOne: false
            referencedRelation: "visit_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          assigned_nurse_id: string | null
          case_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_nurse_id?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_nurse_id?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_assigned_nurse_id_fkey"
            columns: ["assigned_nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      wound_photos: {
        Row: {
          caption: string | null
          id: string
          storage_path: string
          taken_at: string | null
          uploaded_at: string
          visit_summary_id: string
        }
        Insert: {
          caption?: string | null
          id?: string
          storage_path: string
          taken_at?: string | null
          uploaded_at?: string
          visit_summary_id: string
        }
        Update: {
          caption?: string | null
          id?: string
          storage_path?: string
          taken_at?: string | null
          uploaded_at?: string
          visit_summary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wound_photos_visit_summary_id_fkey"
            columns: ["visit_summary_id"]
            isOneToOne: false
            referencedRelation: "visit_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_summary_events: {
        Args: { target_summary_id: string }
        Returns: boolean
      }
      is_assigned_nurse: { Args: { target_visit_id: string }; Returns: boolean }
      is_coordinator: { Args: never; Returns: boolean }
      is_family_member: { Args: { target_family_id: string }; Returns: boolean }
      is_nurse_for_case: { Args: { target_case_id: string }; Returns: boolean }
      is_nurse_for_patient: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      open_review: { Args: { target_summary_id: string }; Returns: undefined }
      publish_summary: {
        Args: { target_summary_id: string }
        Returns: undefined
      }
      send_back_summary: {
        Args: { send_back_reason: string; target_summary_id: string }
        Returns: undefined
      }
      submit_summary: {
        Args: { target_summary_id: string }
        Returns: undefined
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
