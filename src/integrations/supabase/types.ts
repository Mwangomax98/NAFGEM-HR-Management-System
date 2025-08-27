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
      kpi_values: {
        Row: {
          actual_value: number
          comment: string | null
          created_at: string | null
          entered_by: string | null
          id: string
          kpi_id: string | null
          reporting_period: string
        }
        Insert: {
          actual_value: number
          comment?: string | null
          created_at?: string | null
          entered_by?: string | null
          id?: string
          kpi_id?: string | null
          reporting_period: string
        }
        Update: {
          actual_value?: number
          comment?: string | null
          created_at?: string | null
          entered_by?: string | null
          id?: string
          kpi_id?: string | null
          reporting_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_gaps"
            referencedColumns: ["kpi_id"]
          },
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          project_id: string
          responsible_user_id: string | null
          target_value: number
          timeframe: string
          title: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          responsible_user_id?: string | null
          target_value: number
          timeframe?: string
          title: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          responsible_user_id?: string | null
          target_value?: number
          timeframe?: string
          title?: string
          unit?: string
          updated_at?: string | null
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
      role_audit_log: {
        Row: {
          action: string
          changed_by: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
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
          actual_completion_date: string | null
          actual_hours: number | null
          completion_explanation: string | null
          completion_percentage: number | null
          completion_status: string
          created_at: string
          estimated_hours: number | null
          id: string
          linked_kpi_id: string | null
          notes: string | null
          planned_completion_date: string | null
          priority: string
          task_category: string | null
          task_description: string | null
          task_title: string
          updated_at: string
          weekly_target_id: string | null
          weekly_task_id: string
        }
        Insert: {
          actual_completion_date?: string | null
          actual_hours?: number | null
          completion_explanation?: string | null
          completion_percentage?: number | null
          completion_status?: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          linked_kpi_id?: string | null
          notes?: string | null
          planned_completion_date?: string | null
          priority?: string
          task_category?: string | null
          task_description?: string | null
          task_title: string
          updated_at?: string
          weekly_target_id?: string | null
          weekly_task_id: string
        }
        Update: {
          actual_completion_date?: string | null
          actual_hours?: number | null
          completion_explanation?: string | null
          completion_percentage?: number | null
          completion_status?: string
          created_at?: string
          estimated_hours?: number | null
          id?: string
          linked_kpi_id?: string | null
          notes?: string | null
          planned_completion_date?: string | null
          priority?: string
          task_category?: string | null
          task_description?: string | null
          task_title?: string
          updated_at?: string
          weekly_target_id?: string | null
          weekly_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_linked_kpi_id_fkey"
            columns: ["linked_kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_gaps"
            referencedColumns: ["kpi_id"]
          },
          {
            foreignKeyName: "task_submissions_linked_kpi_id_fkey"
            columns: ["linked_kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_weekly_target_id_fkey"
            columns: ["weekly_target_id"]
            isOneToOne: false
            referencedRelation: "weekly_target_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_weekly_target_id_fkey"
            columns: ["weekly_target_id"]
            isOneToOne: false
            referencedRelation: "weekly_targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_weekly_task_id_fkey"
            columns: ["weekly_task_id"]
            isOneToOne: false
            referencedRelation: "weekly_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          timesheet_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          timesheet_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          timesheet_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_attachments_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          created_at: string
          description: string | null
          entry_date: string
          hours_worked: number
          id: string
          project_name: string
          timesheet_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_date: string
          hours_worked?: number
          id?: string
          project_name: string
          timesheet_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_date?: string
          hours_worked?: number
          id?: string
          project_name?: string
          timesheet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number | null
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          total_hours: number | null
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number | null
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          total_hours?: number | null
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
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
      weekly_targets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kpi_id: string | null
          priority: string
          status: string
          target_value: number
          title: string
          updated_at: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kpi_id?: string | null
          priority?: string
          status?: string
          target_value: number
          title: string
          updated_at?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kpi_id?: string | null
          priority?: string
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_gaps"
            referencedColumns: ["kpi_id"]
          },
          {
            foreignKeyName: "weekly_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
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
      kpi_gaps: {
        Row: {
          actual_value: number | null
          category: string | null
          description: string | null
          gap_value: number | null
          kpi_id: string | null
          latest_comment: string | null
          project_id: string | null
          reporting_period: string | null
          status: string | null
          target_value: number | null
          timeframe: string | null
          title: string | null
          unit: string | null
        }
        Relationships: []
      }
      weekly_target_progress: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          kpi_id: string | null
          kpi_title: string | null
          kpi_unit: string | null
          priority: string | null
          status: string | null
          target_value: number | null
          task_count: number | null
          title: string | null
          total_progress: number | null
          updated_at: string | null
          week_end_date: string | null
          week_start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_gaps"
            referencedColumns: ["kpi_id"]
          },
          {
            foreignKeyName: "weekly_targets_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_max_attempts: number
          p_operation: string
          p_time_window: unknown
          p_user_id: string
        }
        Returns: boolean
      }
      detect_security_anomalies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_user_id: string }
        Returns: undefined
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
