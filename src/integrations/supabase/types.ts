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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      driver_availability: {
        Row: {
          availability_type: string
          created_at: string
          driver_id: string
          end_datetime: string
          id: string
          notes: string | null
          start_datetime: string
          updated_at: string
        }
        Insert: {
          availability_type: string
          created_at?: string
          driver_id: string
          end_datetime: string
          id?: string
          notes?: string | null
          start_datetime: string
          updated_at?: string
        }
        Update: {
          availability_type?: string
          created_at?: string
          driver_id?: string
          end_datetime?: string
          id?: string
          notes?: string | null
          start_datetime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_availability_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          availability: boolean
          created_at: string
          email: string | null
          home_base: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          license_type: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          availability?: boolean
          created_at?: string
          email?: string | null
          home_base?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          availability?: boolean
          created_at?: string
          email?: string | null
          home_base?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_type?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          trip_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          trip_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          trip_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          project: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          project: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          project?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_conversations: {
        Row: {
          conversation_title: string | null
          conversation_type: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string
          related_record_id: string | null
          related_record_type: string | null
          sender_id: string
          task_evaluation_id: string | null
        }
        Insert: {
          conversation_title?: string | null
          conversation_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string
          related_record_id?: string | null
          related_record_type?: string | null
          sender_id: string
          task_evaluation_id?: string | null
        }
        Update: {
          conversation_title?: string | null
          conversation_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string
          related_record_id?: string | null
          related_record_type?: string | null
          sender_id?: string
          task_evaluation_id?: string | null
        }
        Relationships: []
      }
      task_evaluations: {
        Row: {
          completion_assessment: string | null
          created_at: string
          evaluation_date: string
          evaluator_id: string
          feedback: string | null
          id: string
          performance_score: number | null
          requires_explanation: boolean | null
          task_submission_id: string
          updated_at: string
        }
        Insert: {
          completion_assessment?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id: string
          feedback?: string | null
          id?: string
          performance_score?: number | null
          requires_explanation?: boolean | null
          task_submission_id: string
          updated_at?: string
        }
        Update: {
          completion_assessment?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string
          feedback?: string | null
          id?: string
          performance_score?: number | null
          requires_explanation?: boolean | null
          task_submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_evaluations_task_submission_id_fkey"
            columns: ["task_submission_id"]
            isOneToOne: true
            referencedRelation: "task_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          actual_hours: number | null
          completion_percentage: number | null
          completion_status: string
          created_at: string
          estimated_hours: number | null
          id: string
          notes: string | null
          priority: string
          task_description: string | null
          task_title: string
          updated_at: string
          weekly_task_id: string
        }
        Insert: {
          actual_hours?: number | null
          completion_percentage?: number | null
          completion_status?: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          priority?: string
          task_description?: string | null
          task_title: string
          updated_at?: string
          weekly_task_id: string
        }
        Update: {
          actual_hours?: number | null
          completion_percentage?: number | null
          completion_status?: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          priority?: string
          task_description?: string | null
          task_title?: string
          updated_at?: string
          weekly_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_weekly_task_id_fkey"
            columns: ["weekly_task_id"]
            isOneToOne: false
            referencedRelation: "weekly_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_requests: {
        Row: {
          assigned_driver_id: string | null
          assigned_vehicle_id: string | null
          created_at: string
          destination: string
          drop_location: string | null
          end_datetime: string
          expected_outcomes: string | null
          id: string
          luggage_notes: string | null
          objectives: string | null
          passengers_count: number
          pickup_location: string
          project_id: string
          proposed_driver_id: string | null
          proposed_vehicle_id: string | null
          purpose: string
          requester_id: string
          start_datetime: string
          status: string
          terms_of_reference: string | null
          updated_at: string
        }
        Insert: {
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          destination: string
          drop_location?: string | null
          end_datetime: string
          expected_outcomes?: string | null
          id?: string
          luggage_notes?: string | null
          objectives?: string | null
          passengers_count: number
          pickup_location: string
          project_id: string
          proposed_driver_id?: string | null
          proposed_vehicle_id?: string | null
          purpose: string
          requester_id: string
          start_datetime: string
          status?: string
          terms_of_reference?: string | null
          updated_at?: string
        }
        Update: {
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          created_at?: string
          destination?: string
          drop_location?: string | null
          end_datetime?: string
          expected_outcomes?: string | null
          id?: string
          luggage_notes?: string | null
          objectives?: string | null
          passengers_count?: number
          pickup_location?: string
          project_id?: string
          proposed_driver_id?: string | null
          proposed_vehicle_id?: string | null
          purpose?: string
          requester_id?: string
          start_datetime?: string
          status?: string
          terms_of_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_requests_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_requests_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_requests_proposed_driver_id_fkey"
            columns: ["proposed_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_requests_proposed_vehicle_id_fkey"
            columns: ["proposed_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_templates: {
        Row: {
          created_at: string
          created_by: string
          destination: string
          estimated_duration_hours: number
          id: string
          is_recurring: boolean
          name: string
          passengers_count: number
          pickup_location: string
          project_id: string
          purpose: string
          recurrence_pattern: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          destination: string
          estimated_duration_hours: number
          id?: string
          is_recurring?: boolean
          name: string
          passengers_count: number
          pickup_location: string
          project_id: string
          purpose: string
          recurrence_pattern?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          destination?: string
          estimated_duration_hours?: number
          id?: string
          is_recurring?: boolean
          name?: string
          passengers_count?: number
          pickup_location?: string
          project_id?: string
          purpose?: string
          recurrence_pattern?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string
          id: string
          maintenance_type: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_type: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          maintenance_type?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          availability: boolean
          capacity: number | null
          created_at: string
          fuel_type: string | null
          id: string
          insurance_expiry: string | null
          last_maintenance: string | null
          make: string
          mileage: number | null
          model: string
          plate_number: string
          status: string
          updated_at: string
          year: number | null
        }
        Insert: {
          availability?: boolean
          capacity?: number | null
          created_at?: string
          fuel_type?: string | null
          id?: string
          insurance_expiry?: string | null
          last_maintenance?: string | null
          make: string
          mileage?: number | null
          model: string
          plate_number: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          availability?: boolean
          capacity?: number | null
          created_at?: string
          fuel_type?: string | null
          id?: string
          insurance_expiry?: string | null
          last_maintenance?: string | null
          make?: string
          mileage?: number | null
          model?: string
          plate_number?: string
          status?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      weekly_tasks: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          status: string
          submitted_at: string | null
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      conversation_summaries: {
        Row: {
          conversation_title: string | null
          conversation_type: string | null
          last_message: string | null
          last_message_at: string | null
          message_count: number | null
          participants: string[] | null
          related_record_id: string | null
          related_record_type: string | null
          task_evaluation_id: string | null
          unread_count: number | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "hr" | "employee"
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
    Enums: {
      app_role: ["admin", "hr", "employee"],
    },
  },
} as const
