export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          id: string
          experiment_id: string
          user_id: string | null
          session_id: string
          variant_key: string
          assigned_at: string | null
        }
        Insert: {
          id?: string
          experiment_id: string
          user_id?: string | null
          session_id: string
          variant_key: string
          assigned_at?: string | null
        }
        Update: {
          id?: string
          experiment_id?: string
          user_id?: string | null
          session_id?: string
          variant_key?: string
          assigned_at?: string | null
        }
        Relationships: []
      }
      ab_test_experiments: {
        Row: {
          id: string
          experiment_key: string
          experiment_name: string
          description: string | null
          variants: Json
          status: string | null
          target_audience: Json | null
          target_pages: string[] | null
          start_date: string | null
          end_date: string | null
          winning_variant: string | null
          statistical_significance: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          experiment_key: string
          experiment_name: string
          description?: string | null
          variants: Json
          status?: string | null
          target_audience?: Json | null
          target_pages?: string[] | null
          start_date?: string | null
          end_date?: string | null
          winning_variant?: string | null
          statistical_significance?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          experiment_key?: string
          experiment_name?: string
          description?: string | null
          variants?: Json
          status?: string | null
          target_audience?: Json | null
          target_pages?: string[] | null
          start_date?: string | null
          end_date?: string | null
          winning_variant?: string | null
          statistical_significance?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      about_awards: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      about_stats: {
        Row: {
          id: string
          label: string
          value: string
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          label: string
          value: string
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          label?: string
          value?: string
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      about_values: {
        Row: {
          id: string
          title: string
          description: string | null
          icon_name: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          icon_name?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          icon_name?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent: string | null
          active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent?: string | null
          active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh_key?: string
          auth_key?: string
          user_agent?: string | null
          active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      advisory_acknowledgments: {
        Row: {
          id: string
          advisory_id: string
          trip_id: string | null
          acknowledged_by: string
          acknowledged_at: string
          acknowledgment_notes: string | null
          mitigation_actions: string[] | null
          proceed_with_trip: boolean | null
        }
        Insert: {
          id?: string
          advisory_id: string
          trip_id?: string | null
          acknowledged_by: string
          acknowledged_at?: string
          acknowledgment_notes?: string | null
          mitigation_actions?: string[] | null
          proceed_with_trip?: boolean | null
        }
        Update: {
          id?: string
          advisory_id?: string
          trip_id?: string | null
          acknowledged_by?: string
          acknowledged_at?: string
          acknowledgment_notes?: string | null
          mitigation_actions?: string[] | null
          proceed_with_trip?: boolean | null
        }
        Relationships: []
      }
      ai_documents: {
        Row: {
          id: string
          branch_id: string | null
          title: string
          document_type: Database["public"]["Enums"]["ai_document_type"]
          content: string
          embedding: string | null
          metadata: Json | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          title: string
          document_type: Database["public"]["Enums"]["ai_document_type"]
          content: string
          embedding?: string | null
          metadata?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          title?: string
          document_type?: Database["public"]["Enums"]["ai_document_type"]
          content?: string
          embedding?: string | null
          metadata?: Json | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_analytics: {
        Row: {
          id: string
          feature: string
          user_id: string | null
          branch_id: string | null
          trip_id: string | null
          tokens_used: number | null
          latency_ms: number | null
          success: boolean | null
          error_message: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          feature: string
          user_id?: string | null
          branch_id?: string | null
          trip_id?: string | null
          tokens_used?: number | null
          latency_ms?: number | null
          success?: boolean | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          feature?: string
          user_id?: string | null
          branch_id?: string | null
          trip_id?: string | null
          tokens_used?: number | null
          latency_ms?: number | null
          success?: boolean | null
          error_message?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          id: string
          type: string
          app: string
          user_id: string | null
          data: Json | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          app: string
          user_id?: string | null
          data?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          app?: string
          user_id?: string | null
          data?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          id: string
          branch_id: string | null
          workflow_name: string
          trigger_action: string
          steps: Json
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          workflow_name: string
          trigger_action: string
          steps?: Json
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          workflow_name?: string
          trigger_action?: string
          steps?: Json
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asita_membership: {
        Row: {
          id: string
          license_id: string
          nia: string
          membership_type: string
          dpd_region: string | null
          member_since: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          license_id: string
          nia: string
          membership_type: string
          dpd_region?: string | null
          member_since: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          license_id?: string
          nia?: string
          membership_type?: string
          dpd_region?: string | null
          member_since?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          id: string
          asset_id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          start_date: string
          end_date: string
          description: string
          vendor_name: string | null
          estimated_cost: number | null
          actual_cost: number | null
          status: Database["public"]["Enums"]["maintenance_status"]
          completed_at: string | null
          completion_notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          asset_id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          start_date: string
          end_date: string
          description: string
          vendor_name?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          completed_at?: string | null
          completion_notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          asset_id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          start_date?: string
          end_date?: string
          description?: string
          vendor_name?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          completed_at?: string | null
          completion_notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          id: string
          branch_id: string
          code: string
          name: string
          asset_type: Database["public"]["Enums"]["asset_type"]
          description: string | null
          capacity: number | null
          specifications: Json | null
          is_owned: boolean | null
          owner_name: string | null
          owner_phone: string | null
          rental_price_per_trip: number | null
          rental_price_per_day: number | null
          registration_number: string | null
          registration_expiry: string | null
          insurance_number: string | null
          insurance_expiry: string | null
          status: Database["public"]["Enums"]["asset_status"]
          current_location: string | null
          home_base: string | null
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          engine_hours: number | null
          photo_url: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          code: string
          name: string
          asset_type: Database["public"]["Enums"]["asset_type"]
          description?: string | null
          capacity?: number | null
          specifications?: Json | null
          is_owned?: boolean | null
          owner_name?: string | null
          owner_phone?: string | null
          rental_price_per_trip?: number | null
          rental_price_per_day?: number | null
          registration_number?: string | null
          registration_expiry?: string | null
          insurance_number?: string | null
          insurance_expiry?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          current_location?: string | null
          home_base?: string | null
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          engine_hours?: number | null
          photo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          code?: string
          name?: string
          asset_type?: Database["public"]["Enums"]["asset_type"]
          description?: string | null
          capacity?: number | null
          specifications?: Json | null
          is_owned?: boolean | null
          owner_name?: string | null
          owner_phone?: string | null
          rental_price_per_trip?: number | null
          rental_price_per_day?: number | null
          registration_number?: string | null
          registration_expiry?: string | null
          insurance_number?: string | null
          insurance_expiry?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          current_location?: string | null
          home_base?: string | null
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          engine_hours?: number | null
          photo_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
          action: Database["public"]["Enums"]["audit_action"]
          entity_type: string
          entity_id: string | null
          description: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
          app: string | null
          changes: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          action: Database["public"]["Enums"]["audit_action"]
          entity_type: string
          entity_id?: string | null
          description?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          app?: string | null
          changes?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
          action?: Database["public"]["Enums"]["audit_action"]
          entity_type?: string
          entity_id?: string | null
          description?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          app?: string | null
          changes?: Json | null
        }
        Relationships: []
      }
      authority_matrix: {
        Row: {
          id: string
          branch_id: string | null
          action_type: string
          action_name: string
          description: string | null
          required_roles: string[]
          min_approvers: number | null
          threshold_amount: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          action_type: string
          action_name: string
          description?: string | null
          required_roles?: string[]
          min_approvers?: number | null
          threshold_amount?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          action_type?: string
          action_name?: string
          description?: string | null
          required_roles?: string[]
          min_approvers?: number | null
          threshold_amount?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_modifications: {
        Row: {
          id: string
          booking_id: string
          modified_by: string
          modification_type: string
          old_value: Json | null
          new_value: Json | null
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          modified_by: string
          modification_type: string
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          modified_by?: string
          modification_type?: string
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      booking_passengers: {
        Row: {
          id: string
          booking_id: string
          full_name: string
          passenger_type: Database["public"]["Enums"]["passenger_type"]
          date_of_birth: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          id_number: string | null
          id_card_url: string | null
          id_verified: boolean | null
          phone: string | null
          email: string | null
          emergency_name: string | null
          emergency_phone: string | null
          dietary_requirements: string | null
          health_conditions: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          full_name: string
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          date_of_birth?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          id_number?: string | null
          id_card_url?: string | null
          id_verified?: boolean | null
          phone?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          dietary_requirements?: string | null
          health_conditions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          full_name?: string
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          date_of_birth?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          id_number?: string | null
          id_card_url?: string | null
          id_verified?: boolean | null
          phone?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          dietary_requirements?: string | null
          health_conditions?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_reschedule_requests: {
        Row: {
          id: string
          booking_id: string
          partner_id: string
          requested_trip_date: string
          reason: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          partner_id: string
          requested_trip_date: string
          reason?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          partner_id?: string
          requested_trip_date?: string
          reason?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          branch_id: string
          package_id: string
          booking_code: string
          booking_date: string
          trip_date: string
          source: Database["public"]["Enums"]["booking_source"]
          mitra_id: string | null
          referral_code: string | null
          adult_pax: number
          child_pax: number
          infant_pax: number
          price_per_adult: number
          price_per_child: number
          subtotal: number
          discount_amount: number | null
          tax_amount: number | null
          total_amount: number
          nta_price_per_adult: number | null
          nta_total: number | null
          status: Database["public"]["Enums"]["booking_status"]
          customer_name: string
          customer_email: string | null
          customer_phone: string
          consent_agreed: boolean | null
          consent_agreed_at: string | null
          special_requests: string | null
          internal_notes: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          customer_id: string | null
          partner_branch_id: string | null
          waiver_signed_at: string | null
          waiver_signature_url: string | null
          waiver_signer_ip: string | null
          waiver_signer_user_agent: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          package_id: string
          booking_code: string
          booking_date?: string
          trip_date: string
          source?: Database["public"]["Enums"]["booking_source"]
          mitra_id?: string | null
          referral_code?: string | null
          adult_pax?: number
          child_pax?: number
          infant_pax?: number
          price_per_adult: number
          price_per_child?: number
          subtotal: number
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount: number
          nta_price_per_adult?: number | null
          nta_total?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          customer_name: string
          customer_email?: string | null
          customer_phone: string
          consent_agreed?: boolean | null
          consent_agreed_at?: string | null
          special_requests?: string | null
          internal_notes?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          customer_id?: string | null
          partner_branch_id?: string | null
          waiver_signed_at?: string | null
          waiver_signature_url?: string | null
          waiver_signer_ip?: string | null
          waiver_signer_user_agent?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          package_id?: string
          booking_code?: string
          booking_date?: string
          trip_date?: string
          source?: Database["public"]["Enums"]["booking_source"]
          mitra_id?: string | null
          referral_code?: string | null
          adult_pax?: number
          child_pax?: number
          infant_pax?: number
          price_per_adult?: number
          price_per_child?: number
          subtotal?: number
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount?: number
          nta_price_per_adult?: number | null
          nta_total?: number | null
          status?: Database["public"]["Enums"]["booking_status"]
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string
          consent_agreed?: boolean | null
          consent_agreed_at?: string | null
          special_requests?: string | null
          internal_notes?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          customer_id?: string | null
          partner_branch_id?: string | null
          waiver_signed_at?: string | null
          waiver_signature_url?: string | null
          waiver_signer_ip?: string | null
          waiver_signer_user_agent?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          timezone: string | null
          currency: string | null
          tax_inclusive: boolean | null
          tax_rate: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          timezone?: string | null
          currency?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          timezone?: string | null
          currency?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      broadcast_delivery_logs: {
        Row: {
          id: string
          broadcast_id: string
          recipient_id: string
          delivery_method: string
          status: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          broadcast_id: string
          recipient_id: string
          delivery_method: string
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          broadcast_id?: string
          recipient_id?: string
          delivery_method?: string
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      broadcast_notifications: {
        Row: {
          id: string
          title: string
          message: string
          sent_by: string
          target_roles: string[] | null
          target_branches: string[] | null
          delivery_method: string[] | null
          scheduled_for: string | null
          sent_at: string | null
          recipient_count: number | null
          success_count: number | null
          failed_count: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          message: string
          sent_by: string
          target_roles?: string[] | null
          target_branches?: string[] | null
          delivery_method?: string[] | null
          scheduled_for?: string | null
          sent_at?: string | null
          recipient_count?: number | null
          success_count?: number | null
          failed_count?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          sent_by?: string
          target_roles?: string[] | null
          target_branches?: string[] | null
          delivery_method?: string[] | null
          scheduled_for?: string | null
          sent_at?: string | null
          recipient_count?: number | null
          success_count?: number | null
          failed_count?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      broadcast_reads: {
        Row: {
          id: string
          broadcast_id: string
          guide_id: string
          read_at: string | null
        }
        Insert: {
          id?: string
          broadcast_id: string
          guide_id: string
          read_at?: string | null
        }
        Update: {
          id?: string
          broadcast_id?: string
          guide_id?: string
          read_at?: string | null
        }
        Relationships: []
      }
      bulk_action_logs: {
        Row: {
          id: string
          action_type: string
          target_table: string
          affected_ids: string[]
          affected_count: number
          successful_count: number
          failed_count: number
          payload: Json | null
          performed_by: string
          performed_at: string | null
        }
        Insert: {
          id?: string
          action_type: string
          target_table: string
          affected_ids: string[]
          affected_count: number
          successful_count: number
          failed_count: number
          payload?: Json | null
          performed_by: string
          performed_at?: string | null
        }
        Update: {
          id?: string
          action_type?: string
          target_table?: string
          affected_ids?: string[]
          affected_count?: number
          successful_count?: number
          failed_count?: number
          payload?: Json | null
          performed_by?: string
          performed_at?: string | null
        }
        Relationships: []
      }
      business_licenses: {
        Row: {
          id: string
          license_type: Database["public"]["Enums"]["license_type"]
          license_number: string
          license_name: string
          issued_by: string
          issued_date: string
          expiry_date: string | null
          status: Database["public"]["Enums"]["license_status"]
          document_url: string | null
          notes: string | null
          reminder_30d_sent: boolean | null
          reminder_15d_sent: boolean | null
          reminder_7d_sent: boolean | null
          reminder_1d_sent: boolean | null
          created_by: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          license_type: Database["public"]["Enums"]["license_type"]
          license_number: string
          license_name: string
          issued_by: string
          issued_date: string
          expiry_date?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          document_url?: string | null
          notes?: string | null
          reminder_30d_sent?: boolean | null
          reminder_15d_sent?: boolean | null
          reminder_7d_sent?: boolean | null
          reminder_1d_sent?: boolean | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          license_number?: string
          license_name?: string
          issued_by?: string
          issued_date?: string
          expiry_date?: string | null
          status?: Database["public"]["Enums"]["license_status"]
          document_url?: string | null
          notes?: string | null
          reminder_30d_sent?: boolean | null
          reminder_15d_sent?: boolean | null
          reminder_7d_sent?: boolean | null
          reminder_1d_sent?: boolean | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      campaign_recipients: {
        Row: {
          id: string
          campaign_id: string
          customer_id: string
          email: string
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          clicked_at: string | null
          bounced_at: string | null
          bounce_reason: string | null
          unsubscribed_at: string | null
          open_count: number | null
          click_count: number | null
          clicked_links: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          customer_id: string
          email: string
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          bounced_at?: string | null
          bounce_reason?: string | null
          unsubscribed_at?: string | null
          open_count?: number | null
          click_count?: number | null
          clicked_links?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          customer_id?: string
          email?: string
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          bounced_at?: string | null
          bounce_reason?: string | null
          unsubscribed_at?: string | null
          open_count?: number | null
          click_count?: number | null
          clicked_links?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      cancellation_policies: {
        Row: {
          id: string
          name: string
          description: string | null
          days_before_trip: number
          refund_percentage: number
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          days_before_trip: number
          refund_percentage: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          days_before_trip?: number
          refund_percentage?: number
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chse_certificates: {
        Row: {
          id: string
          branch_id: string
          certificate_number: string | null
          certificate_type: string
          issuing_authority: string | null
          issued_date: string
          valid_from: string
          valid_until: string
          certificate_url: string | null
          supporting_documents: string[] | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          certificate_number?: string | null
          certificate_type: string
          issuing_authority?: string | null
          issued_date: string
          valid_from: string
          valid_until: string
          certificate_url?: string | null
          supporting_documents?: string[] | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          certificate_number?: string | null
          certificate_type?: string
          issuing_authority?: string | null
          issued_date?: string
          valid_from?: string
          valid_until?: string
          certificate_url?: string | null
          supporting_documents?: string[] | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      chse_checklist_templates: {
        Row: {
          id: string
          branch_id: string
          name: string
          description: string | null
          version: string | null
          checklist_items: Json
          is_active: boolean | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          description?: string | null
          version?: string | null
          checklist_items?: Json
          is_active?: boolean | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          description?: string | null
          version?: string | null
          checklist_items?: Json
          is_active?: boolean | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      chse_daily_logs: {
        Row: {
          id: string
          branch_id: string
          trip_id: string | null
          log_date: string
          clean_score: number | null
          clean_items: Json | null
          clean_notes: string | null
          clean_photos: string[] | null
          health_score: number | null
          health_items: Json | null
          health_notes: string | null
          temperature_logs: Json | null
          safety_score: number | null
          safety_items: Json | null
          safety_notes: string | null
          environment_score: number | null
          environment_items: Json | null
          environment_notes: string | null
          overall_score: number | null
          logged_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_id?: string | null
          log_date?: string
          clean_score?: number | null
          clean_items?: Json | null
          clean_notes?: string | null
          clean_photos?: string[] | null
          health_score?: number | null
          health_items?: Json | null
          health_notes?: string | null
          temperature_logs?: Json | null
          safety_score?: number | null
          safety_items?: Json | null
          safety_notes?: string | null
          environment_score?: number | null
          environment_items?: Json | null
          environment_notes?: string | null
          overall_score?: number | null
          logged_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_id?: string | null
          log_date?: string
          clean_score?: number | null
          clean_items?: Json | null
          clean_notes?: string | null
          clean_photos?: string[] | null
          health_score?: number | null
          health_items?: Json | null
          health_notes?: string | null
          temperature_logs?: Json | null
          safety_score?: number | null
          safety_items?: Json | null
          safety_notes?: string | null
          environment_score?: number | null
          environment_items?: Json | null
          environment_notes?: string | null
          overall_score?: number | null
          logged_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      community_contributions: {
        Row: {
          id: string
          branch_id: string
          contribution_type: string
          title: string
          description: string | null
          beneficiary_name: string
          beneficiary_type: string | null
          beneficiary_location: string | null
          monetary_value: number | null
          in_kind_value: number | null
          total_value: number | null
          currency: string | null
          volunteer_hours: number | null
          volunteers_count: number | null
          contribution_date: string
          evidence_urls: string[] | null
          receipt_url: string | null
          estimated_beneficiaries: number | null
          impact_description: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          contribution_type: string
          title: string
          description?: string | null
          beneficiary_name: string
          beneficiary_type?: string | null
          beneficiary_location?: string | null
          monetary_value?: number | null
          in_kind_value?: number | null
          total_value?: number | null
          currency?: string | null
          volunteer_hours?: number | null
          volunteers_count?: number | null
          contribution_date: string
          evidence_urls?: string[] | null
          receipt_url?: string | null
          estimated_beneficiaries?: number | null
          impact_description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          contribution_type?: string
          title?: string
          description?: string | null
          beneficiary_name?: string
          beneficiary_type?: string | null
          beneficiary_location?: string | null
          monetary_value?: number | null
          in_kind_value?: number | null
          total_value?: number | null
          currency?: string | null
          volunteer_hours?: number | null
          volunteers_count?: number | null
          contribution_date?: string
          evidence_urls?: string[] | null
          receipt_url?: string | null
          estimated_beneficiaries?: number | null
          impact_description?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      community_feedback: {
        Row: {
          id: string
          branch_id: string
          feedback_source: string
          source_name: string | null
          source_contact: string | null
          category: string
          title: string
          description: string
          sentiment: string | null
          severity: string | null
          response_required: boolean | null
          response_text: string | null
          responded_at: string | null
          responded_by: string | null
          status: string | null
          resolution_notes: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          received_at: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          feedback_source: string
          source_name?: string | null
          source_contact?: string | null
          category: string
          title: string
          description: string
          sentiment?: string | null
          severity?: string | null
          response_required?: boolean | null
          response_text?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          resolution_notes?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          received_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          feedback_source?: string
          source_name?: string | null
          source_contact?: string | null
          category?: string
          title?: string
          description?: string
          sentiment?: string | null
          severity?: string | null
          response_required?: boolean | null
          response_text?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string | null
          resolution_notes?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          received_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          npwp: string | null
          siup_number: string | null
          logo_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          npwp?: string | null
          siup_number?: string | null
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          npwp?: string | null
          siup_number?: string | null
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_alerts: {
        Row: {
          id: string
          license_id: string
          alert_type: string
          severity: string
          message: string
          is_read: boolean | null
          is_resolved: boolean | null
          read_by: string | null
          read_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          resolution_notes: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          whatsapp_sent: boolean | null
          whatsapp_sent_at: string | null
          push_sent: boolean | null
          push_sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          license_id: string
          alert_type: string
          severity: string
          message: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          read_by?: string | null
          read_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          license_id?: string
          alert_type?: string
          severity?: string
          message?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          read_by?: string | null
          read_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      compliance_audit_logs: {
        Row: {
          id: string
          branch_id: string
          audit_type: string
          audit_name: string
          audit_scope: string | null
          auditor_name: string
          auditor_type: string
          auditor_organization: string | null
          auditor_credentials: string | null
          audit_date: string
          audit_start_time: string | null
          audit_end_time: string | null
          findings: Json | null
          compliance_score: number | null
          max_score: number | null
          scoring_methodology: string | null
          score_breakdown: Json | null
          non_conformities_major: number | null
          non_conformities_minor: number | null
          observations: number | null
          non_conformities: string[] | null
          corrective_actions_required: string[] | null
          corrective_action_deadline: string | null
          audit_result: string | null
          certification_recommendation: boolean | null
          next_audit_date: string | null
          follow_up_required: boolean | null
          follow_up_date: string | null
          follow_up_notes: string | null
          evidence_urls: string[] | null
          report_url: string | null
          signed_by: string | null
          signature_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          audit_type: string
          audit_name: string
          audit_scope?: string | null
          auditor_name: string
          auditor_type: string
          auditor_organization?: string | null
          auditor_credentials?: string | null
          audit_date: string
          audit_start_time?: string | null
          audit_end_time?: string | null
          findings?: Json | null
          compliance_score?: number | null
          max_score?: number | null
          scoring_methodology?: string | null
          score_breakdown?: Json | null
          non_conformities_major?: number | null
          non_conformities_minor?: number | null
          observations?: number | null
          non_conformities?: string[] | null
          corrective_actions_required?: string[] | null
          corrective_action_deadline?: string | null
          audit_result?: string | null
          certification_recommendation?: boolean | null
          next_audit_date?: string | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          evidence_urls?: string[] | null
          report_url?: string | null
          signed_by?: string | null
          signature_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          audit_type?: string
          audit_name?: string
          audit_scope?: string | null
          auditor_name?: string
          auditor_type?: string
          auditor_organization?: string | null
          auditor_credentials?: string | null
          audit_date?: string
          audit_start_time?: string | null
          audit_end_time?: string | null
          findings?: Json | null
          compliance_score?: number | null
          max_score?: number | null
          scoring_methodology?: string | null
          score_breakdown?: Json | null
          non_conformities_major?: number | null
          non_conformities_minor?: number | null
          observations?: number | null
          non_conformities?: string[] | null
          corrective_actions_required?: string[] | null
          corrective_action_deadline?: string | null
          audit_result?: string | null
          certification_recommendation?: boolean | null
          next_audit_date?: string | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          evidence_urls?: string[] | null
          report_url?: string | null
          signed_by?: string | null
          signature_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      compliance_checklist_assessments: {
        Row: {
          id: string
          checklist_id: string
          audit_id: string | null
          branch_id: string
          assessment_date: string
          assessor_id: string
          responses: Json
          total_score: number | null
          max_possible_score: number | null
          compliance_percentage: number | null
          compliant_count: number | null
          non_compliant_count: number | null
          partial_count: number | null
          not_applicable_count: number | null
          overall_notes: string | null
          recommendations: string[] | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          checklist_id: string
          audit_id?: string | null
          branch_id: string
          assessment_date: string
          assessor_id: string
          responses?: Json
          total_score?: number | null
          max_possible_score?: number | null
          compliance_percentage?: number | null
          compliant_count?: number | null
          non_compliant_count?: number | null
          partial_count?: number | null
          not_applicable_count?: number | null
          overall_notes?: string | null
          recommendations?: string[] | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          checklist_id?: string
          audit_id?: string | null
          branch_id?: string
          assessment_date?: string
          assessor_id?: string
          responses?: Json
          total_score?: number | null
          max_possible_score?: number | null
          compliance_percentage?: number | null
          compliant_count?: number | null
          non_compliant_count?: number | null
          partial_count?: number | null
          not_applicable_count?: number | null
          overall_notes?: string | null
          recommendations?: string[] | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_checklists: {
        Row: {
          id: string
          checklist_name: string
          checklist_code: string | null
          standard_type: string
          version: string | null
          items: Json
          total_items: number | null
          total_weight: number | null
          is_active: boolean | null
          effective_date: string | null
          expiry_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          checklist_name: string
          checklist_code?: string | null
          standard_type: string
          version?: string | null
          items?: Json
          total_items?: number | null
          total_weight?: number | null
          is_active?: boolean | null
          effective_date?: string | null
          expiry_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          checklist_name?: string
          checklist_code?: string | null
          standard_type?: string
          version?: string | null
          items?: Json
          total_items?: number | null
          total_weight?: number | null
          is_active?: boolean | null
          effective_date?: string | null
          expiry_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      compliance_status_tracker: {
        Row: {
          id: string
          branch_id: string
          standard_type: string
          current_status: string | null
          compliance_level: number | null
          last_assessment_date: string | null
          last_assessment_id: string | null
          last_score: number | null
          is_certified: boolean | null
          certification_id: string | null
          certification_valid_until: string | null
          open_non_conformities: number | null
          overdue_actions: number | null
          next_assessment_date: string | null
          next_certification_date: string | null
          last_updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          standard_type: string
          current_status?: string | null
          compliance_level?: number | null
          last_assessment_date?: string | null
          last_assessment_id?: string | null
          last_score?: number | null
          is_certified?: boolean | null
          certification_id?: string | null
          certification_valid_until?: string | null
          open_non_conformities?: number | null
          overdue_actions?: number | null
          next_assessment_date?: string | null
          next_certification_date?: string | null
          last_updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          standard_type?: string
          current_status?: string | null
          compliance_level?: number | null
          last_assessment_date?: string | null
          last_assessment_id?: string | null
          last_score?: number | null
          is_certified?: boolean | null
          certification_id?: string | null
          certification_valid_until?: string | null
          open_non_conformities?: number | null
          overdue_actions?: number | null
          next_assessment_date?: string | null
          next_certification_date?: string | null
          last_updated_at?: string | null
        }
        Relationships: []
      }
      consent_purposes: {
        Row: {
          id: string
          purpose_code: string
          purpose_name: string
          description: string | null
          is_mandatory: boolean | null
          category: string
          legal_basis: string | null
          retention_period: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          purpose_code: string
          purpose_name: string
          description?: string | null
          is_mandatory?: boolean | null
          category: string
          legal_basis?: string | null
          retention_period?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          purpose_code?: string
          purpose_name?: string
          description?: string | null
          is_mandatory?: boolean | null
          category?: string
          legal_basis?: string | null
          retention_period?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_booking_approvals: {
        Row: {
          id: string
          corporate_id: string
          booking_id: string
          employee_id: string
          status: Database["public"]["Enums"]["corporate_approval_status"]
          requested_amount: number
          approved_amount: number | null
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          request_notes: string | null
          approver_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          corporate_id: string
          booking_id: string
          employee_id: string
          status?: Database["public"]["Enums"]["corporate_approval_status"]
          requested_amount: number
          approved_amount?: number | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          request_notes?: string | null
          approver_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          corporate_id?: string
          booking_id?: string
          employee_id?: string
          status?: Database["public"]["Enums"]["corporate_approval_status"]
          requested_amount?: number
          approved_amount?: number | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          request_notes?: string | null
          approver_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_budget_transactions: {
        Row: {
          id: string
          budget_id: string | null
          booking_id: string | null
          transaction_type: string
          amount: number
          description: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          budget_id?: string | null
          booking_id?: string | null
          transaction_type: string
          amount: number
          description?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          budget_id?: string | null
          booking_id?: string | null
          transaction_type?: string
          amount?: number
          description?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      corporate_budgets: {
        Row: {
          id: string
          company_id: string
          department: string
          fiscal_year: number
          fiscal_quarter: number | null
          allocated_amount: number
          spent_amount: number
          pending_amount: number
          alert_threshold: number | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          department: string
          fiscal_year: number
          fiscal_quarter?: number | null
          allocated_amount?: number
          spent_amount?: number
          pending_amount?: number
          alert_threshold?: number | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          department?: string
          fiscal_year?: number
          fiscal_quarter?: number | null
          allocated_amount?: number
          spent_amount?: number
          pending_amount?: number
          alert_threshold?: number | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      corporate_clients: {
        Row: {
          id: string
          branch_id: string
          company_name: string
          company_address: string | null
          company_phone: string | null
          company_email: string | null
          npwp: string | null
          npwp_name: string | null
          npwp_address: string | null
          pic_id: string | null
          pic_name: string | null
          pic_phone: string | null
          pic_email: string | null
          contract_start: string | null
          contract_end: string | null
          contract_document_url: string | null
          credit_limit: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          company_name: string
          company_address?: string | null
          company_phone?: string | null
          company_email?: string | null
          npwp?: string | null
          npwp_name?: string | null
          npwp_address?: string | null
          pic_id?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          pic_email?: string | null
          contract_start?: string | null
          contract_end?: string | null
          contract_document_url?: string | null
          credit_limit?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          company_name?: string
          company_address?: string | null
          company_phone?: string | null
          company_email?: string | null
          npwp?: string | null
          npwp_name?: string | null
          npwp_address?: string | null
          pic_id?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          pic_email?: string | null
          contract_start?: string | null
          contract_end?: string | null
          contract_document_url?: string | null
          credit_limit?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      corporate_deposit_transactions: {
        Row: {
          id: string
          deposit_id: string
          transaction_type: Database["public"]["Enums"]["corporate_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          employee_id: string | null
          booking_id: string | null
          description: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          deposit_id: string
          transaction_type: Database["public"]["Enums"]["corporate_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          employee_id?: string | null
          booking_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          deposit_id?: string
          transaction_type?: Database["public"]["Enums"]["corporate_transaction_type"]
          amount?: number
          balance_before?: number
          balance_after?: number
          employee_id?: string | null
          booking_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      corporate_deposits: {
        Row: {
          id: string
          corporate_id: string
          balance: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          corporate_id: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          corporate_id?: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_employees: {
        Row: {
          id: string
          corporate_id: string
          user_id: string | null
          employee_id_number: string | null
          full_name: string
          email: string
          phone: string | null
          department: string | null
          allocated_amount: number | null
          used_amount: number | null
          remaining_amount: number | null
          is_active: boolean | null
          invitation_sent_at: string | null
          registered_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          corporate_id: string
          user_id?: string | null
          employee_id_number?: string | null
          full_name: string
          email: string
          phone?: string | null
          department?: string | null
          allocated_amount?: number | null
          used_amount?: number | null
          remaining_amount?: number | null
          is_active?: boolean | null
          invitation_sent_at?: string | null
          registered_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          corporate_id?: string
          user_id?: string | null
          employee_id_number?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          department?: string | null
          allocated_amount?: number | null
          used_amount?: number | null
          remaining_amount?: number | null
          is_active?: boolean | null
          invitation_sent_at?: string | null
          registered_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total_price: number
          booking_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          total_price: number
          booking_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          booking_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      corporate_invoices: {
        Row: {
          id: string
          corporate_id: string
          invoice_number: string
          invoice_date: string
          due_date: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          tax_invoice_number: string | null
          tax_invoice_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          paid_at: string | null
          paid_amount: number | null
          payment_reference: string | null
          pdf_url: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          corporate_id: string
          invoice_number: string
          invoice_date?: string
          due_date: string
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          tax_invoice_number?: string | null
          tax_invoice_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          paid_at?: string | null
          paid_amount?: number | null
          payment_reference?: string | null
          pdf_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          corporate_id?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          tax_invoice_number?: string | null
          tax_invoice_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          paid_at?: string | null
          paid_amount?: number | null
          payment_reference?: string | null
          pdf_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crisis_communication_plans: {
        Row: {
          id: string
          branch_id: string
          plan_name: string
          plan_code: string | null
          description: string | null
          version: string | null
          crisis_type: Database["public"]["Enums"]["crisis_type"]
          escalation_matrix: Json | null
          communication_templates: Json | null
          response_procedures: string[] | null
          emergency_contacts: Json | null
          required_resources: Json | null
          training_requirements: string[] | null
          is_active: boolean | null
          last_reviewed_at: string | null
          reviewed_by: string | null
          next_review_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          plan_name: string
          plan_code?: string | null
          description?: string | null
          version?: string | null
          crisis_type: Database["public"]["Enums"]["crisis_type"]
          escalation_matrix?: Json | null
          communication_templates?: Json | null
          response_procedures?: string[] | null
          emergency_contacts?: Json | null
          required_resources?: Json | null
          training_requirements?: string[] | null
          is_active?: boolean | null
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          next_review_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          plan_name?: string
          plan_code?: string | null
          description?: string | null
          version?: string | null
          crisis_type?: Database["public"]["Enums"]["crisis_type"]
          escalation_matrix?: Json | null
          communication_templates?: Json | null
          response_procedures?: string[] | null
          emergency_contacts?: Json | null
          required_resources?: Json | null
          training_requirements?: string[] | null
          is_active?: boolean | null
          last_reviewed_at?: string | null
          reviewed_by?: string | null
          next_review_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      crisis_drill_records: {
        Row: {
          id: string
          branch_id: string
          plan_id: string | null
          drill_name: string
          drill_type: string
          scenario_description: string | null
          scheduled_at: string
          started_at: string | null
          completed_at: string | null
          duration_minutes: number | null
          participants: Json | null
          objectives_met: Json | null
          gaps_identified: string[] | null
          recommendations: string[] | null
          overall_score: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          plan_id?: string | null
          drill_name: string
          drill_type: string
          scenario_description?: string | null
          scheduled_at: string
          started_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          participants?: Json | null
          objectives_met?: Json | null
          gaps_identified?: string[] | null
          recommendations?: string[] | null
          overall_score?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          plan_id?: string | null
          drill_name?: string
          drill_type?: string
          scenario_description?: string | null
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          participants?: Json | null
          objectives_met?: Json | null
          gaps_identified?: string[] | null
          recommendations?: string[] | null
          overall_score?: number | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      crisis_event_updates: {
        Row: {
          id: string
          event_id: string
          update_type: string
          previous_level: Database["public"]["Enums"]["escalation_level"] | null
          new_level: Database["public"]["Enums"]["escalation_level"] | null
          title: string
          description: string | null
          actions_taken: string[] | null
          attachment_urls: string[] | null
          updated_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          update_type: string
          previous_level?: Database["public"]["Enums"]["escalation_level"] | null
          new_level?: Database["public"]["Enums"]["escalation_level"] | null
          title: string
          description?: string | null
          actions_taken?: string[] | null
          attachment_urls?: string[] | null
          updated_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          update_type?: string
          previous_level?: Database["public"]["Enums"]["escalation_level"] | null
          new_level?: Database["public"]["Enums"]["escalation_level"] | null
          title?: string
          description?: string | null
          actions_taken?: string[] | null
          attachment_urls?: string[] | null
          updated_by?: string
          created_at?: string | null
        }
        Relationships: []
      }
      crisis_events: {
        Row: {
          id: string
          branch_id: string
          trip_id: string | null
          plan_id: string | null
          event_code: string | null
          crisis_type: Database["public"]["Enums"]["crisis_type"]
          title: string
          description: string | null
          location_name: string | null
          latitude: number | null
          longitude: number | null
          current_level: Database["public"]["Enums"]["escalation_level"]
          status: string | null
          occurred_at: string
          detected_at: string
          contained_at: string | null
          resolved_at: string | null
          people_affected: number | null
          injuries_count: number | null
          fatalities_count: number | null
          communications_log: Json | null
          resolution_summary: string | null
          lessons_learned: string | null
          follow_up_actions: string[] | null
          reported_by: string
          incident_commander: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_id?: string | null
          plan_id?: string | null
          event_code?: string | null
          crisis_type: Database["public"]["Enums"]["crisis_type"]
          title: string
          description?: string | null
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          current_level?: Database["public"]["Enums"]["escalation_level"]
          status?: string | null
          occurred_at: string
          detected_at: string
          contained_at?: string | null
          resolved_at?: string | null
          people_affected?: number | null
          injuries_count?: number | null
          fatalities_count?: number | null
          communications_log?: Json | null
          resolution_summary?: string | null
          lessons_learned?: string | null
          follow_up_actions?: string[] | null
          reported_by: string
          incident_commander?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_id?: string | null
          plan_id?: string | null
          event_code?: string | null
          crisis_type?: Database["public"]["Enums"]["crisis_type"]
          title?: string
          description?: string | null
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          current_level?: Database["public"]["Enums"]["escalation_level"]
          status?: string | null
          occurred_at?: string
          detected_at?: string
          contained_at?: string | null
          resolved_at?: string | null
          people_affected?: number | null
          injuries_count?: number | null
          fatalities_count?: number | null
          communications_log?: Json | null
          resolution_summary?: string | null
          lessons_learned?: string | null
          follow_up_actions?: string[] | null
          reported_by?: string
          incident_commander?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_job_logs: {
        Row: {
          id: string
          job_name: string
          job_type: string
          started_at: string
          completed_at: string | null
          status: Database["public"]["Enums"]["cron_job_status"]
          records_processed: number | null
          error_message: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          job_name: string
          job_type: string
          started_at?: string
          completed_at?: string | null
          status?: Database["public"]["Enums"]["cron_job_status"]
          records_processed?: number | null
          error_message?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          job_name?: string
          job_type?: string
          started_at?: string
          completed_at?: string | null
          status?: Database["public"]["Enums"]["cron_job_status"]
          records_processed?: number | null
          error_message?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          id: string
          report_name: string
          description: string | null
          report_type: string
          data_source: string
          columns: Json
          filters: Json | null
          grouping: Json | null
          sorting: Json | null
          aggregations: Json | null
          chart_type: string | null
          chart_config: Json | null
          schedule_enabled: boolean | null
          schedule_cron: string | null
          schedule_recipients: string[] | null
          last_run_at: string | null
          next_run_at: string | null
          is_public: boolean | null
          shared_with: string[] | null
          created_by: string
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          report_name: string
          description?: string | null
          report_type: string
          data_source: string
          columns: Json
          filters?: Json | null
          grouping?: Json | null
          sorting?: Json | null
          aggregations?: Json | null
          chart_type?: string | null
          chart_config?: Json | null
          schedule_enabled?: boolean | null
          schedule_cron?: string | null
          schedule_recipients?: string[] | null
          last_run_at?: string | null
          next_run_at?: string | null
          is_public?: boolean | null
          shared_with?: string[] | null
          created_by: string
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          report_name?: string
          description?: string | null
          report_type?: string
          data_source?: string
          columns?: Json
          filters?: Json | null
          grouping?: Json | null
          sorting?: Json | null
          aggregations?: Json | null
          chart_type?: string | null
          chart_config?: Json | null
          schedule_enabled?: boolean | null
          schedule_cron?: string | null
          schedule_recipients?: string[] | null
          last_run_at?: string | null
          next_run_at?: string | null
          is_public?: boolean | null
          shared_with?: string[] | null
          created_by?: string
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_communications: {
        Row: {
          id: string
          customer_id: string
          communication_type: string
          direction: string | null
          subject: string | null
          content: string | null
          outcome: string | null
          follow_up_required: boolean | null
          follow_up_date: string | null
          follow_up_notes: string | null
          booking_id: string | null
          attachments: Json | null
          metadata: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          communication_type: string
          direction?: string | null
          subject?: string | null
          content?: string | null
          outcome?: string | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          booking_id?: string | null
          attachments?: Json | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          communication_type?: string
          direction?: string | null
          subject?: string | null
          content?: string | null
          outcome?: string | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          booking_id?: string | null
          attachments?: Json | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          booking_id: string | null
          refund_id: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          booking_id?: string | null
          refund_id?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          transaction_type?: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          amount?: number
          balance_before?: number
          balance_after?: number
          booking_id?: string | null
          refund_id?: string | null
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      customer_wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_breach_incidents: {
        Row: {
          id: string
          incident_date: string
          detected_at: string
          severity: string
          affected_data_types: string[]
          affected_users_count: number | null
          affected_user_ids: string[] | null
          title: string
          description: string
          root_cause: string | null
          attack_vector: string | null
          remediation_steps: string | null
          remediation_completed_at: string | null
          notification_sent_at: string | null
          notification_method: string | null
          reported_to_authority_at: string | null
          authority_report_number: string | null
          status: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          incident_date: string
          detected_at: string
          severity: string
          affected_data_types: string[]
          affected_users_count?: number | null
          affected_user_ids?: string[] | null
          title: string
          description: string
          root_cause?: string | null
          attack_vector?: string | null
          remediation_steps?: string | null
          remediation_completed_at?: string | null
          notification_sent_at?: string | null
          notification_method?: string | null
          reported_to_authority_at?: string | null
          authority_report_number?: string | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          incident_date?: string
          detected_at?: string
          severity?: string
          affected_data_types?: string[]
          affected_users_count?: number | null
          affected_user_ids?: string[] | null
          title?: string
          description?: string
          root_cause?: string | null
          attack_vector?: string | null
          remediation_steps?: string | null
          remediation_completed_at?: string | null
          notification_sent_at?: string | null
          notification_method?: string | null
          reported_to_authority_at?: string | null
          authority_report_number?: string | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          id: string
          user_id: string
          request_type: string
          export_format: string | null
          status: string | null
          file_url: string | null
          file_size_bytes: number | null
          expires_at: string | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          request_type: string
          export_format?: string | null
          status?: string | null
          file_url?: string | null
          file_size_bytes?: number | null
          expires_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          request_type?: string
          export_format?: string | null
          status?: string | null
          file_url?: string | null
          file_size_bytes?: number | null
          expires_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      data_retention_logs: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          retention_days: number
          original_trip_date: string | null
          deleted_at: string
          files_deleted: string[] | null
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          retention_days: number
          original_trip_date?: string | null
          deleted_at?: string
          files_deleted?: string[] | null
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          retention_days?: number
          original_trip_date?: string | null
          deleted_at?: string
          files_deleted?: string[] | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          id: string
          data_type: string
          table_name: string
          description: string | null
          retention_days: number
          legal_basis: string | null
          auto_delete_enabled: boolean | null
          delete_function_name: string | null
          last_cleanup_at: string | null
          next_cleanup_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          data_type: string
          table_name: string
          description?: string | null
          retention_days: number
          legal_basis?: string | null
          auto_delete_enabled?: boolean | null
          delete_function_name?: string | null
          last_cleanup_at?: string | null
          next_cleanup_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          data_type?: string
          table_name?: string
          description?: string | null
          retention_days?: number
          legal_basis?: string | null
          auto_delete_enabled?: boolean | null
          delete_function_name?: string | null
          last_cleanup_at?: string | null
          next_cleanup_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      destination_risk_history: {
        Row: {
          id: string
          destination_id: string
          previous_threat_level: Database["public"]["Enums"]["threat_level"] | null
          new_threat_level: Database["public"]["Enums"]["threat_level"] | null
          previous_risk_factors: Json | null
          new_risk_factors: Json | null
          change_reason: string | null
          changed_by: string
          changed_at: string | null
        }
        Insert: {
          id?: string
          destination_id: string
          previous_threat_level?: Database["public"]["Enums"]["threat_level"] | null
          new_threat_level?: Database["public"]["Enums"]["threat_level"] | null
          previous_risk_factors?: Json | null
          new_risk_factors?: Json | null
          change_reason?: string | null
          changed_by: string
          changed_at?: string | null
        }
        Update: {
          id?: string
          destination_id?: string
          previous_threat_level?: Database["public"]["Enums"]["threat_level"] | null
          new_threat_level?: Database["public"]["Enums"]["threat_level"] | null
          previous_risk_factors?: Json | null
          new_risk_factors?: Json | null
          change_reason?: string | null
          changed_by?: string
          changed_at?: string | null
        }
        Relationships: []
      }
      destination_risk_profiles: {
        Row: {
          id: string
          branch_id: string
          location_name: string
          location_code: string | null
          description: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          risk_category: Database["public"]["Enums"]["risk_category"]
          threat_level: Database["public"]["Enums"]["threat_level"]
          risk_factors: Json | null
          seasonal_risks: Json | null
          mitigation_measures: string[] | null
          required_equipment: string[] | null
          emergency_procedures: string[] | null
          last_assessed_at: string | null
          assessed_by: string | null
          valid_until: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          location_name: string
          location_code?: string | null
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          risk_category?: Database["public"]["Enums"]["risk_category"]
          threat_level?: Database["public"]["Enums"]["threat_level"]
          risk_factors?: Json | null
          seasonal_risks?: Json | null
          mitigation_measures?: string[] | null
          required_equipment?: string[] | null
          emergency_procedures?: string[] | null
          last_assessed_at?: string | null
          assessed_by?: string | null
          valid_until?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          location_name?: string
          location_code?: string | null
          description?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          risk_category?: Database["public"]["Enums"]["risk_category"]
          threat_level?: Database["public"]["Enums"]["threat_level"]
          risk_factors?: Json | null
          seasonal_risks?: Json | null
          mitigation_measures?: string[] | null
          required_equipment?: string[] | null
          emergency_procedures?: string[] | null
          last_assessed_at?: string | null
          assessed_by?: string | null
          valid_until?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      discount_code_usage: {
        Row: {
          id: string
          discount_code_id: string
          user_id: string | null
          booking_id: string | null
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          discount_code_id: string
          user_id?: string | null
          booking_id?: string | null
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          discount_code_id?: string
          user_id?: string | null
          booking_id?: string | null
          discount_amount?: number
          used_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          max_discount_amount: number | null
          min_order_amount: number | null
          max_uses: number | null
          max_uses_per_user: number | null
          used_count: number | null
          valid_from: string
          valid_until: string | null
          branch_id: string | null
          package_ids: string[] | null
          customer_type: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          max_discount_amount?: number | null
          min_order_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
          branch_id?: string | null
          package_ids?: string[] | null
          customer_type?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          max_discount_amount?: number | null
          min_order_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
          branch_id?: string | null
          package_ids?: string[] | null
          customer_type?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      disposal_methods_lookup: {
        Row: {
          id: string
          method_name: string
          description: string | null
          is_eco_friendly: boolean | null
          icon: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          method_name: string
          description?: string | null
          is_eco_friendly?: boolean | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          method_name?: string
          description?: string | null
          is_eco_friendly?: boolean | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          id: string
          campaign_name: string
          subject: string
          preview_text: string | null
          content_html: string
          content_text: string | null
          segment_conditions: Json | null
          exclude_conditions: Json | null
          scheduled_for: string | null
          sent_at: string | null
          recipient_count: number | null
          sent_count: number | null
          delivered_count: number | null
          opened_count: number | null
          clicked_count: number | null
          bounced_count: number | null
          unsubscribed_count: number | null
          status: string | null
          template_id: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          campaign_name: string
          subject: string
          preview_text?: string | null
          content_html: string
          content_text?: string | null
          segment_conditions?: Json | null
          exclude_conditions?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          recipient_count?: number | null
          sent_count?: number | null
          delivered_count?: number | null
          opened_count?: number | null
          clicked_count?: number | null
          bounced_count?: number | null
          unsubscribed_count?: number | null
          status?: string | null
          template_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          campaign_name?: string
          subject?: string
          preview_text?: string | null
          content_html?: string
          content_text?: string | null
          segment_conditions?: Json | null
          exclude_conditions?: Json | null
          scheduled_for?: string | null
          sent_at?: string | null
          recipient_count?: number | null
          sent_count?: number | null
          delivered_count?: number | null
          opened_count?: number | null
          clicked_count?: number | null
          bounced_count?: number | null
          unsubscribed_count?: number | null
          status?: string | null
          template_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          template_key: string
          name: string
          subject_template: string
          body_html_template: string
          body_text_template: string | null
          variables: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          key: string | null
        }
        Insert: {
          id?: string
          template_key: string
          name: string
          subject_template: string
          body_html_template: string
          body_text_template?: string | null
          variables?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          key?: string | null
        }
        Update: {
          id?: string
          template_key?: string
          name?: string
          subject_template?: string
          body_html_template?: string
          body_text_template?: string | null
          variables?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          key?: string | null
        }
        Relationships: []
      }
      emergency_notifications_log: {
        Row: {
          id: string
          branch_id: string | null
          reference_type: string
          reference_id: string
          recipient_name: string
          recipient_phone: string | null
          recipient_email: string | null
          relationship: string | null
          notification_type: string
          message_template: string | null
          message_content: string | null
          status: string | null
          sent_at: string | null
          delivered_at: string | null
          acknowledged_at: string | null
          error_message: string | null
          retry_count: number | null
          sent_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          reference_type: string
          reference_id: string
          recipient_name: string
          recipient_phone?: string | null
          recipient_email?: string | null
          relationship?: string | null
          notification_type: string
          message_template?: string | null
          message_content?: string | null
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          acknowledged_at?: string | null
          error_message?: string | null
          retry_count?: number | null
          sent_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          reference_type?: string
          reference_id?: string
          recipient_name?: string
          recipient_phone?: string | null
          recipient_email?: string | null
          relationship?: string | null
          notification_type?: string
          message_template?: string | null
          message_content?: string | null
          status?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          acknowledged_at?: string | null
          error_message?: string | null
          retry_count?: number | null
          sent_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          id: string
          employee_id: string
          attendance_date: string
          check_in_time: string | null
          check_out_time: string | null
          status: string | null
          late_minutes: number | null
          overtime_minutes: number | null
          work_hours: number | null
          notes: string | null
          location: string | null
          check_in_location: Json | null
          check_out_location: Json | null
          recorded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          attendance_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: string | null
          late_minutes?: number | null
          overtime_minutes?: number | null
          work_hours?: number | null
          notes?: string | null
          location?: string | null
          check_in_location?: Json | null
          check_out_location?: Json | null
          recorded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          attendance_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: string | null
          late_minutes?: number | null
          overtime_minutes?: number | null
          work_hours?: number | null
          notes?: string | null
          location?: string | null
          check_in_location?: Json | null
          check_out_location?: Json | null
          recorded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          id: string
          category_name: string
          description: string | null
          icon: string | null
          requires_receipt: boolean | null
          max_amount: number | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          category_name: string
          description?: string | null
          icon?: string | null
          requires_receipt?: boolean | null
          max_amount?: number | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          category_name?: string
          description?: string | null
          icon?: string | null
          requires_receipt?: boolean | null
          max_amount?: number | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_requests: {
        Row: {
          id: string
          branch_id: string
          request_code: string
          category: Database["public"]["Enums"]["expense_category"]
          description: string
          amount: number
          vendor_id: string | null
          vendor_name: string | null
          trip_id: string | null
          status: Database["public"]["Enums"]["expense_request_status"]
          approval_level: number | null
          approved_by: string | null
          approved_at: string | null
          approval_notes: string | null
          rejected_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          paid_by: string | null
          paid_at: string | null
          payment_proof_url: string | null
          requested_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          request_code: string
          category: Database["public"]["Enums"]["expense_category"]
          description: string
          amount: number
          vendor_id?: string | null
          vendor_name?: string | null
          trip_id?: string | null
          status?: Database["public"]["Enums"]["expense_request_status"]
          approval_level?: number | null
          approved_by?: string | null
          approved_at?: string | null
          approval_notes?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          paid_by?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          requested_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          request_code?: string
          category?: Database["public"]["Enums"]["expense_category"]
          description?: string
          amount?: number
          vendor_id?: string | null
          vendor_name?: string | null
          trip_id?: string | null
          status?: Database["public"]["Enums"]["expense_request_status"]
          approval_level?: number | null
          approved_by?: string | null
          approved_at?: string | null
          approval_notes?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          paid_by?: string | null
          paid_at?: string | null
          payment_proof_url?: string | null
          requested_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          id: string
          app_type: string | null
          package_id: string | null
          category: string | null
          question: string
          answer: string
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_type?: string | null
          package_id?: string | null
          category?: string | null
          question: string
          answer: string
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_type?: string | null
          package_id?: string | null
          category?: string | null
          question?: string
          answer?: string
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_analytics_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          event_name: string
          event_category: string
          event_action: string
          event_label: string | null
          event_value: number | null
          feature_name: string | null
          feature_variant: string | null
          page_url: string | null
          page_title: string | null
          referrer: string | null
          user_agent: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          page_load_time: number | null
          time_to_interactive: number | null
          first_contentful_paint: number | null
          properties: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          event_name: string
          event_category: string
          event_action: string
          event_label?: string | null
          event_value?: number | null
          feature_name?: string | null
          feature_variant?: string | null
          page_url?: string | null
          page_title?: string | null
          referrer?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          page_load_time?: number | null
          time_to_interactive?: number | null
          first_contentful_paint?: number | null
          properties?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          event_name?: string
          event_category?: string
          event_action?: string
          event_label?: string | null
          event_value?: number | null
          feature_name?: string | null
          feature_variant?: string | null
          page_url?: string | null
          page_title?: string | null
          referrer?: string | null
          user_agent?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          page_load_time?: number | null
          time_to_interactive?: number | null
          first_contentful_paint?: number | null
          properties?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          id: string
          flag_key: string
          flag_name: string
          description: string | null
          is_enabled: boolean | null
          rollout_percentage: number | null
          target_users: string[] | null
          target_roles: string[] | null
          target_branches: string[] | null
          conditions: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          flag_key: string
          flag_name: string
          description?: string | null
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_users?: string[] | null
          target_roles?: string[] | null
          target_branches?: string[] | null
          conditions?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          flag_key?: string
          flag_name?: string
          description?: string | null
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_users?: string[] | null
          target_roles?: string[] | null
          target_branches?: string[] | null
          conditions?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      filter_usage_stats: {
        Row: {
          id: string
          filter_id: string | null
          user_id: string | null
          used_at: string | null
          result_count: number | null
        }
        Insert: {
          id?: string
          filter_id?: string | null
          user_id?: string | null
          used_at?: string | null
          result_count?: number | null
        }
        Update: {
          id?: string
          filter_id?: string | null
          user_id?: string | null
          used_at?: string | null
          result_count?: number | null
        }
        Relationships: []
      }
      gift_vouchers: {
        Row: {
          id: string
          partner_id: string
          code: string
          amount: number
          currency: string | null
          recipient_name: string
          recipient_email: string | null
          recipient_phone: string | null
          sender_name: string
          message: string | null
          status: string
          expires_at: string
          redeemed_at: string | null
          redeemed_by: string | null
          redeemed_booking_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          code: string
          amount: number
          currency?: string | null
          recipient_name: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sender_name: string
          message?: string | null
          status?: string
          expires_at: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_booking_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          code?: string
          amount?: number
          currency?: string | null
          recipient_name?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          sender_name?: string
          message?: string | null
          status?: string
          expires_at?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          redeemed_booking_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gps_pings: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          latitude: number
          longitude: number
          accuracy_meters: number | null
          altitude_meters: number | null
          heading: number | null
          speed_kmh: number | null
          battery_percent: number | null
          is_charging: boolean | null
          network_type: string | null
          recorded_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          latitude: number
          longitude: number
          accuracy_meters?: number | null
          altitude_meters?: number | null
          heading?: number | null
          speed_kmh?: number | null
          battery_percent?: number | null
          is_charging?: boolean | null
          network_type?: string | null
          recorded_at?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          latitude?: number
          longitude?: number
          accuracy_meters?: number | null
          altitude_meters?: number | null
          heading?: number | null
          speed_kmh?: number | null
          battery_percent?: number | null
          is_charging?: boolean | null
          network_type?: string | null
          recorded_at?: string
          created_at?: string | null
        }
        Relationships: []
      }
      guide_assessment_templates: {
        Row: {
          id: string
          branch_id: string | null
          name: string
          description: string | null
          category: string
          version: number | null
          assessment_type: string
          estimated_minutes: number | null
          passing_score: number | null
          questions: Json
          scoring_config: Json | null
          result_categories: Json | null
          is_recurring: boolean | null
          recurrence_interval: number | null
          is_required: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          name: string
          description?: string | null
          category: string
          version?: number | null
          assessment_type: string
          estimated_minutes?: number | null
          passing_score?: number | null
          questions: Json
          scoring_config?: Json | null
          result_categories?: Json | null
          is_recurring?: boolean | null
          recurrence_interval?: number | null
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          name?: string
          description?: string | null
          category?: string
          version?: number | null
          assessment_type?: string
          estimated_minutes?: number | null
          passing_score?: number | null
          questions?: Json
          scoring_config?: Json | null
          result_categories?: Json | null
          is_recurring?: boolean | null
          recurrence_interval?: number | null
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_assessments: {
        Row: {
          id: string
          guide_id: string
          template_id: string
          started_at: string | null
          completed_at: string | null
          answers: Json
          score: number | null
          category: string | null
          insights: Json | null
          status: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          template_id: string
          started_at?: string | null
          completed_at?: string | null
          answers?: Json
          score?: number | null
          category?: string | null
          insights?: Json | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          template_id?: string
          started_at?: string | null
          completed_at?: string | null
          answers?: Json
          score?: number | null
          category?: string | null
          insights?: Json | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_assignment_audit_logs: {
        Row: {
          id: string
          trip_id: string | null
          guide_id: string | null
          branch_id: string | null
          action_type: string
          action_details: Json | null
          performed_by: string | null
          performed_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          guide_id?: string | null
          branch_id?: string | null
          action_type: string
          action_details?: Json | null
          performed_by?: string | null
          performed_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          guide_id?: string | null
          branch_id?: string | null
          action_type?: string
          action_details?: Json | null
          performed_by?: string | null
          performed_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_availability: {
        Row: {
          id: string
          guide_id: string
          available_from: string
          available_until: string
          status: Database["public"]["Enums"]["guide_availability_status"]
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          available_from: string
          available_until: string
          status: Database["public"]["Enums"]["guide_availability_status"]
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          available_from?: string
          available_until?: string
          status?: Database["public"]["Enums"]["guide_availability_status"]
          reason?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_bank_accounts: {
        Row: {
          id: string
          guide_id: string
          bank_name: string
          account_number: string
          account_holder_name: string
          branch_name: string | null
          branch_code: string | null
          status: string
          rejection_reason: string | null
          approved_by: string | null
          approved_at: string | null
          rejected_by: string | null
          rejected_at: string | null
          verification_notes: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
          original_data: Json | null
          edit_requested_at: string | null
          edit_requested_by: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          bank_name: string
          account_number: string
          account_holder_name: string
          branch_name?: string | null
          branch_code?: string | null
          status?: string
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          verification_notes?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          original_data?: Json | null
          edit_requested_at?: string | null
          edit_requested_by?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          bank_name?: string
          account_number?: string
          account_holder_name?: string
          branch_name?: string | null
          branch_code?: string | null
          status?: string
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          verification_notes?: string | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          original_data?: Json | null
          edit_requested_at?: string | null
          edit_requested_by?: string | null
        }
        Relationships: []
      }
      guide_certifications: {
        Row: {
          id: string
          guide_id: string
          module_id: string
          certificate_number: string | null
          issued_at: string | null
          expires_at: string | null
          is_valid: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          module_id: string
          certificate_number?: string | null
          issued_at?: string | null
          expires_at?: string | null
          is_valid?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          module_id?: string
          certificate_number?: string | null
          issued_at?: string | null
          expires_at?: string | null
          is_valid?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_certifications_tracker: {
        Row: {
          id: string
          guide_id: string
          certification_type: string
          certification_name: string
          issuer: string | null
          certification_number: string | null
          issue_date: string | null
          expiry_date: string | null
          status: string | null
          document_url: string | null
          verification_note: string | null
          verified_by: string | null
          verified_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          branch_id: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          certification_type: string
          certification_name: string
          issuer?: string | null
          certification_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          status?: string | null
          document_url?: string | null
          verification_note?: string | null
          verified_by?: string | null
          verified_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          branch_id?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          certification_type?: string
          certification_name?: string
          issuer?: string | null
          certification_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          status?: string | null
          document_url?: string | null
          verification_note?: string | null
          verified_by?: string | null
          verified_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          branch_id?: string | null
        }
        Relationships: []
      }
      guide_challenges: {
        Row: {
          id: string
          guide_id: string
          challenge_type: string
          title: string
          description: string | null
          target_value: number
          current_value: number | null
          start_date: string
          target_date: string | null
          status: string | null
          completed_at: string | null
          reward_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          challenge_type: string
          title: string
          description?: string | null
          target_value: number
          current_value?: number | null
          start_date?: string
          target_date?: string | null
          status?: string | null
          completed_at?: string | null
          reward_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          challenge_type?: string
          title?: string
          description?: string | null
          target_value?: number
          current_value?: number | null
          start_date?: string
          target_date?: string | null
          status?: string | null
          completed_at?: string | null
          reward_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_competency_assessments: {
        Row: {
          id: string
          guide_id: string
          certification_type: string
          assessment_date: string
          assessor_name: string | null
          assessor_institution: string | null
          assessor_license_number: string | null
          knowledge_score: number | null
          skill_score: number | null
          attitude_score: number | null
          overall_score: number | null
          result: string | null
          competency_gaps: string[] | null
          recommendations: string | null
          certificate_number: string | null
          certificate_url: string | null
          certificate_valid_until: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          certification_type: string
          assessment_date: string
          assessor_name?: string | null
          assessor_institution?: string | null
          assessor_license_number?: string | null
          knowledge_score?: number | null
          skill_score?: number | null
          attitude_score?: number | null
          overall_score?: number | null
          result?: string | null
          competency_gaps?: string[] | null
          recommendations?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          certificate_valid_until?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          certification_type?: string
          assessment_date?: string
          assessor_name?: string | null
          assessor_institution?: string | null
          assessor_license_number?: string | null
          knowledge_score?: number | null
          skill_score?: number | null
          attitude_score?: number | null
          overall_score?: number | null
          result?: string | null
          competency_gaps?: string[] | null
          recommendations?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          certificate_valid_until?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_competency_unit_progress: {
        Row: {
          id: string
          guide_id: string
          unit_id: string
          status: string | null
          score: number | null
          attempts_count: number | null
          started_at: string | null
          completed_at: string | null
          expires_at: string | null
          evidence_urls: string[] | null
          assessor_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          unit_id: string
          status?: string | null
          score?: number | null
          attempts_count?: number | null
          started_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
          evidence_urls?: string[] | null
          assessor_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          unit_id?: string
          status?: string | null
          score?: number | null
          attempts_count?: number | null
          started_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
          evidence_urls?: string[] | null
          assessor_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_compliance_education_logs: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          section_read: string
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          section_read: string
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          section_read?: string
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_contract_payments: {
        Row: {
          id: string
          contract_id: string
          wallet_transaction_id: string | null
          amount: number
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          wallet_transaction_id?: string | null
          amount: number
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          wallet_transaction_id?: string | null
          amount?: number
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_contract_resignations: {
        Row: {
          id: string
          contract_id: string
          guide_id: string
          branch_id: string | null
          status: Database["public"]["Enums"]["guide_resign_status"] | null
          reason: string
          effective_date: string
          notice_period_days: number | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          rejection_reason: string | null
          submitted_at: string | null
          withdrawn_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          guide_id: string
          branch_id?: string | null
          status?: Database["public"]["Enums"]["guide_resign_status"] | null
          reason: string
          effective_date: string
          notice_period_days?: number | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          withdrawn_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          guide_id?: string
          branch_id?: string | null
          status?: Database["public"]["Enums"]["guide_resign_status"] | null
          reason?: string
          effective_date?: string
          notice_period_days?: number | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          withdrawn_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_contract_sanctions: {
        Row: {
          id: string
          contract_id: string
          guide_id: string
          branch_id: string | null
          sanction_type: Database["public"]["Enums"]["guide_sanction_type"]
          severity: Database["public"]["Enums"]["guide_sanction_severity"]
          title: string
          description: string
          violation_date: string
          action_taken: string | null
          fine_amount: number | null
          suspension_start_date: string | null
          suspension_end_date: string | null
          status: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          issued_by: string
          issued_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          guide_id: string
          branch_id?: string | null
          sanction_type: Database["public"]["Enums"]["guide_sanction_type"]
          severity?: Database["public"]["Enums"]["guide_sanction_severity"]
          title: string
          description: string
          violation_date: string
          action_taken?: string | null
          fine_amount?: number | null
          suspension_start_date?: string | null
          suspension_end_date?: string | null
          status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          issued_by: string
          issued_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          guide_id?: string
          branch_id?: string | null
          sanction_type?: Database["public"]["Enums"]["guide_sanction_type"]
          severity?: Database["public"]["Enums"]["guide_sanction_severity"]
          title?: string
          description?: string
          violation_date?: string
          action_taken?: string | null
          fine_amount?: number | null
          suspension_start_date?: string | null
          suspension_end_date?: string | null
          status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          issued_by?: string
          issued_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_contract_trips: {
        Row: {
          id: string
          contract_id: string
          trip_id: string | null
          trip_code: string | null
          trip_date: string | null
          fee_amount: number
          status: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          trip_id?: string | null
          trip_code?: string | null
          trip_date?: string | null
          fee_amount: number
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          trip_id?: string | null
          trip_code?: string | null
          trip_date?: string | null
          fee_amount?: number
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_contracts: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          contract_number: string | null
          contract_type: Database["public"]["Enums"]["guide_contract_type"]
          title: string
          description: string | null
          start_date: string
          end_date: string | null
          fee_amount: number | null
          fee_type: string
          payment_terms: string | null
          terms_and_conditions: Json | null
          status: Database["public"]["Enums"]["guide_contract_status"] | null
          guide_signed_at: string | null
          guide_signature_url: string | null
          company_signed_at: string | null
          company_signature_url: string | null
          signed_pdf_url: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          expires_at: string | null
          terminated_at: string | null
          termination_reason: string | null
          terminated_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          is_master_contract: boolean | null
          auto_cover_trips: boolean | null
          renewal_date: string | null
          previous_contract_id: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          contract_number?: string | null
          contract_type: Database["public"]["Enums"]["guide_contract_type"]
          title: string
          description?: string | null
          start_date: string
          end_date?: string | null
          fee_amount?: number | null
          fee_type?: string
          payment_terms?: string | null
          terms_and_conditions?: Json | null
          status?: Database["public"]["Enums"]["guide_contract_status"] | null
          guide_signed_at?: string | null
          guide_signature_url?: string | null
          company_signed_at?: string | null
          company_signature_url?: string | null
          signed_pdf_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          terminated_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          is_master_contract?: boolean | null
          auto_cover_trips?: boolean | null
          renewal_date?: string | null
          previous_contract_id?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          contract_number?: string | null
          contract_type?: Database["public"]["Enums"]["guide_contract_type"]
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string | null
          fee_amount?: number | null
          fee_type?: string
          payment_terms?: string | null
          terms_and_conditions?: Json | null
          status?: Database["public"]["Enums"]["guide_contract_status"] | null
          guide_signed_at?: string | null
          guide_signature_url?: string | null
          company_signed_at?: string | null
          company_signature_url?: string | null
          signed_pdf_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          expires_at?: string | null
          terminated_at?: string | null
          termination_reason?: string | null
          terminated_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          is_master_contract?: boolean | null
          auto_cover_trips?: boolean | null
          renewal_date?: string | null
          previous_contract_id?: string | null
        }
        Relationships: []
      }
      guide_document_verifications: {
        Row: {
          id: string
          application_id: string
          document_type: string
          document_url: string
          verification_status: string
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          extracted_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          document_type: string
          document_url: string
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          extracted_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          document_type?: string
          document_url?: string
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          extracted_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_documents: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          document_type: string
          document_name: string
          description: string | null
          file_url: string
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          verification_status: string
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          extracted_data: Json | null
          expiry_date: string | null
          is_required: boolean | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          document_type: string
          document_name: string
          description?: string | null
          file_url: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          extracted_data?: Json | null
          expiry_date?: string | null
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          document_type?: string
          document_name?: string
          description?: string | null
          file_url?: string
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          verification_status?: string
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          extracted_data?: Json | null
          expiry_date?: string | null
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_emergency_contacts: {
        Row: {
          id: string
          guide_id: string
          name: string
          relationship: string | null
          phone: string
          email: string | null
          priority: number | null
          auto_notify: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          name: string
          relationship?: string | null
          phone: string
          email?: string | null
          priority?: number | null
          auto_notify?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          name?: string
          relationship?: string | null
          phone?: string
          email?: string | null
          priority?: number | null
          auto_notify?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_equipment_checklists: {
        Row: {
          id: string
          trip_id: string | null
          guide_id: string
          branch_id: string
          equipment_items: Json
          completed_at: string | null
          is_completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          guide_id: string
          branch_id: string
          equipment_items?: Json
          completed_at?: string | null
          is_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          guide_id?: string
          branch_id?: string
          equipment_items?: Json
          completed_at?: string | null
          is_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_equipment_reports: {
        Row: {
          id: string
          equipment_checklist_id: string | null
          trip_id: string | null
          guide_id: string
          branch_id: string
          equipment_name: string
          equipment_type: string | null
          issue_type: string
          description: string
          photo_url: string | null
          severity: string | null
          status: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          equipment_checklist_id?: string | null
          trip_id?: string | null
          guide_id: string
          branch_id: string
          equipment_name: string
          equipment_type?: string | null
          issue_type: string
          description: string
          photo_url?: string | null
          severity?: string | null
          status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          equipment_checklist_id?: string | null
          trip_id?: string | null
          guide_id?: string
          branch_id?: string
          equipment_name?: string
          equipment_type?: string | null
          issue_type?: string
          description?: string
          photo_url?: string | null
          severity?: string | null
          status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_feedback_attachments: {
        Row: {
          id: string
          feedback_id: string
          file_url: string
          file_type: string
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          feedback_id: string
          file_url: string
          file_type: string
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          feedback_id?: string
          file_url?: string
          file_type?: string
          file_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      guide_feedbacks: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          feedback_type: string
          rating: number | null
          title: string
          message: string
          is_anonymous: boolean | null
          status: string
          admin_response: string | null
          admin_id: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          feedback_type: string
          rating?: number | null
          title: string
          message: string
          is_anonymous?: boolean | null
          status?: string
          admin_response?: string | null
          admin_id?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          feedback_type?: string
          rating?: number | null
          title?: string
          message?: string
          is_anonymous?: boolean | null
          status?: string
          admin_response?: string | null
          admin_id?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_id_cards: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          card_number: string
          issue_date: string
          expiry_date: string
          status: string
          qr_code_url: string | null
          qr_code_data: string
          verification_token: string
          issued_by: string | null
          revoked_by: string | null
          revoked_at: string | null
          revoked_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          card_number: string
          issue_date?: string
          expiry_date: string
          status?: string
          qr_code_url?: string | null
          qr_code_data: string
          verification_token: string
          issued_by?: string | null
          revoked_by?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          card_number?: string
          issue_date?: string
          expiry_date?: string
          status?: string
          qr_code_url?: string | null
          qr_code_data?: string
          verification_token?: string
          issued_by?: string | null
          revoked_by?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_license_applications: {
        Row: {
          id: string
          guide_id: string
          branch_id: string | null
          application_number: string
          applied_at: string
          status: Database["public"]["Enums"]["guide_license_status"]
          current_stage: string
          application_data: Json
          documents: Json | null
          assessment_results: Json | null
          training_progress: Json | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          approval_decision: string | null
          approval_notes: string | null
          approved_by: string | null
          approved_at: string | null
          rejected_by: string | null
          rejected_at: string | null
          rejection_reason: string | null
          license_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id?: string | null
          application_number: string
          applied_at?: string
          status?: Database["public"]["Enums"]["guide_license_status"]
          current_stage?: string
          application_data: Json
          documents?: Json | null
          assessment_results?: Json | null
          training_progress?: Json | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approval_decision?: string | null
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          license_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string | null
          application_number?: string
          applied_at?: string
          status?: Database["public"]["Enums"]["guide_license_status"]
          current_stage?: string
          application_data?: Json
          documents?: Json | null
          assessment_results?: Json | null
          training_progress?: Json | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approval_decision?: string | null
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejected_by?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          license_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_locations: {
        Row: {
          id: string
          guide_id: string
          trip_id: string | null
          latitude: number
          longitude: number
          accuracy_meters: number | null
          is_online: boolean | null
          last_seen_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          trip_id?: string | null
          latitude: number
          longitude: number
          accuracy_meters?: number | null
          is_online?: boolean | null
          last_seen_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          trip_id?: string | null
          latitude?: number
          longitude?: number
          accuracy_meters?: number | null
          is_online?: boolean | null
          last_seen_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_mandatory_training_assignments: {
        Row: {
          id: string
          mandatory_training_id: string
          guide_id: string
          due_date: string
          completed_at: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          last_reminder_sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          mandatory_training_id: string
          guide_id: string
          due_date: string
          completed_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          last_reminder_sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          mandatory_training_id?: string
          guide_id?: string
          due_date?: string
          completed_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          last_reminder_sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_medical_info: {
        Row: {
          id: string
          guide_id: string
          blood_type: string | null
          allergies: string[] | null
          medical_conditions: string[] | null
          current_medications: string[] | null
          emergency_notes: string | null
          insurance_provider: string | null
          insurance_policy_number: string | null
          last_updated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          current_medications?: string[] | null
          emergency_notes?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          last_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          blood_type?: string | null
          allergies?: string[] | null
          medical_conditions?: string[] | null
          current_medications?: string[] | null
          emergency_notes?: string | null
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          last_updated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_menu_items: {
        Row: {
          id: string
          branch_id: string | null
          section: string
          href: string
          label: string
          icon_name: string
          description: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          section: string
          href: string
          label: string
          icon_name: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          section?: string
          href?: string
          label?: string
          icon_name?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_notes: {
        Row: {
          id: string
          trip_id: string
          created_by: string
          branch_id: string | null
          message: string
          note_type: string | null
          parent_note_id: string | null
          is_internal: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          created_by: string
          branch_id?: string | null
          message: string
          note_type?: string | null
          parent_note_id?: string | null
          is_internal?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          created_by?: string
          branch_id?: string | null
          message?: string
          note_type?: string | null
          parent_note_id?: string | null
          is_internal?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_onboarding_progress: {
        Row: {
          id: string
          guide_id: string
          current_step_id: string | null
          started_at: string | null
          completed_at: string | null
          status: string | null
          completion_percentage: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          current_step_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          current_step_id?: string | null
          started_at?: string | null
          completed_at?: string | null
          status?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_onboarding_step_completions: {
        Row: {
          id: string
          progress_id: string
          step_id: string
          completed_at: string | null
          completion_data: Json | null
          validation_result: Json | null
          status: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          progress_id: string
          step_id: string
          completed_at?: string | null
          completion_data?: Json | null
          validation_result?: Json | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          progress_id?: string
          step_id?: string
          completed_at?: string | null
          completion_data?: Json | null
          validation_result?: Json | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_onboarding_steps: {
        Row: {
          id: string
          branch_id: string | null
          step_order: number
          step_type: string
          title: string
          description: string | null
          instructions: string | null
          is_required: boolean | null
          estimated_minutes: number | null
          depends_on_step_id: string | null
          resource_url: string | null
          resource_type: string | null
          validation_type: string | null
          validation_config: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          step_order: number
          step_type: string
          title: string
          description?: string | null
          instructions?: string | null
          is_required?: boolean | null
          estimated_minutes?: number | null
          depends_on_step_id?: string | null
          resource_url?: string | null
          resource_type?: string | null
          validation_type?: string | null
          validation_config?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          step_order?: number
          step_type?: string
          title?: string
          description?: string | null
          instructions?: string | null
          is_required?: boolean | null
          estimated_minutes?: number | null
          depends_on_step_id?: string | null
          resource_url?: string | null
          resource_type?: string | null
          validation_type?: string | null
          validation_config?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_performance_goals: {
        Row: {
          id: string
          guide_id: string
          branch_id: string
          year: number
          month: number
          target_trips: number | null
          target_rating: number | null
          target_income: number | null
          current_trips: number | null
          current_rating: number | null
          current_income: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          branch_id: string
          year: number
          month: number
          target_trips?: number | null
          target_rating?: number | null
          target_income?: number | null
          current_trips?: number | null
          current_rating?: number | null
          current_income?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          branch_id?: string
          year?: number
          month?: number
          target_trips?: number | null
          target_rating?: number | null
          target_income?: number | null
          current_trips?: number | null
          current_rating?: number | null
          current_income?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_performance_metrics: {
        Row: {
          id: string
          guide_id: string
          period_start: string
          period_end: string
          period_type: string | null
          total_trips: number | null
          completed_trips: number | null
          cancelled_trips: number | null
          average_rating: number | null
          total_ratings: number | null
          on_time_rate: number | null
          customer_satisfaction_score: number | null
          skills_improved: number | null
          assessments_completed: number | null
          total_earnings: number | null
          average_per_trip: number | null
          overall_score: number | null
          performance_tier: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          period_start: string
          period_end: string
          period_type?: string | null
          total_trips?: number | null
          completed_trips?: number | null
          cancelled_trips?: number | null
          average_rating?: number | null
          total_ratings?: number | null
          on_time_rate?: number | null
          customer_satisfaction_score?: number | null
          skills_improved?: number | null
          assessments_completed?: number | null
          total_earnings?: number | null
          average_per_trip?: number | null
          overall_score?: number | null
          performance_tier?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          period_start?: string
          period_end?: string
          period_type?: string | null
          total_trips?: number | null
          completed_trips?: number | null
          cancelled_trips?: number | null
          average_rating?: number | null
          total_ratings?: number | null
          on_time_rate?: number | null
          customer_satisfaction_score?: number | null
          skills_improved?: number | null
          assessments_completed?: number | null
          total_earnings?: number | null
          average_per_trip?: number | null
          overall_score?: number | null
          performance_tier?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_preferences: {
        Row: {
          id: string
          guide_id: string
          preferred_trip_types: string[] | null
          preferred_locations: string[] | null
          preferred_days_of_week: unknown[] | null
          preferred_time_slots: Json | null
          max_trips_per_day: number | null
          max_trips_per_week: number | null
          notification_preferences: Json | null
          preferred_language: string | null
          theme_preference: string | null
          dashboard_layout: Json | null
          learning_style: string | null
          preferred_content_format: string | null
          favorite_destinations: string[] | null
          preferred_durations: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          preferred_trip_types?: string[] | null
          preferred_locations?: string[] | null
          preferred_days_of_week?: unknown[] | null
          preferred_time_slots?: Json | null
          max_trips_per_day?: number | null
          max_trips_per_week?: number | null
          notification_preferences?: Json | null
          preferred_language?: string | null
          theme_preference?: string | null
          dashboard_layout?: Json | null
          learning_style?: string | null
          preferred_content_format?: string | null
          favorite_destinations?: string[] | null
          preferred_durations?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          preferred_trip_types?: string[] | null
          preferred_locations?: string[] | null
          preferred_days_of_week?: unknown[] | null
          preferred_time_slots?: Json | null
          max_trips_per_day?: number | null
          max_trips_per_week?: number | null
          notification_preferences?: Json | null
          preferred_language?: string | null
          theme_preference?: string | null
          dashboard_layout?: Json | null
          learning_style?: string | null
          preferred_content_format?: string | null
          favorite_destinations?: string[] | null
          preferred_durations?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_profiles_public_internal: {
        Row: {
          user_id: string
          branch_id: string | null
          display_name: string
          photo_url: string | null
          badges: Json | null
          skills: Json | null
          current_availability: string | null
          last_status_update: string | null
          contact_enabled: boolean | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          branch_id?: string | null
          display_name: string
          photo_url?: string | null
          badges?: Json | null
          skills?: Json | null
          current_availability?: string | null
          last_status_update?: string | null
          contact_enabled?: boolean | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          branch_id?: string | null
          display_name?: string
          photo_url?: string | null
          badges?: Json | null
          skills?: Json | null
          current_availability?: string | null
          last_status_update?: string | null
          contact_enabled?: boolean | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_promos: {
        Row: {
          id: string
          branch_id: string | null
          type: Database["public"]["Enums"]["promo_item_type"]
          title: string
          subtitle: string | null
          description: string | null
          link: string | null
          badge: string | null
          gradient: string | null
          priority: Database["public"]["Enums"]["promo_priority"]
          start_date: string
          end_date: string | null
          is_active: boolean
          target_roles: string[] | null
          target_guide_ids: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          branch_id?: string | null
          type: Database["public"]["Enums"]["promo_item_type"]
          title: string
          subtitle?: string | null
          description?: string | null
          link?: string | null
          badge?: string | null
          gradient?: string | null
          priority?: Database["public"]["Enums"]["promo_priority"]
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          target_roles?: string[] | null
          target_guide_ids?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          branch_id?: string | null
          type?: Database["public"]["Enums"]["promo_item_type"]
          title?: string
          subtitle?: string | null
          description?: string | null
          link?: string | null
          badge?: string | null
          gradient?: string | null
          priority?: Database["public"]["Enums"]["promo_priority"]
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          target_roles?: string[] | null
          target_guide_ids?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_push_subscriptions: {
        Row: {
          id: string
          guide_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          endpoint?: string
          p256dh_key?: string
          auth_key?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_quick_actions: {
        Row: {
          id: string
          branch_id: string | null
          href: string
          label: string
          icon_name: string
          color: string
          description: string | null
          display_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          href: string
          label: string
          icon_name: string
          color: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          href?: string
          label?: string
          icon_name?: string
          color?: string
          description?: string | null
          display_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_reward_points: {
        Row: {
          id: string
          guide_id: string
          balance: number | null
          lifetime_earned: number | null
          lifetime_redeemed: number | null
          expired_points: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          balance?: number | null
          lifetime_earned?: number | null
          lifetime_redeemed?: number | null
          expired_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          balance?: number | null
          lifetime_earned?: number | null
          lifetime_redeemed?: number | null
          expired_points?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_reward_transactions: {
        Row: {
          id: string
          guide_id: string
          points: number
          transaction_type: string
          source_type: string | null
          source_id: string | null
          description: string | null
          metadata: Json | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          points: number
          transaction_type: string
          source_type?: string | null
          source_id?: string | null
          description?: string | null
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          points?: number
          transaction_type?: string
          source_type?: string | null
          source_id?: string | null
          description?: string | null
          metadata?: Json | null
          expires_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_savings_goals: {
        Row: {
          id: string
          guide_id: string
          name: string
          target_amount: number
          current_amount: number
          auto_save_percent: number | null
          auto_save_enabled: boolean | null
          is_completed: boolean | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          name: string
          target_amount: number
          current_amount?: number
          auto_save_percent?: number | null
          auto_save_enabled?: boolean | null
          is_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          auto_save_percent?: number | null
          auto_save_enabled?: boolean | null
          is_completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_skill_goals: {
        Row: {
          id: string
          guide_id: string
          skill_id: string
          target_level: number
          target_date: string | null
          priority: string | null
          current_progress: number | null
          milestones: Json | null
          status: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          skill_id: string
          target_level: number
          target_date?: string | null
          priority?: string | null
          current_progress?: number | null
          milestones?: Json | null
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          skill_id?: string
          target_level?: number
          target_date?: string | null
          priority?: string | null
          current_progress?: number | null
          milestones?: Json | null
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_skills: {
        Row: {
          id: string
          guide_id: string
          skill_id: string
          current_level: number
          target_level: number | null
          validated_at: string | null
          validated_by: string | null
          validation_method: string | null
          validation_evidence: Json | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          skill_id: string
          current_level?: number
          target_level?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_method?: string | null
          validation_evidence?: Json | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          skill_id?: string
          current_level?: number
          target_level?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_method?: string | null
          validation_evidence?: Json | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_skills_catalog: {
        Row: {
          id: string
          branch_id: string | null
          name: string
          description: string | null
          category: string
          icon_name: string | null
          levels: Json
          validation_method: string | null
          requires_certification: boolean | null
          is_active: boolean | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          name: string
          description?: string | null
          category: string
          icon_name?: string | null
          levels: Json
          validation_method?: string | null
          requires_certification?: boolean | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          name?: string
          description?: string | null
          category?: string
          icon_name?: string | null
          levels?: Json
          validation_method?: string | null
          requires_certification?: boolean | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_social_post_comments: {
        Row: {
          id: string
          post_id: string
          guide_id: string
          comment_text: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          guide_id: string
          comment_text: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          guide_id?: string
          comment_text?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_social_post_likes: {
        Row: {
          id: string
          post_id: string
          guide_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          guide_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          guide_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      guide_social_posts: {
        Row: {
          id: string
          guide_id: string
          content: string | null
          image_urls: string[] | null
          likes_count: number | null
          comments_count: number | null
          is_public: boolean | null
          branch_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          content?: string | null
          image_urls?: string[] | null
          likes_count?: number | null
          comments_count?: number | null
          is_public?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          content?: string | null
          image_urls?: string[] | null
          likes_count?: number | null
          comments_count?: number | null
          is_public?: boolean | null
          branch_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_status: {
        Row: {
          guide_id: string
          current_status: Database["public"]["Enums"]["guide_current_status"]
          note: string | null
          updated_at: string | null
        }
        Insert: {
          guide_id: string
          current_status?: Database["public"]["Enums"]["guide_current_status"]
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          guide_id?: string
          current_status?: Database["public"]["Enums"]["guide_current_status"]
          note?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_survey_responses: {
        Row: {
          id: string
          guide_id: string
          survey_id: string
          responses: Json
          submitted_at: string | null
          survey_type: string | null
          is_anonymous: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          survey_id: string
          responses: Json
          submitted_at?: string | null
          survey_type?: string | null
          is_anonymous?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          survey_id?: string
          responses?: Json
          submitted_at?: string | null
          survey_type?: string | null
          is_anonymous?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_training_modules: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string
          category: Database["public"]["Enums"]["training_category"]
          duration_minutes: number
          is_required: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: string
          category: Database["public"]["Enums"]["training_category"]
          duration_minutes: number
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string
          category?: Database["public"]["Enums"]["training_category"]
          duration_minutes?: number
          is_required?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_training_progress: {
        Row: {
          id: string
          guide_id: string
          module_id: string
          status: Database["public"]["Enums"]["training_status"] | null
          progress_percent: number | null
          completed_at: string | null
          score: number | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          module_id: string
          status?: Database["public"]["Enums"]["training_status"] | null
          progress_percent?: number | null
          completed_at?: string | null
          score?: number | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          module_id?: string
          status?: Database["public"]["Enums"]["training_status"] | null
          progress_percent?: number | null
          completed_at?: string | null
          score?: number | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_training_quiz_attempts: {
        Row: {
          id: string
          guide_id: string
          module_id: string
          answers: Json
          score: number
          passed: boolean | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          module_id: string
          answers: Json
          score: number
          passed?: boolean | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          module_id?: string
          answers?: Json
          score?: number
          passed?: boolean | null
          completed_at?: string | null
        }
        Relationships: []
      }
      guide_training_quizzes: {
        Row: {
          id: string
          module_id: string
          question: string
          question_type: string | null
          options: Json | null
          correct_answer: string | null
          points: number | null
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          module_id: string
          question: string
          question_type?: string | null
          options?: Json | null
          correct_answer?: string | null
          points?: number | null
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          module_id?: string
          question?: string
          question_type?: string | null
          options?: Json | null
          correct_answer?: string | null
          points?: number | null
          display_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_trip_activity_logs: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          branch_id: string
          activity_type: string
          activity_label: string
          activity_description: string | null
          latitude: number | null
          longitude: number | null
          location_name: string | null
          recorded_at: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          branch_id: string
          activity_type: string
          activity_label: string
          activity_description?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          recorded_at?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          branch_id?: string
          activity_type?: string
          activity_label?: string
          activity_description?: string | null
          latitude?: number | null
          longitude?: number | null
          location_name?: string | null
          recorded_at?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_trip_timeline_shares: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          share_token: string
          expires_at: string | null
          is_active: boolean | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          share_token: string
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          share_token?: string
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      guide_wallet_milestones: {
        Row: {
          id: string
          guide_id: string
          milestone_type: string
          milestone_name: string
          milestone_description: string | null
          achieved_at: string | null
          achievement_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          milestone_type: string
          milestone_name: string
          milestone_description?: string | null
          achieved_at?: string | null
          achievement_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          milestone_type?: string
          milestone_name?: string
          milestone_description?: string | null
          achieved_at?: string | null
          achievement_data?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      guide_wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          reference_type: string | null
          reference_id: string | null
          status: string | null
          description: string | null
          created_by: string | null
          created_at: string | null
          bank_account_id: string | null
        }
        Insert: {
          id?: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          reference_type?: string | null
          reference_id?: string | null
          status?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          bank_account_id?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          transaction_type?: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          amount?: number
          balance_before?: number
          balance_after?: number
          reference_type?: string | null
          reference_id?: string | null
          status?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          bank_account_id?: string | null
        }
        Relationships: []
      }
      guide_wallets: {
        Row: {
          id: string
          guide_id: string
          balance: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guide_id: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guide_id?: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incident_follow_ups: {
        Row: {
          id: string
          incident_id: string
          branch_id: string | null
          follow_up_type: string
          title: string
          description: string | null
          status: string | null
          priority: string | null
          due_date: string | null
          next_action_date: string | null
          completed_at: string | null
          assigned_to: string | null
          notes: string | null
          action_taken: string[] | null
          attachments: string[] | null
          resolution_summary: string | null
          outcome: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          branch_id?: string | null
          follow_up_type: string
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          next_action_date?: string | null
          completed_at?: string | null
          assigned_to?: string | null
          notes?: string | null
          action_taken?: string[] | null
          attachments?: string[] | null
          resolution_summary?: string | null
          outcome?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          branch_id?: string | null
          follow_up_type?: string
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          due_date?: string | null
          next_action_date?: string | null
          completed_at?: string | null
          assigned_to?: string | null
          notes?: string | null
          action_taken?: string[] | null
          attachments?: string[] | null
          resolution_summary?: string | null
          outcome?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      incident_injuries: {
        Row: {
          id: string
          incident_id: string
          person_type: string
          person_name: string
          person_id: string | null
          injury_type: string
          injury_description: string | null
          body_parts_affected: string[] | null
          first_aid_given: boolean | null
          first_aid_description: string | null
          medical_attention_required: boolean | null
          hospitalized: boolean | null
          hospital_name: string | null
          current_status: string | null
          requires_follow_up: boolean | null
          follow_up_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          person_type: string
          person_name: string
          person_id?: string | null
          injury_type: string
          injury_description?: string | null
          body_parts_affected?: string[] | null
          first_aid_given?: boolean | null
          first_aid_description?: string | null
          medical_attention_required?: boolean | null
          hospitalized?: boolean | null
          hospital_name?: string | null
          current_status?: string | null
          requires_follow_up?: boolean | null
          follow_up_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          person_type?: string
          person_name?: string
          person_id?: string | null
          injury_type?: string
          injury_description?: string | null
          body_parts_affected?: string[] | null
          first_aid_given?: boolean | null
          first_aid_description?: string | null
          medical_attention_required?: boolean | null
          hospitalized?: boolean | null
          hospital_name?: string | null
          current_status?: string | null
          requires_follow_up?: boolean | null
          follow_up_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incident_insurance_claims: {
        Row: {
          id: string
          incident_id: string
          branch_id: string | null
          claim_number: string | null
          claim_type: string
          insurance_company_id: string | null
          insurance_company_name: string | null
          policy_number: string | null
          claimant_name: string
          claimant_type: string
          claimant_contact: string | null
          description: string | null
          amount_claimed: number | null
          amount_approved: number | null
          currency: string | null
          documents_submitted: string[] | null
          documents_required: string[] | null
          submitted_at: string | null
          acknowledged_at: string | null
          under_review_at: string | null
          decision_at: string | null
          paid_at: string | null
          status: string | null
          rejection_reason: string | null
          adjuster_name: string | null
          adjuster_phone: string | null
          adjuster_email: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          incident_id: string
          branch_id?: string | null
          claim_number?: string | null
          claim_type: string
          insurance_company_id?: string | null
          insurance_company_name?: string | null
          policy_number?: string | null
          claimant_name: string
          claimant_type: string
          claimant_contact?: string | null
          description?: string | null
          amount_claimed?: number | null
          amount_approved?: number | null
          currency?: string | null
          documents_submitted?: string[] | null
          documents_required?: string[] | null
          submitted_at?: string | null
          acknowledged_at?: string | null
          under_review_at?: string | null
          decision_at?: string | null
          paid_at?: string | null
          status?: string | null
          rejection_reason?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          adjuster_email?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          branch_id?: string | null
          claim_number?: string | null
          claim_type?: string
          insurance_company_id?: string | null
          insurance_company_name?: string | null
          policy_number?: string | null
          claimant_name?: string
          claimant_type?: string
          claimant_contact?: string | null
          description?: string | null
          amount_claimed?: number | null
          amount_approved?: number | null
          currency?: string | null
          documents_submitted?: string[] | null
          documents_required?: string[] | null
          submitted_at?: string | null
          acknowledged_at?: string | null
          under_review_at?: string | null
          decision_at?: string | null
          paid_at?: string | null
          status?: string | null
          rejection_reason?: string | null
          adjuster_name?: string | null
          adjuster_phone?: string | null
          adjuster_email?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          id: string
          trip_id: string | null
          guide_id: string
          branch_id: string
          incident_type: string
          chronology: string
          severity: string | null
          status: string | null
          witnesses: string | null
          photo_urls: string[] | null
          reported_at: string | null
          reported_by: string | null
          created_at: string | null
          updated_at: string | null
          voice_note_url: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          guide_id: string
          branch_id: string
          incident_type: string
          chronology: string
          severity?: string | null
          status?: string | null
          witnesses?: string | null
          photo_urls?: string[] | null
          reported_at?: string | null
          reported_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          voice_note_url?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          guide_id?: string
          branch_id?: string
          incident_type?: string
          chronology?: string
          severity?: string | null
          status?: string | null
          witnesses?: string | null
          photo_urls?: string[] | null
          reported_at?: string | null
          reported_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          voice_note_url?: string | null
        }
        Relationships: []
      }
      insurance_companies: {
        Row: {
          id: string
          branch_id: string
          name: string
          code: string
          email: string
          phone: string | null
          is_active: boolean | null
          format_type: string | null
          template_config: Json | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          code: string
          email: string
          phone?: string | null
          is_active?: boolean | null
          format_type?: string | null
          template_config?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          code?: string
          email?: string
          phone?: string | null
          is_active?: boolean | null
          format_type?: string | null
          template_config?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      insurance_manifests: {
        Row: {
          id: string
          branch_id: string
          trip_id: string
          trip_date: string
          insurance_company_id: string | null
          insurance_company_name: string | null
          passenger_count: number
          manifest_data: Json
          file_url: string | null
          file_format: string | null
          file_size_bytes: number | null
          status: string
          sent_at: string | null
          sent_to_email: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_id: string
          trip_date: string
          insurance_company_id?: string | null
          insurance_company_name?: string | null
          passenger_count: number
          manifest_data: Json
          file_url?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          status?: string
          sent_at?: string | null
          sent_to_email?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_id?: string
          trip_date?: string
          insurance_company_id?: string | null
          insurance_company_name?: string | null
          passenger_count?: number
          manifest_data?: Json
          file_url?: string | null
          file_format?: string | null
          file_size_bytes?: number | null
          status?: string
          sent_at?: string | null
          sent_to_email?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          id: string
          branch_id: string | null
          provider: string
          category: string
          config: Json
          is_enabled: boolean | null
          is_verified: boolean | null
          verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          provider: string
          category: string
          config?: Json
          is_enabled?: boolean | null
          is_verified?: boolean | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          provider?: string
          category?: string
          config?: Json
          is_enabled?: boolean | null
          is_verified?: boolean | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          branch_id: string
          name: string
          sku: string | null
          unit: string
          current_stock: number
          min_stock: number | null
          unit_cost: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          sku?: string | null
          unit: string
          current_stock?: number
          min_stock?: number | null
          unit_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          sku?: string | null
          unit?: string
          current_stock?: number
          min_stock?: number | null
          unit_cost?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_handovers: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          handover_type: string
          item_name: string
          item_code: string | null
          quantity: number
          condition: string | null
          notes: string | null
          handed_out_at: string | null
          handed_out_by: string | null
          returned_at: string | null
          returned_condition: string | null
          return_notes: string | null
          received_by: string | null
          photo_url: string | null
          is_resolved: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          handover_type: string
          item_name: string
          item_code?: string | null
          quantity?: number
          condition?: string | null
          notes?: string | null
          handed_out_at?: string | null
          handed_out_by?: string | null
          returned_at?: string | null
          returned_condition?: string | null
          return_notes?: string | null
          received_by?: string | null
          photo_url?: string | null
          is_resolved?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          handover_type?: string
          item_name?: string
          item_code?: string | null
          quantity?: number
          condition?: string | null
          notes?: string | null
          handed_out_at?: string | null
          handed_out_by?: string | null
          returned_at?: string | null
          returned_condition?: string | null
          return_notes?: string | null
          received_by?: string | null
          photo_url?: string | null
          is_resolved?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          id: string
          inventory_id: string
          trip_id: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity: number
          stock_before: number
          stock_after: number
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          inventory_id: string
          trip_id?: string | null
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity: number
          stock_before: number
          stock_after: number
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          inventory_id?: string
          trip_id?: string | null
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
          quantity?: number
          stock_before?: number
          stock_after?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          discount: number | null
          subtotal: number
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          discount?: number | null
          subtotal: number
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          discount?: number | null
          subtotal?: number
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      invoice_send_logs: {
        Row: {
          id: string
          invoice_id: string
          send_method: string
          recipient_email: string | null
          recipient_phone: string | null
          email_sent: boolean | null
          whatsapp_sent: boolean | null
          pdf_url: string | null
          error_message: string | null
          sent_by: string
          sent_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          send_method: string
          recipient_email?: string | null
          recipient_phone?: string | null
          email_sent?: boolean | null
          whatsapp_sent?: boolean | null
          pdf_url?: string | null
          error_message?: string | null
          sent_by: string
          sent_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          send_method?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          email_sent?: boolean | null
          whatsapp_sent?: boolean | null
          pdf_url?: string | null
          error_message?: string | null
          sent_by?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          booking_id: string | null
          trip_id: string | null
          customer_id: string | null
          corporate_id: string | null
          invoice_type: string
          subtotal: number
          tax_rate: number | null
          tax_amount: number | null
          discount_amount: number | null
          discount_reason: string | null
          total_amount: number
          due_date: string | null
          payment_terms: string | null
          status: string | null
          paid_amount: number | null
          paid_at: string | null
          pdf_url: string | null
          notes: string | null
          internal_notes: string | null
          generated_by: string | null
          sent_at: string | null
          sent_to: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          booking_id?: string | null
          trip_id?: string | null
          customer_id?: string | null
          corporate_id?: string | null
          invoice_type?: string
          subtotal: number
          tax_rate?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          discount_reason?: string | null
          total_amount: number
          due_date?: string | null
          payment_terms?: string | null
          status?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          pdf_url?: string | null
          notes?: string | null
          internal_notes?: string | null
          generated_by?: string | null
          sent_at?: string | null
          sent_to?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          booking_id?: string | null
          trip_id?: string | null
          customer_id?: string | null
          corporate_id?: string | null
          invoice_type?: string
          subtotal?: number
          tax_rate?: number | null
          tax_amount?: number | null
          discount_amount?: number | null
          discount_reason?: string | null
          total_amount?: number
          due_date?: string | null
          payment_terms?: string | null
          status?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          pdf_url?: string | null
          notes?: string | null
          internal_notes?: string | null
          generated_by?: string | null
          sent_at?: string | null
          sent_to?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kol_trips: {
        Row: {
          id: string
          package_id: string
          kol_name: string
          kol_handle: string | null
          kol_platform: string | null
          kol_photo_url: string | null
          kol_bio: string | null
          trip_date: string
          max_participants: number
          current_participants: number | null
          base_price: number
          kol_fee: number | null
          final_price: number
          slug: string
          hero_image_url: string | null
          video_url: string | null
          chat_group_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          kol_name: string
          kol_handle?: string | null
          kol_platform?: string | null
          kol_photo_url?: string | null
          kol_bio?: string | null
          trip_date: string
          max_participants: number
          current_participants?: number | null
          base_price: number
          kol_fee?: number | null
          final_price: number
          slug: string
          hero_image_url?: string | null
          video_url?: string | null
          chat_group_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          kol_name?: string
          kol_handle?: string | null
          kol_platform?: string | null
          kol_photo_url?: string | null
          kol_bio?: string | null
          trip_date?: string
          max_participants?: number
          current_participants?: number | null
          base_price?: number
          kol_fee?: number | null
          final_price?: number
          slug?: string
          hero_image_url?: string | null
          video_url?: string | null
          chat_group_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          id: string
          employee_id: string
          year: number
          leave_type: string
          total_days: number
          used_days: number
          remaining_days: number
          carried_over: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          year: number
          leave_type: string
          total_days?: number
          used_days?: number
          remaining_days?: number
          carried_over?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          year?: number
          leave_type?: string
          total_days?: number
          used_days?: number
          remaining_days?: number
          carried_over?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          id: string
          employee_id: string
          leave_type: string
          start_date: string
          end_date: string
          days_count: number
          reason: string | null
          attachment_url: string | null
          status: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type: string
          start_date: string
          end_date: string
          days_count: number
          reason?: string | null
          attachment_url?: string | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          days_count?: number
          reason?: string | null
          attachment_url?: string | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          id: string
          page_type: string
          title: string
          content_html: string
          last_updated: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          page_type: string
          title: string
          content_html: string
          last_updated?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          page_type?: string
          title?: string
          content_html?: string
          last_updated?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      local_employment_metrics: {
        Row: {
          id: string
          branch_id: string
          period_month: string
          total_employees: number | null
          local_employees: number | null
          local_percentage: number | null
          female_employees: number | null
          male_employees: number | null
          female_percentage: number | null
          full_time_employees: number | null
          part_time_employees: number | null
          seasonal_employees: number | null
          total_vendors: number | null
          local_vendors: number | null
          local_vendors_percentage: number | null
          total_operational_spend: number | null
          local_spend_amount: number | null
          local_spend_percentage: number | null
          local_food_spend: number | null
          local_services_spend: number | null
          local_supplies_spend: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          recorded_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          period_month: string
          total_employees?: number | null
          local_employees?: number | null
          local_percentage?: number | null
          female_employees?: number | null
          male_employees?: number | null
          female_percentage?: number | null
          full_time_employees?: number | null
          part_time_employees?: number | null
          seasonal_employees?: number | null
          total_vendors?: number | null
          local_vendors?: number | null
          local_vendors_percentage?: number | null
          total_operational_spend?: number | null
          local_spend_amount?: number | null
          local_spend_percentage?: number | null
          local_food_spend?: number | null
          local_services_spend?: number | null
          local_supplies_spend?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          recorded_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          period_month?: string
          total_employees?: number | null
          local_employees?: number | null
          local_percentage?: number | null
          female_employees?: number | null
          male_employees?: number | null
          female_percentage?: number | null
          full_time_employees?: number | null
          part_time_employees?: number | null
          seasonal_employees?: number | null
          total_vendors?: number | null
          local_vendors?: number | null
          local_vendors_percentage?: number | null
          total_operational_spend?: number | null
          local_spend_amount?: number | null
          local_spend_percentage?: number | null
          local_food_spend?: number | null
          local_services_spend?: number | null
          local_supplies_spend?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          recorded_by?: string | null
        }
        Relationships: []
      }
      local_suppliers: {
        Row: {
          id: string
          branch_id: string
          supplier_name: string
          supplier_type: string
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          is_local: boolean | null
          locality: string | null
          distance_km: number | null
          business_registration: string | null
          is_small_business: boolean | null
          is_women_owned: boolean | null
          is_cooperative: boolean | null
          employees_count: number | null
          certifications: string[] | null
          partnership_since: string | null
          contract_type: string | null
          total_spend_ytd: number | null
          average_monthly_spend: number | null
          is_active: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          supplier_name: string
          supplier_type: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          is_local?: boolean | null
          locality?: string | null
          distance_km?: number | null
          business_registration?: string | null
          is_small_business?: boolean | null
          is_women_owned?: boolean | null
          is_cooperative?: boolean | null
          employees_count?: number | null
          certifications?: string[] | null
          partnership_since?: string | null
          contract_type?: string | null
          total_spend_ytd?: number | null
          average_monthly_spend?: number | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          supplier_name?: string
          supplier_type?: string
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          is_local?: boolean | null
          locality?: string | null
          distance_km?: number | null
          business_registration?: string | null
          is_small_business?: boolean | null
          is_women_owned?: boolean | null
          is_cooperative?: boolean | null
          employees_count?: number | null
          certifications?: string[] | null
          partnership_since?: string | null
          contract_type?: string | null
          total_spend_ytd?: number | null
          average_monthly_spend?: number | null
          is_active?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      loyalty_adjustments: {
        Row: {
          id: string
          customer_id: string
          points_change: number
          reason: string
          adjustment_type: string
          reference_id: string | null
          reference_type: string | null
          adjusted_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          points_change: number
          reason: string
          adjustment_type: string
          reference_id?: string | null
          reference_type?: string | null
          adjusted_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          points_change?: number
          reason?: string
          adjustment_type?: string
          reference_id?: string | null
          reference_type?: string | null
          adjusted_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          id: string
          user_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_points_adjustments: {
        Row: {
          id: string
          customer_id: string
          points: number
          adjustment_type: string
          reason: string
          reference_id: string | null
          reference_type: string | null
          balance_before: number
          balance_after: number
          expiry_date: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          points: number
          adjustment_type: string
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          balance_before: number
          balance_after: number
          expiry_date?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          points?: number
          adjustment_type?: string
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          balance_before?: number
          balance_after?: number
          expiry_date?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          points_cost: number
          value_in_rupiah: number | null
          image_url: string | null
          stock: number | null
          valid_until: string | null
          terms: Json | null
          is_active: boolean | null
          display_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          points_cost: number
          value_in_rupiah?: number | null
          image_url?: string | null
          stock?: number | null
          valid_until?: string | null
          terms?: Json | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          points_cost?: number
          value_in_rupiah?: number | null
          image_url?: string | null
          stock?: number | null
          valid_until?: string | null
          terms?: Json | null
          is_active?: boolean | null
          display_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          id: string
          loyalty_id: string
          transaction_type: Database["public"]["Enums"]["points_transaction_type"]
          points: number
          balance_before: number
          balance_after: number
          booking_id: string | null
          referral_code: string | null
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          loyalty_id: string
          transaction_type: Database["public"]["Enums"]["points_transaction_type"]
          points: number
          balance_before: number
          balance_after: number
          booking_id?: string | null
          referral_code?: string | null
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          loyalty_id?: string
          transaction_type?: Database["public"]["Enums"]["points_transaction_type"]
          points?: number
          balance_before?: number
          balance_after?: number
          booking_id?: string | null
          referral_code?: string | null
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      mandatory_trainings: {
        Row: {
          id: string
          branch_id: string
          training_type: Database["public"]["Enums"]["training_type"]
          frequency: Database["public"]["Enums"]["training_frequency"]
          title: string
          description: string | null
          is_active: boolean | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          training_type: Database["public"]["Enums"]["training_type"]
          frequency: Database["public"]["Enums"]["training_frequency"]
          title: string
          description?: string | null
          is_active?: boolean | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          training_type?: Database["public"]["Enums"]["training_type"]
          frequency?: Database["public"]["Enums"]["training_frequency"]
          title?: string
          description?: string | null
          is_active?: boolean | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      manifest_checks: {
        Row: {
          id: string
          trip_id: string
          passenger_id: string
          boarded_at: string | null
          boarded_by: string | null
          returned_at: string | null
          returned_by: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          passenger_id: string
          boarded_at?: string | null
          boarded_by?: string | null
          returned_at?: string | null
          returned_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          passenger_id?: string
          boarded_at?: string | null
          boarded_by?: string | null
          returned_at?: string | null
          returned_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marine_protection_zones: {
        Row: {
          id: string
          zone_name: string
          zone_code: string | null
          zone_type: string
          polygon_coordinates: Json
          center_latitude: number | null
          center_longitude: number | null
          radius_km: number | null
          restrictions: string[]
          max_speed_knots: number | null
          max_vessels: number | null
          allowed_activities: string[] | null
          prohibited_activities: string[] | null
          seasonal_restrictions: Json | null
          penalty_info: string | null
          authority: string | null
          contact_info: Json | null
          source: string | null
          source_reference: string | null
          designation_date: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          zone_name: string
          zone_code?: string | null
          zone_type: string
          polygon_coordinates: Json
          center_latitude?: number | null
          center_longitude?: number | null
          radius_km?: number | null
          restrictions: string[]
          max_speed_knots?: number | null
          max_vessels?: number | null
          allowed_activities?: string[] | null
          prohibited_activities?: string[] | null
          seasonal_restrictions?: Json | null
          penalty_info?: string | null
          authority?: string | null
          contact_info?: Json | null
          source?: string | null
          source_reference?: string | null
          designation_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          zone_name?: string
          zone_code?: string | null
          zone_type?: string
          polygon_coordinates?: Json
          center_latitude?: number | null
          center_longitude?: number | null
          radius_km?: number | null
          restrictions?: string[]
          max_speed_knots?: number | null
          max_vessels?: number | null
          allowed_activities?: string[] | null
          prohibited_activities?: string[] | null
          seasonal_restrictions?: Json | null
          penalty_info?: string | null
          authority?: string | null
          contact_info?: Json | null
          source?: string | null
          source_reference?: string | null
          designation_date?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      marine_wildlife_sightings: {
        Row: {
          id: string
          trip_id: string | null
          zone_id: string | null
          branch_id: string | null
          species_name: string
          species_type: string
          common_name: string | null
          estimated_count: number | null
          count_certainty: string | null
          latitude: number
          longitude: number
          sighted_at: string
          behavior_observed: string | null
          health_status: string | null
          photo_urls: string[] | null
          notes: string | null
          conservation_status: string | null
          reported_to_authority: boolean | null
          authority_reference: string | null
          sighted_by: string
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          zone_id?: string | null
          branch_id?: string | null
          species_name: string
          species_type: string
          common_name?: string | null
          estimated_count?: number | null
          count_certainty?: string | null
          latitude: number
          longitude: number
          sighted_at: string
          behavior_observed?: string | null
          health_status?: string | null
          photo_urls?: string[] | null
          notes?: string | null
          conservation_status?: string | null
          reported_to_authority?: boolean | null
          authority_reference?: string | null
          sighted_by: string
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          zone_id?: string | null
          branch_id?: string | null
          species_name?: string
          species_type?: string
          common_name?: string | null
          estimated_count?: number | null
          count_certainty?: string | null
          latitude?: number
          longitude?: number
          sighted_at?: string
          behavior_observed?: string | null
          health_status?: string | null
          photo_urls?: string[] | null
          notes?: string | null
          conservation_status?: string | null
          reported_to_authority?: boolean | null
          authority_reference?: string | null
          sighted_by?: string
          created_at?: string | null
        }
        Relationships: []
      }
      meeting_points: {
        Row: {
          id: string
          branch_id: string
          name: string
          description: string | null
          latitude: number
          longitude: number
          radius_meters: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          description?: string | null
          latitude: number
          longitude: number
          radius_meters?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          description?: string | null
          latitude?: number
          longitude?: number
          radius_meters?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mitra_credit_limit_history: {
        Row: {
          id: string
          wallet_id: string
          mitra_id: string
          old_limit: number
          new_limit: number
          change_amount: number
          reason: string | null
          approved_by: string | null
          approved_at: string | null
          status: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          wallet_id: string
          mitra_id: string
          old_limit: number
          new_limit: number
          change_amount: number
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          wallet_id?: string
          mitra_id?: string
          old_limit?: number
          new_limit?: number
          change_amount?: number
          reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mitra_wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          booking_id: string | null
          payment_id: string | null
          description: string | null
          created_by: string | null
          created_at: string | null
          credit_used_before: number | null
          credit_used_after: number | null
        }
        Insert: {
          id?: string
          wallet_id: string
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          amount: number
          balance_before: number
          balance_after: number
          booking_id?: string | null
          payment_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          credit_used_before?: number | null
          credit_used_after?: number | null
        }
        Update: {
          id?: string
          wallet_id?: string
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          amount?: number
          balance_before?: number
          balance_after?: number
          booking_id?: string | null
          payment_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          credit_used_before?: number | null
          credit_used_after?: number | null
        }
        Relationships: []
      }
      mitra_wallets: {
        Row: {
          id: string
          mitra_id: string
          balance: number
          credit_limit: number | null
          created_at: string | null
          updated_at: string | null
          credit_used: number | null
        }
        Insert: {
          id?: string
          mitra_id: string
          balance?: number
          credit_limit?: number | null
          created_at?: string | null
          updated_at?: string | null
          credit_used?: number | null
        }
        Update: {
          id?: string
          mitra_id?: string
          balance?: number
          credit_limit?: number | null
          created_at?: string | null
          updated_at?: string | null
          credit_used?: number | null
        }
        Relationships: []
      }
      mra_tp_competency_units: {
        Row: {
          id: string
          unit_code: string
          unit_title: string
          description: string | null
          category: string
          level: number | null
          prerequisite_units: string[] | null
          minimum_score: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          unit_code: string
          unit_title: string
          description?: string | null
          category: string
          level?: number | null
          prerequisite_units?: string[] | null
          minimum_score?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          unit_code?: string
          unit_title?: string
          description?: string | null
          category?: string
          level?: number | null
          prerequisite_units?: string[] | null
          minimum_score?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      near_miss_reports: {
        Row: {
          id: string
          trip_id: string | null
          guide_id: string
          branch_id: string
          incident_date: string
          location: string | null
          description: string
          potential_consequence: string | null
          contributing_factors: string[] | null
          corrective_actions: string | null
          potential_severity: string | null
          likelihood: string | null
          status: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          guide_id: string
          branch_id: string
          incident_date: string
          location?: string | null
          description: string
          potential_consequence?: string | null
          contributing_factors?: string[] | null
          corrective_actions?: string | null
          potential_severity?: string | null
          likelihood?: string | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          guide_id?: string
          branch_id?: string
          incident_date?: string
          location?: string | null
          description?: string
          potential_consequence?: string | null
          contributing_factors?: string[] | null
          corrective_actions?: string | null
          potential_severity?: string | null
          likelihood?: string | null
          status?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string | null
          recipient_phone: string | null
          recipient_email: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          template_name: string | null
          subject: string | null
          body: string | null
          entity_type: string | null
          entity_id: string | null
          status: Database["public"]["Enums"]["notification_status"]
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error_message: string | null
          retry_count: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          recipient_phone?: string | null
          recipient_email?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          template_name?: string | null
          subject?: string | null
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          retry_count?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          recipient_phone?: string | null
          recipient_email?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          template_name?: string | null
          subject?: string | null
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          retry_count?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          app: string
          notification_type: string
          enabled: boolean | null
          channels: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          app: string
          notification_type: string
          enabled?: boolean | null
          channels?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          app?: string
          notification_type?: string
          enabled?: boolean | null
          channels?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          template_key: string
          name: string
          message_template: string
          variables: Json | null
          channel: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_key: string
          name: string
          message_template: string
          variables?: Json | null
          channel?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          template_key?: string
          name?: string
          message_template?: string
          variables?: Json | null
          channel?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ops_broadcasts: {
        Row: {
          id: string
          branch_id: string
          broadcast_type: Database["public"]["Enums"]["broadcast_type"]
          title: string
          message: string
          target_guides: string[] | null
          is_active: boolean | null
          is_urgent: boolean | null
          scheduled_at: string | null
          expires_at: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          broadcast_type: Database["public"]["Enums"]["broadcast_type"]
          title: string
          message: string
          target_guides?: string[] | null
          is_active?: boolean | null
          is_urgent?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          broadcast_type?: Database["public"]["Enums"]["broadcast_type"]
          title?: string
          message?: string
          target_guides?: string[] | null
          is_active?: boolean | null
          is_urgent?: boolean | null
          scheduled_at?: string | null
          expires_at?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      package_itineraries: {
        Row: {
          id: string
          package_id: string
          day_number: number
          title: string
          description: string | null
          activities: Json | null
          meals: string[] | null
          accommodation: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          day_number: number
          title: string
          description?: string | null
          activities?: Json | null
          meals?: string[] | null
          accommodation?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          day_number?: number
          title?: string
          description?: string | null
          activities?: Json | null
          meals?: string[] | null
          accommodation?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      package_prices: {
        Row: {
          id: string
          package_id: string
          min_pax: number
          max_pax: number
          price_publish: number
          price_nta: number
          price_weekend: number | null
          cost_internal: number | null
          cost_external: number | null
          valid_from: string
          valid_until: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          min_pax: number
          max_pax: number
          price_publish: number
          price_nta: number
          price_weekend?: number | null
          cost_internal?: number | null
          cost_external?: number | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          min_pax?: number
          max_pax?: number
          price_publish?: number
          price_nta?: number
          price_weekend?: number | null
          cost_internal?: number | null
          cost_external?: number | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      package_reviews: {
        Row: {
          id: string
          package_id: string
          booking_id: string | null
          reviewer_id: string
          reviewer_name: string
          reviewer_avatar: string | null
          overall_rating: number
          itinerary_rating: number | null
          guide_rating: number | null
          accommodation_rating: number | null
          transport_rating: number | null
          value_rating: number | null
          review_text: string | null
          review_title: string | null
          photos: string[] | null
          trip_date: string | null
          verified_purchase: boolean | null
          helpful_count: number | null
          unhelpful_count: number | null
          reported_count: number | null
          status: string | null
          moderation_notes: string | null
          moderated_by: string | null
          moderated_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          booking_id?: string | null
          reviewer_id: string
          reviewer_name: string
          reviewer_avatar?: string | null
          overall_rating: number
          itinerary_rating?: number | null
          guide_rating?: number | null
          accommodation_rating?: number | null
          transport_rating?: number | null
          value_rating?: number | null
          review_text?: string | null
          review_title?: string | null
          photos?: string[] | null
          trip_date?: string | null
          verified_purchase?: boolean | null
          helpful_count?: number | null
          unhelpful_count?: number | null
          reported_count?: number | null
          status?: string | null
          moderation_notes?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          booking_id?: string | null
          reviewer_id?: string
          reviewer_name?: string
          reviewer_avatar?: string | null
          overall_rating?: number
          itinerary_rating?: number | null
          guide_rating?: number | null
          accommodation_rating?: number | null
          transport_rating?: number | null
          value_rating?: number | null
          review_text?: string | null
          review_title?: string | null
          photos?: string[] | null
          trip_date?: string | null
          verified_purchase?: boolean | null
          helpful_count?: number | null
          unhelpful_count?: number | null
          reported_count?: number | null
          status?: string | null
          moderation_notes?: string | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          id: string
          branch_id: string
          code: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          package_type: Database["public"]["Enums"]["package_type"]
          status: Database["public"]["Enums"]["package_status"]
          destination: string
          city: string | null
          province: string | null
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          duration_days: number
          duration_nights: number
          min_pax: number
          max_pax: number
          inclusions: string[] | null
          exclusions: string[] | null
          itinerary: Json | null
          thumbnail_url: string | null
          gallery_urls: string[] | null
          meta_title: string | null
          meta_description: string | null
          child_discount_percent: number | null
          child_min_age: number | null
          child_max_age: number | null
          infant_max_age: number | null
          fuel_per_pax_liter: number | null
          water_per_pax_bottle: number | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          trip_type: string | null
          duration: number | null
        }
        Insert: {
          id?: string
          branch_id: string
          code: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          package_type?: Database["public"]["Enums"]["package_type"]
          status?: Database["public"]["Enums"]["package_status"]
          destination: string
          city?: string | null
          province?: string | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          duration_days?: number
          duration_nights?: number
          min_pax?: number
          max_pax?: number
          inclusions?: string[] | null
          exclusions?: string[] | null
          itinerary?: Json | null
          thumbnail_url?: string | null
          gallery_urls?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          child_discount_percent?: number | null
          child_min_age?: number | null
          child_max_age?: number | null
          infant_max_age?: number | null
          fuel_per_pax_liter?: number | null
          water_per_pax_bottle?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          trip_type?: string | null
          duration?: number | null
        }
        Update: {
          id?: string
          branch_id?: string
          code?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          package_type?: Database["public"]["Enums"]["package_type"]
          status?: Database["public"]["Enums"]["package_status"]
          destination?: string
          city?: string | null
          province?: string | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          duration_days?: number
          duration_nights?: number
          min_pax?: number
          max_pax?: number
          inclusions?: string[] | null
          exclusions?: string[] | null
          itinerary?: Json | null
          thumbnail_url?: string | null
          gallery_urls?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          child_discount_percent?: number | null
          child_min_age?: number | null
          child_max_age?: number | null
          infant_max_age?: number | null
          fuel_per_pax_liter?: number | null
          water_per_pax_bottle?: number | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          trip_type?: string | null
          duration?: number | null
        }
        Relationships: []
      }
      partner_activity_logs: {
        Row: {
          id: string
          partner_id: string
          user_id: string | null
          action_type: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          user_id?: string | null
          action_type: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          user_id?: string | null
          action_type?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_branches: {
        Row: {
          id: string
          partner_id: string
          name: string
          address: string | null
          phone: string | null
          is_headquarters: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          name: string
          address?: string | null
          phone?: string | null
          is_headquarters?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          name?: string
          address?: string | null
          phone?: string | null
          is_headquarters?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      partner_broadcast_recipients: {
        Row: {
          id: string
          broadcast_id: string
          customer_id: string | null
          phone_number: string
          status: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error_message: string | null
          message_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          broadcast_id: string
          customer_id?: string | null
          phone_number: string
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          message_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          broadcast_id?: string
          customer_id?: string | null
          phone_number?: string
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          message_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_broadcasts: {
        Row: {
          id: string
          partner_id: string
          name: string
          template_name: string
          audience_filter: Json | null
          recipient_count: number
          sent_count: number
          failed_count: number
          status: string
          scheduled_at: string | null
          sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          name: string
          template_name: string
          audience_filter?: Json | null
          recipient_count?: number
          sent_count?: number
          failed_count?: number
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          name?: string
          template_name?: string
          audience_filter?: Json | null
          recipient_count?: number
          sent_count?: number
          failed_count?: number
          status?: string
          scheduled_at?: string | null
          sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_competitor_prices: {
        Row: {
          id: string
          partner_id: string
          competitor_name: string
          product_name: string
          product_url: string | null
          current_price: number
          previous_price: number | null
          lowest_price: number | null
          highest_price: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          competitor_name: string
          product_name: string
          product_url?: string | null
          current_price: number
          previous_price?: number | null
          lowest_price?: number | null
          highest_price?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          competitor_name?: string
          product_name?: string
          product_url?: string | null
          current_price?: number
          previous_price?: number | null
          lowest_price?: number | null
          highest_price?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_contracts: {
        Row: {
          id: string
          partner_id: string
          title: string
          type: string
          version: string
          content: string
          status: string
          signed_at: string | null
          signature_data: string | null
          signature_location: string | null
          signature_ip: string | null
          signature_user_agent: string | null
          expires_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          title: string
          type?: string
          version?: string
          content: string
          status?: string
          signed_at?: string | null
          signature_data?: string | null
          signature_location?: string | null
          signature_ip?: string | null
          signature_user_agent?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          title?: string
          type?: string
          version?: string
          content?: string
          status?: string
          signed_at?: string | null
          signature_data?: string | null
          signature_location?: string | null
          signature_ip?: string | null
          signature_user_agent?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_custom_reports: {
        Row: {
          id: string
          partner_id: string
          name: string
          data_source: string
          config: Json
          last_run_at: string | null
          run_count: number | null
          schedule_cron: string | null
          schedule_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          name: string
          data_source: string
          config?: Json
          last_run_at?: string | null
          run_count?: number | null
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          name?: string
          data_source?: string
          config?: Json
          last_run_at?: string | null
          run_count?: number | null
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_customers: {
        Row: {
          id: string
          partner_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          birthdate: string | null
          segment: string | null
          preferences: Json | null
          special_notes: string | null
          booking_count: number | null
          total_spent: number | null
          last_trip_date: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          birthdate?: string | null
          segment?: string | null
          preferences?: Json | null
          special_notes?: string | null
          booking_count?: number | null
          total_spent?: number | null
          last_trip_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          birthdate?: string | null
          segment?: string | null
          preferences?: Json | null
          special_notes?: string | null
          booking_count?: number | null
          total_spent?: number | null
          last_trip_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      partner_inbox_messages: {
        Row: {
          id: string
          partner_id: string
          thread_id: string | null
          parent_message_id: string | null
          subject: string | null
          message_text: string
          sender_id: string | null
          sender_type: string
          sender_name: string | null
          is_read: boolean | null
          read_at: string | null
          priority: string | null
          category: string | null
          attachments: Json | null
          created_at: string | null
          updated_at: string | null
          parsed_data: Json | null
          parsing_status: Database["public"]["Enums"]["inbox_parsing_status"] | null
          parsing_confidence: number | null
          parsed_at: string | null
          draft_booking_id: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          thread_id?: string | null
          parent_message_id?: string | null
          subject?: string | null
          message_text: string
          sender_id?: string | null
          sender_type?: string
          sender_name?: string | null
          is_read?: boolean | null
          read_at?: string | null
          priority?: string | null
          category?: string | null
          attachments?: Json | null
          created_at?: string | null
          updated_at?: string | null
          parsed_data?: Json | null
          parsing_status?: Database["public"]["Enums"]["inbox_parsing_status"] | null
          parsing_confidence?: number | null
          parsed_at?: string | null
          draft_booking_id?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          thread_id?: string | null
          parent_message_id?: string | null
          subject?: string | null
          message_text?: string
          sender_id?: string | null
          sender_type?: string
          sender_name?: string | null
          is_read?: boolean | null
          read_at?: string | null
          priority?: string | null
          category?: string | null
          attachments?: Json | null
          created_at?: string | null
          updated_at?: string | null
          parsed_data?: Json | null
          parsing_status?: Database["public"]["Enums"]["inbox_parsing_status"] | null
          parsing_confidence?: number | null
          parsed_at?: string | null
          draft_booking_id?: string | null
        }
        Relationships: []
      }
      partner_legal_documents: {
        Row: {
          id: string
          partner_id: string
          document_type: string
          document_number: string | null
          document_url: string
          ocr_data: Json | null
          ocr_confidence: number | null
          is_verified: boolean | null
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          document_type: string
          document_number?: string | null
          document_url: string
          ocr_data?: Json | null
          ocr_confidence?: number | null
          is_verified?: boolean | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          document_type?: string
          document_number?: string | null
          document_url?: string
          ocr_data?: Json | null
          ocr_confidence?: number | null
          is_verified?: boolean | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      partner_price_alerts: {
        Row: {
          id: string
          partner_id: string
          package_id: string
          target_price: number
          alert_type: string
          is_active: boolean | null
          triggered_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          package_id: string
          target_price: number
          alert_type?: string
          is_active?: boolean | null
          triggered_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          package_id?: string
          target_price?: number
          alert_type?: string
          is_active?: boolean | null
          triggered_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_push_subscriptions: {
        Row: {
          id: string
          user_id: string
          partner_id: string | null
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent: string | null
          device_type: string | null
          is_active: boolean | null
          last_used_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          partner_id?: string | null
          endpoint: string
          p256dh_key: string
          auth_key: string
          user_agent?: string | null
          device_type?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          partner_id?: string | null
          endpoint?: string
          p256dh_key?: string
          auth_key?: string
          user_agent?: string | null
          device_type?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referral_code: string | null
          status: string | null
          points_awarded: number | null
          awarded_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referral_code?: string | null
          status?: string | null
          points_awarded?: number | null
          awarded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          referral_code?: string | null
          status?: string | null
          points_awarded?: number | null
          awarded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_reward_milestones: {
        Row: {
          id: string
          partner_id: string
          milestone_type: string
          milestone_value: number
          points_awarded: number
          achieved_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          partner_id: string
          milestone_type: string
          milestone_value: number
          points_awarded: number
          achieved_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          partner_id?: string
          milestone_type?: string
          milestone_value?: number
          points_awarded?: number
          achieved_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      partner_reward_points: {
        Row: {
          id: string
          partner_id: string
          balance: number
          lifetime_earned: number
          lifetime_redeemed: number
          expired_points: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          expired_points?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_redeemed?: number
          expired_points?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_reward_transactions: {
        Row: {
          id: string
          partner_id: string
          transaction_type: Database["public"]["Enums"]["partner_reward_transaction_type"]
          points: number
          source_type: Database["public"]["Enums"]["partner_reward_source_type"] | null
          source_id: string | null
          balance_before: number
          balance_after: number
          expires_at: string | null
          description: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          transaction_type: Database["public"]["Enums"]["partner_reward_transaction_type"]
          points: number
          source_type?: Database["public"]["Enums"]["partner_reward_source_type"] | null
          source_id?: string | null
          balance_before: number
          balance_after: number
          expires_at?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          transaction_type?: Database["public"]["Enums"]["partner_reward_transaction_type"]
          points?: number
          source_type?: Database["public"]["Enums"]["partner_reward_source_type"] | null
          source_id?: string | null
          balance_before?: number
          balance_after?: number
          expires_at?: string | null
          description?: string | null
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_support_tickets: {
        Row: {
          id: string
          partner_id: string
          user_id: string | null
          subject: string
          description: string
          category: string | null
          status: string
          priority: string | null
          messages: Json | null
          submitted_at: string | null
          first_response_at: string | null
          resolved_at: string | null
          response_sla_hours: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          user_id?: string | null
          subject: string
          description: string
          category?: string | null
          status?: string
          priority?: string | null
          messages?: Json | null
          submitted_at?: string | null
          first_response_at?: string | null
          resolved_at?: string | null
          response_sla_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          user_id?: string | null
          subject?: string
          description?: string
          category?: string | null
          status?: string
          priority?: string | null
          messages?: Json | null
          submitted_at?: string | null
          first_response_at?: string | null
          resolved_at?: string | null
          response_sla_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_tier_history: {
        Row: {
          id: string
          partner_id: string
          old_tier: string | null
          new_tier: string
          assigned_by: string | null
          assigned_at: string | null
          reason: string | null
          is_auto_calculated: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          old_tier?: string | null
          new_tier: string
          assigned_by?: string | null
          assigned_at?: string | null
          reason?: string | null
          is_auto_calculated?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          old_tier?: string | null
          new_tier?: string
          assigned_by?: string | null
          assigned_at?: string | null
          reason?: string | null
          is_auto_calculated?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      partner_users: {
        Row: {
          id: string
          partner_id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          role: string
          permissions: Json | null
          is_active: boolean | null
          last_login_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          branch_id: string | null
        }
        Insert: {
          id?: string
          partner_id: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          role: string
          permissions?: Json | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          branch_id?: string | null
        }
        Update: {
          id?: string
          partner_id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          role?: string
          permissions?: Json | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          branch_id?: string | null
        }
        Relationships: []
      }
      passenger_consents: {
        Row: {
          id: string
          trip_id: string
          manifest_id: string | null
          passenger_name: string
          passenger_id: string | null
          consent_type: string
          consent_text: string
          agreed: boolean | null
          agreed_at: string | null
          signature_data: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          manifest_id?: string | null
          passenger_name: string
          passenger_id?: string | null
          consent_type: string
          consent_text: string
          agreed?: boolean | null
          agreed_at?: string | null
          signature_data?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          manifest_id?: string | null
          passenger_name?: string
          passenger_id?: string | null
          consent_type?: string
          consent_text?: string
          agreed?: boolean | null
          agreed_at?: string | null
          signature_data?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      passenger_emergency_contacts: {
        Row: {
          id: string
          passenger_id: string
          booking_id: string | null
          branch_id: string | null
          contact_name: string
          relationship: string
          phone: string
          phone_secondary: string | null
          email: string | null
          address: string | null
          city: string | null
          country: string | null
          notify_on_emergency: boolean | null
          notify_on_delay: boolean | null
          notify_on_incident: boolean | null
          preferred_contact_method: string | null
          preferred_language: string | null
          priority: number | null
          is_active: boolean | null
          verified_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          passenger_id: string
          booking_id?: string | null
          branch_id?: string | null
          contact_name: string
          relationship: string
          phone: string
          phone_secondary?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          notify_on_emergency?: boolean | null
          notify_on_delay?: boolean | null
          notify_on_incident?: boolean | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          priority?: number | null
          is_active?: boolean | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          passenger_id?: string
          booking_id?: string | null
          branch_id?: string | null
          contact_name?: string
          relationship?: string
          phone?: string
          phone_secondary?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          notify_on_emergency?: boolean | null
          notify_on_delay?: boolean | null
          notify_on_incident?: boolean | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          priority?: number | null
          is_active?: boolean | null
          verified_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      passenger_medical_info: {
        Row: {
          id: string
          passenger_id: string
          booking_id: string | null
          has_medical_conditions: boolean | null
          medical_conditions: string[] | null
          medical_notes: string | null
          has_allergies: boolean | null
          allergies: string[] | null
          allergy_severity: string | null
          current_medications: string[] | null
          medication_notes: string | null
          blood_type: string | null
          insurance_company: string | null
          insurance_policy_number: string | null
          insurance_phone: string | null
          mobility_assistance: boolean | null
          dietary_restrictions: string[] | null
          special_needs_notes: string | null
          consent_share_emergency: boolean | null
          consent_given_at: string | null
          consent_given_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          passenger_id: string
          booking_id?: string | null
          has_medical_conditions?: boolean | null
          medical_conditions?: string[] | null
          medical_notes?: string | null
          has_allergies?: boolean | null
          allergies?: string[] | null
          allergy_severity?: string | null
          current_medications?: string[] | null
          medication_notes?: string | null
          blood_type?: string | null
          insurance_company?: string | null
          insurance_policy_number?: string | null
          insurance_phone?: string | null
          mobility_assistance?: boolean | null
          dietary_restrictions?: string[] | null
          special_needs_notes?: string | null
          consent_share_emergency?: boolean | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          passenger_id?: string
          booking_id?: string | null
          has_medical_conditions?: boolean | null
          medical_conditions?: string[] | null
          medical_notes?: string | null
          has_allergies?: boolean | null
          allergies?: string[] | null
          allergy_severity?: string | null
          current_medications?: string[] | null
          medication_notes?: string | null
          blood_type?: string | null
          insurance_company?: string | null
          insurance_policy_number?: string | null
          insurance_phone?: string | null
          mobility_assistance?: boolean | null
          dietary_restrictions?: string[] | null
          special_needs_notes?: string | null
          consent_share_emergency?: boolean | null
          consent_given_at?: string | null
          consent_given_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_verification_logs: {
        Row: {
          id: string
          payment_id: string
          action: string
          previous_status: string | null
          new_status: string
          notes: string | null
          rejection_reason: string | null
          performed_by: string
          performed_at: string | null
        }
        Insert: {
          id?: string
          payment_id: string
          action: string
          previous_status?: string | null
          new_status: string
          notes?: string | null
          rejection_reason?: string | null
          performed_by: string
          performed_at?: string | null
        }
        Update: {
          id?: string
          payment_id?: string
          action?: string
          previous_status?: string | null
          new_status?: string
          notes?: string | null
          rejection_reason?: string | null
          performed_by?: string
          performed_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          payment_code: string
          amount: number
          fee_amount: number | null
          net_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["payment_status"]
          external_id: string | null
          payment_url: string | null
          payer_name: string | null
          payer_email: string | null
          payer_phone: string | null
          split_bill_id: string | null
          proof_image_url: string | null
          ocr_verified: boolean | null
          ocr_verified_at: string | null
          ocr_data: Json | null
          verified_by: string | null
          verified_at: string | null
          paid_at: string | null
          expired_at: string | null
          refunded_at: string | null
          created_at: string | null
          updated_at: string | null
          is_manual: boolean | null
          manual_entry_by: string | null
          bank_name: string | null
          account_number: string | null
          proof_url: string | null
          verification_status: string | null
          verification_notes: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          payment_code: string
          amount: number
          fee_amount?: number | null
          net_amount?: number | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          external_id?: string | null
          payment_url?: string | null
          payer_name?: string | null
          payer_email?: string | null
          payer_phone?: string | null
          split_bill_id?: string | null
          proof_image_url?: string | null
          ocr_verified?: boolean | null
          ocr_verified_at?: string | null
          ocr_data?: Json | null
          verified_by?: string | null
          verified_at?: string | null
          paid_at?: string | null
          expired_at?: string | null
          refunded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_manual?: boolean | null
          manual_entry_by?: string | null
          bank_name?: string | null
          account_number?: string | null
          proof_url?: string | null
          verification_status?: string | null
          verification_notes?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          payment_code?: string
          amount?: number
          fee_amount?: number | null
          net_amount?: number | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          external_id?: string | null
          payment_url?: string | null
          payer_name?: string | null
          payer_email?: string | null
          payer_phone?: string | null
          split_bill_id?: string | null
          proof_image_url?: string | null
          ocr_verified?: boolean | null
          ocr_verified_at?: string | null
          ocr_data?: Json | null
          verified_by?: string | null
          verified_at?: string | null
          paid_at?: string | null
          expired_at?: string | null
          refunded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          is_manual?: boolean | null
          manual_entry_by?: string | null
          bank_name?: string | null
          account_number?: string | null
          proof_url?: string | null
          verification_status?: string | null
          verification_notes?: string | null
        }
        Relationships: []
      }
      performance_goals: {
        Row: {
          id: string
          employee_id: string
          review_id: string | null
          goal_title: string
          goal_description: string | null
          target_metric: string | null
          target_value: string | null
          due_date: string | null
          progress: number | null
          status: string | null
          completion_notes: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          review_id?: string | null
          goal_title: string
          goal_description?: string | null
          target_metric?: string | null
          target_value?: string | null
          due_date?: string | null
          progress?: number | null
          status?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          review_id?: string | null
          goal_title?: string
          goal_description?: string | null
          target_metric?: string | null
          target_value?: string | null
          due_date?: string | null
          progress?: number | null
          status?: string | null
          completion_notes?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          id: string
          page_url: string
          page_type: string | null
          lcp: number | null
          fid: number | null
          cls: number | null
          ttfb: number | null
          fcp: number | null
          tti: number | null
          dom_load_time: number | null
          page_load_time: number | null
          resource_count: number | null
          connection_type: string | null
          effective_type: string | null
          downlink: number | null
          rtt: number | null
          user_id: string | null
          session_id: string
          device_type: string | null
          browser: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          page_url: string
          page_type?: string | null
          lcp?: number | null
          fid?: number | null
          cls?: number | null
          ttfb?: number | null
          fcp?: number | null
          tti?: number | null
          dom_load_time?: number | null
          page_load_time?: number | null
          resource_count?: number | null
          connection_type?: string | null
          effective_type?: string | null
          downlink?: number | null
          rtt?: number | null
          user_id?: string | null
          session_id: string
          device_type?: string | null
          browser?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          page_url?: string
          page_type?: string | null
          lcp?: number | null
          fid?: number | null
          cls?: number | null
          ttfb?: number | null
          fcp?: number | null
          tti?: number | null
          dom_load_time?: number | null
          page_load_time?: number | null
          resource_count?: number | null
          connection_type?: string | null
          effective_type?: string | null
          downlink?: number | null
          rtt?: number | null
          user_id?: string | null
          session_id?: string
          device_type?: string | null
          browser?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          id: string
          employee_id: string
          review_period: string
          review_type: string
          reviewer_id: string
          performance_score: number | null
          communication_score: number | null
          teamwork_score: number | null
          initiative_score: number | null
          reliability_score: number | null
          strengths: string | null
          areas_for_improvement: string | null
          goals_for_next_period: string | null
          achievements: string | null
          reviewer_comments: string | null
          employee_comments: string | null
          employee_acknowledged: boolean | null
          acknowledged_at: string | null
          status: string | null
          review_date: string
          finalized_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          review_period: string
          review_type?: string
          reviewer_id: string
          performance_score?: number | null
          communication_score?: number | null
          teamwork_score?: number | null
          initiative_score?: number | null
          reliability_score?: number | null
          strengths?: string | null
          areas_for_improvement?: string | null
          goals_for_next_period?: string | null
          achievements?: string | null
          reviewer_comments?: string | null
          employee_comments?: string | null
          employee_acknowledged?: boolean | null
          acknowledged_at?: string | null
          status?: string | null
          review_date: string
          finalized_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          review_period?: string
          review_type?: string
          reviewer_id?: string
          performance_score?: number | null
          communication_score?: number | null
          teamwork_score?: number | null
          initiative_score?: number | null
          reliability_score?: number | null
          strengths?: string | null
          areas_for_improvement?: string | null
          goals_for_next_period?: string | null
          achievements?: string | null
          reviewer_comments?: string | null
          employee_comments?: string | null
          employee_acknowledged?: boolean | null
          acknowledged_at?: string | null
          status?: string | null
          review_date?: string
          finalized_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permenparekraf_assessment_responses: {
        Row: {
          id: string
          assessment_id: string
          criteria_id: string
          score_achieved: number
          evidence_provided: boolean | null
          evidence_urls: string[] | null
          notes: string | null
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          assessment_id: string
          criteria_id: string
          score_achieved: number
          evidence_provided?: boolean | null
          evidence_urls?: string[] | null
          notes?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string
          criteria_id?: string
          score_achieved?: number
          evidence_provided?: boolean | null
          evidence_urls?: string[] | null
          notes?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permenparekraf_criteria: {
        Row: {
          id: string
          business_type: string
          section_code: string
          criteria_code: string
          criteria_name: string
          description: string | null
          max_score: number
          weight: number | null
          is_mandatory: boolean | null
          required_evidence: string[] | null
          verification_method: string | null
          is_active: boolean | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          business_type: string
          section_code: string
          criteria_code: string
          criteria_name: string
          description?: string | null
          max_score: number
          weight?: number | null
          is_mandatory?: boolean | null
          required_evidence?: string[] | null
          verification_method?: string | null
          is_active?: boolean | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          business_type?: string
          section_code?: string
          criteria_code?: string
          criteria_name?: string
          description?: string | null
          max_score?: number
          weight?: number | null
          is_mandatory?: boolean | null
          required_evidence?: string[] | null
          verification_method?: string | null
          is_active?: boolean | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permenparekraf_grading_config: {
        Row: {
          id: string
          business_type: string
          grade: string
          min_score: number
          max_score: number
          mandatory_sections: string[] | null
          min_section_score: number | null
          benefits: string | null
          validity_years: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          business_type: string
          grade: string
          min_score: number
          max_score: number
          mandatory_sections?: string[] | null
          min_section_score?: number | null
          benefits?: string | null
          validity_years?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          business_type?: string
          grade?: string
          min_score?: number
          max_score?: number
          mandatory_sections?: string[] | null
          min_section_score?: number | null
          benefits?: string | null
          validity_years?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      permenparekraf_self_assessments: {
        Row: {
          id: string
          branch_id: string | null
          assessment_date: string
          assessment_type: string
          assessment_year: number
          total_score: number | null
          grade: string | null
          section_scores: Json
          section_legalitas: number | null
          section_sdm: number | null
          section_sarana_prasarana: number | null
          section_pelayanan: number | null
          section_keuangan: number | null
          section_lingkungan: number | null
          evidence_urls: string[] | null
          evidence_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          approved_by: string | null
          approved_at: string | null
          status: string | null
          certificate_number: string | null
          certificate_url: string | null
          certificate_valid_until: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          assessment_date: string
          assessment_type: string
          assessment_year: number
          total_score?: number | null
          grade?: string | null
          section_scores?: Json
          section_legalitas?: number | null
          section_sdm?: number | null
          section_sarana_prasarana?: number | null
          section_pelayanan?: number | null
          section_keuangan?: number | null
          section_lingkungan?: number | null
          evidence_urls?: string[] | null
          evidence_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          status?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          certificate_valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          assessment_date?: string
          assessment_type?: string
          assessment_year?: number
          total_score?: number | null
          grade?: string | null
          section_scores?: Json
          section_legalitas?: number | null
          section_sdm?: number | null
          section_sarana_prasarana?: number | null
          section_pelayanan?: number | null
          section_keuangan?: number | null
          section_lingkungan?: number | null
          evidence_urls?: string[] | null
          evidence_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          status?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          certificate_valid_until?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pre_trip_assessments: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          branch_id: string
          wave_height: number | null
          wind_speed: number | null
          weather_condition: string | null
          crew_ready: boolean | null
          equipment_complete: boolean | null
          risk_score: number
          risk_level: string
          is_safe: boolean | null
          approved_by: string | null
          approved_at: string | null
          approval_reason: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          hygiene_verified: boolean | null
          sanitization_complete: boolean | null
          health_protocol_followed: boolean | null
          chse_checklist: Json | null
          chse_verified_at: string | null
          chse_verified_by: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          branch_id: string
          wave_height?: number | null
          wind_speed?: number | null
          weather_condition?: string | null
          crew_ready?: boolean | null
          equipment_complete?: boolean | null
          risk_score?: number
          risk_level?: string
          is_safe?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          approval_reason?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          hygiene_verified?: boolean | null
          sanitization_complete?: boolean | null
          health_protocol_followed?: boolean | null
          chse_checklist?: Json | null
          chse_verified_at?: string | null
          chse_verified_by?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          branch_id?: string
          wave_height?: number | null
          wind_speed?: number | null
          weather_condition?: string | null
          crew_ready?: boolean | null
          equipment_complete?: boolean | null
          risk_score?: number
          risk_level?: string
          is_safe?: boolean | null
          approved_by?: string | null
          approved_at?: string | null
          approval_reason?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          hygiene_verified?: boolean | null
          sanitization_complete?: boolean | null
          health_protocol_followed?: boolean | null
          chse_checklist?: Json | null
          chse_verified_at?: string | null
          chse_verified_by?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          total_referrals: number | null
          total_bookings: number | null
          total_commission: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          total_referrals?: number | null
          total_bookings?: number | null
          total_commission?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          total_referrals?: number | null
          total_bookings?: number | null
          total_commission?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          referral_code: string
          status: string
          referee_discount: number
          referrer_points: number
          booking_id: string | null
          completed_at: string | null
          referee_reward_claimed: boolean | null
          referrer_reward_claimed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          referral_code: string
          status?: string
          referee_discount?: number
          referrer_points?: number
          booking_id?: string | null
          completed_at?: string | null
          referee_reward_claimed?: boolean | null
          referrer_reward_claimed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string
          referral_code?: string
          status?: string
          referee_discount?: number
          referrer_points?: number
          booking_id?: string | null
          completed_at?: string | null
          referee_reward_claimed?: boolean | null
          referrer_reward_claimed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          id: string
          booking_id: string
          payment_id: string | null
          original_amount: number
          refund_percent: number
          admin_fee: number | null
          refund_amount: number
          days_before_trip: number
          policy_applied: string | null
          status: Database["public"]["Enums"]["refund_status"]
          refund_to: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          is_override: boolean | null
          override_by: string | null
          override_reason: string | null
          approved_by: string | null
          approved_at: string | null
          processed_at: string | null
          completed_at: string | null
          disbursement_id: string | null
          requested_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          payment_id?: string | null
          original_amount: number
          refund_percent: number
          admin_fee?: number | null
          refund_amount: number
          days_before_trip: number
          policy_applied?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          refund_to?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          is_override?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          processed_at?: string | null
          completed_at?: string | null
          disbursement_id?: string | null
          requested_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          payment_id?: string | null
          original_amount?: number
          refund_percent?: number
          admin_fee?: number | null
          refund_amount?: number
          days_before_trip?: number
          policy_applied?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          refund_to?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          is_override?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          processed_at?: string | null
          completed_at?: string | null
          disbursement_id?: string | null
          requested_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          id: string
          report_id: string
          run_type: string | null
          status: string | null
          filters_used: Json | null
          result_count: number | null
          result_file_url: string | null
          error_message: string | null
          started_at: string | null
          completed_at: string | null
          triggered_by: string | null
        }
        Insert: {
          id?: string
          report_id: string
          run_type?: string | null
          status?: string | null
          filters_used?: Json | null
          result_count?: number | null
          result_file_url?: string | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          triggered_by?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          run_type?: string | null
          status?: string | null
          filters_used?: Json | null
          result_count?: number | null
          result_file_url?: string | null
          error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      report_subscriptions: {
        Row: {
          id: string
          report_id: string
          user_id: string
          frequency: string
          delivery_day: number | null
          delivery_time: string | null
          format: string | null
          is_active: boolean | null
          last_sent_at: string | null
          next_send_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          frequency?: string
          delivery_day?: number | null
          delivery_time?: string | null
          format?: string | null
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          frequency?: string
          delivery_day?: number | null
          delivery_time?: string | null
          format?: string | null
          is_active?: boolean | null
          last_sent_at?: string | null
          next_send_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          vote_type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          vote_type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          vote_type?: string
          created_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string | null
          reviewer_name: string
          overall_rating: number
          guide_rating: number | null
          facility_rating: number | null
          value_rating: number | null
          review_text: string | null
          photo_unlocked: boolean | null
          is_published: boolean | null
          moderated_by: string | null
          moderated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id?: string | null
          reviewer_name: string
          overall_rating: number
          guide_rating?: number | null
          facility_rating?: number | null
          value_rating?: number | null
          review_text?: string | null
          photo_unlocked?: boolean | null
          is_published?: boolean | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string | null
          reviewer_name?: string
          overall_rating?: number
          guide_rating?: number | null
          facility_rating?: number | null
          value_rating?: number | null
          review_text?: string | null
          photo_unlocked?: boolean | null
          is_published?: boolean | null
          moderated_by?: string | null
          moderated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_applications: {
        Row: {
          id: string
          user_id: string
          requested_role: Database["public"]["Enums"]["user_role"]
          status: string | null
          message: string | null
          admin_notes: string | null
          applied_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          created_at: string | null
          updated_at: string | null
          company_data: Json | null
          legal_documents: Json | null
          application_status: string | null
        }
        Insert: {
          id?: string
          user_id: string
          requested_role: Database["public"]["Enums"]["user_role"]
          status?: string | null
          message?: string | null
          admin_notes?: string | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
          company_data?: Json | null
          legal_documents?: Json | null
          application_status?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          requested_role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          message?: string | null
          admin_notes?: string | null
          applied_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
          company_data?: Json | null
          legal_documents?: Json | null
          application_status?: string | null
        }
        Relationships: []
      }
      salary_deductions: {
        Row: {
          id: string
          salary_payment_id: string | null
          guide_id: string
          trip_id: string | null
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          amount: number
          reason: string
          is_auto: boolean | null
          created_by: string | null
          created_at: string | null
          description: string | null
        }
        Insert: {
          id?: string
          salary_payment_id?: string | null
          guide_id: string
          trip_id?: string | null
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          amount: number
          reason: string
          is_auto?: boolean | null
          created_by?: string | null
          created_at?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          salary_payment_id?: string | null
          guide_id?: string
          trip_id?: string | null
          deduction_type?: Database["public"]["Enums"]["deduction_type"]
          amount?: number
          reason?: string
          is_auto?: boolean | null
          created_by?: string | null
          created_at?: string | null
          description?: string | null
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          id: string
          branch_id: string
          period_start: string
          period_end: string
          guide_id: string
          base_amount: number
          bonus_amount: number | null
          deduction_amount: number | null
          net_amount: number
          status: Database["public"]["Enums"]["salary_payment_status"]
          all_docs_uploaded: boolean | null
          paid_by: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          period_start: string
          period_end: string
          guide_id: string
          base_amount?: number
          bonus_amount?: number | null
          deduction_amount?: number | null
          net_amount: number
          status?: Database["public"]["Enums"]["salary_payment_status"]
          all_docs_uploaded?: boolean | null
          paid_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          period_start?: string
          period_end?: string
          guide_id?: string
          base_amount?: number
          bonus_amount?: number | null
          deduction_amount?: number | null
          net_amount?: number
          status?: Database["public"]["Enums"]["salary_payment_status"]
          all_docs_uploaded?: boolean | null
          paid_by?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sanitization_records: {
        Row: {
          id: string
          branch_id: string
          trip_id: string | null
          sanitization_type: string
          areas_sanitized: string[] | null
          products_used: string[] | null
          started_at: string
          completed_at: string | null
          duration_minutes: number | null
          photo_before: string | null
          photo_after: string | null
          performed_by: string
          verified_by: string | null
          verified_at: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_id?: string | null
          sanitization_type: string
          areas_sanitized?: string[] | null
          products_used?: string[] | null
          started_at: string
          completed_at?: string | null
          duration_minutes?: number | null
          photo_before?: string | null
          photo_after?: string | null
          performed_by: string
          verified_by?: string | null
          verified_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_id?: string | null
          sanitization_type?: string
          areas_sanitized?: string[] | null
          products_used?: string[] | null
          started_at?: string
          completed_at?: string | null
          duration_minutes?: number | null
          photo_before?: string | null
          photo_after?: string | null
          performed_by?: string
          verified_by?: string | null
          verified_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          id: string
          notification_type: string
          recipient_id: string | null
          recipient_role: string | null
          recipient_filter: Json | null
          title: string
          message: string
          delivery_method: string
          schedule_time: string
          repeat_pattern: string | null
          repeat_until: string | null
          last_run_at: string | null
          next_run_at: string | null
          run_count: number | null
          max_runs: number | null
          status: string | null
          metadata: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          notification_type: string
          recipient_id?: string | null
          recipient_role?: string | null
          recipient_filter?: Json | null
          title: string
          message: string
          delivery_method: string
          schedule_time: string
          repeat_pattern?: string | null
          repeat_until?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          max_runs?: number | null
          status?: string | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          notification_type?: string
          recipient_id?: string | null
          recipient_role?: string | null
          recipient_filter?: Json | null
          title?: string
          message?: string
          delivery_method?: string
          schedule_time?: string
          repeat_pattern?: string | null
          repeat_until?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          max_runs?: number | null
          status?: string | null
          metadata?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      season_calendar: {
        Row: {
          id: string
          branch_id: string
          name: string
          season_type: Database["public"]["Enums"]["season_type"]
          start_date: string
          end_date: string
          markup_type: string | null
          markup_value: number
          created_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          season_type: Database["public"]["Enums"]["season_type"]
          start_date: string
          end_date: string
          markup_type?: string | null
          markup_value: number
          created_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          season_type?: Database["public"]["Enums"]["season_type"]
          start_date?: string
          end_date?: string
          markup_type?: string | null
          markup_value?: number
          created_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          branch_id: string | null
          name: string
          description: string | null
          start_date: string
          end_date: string
          price_multiplier: number | null
          color: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          name: string
          description?: string | null
          start_date: string
          end_date: string
          price_multiplier?: number | null
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          price_multiplier?: number | null
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          email: string | null
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json | null
          severity: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          email?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          severity?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          email?: string | null
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          severity?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      seo_pages: {
        Row: {
          id: string
          package_id: string
          origin_city: string
          slug: string
          title: string
          description: string | null
          meta_description: string | null
          h1: string | null
          h2: string[] | null
          content: string | null
          keywords: string[] | null
          package_name: string | null
          package_destination: string | null
          is_published: boolean | null
          generated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          package_id: string
          origin_city: string
          slug: string
          title: string
          description?: string | null
          meta_description?: string | null
          h1?: string | null
          h2?: string[] | null
          content?: string | null
          keywords?: string[] | null
          package_name?: string | null
          package_destination?: string | null
          is_published?: boolean | null
          generated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          package_id?: string
          origin_city?: string
          slug?: string
          title?: string
          description?: string | null
          meta_description?: string | null
          h1?: string | null
          h2?: string[] | null
          content?: string | null
          keywords?: string[] | null
          package_name?: string | null
          package_destination?: string | null
          is_published?: boolean | null
          generated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          branch_id: string | null
          key: string
          value: string
          value_type: string | null
          description: string | null
          is_public: boolean | null
          updated_by: string | null
          updated_at: string | null
          value_encrypted: string | null
          is_sensitive: boolean | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          key: string
          value: string
          value_type?: string | null
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
          value_encrypted?: string | null
          is_sensitive?: boolean | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          key?: string
          value?: string
          value_type?: string | null
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
          value_encrypted?: string | null
          is_sensitive?: boolean | null
        }
        Relationships: []
      }
      sos_alerts: {
        Row: {
          id: string
          branch_id: string
          trip_id: string | null
          guide_id: string
          latitude: number
          longitude: number
          location_name: string | null
          status: Database["public"]["Enums"]["sos_status"]
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          created_at: string | null
          accuracy_meters: number | null
          message: string | null
          whatsapp_sent: boolean | null
          push_sent: boolean | null
          nearby_crew_notified: boolean | null
          emergency_contacts_notified: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_id?: string | null
          guide_id: string
          latitude: number
          longitude: number
          location_name?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          accuracy_meters?: number | null
          message?: string | null
          whatsapp_sent?: boolean | null
          push_sent?: boolean | null
          nearby_crew_notified?: boolean | null
          emergency_contacts_notified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_id?: string | null
          guide_id?: string
          latitude?: number
          longitude?: number
          location_name?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string | null
          accuracy_meters?: number | null
          message?: string | null
          whatsapp_sent?: boolean | null
          push_sent?: boolean | null
          nearby_crew_notified?: boolean | null
          emergency_contacts_notified?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      split_bill_participants: {
        Row: {
          id: string
          split_bill_id: string
          name: string
          phone: string | null
          email: string | null
          amount: number
          payment_id: string | null
          payment_url: string | null
          is_paid: boolean | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          split_bill_id: string
          name: string
          phone?: string | null
          email?: string | null
          amount: number
          payment_id?: string | null
          payment_url?: string | null
          is_paid?: boolean | null
          paid_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          split_bill_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          amount?: number
          payment_id?: string | null
          payment_url?: string | null
          is_paid?: boolean | null
          paid_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      split_bills: {
        Row: {
          id: string
          booking_id: string
          creator_id: string | null
          creator_name: string
          creator_phone: string
          total_amount: number
          split_count: number
          amount_per_person: number
          status: Database["public"]["Enums"]["split_bill_status"]
          paid_count: number | null
          expires_at: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          creator_id?: string | null
          creator_name: string
          creator_phone: string
          total_amount: number
          split_count: number
          amount_per_person: number
          status?: Database["public"]["Enums"]["split_bill_status"]
          paid_count?: number | null
          expires_at: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          creator_id?: string | null
          creator_name?: string
          creator_phone?: string
          total_amount?: number
          split_count?: number
          amount_per_person?: number
          status?: Database["public"]["Enums"]["split_bill_status"]
          paid_count?: number | null
          expires_at?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_assessments: {
        Row: {
          id: string
          branch_id: string | null
          supplier_name: string
          supplier_type: string
          contact_person: string | null
          contact_email: string | null
          contact_phone: string | null
          has_environmental_policy: boolean | null
          waste_management_score: number | null
          carbon_reduction_efforts: string | null
          uses_renewable_energy: boolean | null
          has_certifications: boolean | null
          certification_urls: string[] | null
          overall_rating: number | null
          compliance_status: string | null
          assessment_date: string
          next_review_date: string | null
          assessed_by: string | null
          assessment_notes: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          supplier_name: string
          supplier_type: string
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          has_environmental_policy?: boolean | null
          waste_management_score?: number | null
          carbon_reduction_efforts?: string | null
          uses_renewable_energy?: boolean | null
          has_certifications?: boolean | null
          certification_urls?: string[] | null
          overall_rating?: number | null
          compliance_status?: string | null
          assessment_date: string
          next_review_date?: string | null
          assessed_by?: string | null
          assessment_notes?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          supplier_name?: string
          supplier_type?: string
          contact_person?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          has_environmental_policy?: boolean | null
          waste_management_score?: number | null
          carbon_reduction_efforts?: string | null
          uses_renewable_energy?: boolean | null
          has_certifications?: boolean | null
          certification_urls?: string[] | null
          overall_rating?: number | null
          compliance_status?: string | null
          assessment_date?: string
          next_review_date?: string | null
          assessed_by?: string | null
          assessment_notes?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sustainability_certifications: {
        Row: {
          id: string
          branch_id: string
          certification_name: string
          certification_type: string
          certification_body: string | null
          certification_number: string | null
          issued_date: string
          valid_from: string
          valid_until: string
          status: string | null
          certificate_url: string | null
          audit_report_url: string | null
          renewal_date: string | null
          renewal_reminder_sent: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          certification_name: string
          certification_type: string
          certification_body?: string | null
          certification_number?: string | null
          issued_date: string
          valid_from: string
          valid_until: string
          status?: string | null
          certificate_url?: string | null
          audit_report_url?: string | null
          renewal_date?: string | null
          renewal_reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          certification_name?: string
          certification_type?: string
          certification_body?: string | null
          certification_number?: string | null
          issued_date?: string
          valid_from?: string
          valid_until?: string
          status?: string | null
          certificate_url?: string | null
          audit_report_url?: string | null
          renewal_date?: string | null
          renewal_reminder_sent?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      sustainability_goals: {
        Row: {
          id: string
          branch_id: string
          period_type: Database["public"]["Enums"]["period_type"]
          period_start: string
          period_end: string
          target_co2_kg: number | null
          target_waste_kg: number | null
          created_by: string
          created_at: string | null
          updated_at: string | null
          goal_type: string | null
          target_value: number | null
          target_unit: string | null
          current_value: number | null
          status: string | null
          baseline_value: number | null
          baseline_date: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          period_type: Database["public"]["Enums"]["period_type"]
          period_start: string
          period_end: string
          target_co2_kg?: number | null
          target_waste_kg?: number | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
          goal_type?: string | null
          target_value?: number | null
          target_unit?: string | null
          current_value?: number | null
          status?: string | null
          baseline_value?: number | null
          baseline_date?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          period_type?: Database["public"]["Enums"]["period_type"]
          period_start?: string
          period_end?: string
          target_co2_kg?: number | null
          target_waste_kg?: number | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
          goal_type?: string | null
          target_value?: number | null
          target_unit?: string | null
          current_value?: number | null
          status?: string | null
          baseline_value?: number | null
          baseline_date?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      sustainability_initiatives: {
        Row: {
          id: string
          branch_id: string
          title: string
          description: string | null
          initiative_type: string
          target_metric: string | null
          target_value: number | null
          target_unit: string | null
          start_date: string
          end_date: string | null
          status: string | null
          current_progress: number | null
          milestones: Json | null
          budget_allocated: number | null
          budget_spent: number | null
          responsible_person: string | null
          estimated_impact: string | null
          actual_impact: string | null
          documentation_urls: string[] | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          title: string
          description?: string | null
          initiative_type: string
          target_metric?: string | null
          target_value?: number | null
          target_unit?: string | null
          start_date: string
          end_date?: string | null
          status?: string | null
          current_progress?: number | null
          milestones?: Json | null
          budget_allocated?: number | null
          budget_spent?: number | null
          responsible_person?: string | null
          estimated_impact?: string | null
          actual_impact?: string | null
          documentation_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          title?: string
          description?: string | null
          initiative_type?: string
          target_metric?: string | null
          target_value?: number | null
          target_unit?: string | null
          start_date?: string
          end_date?: string | null
          status?: string | null
          current_progress?: number | null
          milestones?: Json | null
          budget_allocated?: number | null
          budget_spent?: number | null
          responsible_person?: string | null
          estimated_impact?: string | null
          actual_impact?: string | null
          documentation_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      sustainability_metrics_monthly: {
        Row: {
          id: string
          branch_id: string
          metric_month: string
          total_waste_kg: number | null
          plastic_waste_kg: number | null
          organic_waste_kg: number | null
          recycled_waste_kg: number | null
          recycling_rate: number | null
          total_fuel_liters: number | null
          total_co2_kg: number | null
          co2_per_passenger_kg: number | null
          co2_per_trip_kg: number | null
          total_trips: number | null
          total_passengers: number | null
          total_distance_nm: number | null
          total_water_liters: number | null
          water_per_passenger_liters: number | null
          previous_month_co2_kg: number | null
          previous_month_waste_kg: number | null
          co2_change_percent: number | null
          waste_change_percent: number | null
          calculated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          metric_month: string
          total_waste_kg?: number | null
          plastic_waste_kg?: number | null
          organic_waste_kg?: number | null
          recycled_waste_kg?: number | null
          recycling_rate?: number | null
          total_fuel_liters?: number | null
          total_co2_kg?: number | null
          co2_per_passenger_kg?: number | null
          co2_per_trip_kg?: number | null
          total_trips?: number | null
          total_passengers?: number | null
          total_distance_nm?: number | null
          total_water_liters?: number | null
          water_per_passenger_liters?: number | null
          previous_month_co2_kg?: number | null
          previous_month_waste_kg?: number | null
          co2_change_percent?: number | null
          waste_change_percent?: number | null
          calculated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          metric_month?: string
          total_waste_kg?: number | null
          plastic_waste_kg?: number | null
          organic_waste_kg?: number | null
          recycled_waste_kg?: number | null
          recycling_rate?: number | null
          total_fuel_liters?: number | null
          total_co2_kg?: number | null
          co2_per_passenger_kg?: number | null
          co2_per_trip_kg?: number | null
          total_trips?: number | null
          total_passengers?: number | null
          total_distance_nm?: number | null
          total_water_liters?: number | null
          water_per_passenger_liters?: number | null
          previous_month_co2_kg?: number | null
          previous_month_waste_kg?: number | null
          co2_change_percent?: number | null
          waste_change_percent?: number | null
          calculated_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          comment: string
          attachment_urls: string[] | null
          is_internal: boolean | null
          author_id: string | null
          author_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          ticket_id: string
          comment: string
          attachment_urls?: string[] | null
          is_internal?: boolean | null
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          ticket_id?: string
          comment?: string
          attachment_urls?: string[] | null
          is_internal?: boolean | null
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          branch_id: string
          ticket_code: string
          category: Database["public"]["Enums"]["ticket_category"]
          priority: Database["public"]["Enums"]["ticket_priority"]
          subject: string
          description: string
          booking_id: string | null
          trip_id: string | null
          reported_by: string | null
          reporter_name: string | null
          reporter_email: string | null
          reporter_phone: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          sla_deadline: string | null
          sla_breached: boolean | null
          assigned_to: string | null
          assigned_at: string | null
          escalated_to: string | null
          escalated_at: string | null
          escalation_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string
          satisfaction_rating: number | null
          satisfaction_feedback: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          ticket_code: string
          category: Database["public"]["Enums"]["ticket_category"]
          priority?: Database["public"]["Enums"]["ticket_priority"]
          subject: string
          description: string
          booking_id?: string | null
          trip_id?: string | null
          reported_by?: string | null
          reporter_name?: string | null
          reporter_email?: string | null
          reporter_phone?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          sla_deadline?: string | null
          sla_breached?: boolean | null
          assigned_to?: string | null
          assigned_at?: string | null
          escalated_to?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string
          satisfaction_rating?: number | null
          satisfaction_feedback?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          ticket_code?: string
          category?: Database["public"]["Enums"]["ticket_category"]
          priority?: Database["public"]["Enums"]["ticket_priority"]
          subject?: string
          description?: string
          booking_id?: string | null
          trip_id?: string | null
          reported_by?: string | null
          reporter_name?: string | null
          reporter_email?: string | null
          reporter_phone?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          sla_deadline?: string | null
          sla_breached?: boolean | null
          assigned_to?: string | null
          assigned_at?: string | null
          escalated_to?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string
          satisfaction_rating?: number | null
          satisfaction_feedback?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_assessment_answers: {
        Row: {
          id: string
          assessment_id: string
          question_id: string
          answer: string
          is_correct: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          assessment_id: string
          question_id: string
          answer: string
          is_correct?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string
          question_id?: string
          answer?: string
          is_correct?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      training_assessment_questions: {
        Row: {
          id: string
          session_id: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          options: Json | null
          correct_answer: string | null
          points: number | null
          question_order: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          options?: Json | null
          correct_answer?: string | null
          points?: number | null
          question_order: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          options?: Json | null
          correct_answer?: string | null
          points?: number | null
          question_order?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_assessments: {
        Row: {
          id: string
          session_id: string
          guide_id: string
          self_rating: number | null
          quiz_score: number | null
          quiz_passed: boolean | null
          submitted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          guide_id: string
          self_rating?: number | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          guide_id?: string
          self_rating?: number | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          submitted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          id: string
          session_id: string
          guide_id: string
          branch_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          checked_in_at: string | null
          checked_in_by: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          guide_id: string
          branch_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          checked_in_at?: string | null
          checked_in_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          guide_id?: string
          branch_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          checked_in_at?: string | null
          checked_in_by?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_certificates: {
        Row: {
          id: string
          session_id: string
          guide_id: string
          branch_id: string
          certificate_number: string | null
          certificate_pdf_url: string | null
          quiz_attempt_id: string | null
          quiz_score: number | null
          quiz_passed: boolean | null
          is_issued: boolean | null
          issued_at: string | null
          issued_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          guide_id: string
          branch_id: string
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          quiz_attempt_id?: string | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          is_issued?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          guide_id?: string
          branch_id?: string
          certificate_number?: string | null
          certificate_pdf_url?: string | null
          quiz_attempt_id?: string | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          is_issued?: boolean | null
          issued_at?: string | null
          issued_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_feedback: {
        Row: {
          id: string
          session_id: string
          guide_id: string
          trainer_id: string
          rating: Database["public"]["Enums"]["feedback_rating"]
          comment: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          guide_id: string
          trainer_id: string
          rating: Database["public"]["Enums"]["feedback_rating"]
          comment?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          guide_id?: string
          trainer_id?: string
          rating?: Database["public"]["Enums"]["feedback_rating"]
          comment?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          id: string
          branch_id: string
          session_name: string
          session_type: string
          description: string | null
          session_date: string
          session_time: string | null
          duration_minutes: number | null
          location: string | null
          status: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          session_name: string
          session_type: string
          description?: string | null
          session_date: string
          session_time?: string | null
          duration_minutes?: number | null
          location?: string | null
          status?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          session_name?: string
          session_type?: string
          description?: string | null
          session_date?: string
          session_time?: string | null
          duration_minutes?: number | null
          location?: string | null
          status?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_advisories: {
        Row: {
          id: string
          source: string
          source_reference: string | null
          source_url: string | null
          advisory_type: string
          severity: string
          severity_code: number | null
          affected_locations: Json | null
          affected_regions: string[] | null
          title: string
          description: string
          impact_description: string | null
          recommendations: string[] | null
          valid_from: string
          valid_until: string | null
          is_active: boolean | null
          weather_data: Json | null
          maritime_data: Json | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          source: string
          source_reference?: string | null
          source_url?: string | null
          advisory_type: string
          severity?: string
          severity_code?: number | null
          affected_locations?: Json | null
          affected_regions?: string[] | null
          title: string
          description: string
          impact_description?: string | null
          recommendations?: string[] | null
          valid_from: string
          valid_until?: string | null
          is_active?: boolean | null
          weather_data?: Json | null
          maritime_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          source?: string
          source_reference?: string | null
          source_url?: string | null
          advisory_type?: string
          severity?: string
          severity_code?: number | null
          affected_locations?: Json | null
          affected_regions?: string[] | null
          title?: string
          description?: string
          impact_description?: string | null
          recommendations?: string[] | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean | null
          weather_data?: Json | null
          maritime_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      travel_circle_contributions: {
        Row: {
          id: string
          circle_id: string
          member_id: string
          period_month: string
          amount: number
          status: Database["public"]["Enums"]["contribution_status"]
          paid_at: string | null
          payment_reference: string | null
          reminder_sent_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          circle_id: string
          member_id: string
          period_month: string
          amount: number
          status?: Database["public"]["Enums"]["contribution_status"]
          paid_at?: string | null
          payment_reference?: string | null
          reminder_sent_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          circle_id?: string
          member_id?: string
          period_month?: string
          amount?: number
          status?: Database["public"]["Enums"]["contribution_status"]
          paid_at?: string | null
          payment_reference?: string | null
          reminder_sent_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      travel_circle_members: {
        Row: {
          id: string
          circle_id: string
          user_id: string | null
          name: string
          phone: string | null
          email: string | null
          total_contributed: number | null
          is_active: boolean | null
          joined_at: string | null
        }
        Insert: {
          id?: string
          circle_id: string
          user_id?: string | null
          name: string
          phone?: string | null
          email?: string | null
          total_contributed?: number | null
          is_active?: boolean | null
          joined_at?: string | null
        }
        Update: {
          id?: string
          circle_id?: string
          user_id?: string | null
          name?: string
          phone?: string | null
          email?: string | null
          total_contributed?: number | null
          is_active?: boolean | null
          joined_at?: string | null
        }
        Relationships: []
      }
      travel_circles: {
        Row: {
          id: string
          branch_id: string | null
          name: string
          description: string | null
          target_amount: number
          current_amount: number | null
          monthly_contribution: number
          contribution_day: number | null
          target_date: string | null
          admin_id: string
          status: Database["public"]["Enums"]["travel_circle_status"]
          virtual_account_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          name: string
          description?: string | null
          target_amount: number
          current_amount?: number | null
          monthly_contribution: number
          contribution_day?: number | null
          target_date?: string | null
          admin_id: string
          status?: Database["public"]["Enums"]["travel_circle_status"]
          virtual_account_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          name?: string
          description?: string | null
          target_amount?: number
          current_amount?: number | null
          monthly_contribution?: number
          contribution_day?: number | null
          target_date?: string | null
          admin_id?: string
          status?: Database["public"]["Enums"]["travel_circle_status"]
          virtual_account_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_bookings: {
        Row: {
          id: string
          trip_id: string
          booking_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          booking_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          booking_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      trip_chat_messages: {
        Row: {
          id: string
          trip_id: string
          sender_id: string
          sender_role: string
          message_text: string
          template_type: string | null
          created_at: string | null
          read_at: string | null
          read_by: string | null
          attachment_url: string | null
          attachment_type: string | null
          attachment_filename: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          sender_id: string
          sender_role: string
          message_text: string
          template_type?: string | null
          created_at?: string | null
          read_at?: string | null
          read_by?: string | null
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_filename?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          sender_id?: string
          sender_role?: string
          message_text?: string
          template_type?: string | null
          created_at?: string | null
          read_at?: string | null
          read_by?: string | null
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_filename?: string | null
        }
        Relationships: []
      }
      trip_crews: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          branch_id: string | null
          role: string
          status: string
          assigned_at: string | null
          assigned_by: string | null
          confirmed_at: string | null
          assignment_notes: string | null
          created_at: string | null
          updated_at: string | null
          fee_amount: number | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          branch_id?: string | null
          role?: string
          status?: string
          assigned_at?: string | null
          assigned_by?: string | null
          confirmed_at?: string | null
          assignment_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          fee_amount?: number | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          branch_id?: string | null
          role?: string
          status?: string
          assigned_at?: string | null
          assigned_by?: string | null
          confirmed_at?: string | null
          assignment_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          fee_amount?: number | null
        }
        Relationships: []
      }
      trip_destination_risks: {
        Row: {
          id: string
          trip_id: string
          destination_id: string | null
          threat_level_at_departure: Database["public"]["Enums"]["threat_level"] | null
          risk_factors_snapshot: Json | null
          seasonal_risk_snapshot: Json | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          acknowledgment_notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          destination_id?: string | null
          threat_level_at_departure?: Database["public"]["Enums"]["threat_level"] | null
          risk_factors_snapshot?: Json | null
          seasonal_risk_snapshot?: Json | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          acknowledgment_notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          destination_id?: string | null
          threat_level_at_departure?: Database["public"]["Enums"]["threat_level"] | null
          risk_factors_snapshot?: Json | null
          seasonal_risk_snapshot?: Json | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          acknowledgment_notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      trip_expenses: {
        Row: {
          id: string
          trip_id: string
          vendor_id: string | null
          category: Database["public"]["Enums"]["expense_category"]
          description: string
          quantity: number | null
          unit_price: number
          total_amount: number
          receipt_url: string | null
          expected_amount: number | null
          variance_percent: number | null
          is_anomaly: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          vendor_id?: string | null
          category: Database["public"]["Enums"]["expense_category"]
          description: string
          quantity?: number | null
          unit_price: number
          total_amount: number
          receipt_url?: string | null
          expected_amount?: number | null
          variance_percent?: number | null
          is_anomaly?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          vendor_id?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          description?: string
          quantity?: number | null
          unit_price?: number
          total_amount?: number
          receipt_url?: string | null
          expected_amount?: number | null
          variance_percent?: number | null
          is_anomaly?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_fuel_logs: {
        Row: {
          id: string
          trip_id: string
          branch_id: string
          fuel_liters: number
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          distance_nm: number | null
          co2_emissions_kg: number | null
          logged_by: string
          logged_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          branch_id: string
          fuel_liters: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          distance_nm?: number | null
          co2_emissions_kg?: number | null
          logged_by: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          branch_id?: string
          fuel_liters?: number
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          distance_nm?: number | null
          co2_emissions_kg?: number | null
          logged_by?: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_guides: {
        Row: {
          id: string
          trip_id: string
          guide_id: string
          guide_role: Database["public"]["Enums"]["guide_role"]
          fee_amount: number
          check_in_at: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_location: string | null
          is_late: boolean | null
          check_out_at: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          documentation_uploaded: boolean | null
          created_at: string | null
          updated_at: string | null
          assignment_status: Database["public"]["Enums"]["trip_assignment_status"] | null
          confirmation_deadline: string | null
          confirmed_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          auto_reassigned_at: string | null
          reassigned_from_guide_id: string | null
          assigned_at: string | null
          assignment_method: string | null
          branch_id: string | null
          trip_date: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id: string
          guide_role?: Database["public"]["Enums"]["guide_role"]
          fee_amount: number
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_location?: string | null
          is_late?: boolean | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          documentation_uploaded?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          assignment_status?: Database["public"]["Enums"]["trip_assignment_status"] | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          auto_reassigned_at?: string | null
          reassigned_from_guide_id?: string | null
          assigned_at?: string | null
          assignment_method?: string | null
          branch_id?: string | null
          trip_date?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string
          guide_role?: Database["public"]["Enums"]["guide_role"]
          fee_amount?: number
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_location?: string | null
          is_late?: boolean | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          documentation_uploaded?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          assignment_status?: Database["public"]["Enums"]["trip_assignment_status"] | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          auto_reassigned_at?: string | null
          reassigned_from_guide_id?: string | null
          assigned_at?: string | null
          assignment_method?: string | null
          branch_id?: string | null
          trip_date?: string | null
        }
        Relationships: []
      }
      trip_manifest: {
        Row: {
          id: string
          trip_id: string
          passenger_name: string
          passenger_email: string | null
          passenger_phone: string | null
          passenger_id_number: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          health_notes: string | null
          allergies: string[] | null
          check_in_status: string | null
          checked_in_at: string | null
          seat_number: string | null
          room_number: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          passenger_name: string
          passenger_email?: string | null
          passenger_phone?: string | null
          passenger_id_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_notes?: string | null
          allergies?: string[] | null
          check_in_status?: string | null
          checked_in_at?: string | null
          seat_number?: string | null
          room_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          passenger_name?: string
          passenger_email?: string | null
          passenger_phone?: string | null
          passenger_id_number?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_notes?: string | null
          allergies?: string[] | null
          check_in_status?: string | null
          checked_in_at?: string | null
          seat_number?: string | null
          room_number?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_tasks: {
        Row: {
          id: string
          trip_id: string
          guide_id: string | null
          task_type: string
          category: string | null
          title: string
          description: string | null
          priority: string | null
          due_at: string | null
          status: string | null
          completed_at: string | null
          completed_by: string | null
          notes: string | null
          attachments: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          guide_id?: string | null
          task_type: string
          category?: string | null
          title: string
          description?: string | null
          priority?: string | null
          due_at?: string | null
          status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          attachments?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          guide_id?: string | null
          task_type?: string
          category?: string | null
          title?: string
          description?: string | null
          priority?: string | null
          due_at?: string | null
          status?: string | null
          completed_at?: string | null
          completed_by?: string | null
          notes?: string | null
          attachments?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_zone_compliance: {
        Row: {
          id: string
          trip_id: string
          zone_id: string
          branch_id: string | null
          entered_at: string
          exited_at: string | null
          duration_minutes: number | null
          entry_latitude: number | null
          entry_longitude: number | null
          compliance_status: string
          violations: Json | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          zone_id: string
          branch_id?: string | null
          entered_at: string
          exited_at?: string | null
          duration_minutes?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          compliance_status?: string
          violations?: Json | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          zone_id?: string
          branch_id?: string | null
          entered_at?: string
          exited_at?: string | null
          duration_minutes?: number | null
          entry_latitude?: number | null
          entry_longitude?: number | null
          compliance_status?: string
          violations?: Json | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          branch_id: string
          trip_code: string
          trip_date: string
          package_id: string
          primary_asset_id: string | null
          secondary_asset_id: string | null
          total_pax: number
          status: Database["public"]["Enums"]["trip_status"]
          departure_time: string | null
          actual_departure_time: string | null
          return_time: string | null
          actual_return_time: string | null
          documentation_url: string | null
          documentation_uploaded_at: string | null
          notes: string | null
          completed_at: string | null
          completed_by: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          briefing_points: Json | null
          briefing_generated_at: string | null
          briefing_generated_by: string | null
          briefing_updated_at: string | null
          briefing_updated_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          trip_code: string
          trip_date: string
          package_id: string
          primary_asset_id?: string | null
          secondary_asset_id?: string | null
          total_pax?: number
          status?: Database["public"]["Enums"]["trip_status"]
          departure_time?: string | null
          actual_departure_time?: string | null
          return_time?: string | null
          actual_return_time?: string | null
          documentation_url?: string | null
          documentation_uploaded_at?: string | null
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          briefing_points?: Json | null
          briefing_generated_at?: string | null
          briefing_generated_by?: string | null
          briefing_updated_at?: string | null
          briefing_updated_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          trip_code?: string
          trip_date?: string
          package_id?: string
          primary_asset_id?: string | null
          secondary_asset_id?: string | null
          total_pax?: number
          status?: Database["public"]["Enums"]["trip_status"]
          departure_time?: string | null
          actual_departure_time?: string | null
          return_time?: string | null
          actual_return_time?: string | null
          documentation_url?: string | null
          documentation_uploaded_at?: string | null
          notes?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          briefing_points?: Json | null
          briefing_generated_at?: string | null
          briefing_generated_by?: string | null
          briefing_updated_at?: string | null
          briefing_updated_by?: string | null
        }
        Relationships: []
      }
      trm_competency_assessments: {
        Row: {
          id: string
          user_id: string
          assessor_id: string | null
          branch_id: string | null
          assessment_type: string
          competencies: Json
          overall_score: number | null
          assessed_at: string
          result: string | null
          recommendations: string[] | null
          improvement_areas: string[] | null
          follow_up_required: boolean | null
          follow_up_date: string | null
          evidence_urls: string[] | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          assessor_id?: string | null
          branch_id?: string | null
          assessment_type: string
          competencies?: Json
          overall_score?: number | null
          assessed_at?: string
          result?: string | null
          recommendations?: string[] | null
          improvement_areas?: string[] | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          evidence_urls?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          assessor_id?: string | null
          branch_id?: string | null
          assessment_type?: string
          competencies?: Json
          overall_score?: number | null
          assessed_at?: string
          result?: string | null
          recommendations?: string[] | null
          improvement_areas?: string[] | null
          follow_up_required?: boolean | null
          follow_up_date?: string | null
          evidence_urls?: string[] | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trm_improvement_actions: {
        Row: {
          id: string
          branch_id: string
          source_type: string
          source_id: string | null
          title: string
          description: string | null
          category: string
          priority: string | null
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          status: string | null
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          effectiveness_rating: number | null
          effectiveness_notes: string | null
          evidence_urls: string[] | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          source_type: string
          source_id?: string | null
          title: string
          description?: string | null
          category: string
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          status?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          effectiveness_rating?: number | null
          effectiveness_notes?: string | null
          evidence_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          source_type?: string
          source_id?: string | null
          title?: string
          description?: string | null
          category?: string
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          status?: string | null
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          effectiveness_rating?: number | null
          effectiveness_notes?: string | null
          evidence_urls?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      trm_kpi_targets: {
        Row: {
          id: string
          branch_id: string
          target_year: number
          target_quarter: number | null
          target_risk_assessment_rate: number | null
          target_max_high_risk_trips: number | null
          target_max_incidents: number | null
          target_incident_resolution_days: number | null
          target_zero_high_severity: boolean | null
          target_response_time_minutes: number | null
          target_sos_acknowledgment_minutes: number | null
          target_training_compliance_rate: number | null
          target_safety_briefing_rate: number | null
          target_zero_injuries: boolean | null
          target_overall_score: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          target_year: number
          target_quarter?: number | null
          target_risk_assessment_rate?: number | null
          target_max_high_risk_trips?: number | null
          target_max_incidents?: number | null
          target_incident_resolution_days?: number | null
          target_zero_high_severity?: boolean | null
          target_response_time_minutes?: number | null
          target_sos_acknowledgment_minutes?: number | null
          target_training_compliance_rate?: number | null
          target_safety_briefing_rate?: number | null
          target_zero_injuries?: boolean | null
          target_overall_score?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          target_year?: number
          target_quarter?: number | null
          target_risk_assessment_rate?: number | null
          target_max_high_risk_trips?: number | null
          target_max_incidents?: number | null
          target_incident_resolution_days?: number | null
          target_zero_high_severity?: boolean | null
          target_response_time_minutes?: number | null
          target_sos_acknowledgment_minutes?: number | null
          target_training_compliance_rate?: number | null
          target_safety_briefing_rate?: number | null
          target_zero_injuries?: boolean | null
          target_overall_score?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      trm_performance_metrics: {
        Row: {
          id: string
          branch_id: string
          metric_period: string
          total_trips: number | null
          completed_trips: number | null
          cancelled_trips: number | null
          incidents_count: number | null
          incidents_high_severity: number | null
          incidents_resolved: number | null
          near_misses_count: number | null
          risk_assessments_required: number | null
          risk_assessments_completed: number | null
          risk_assessments_rate: number | null
          average_risk_score: number | null
          high_risk_trips: number | null
          sos_alerts_count: number | null
          average_response_time_minutes: number | null
          fastest_response_time_minutes: number | null
          slowest_response_time_minutes: number | null
          guides_total: number | null
          guides_training_compliant: number | null
          training_compliance_rate: number | null
          safety_briefings_completed: number | null
          safety_briefing_rate: number | null
          equipment_checks_completed: number | null
          equipment_check_rate: number | null
          passenger_injuries: number | null
          crew_injuries: number | null
          safety_complaints: number | null
          overall_trm_score: number | null
          score_breakdown: Json | null
          previous_month_score: number | null
          score_change: number | null
          calculated_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          metric_period: string
          total_trips?: number | null
          completed_trips?: number | null
          cancelled_trips?: number | null
          incidents_count?: number | null
          incidents_high_severity?: number | null
          incidents_resolved?: number | null
          near_misses_count?: number | null
          risk_assessments_required?: number | null
          risk_assessments_completed?: number | null
          risk_assessments_rate?: number | null
          average_risk_score?: number | null
          high_risk_trips?: number | null
          sos_alerts_count?: number | null
          average_response_time_minutes?: number | null
          fastest_response_time_minutes?: number | null
          slowest_response_time_minutes?: number | null
          guides_total?: number | null
          guides_training_compliant?: number | null
          training_compliance_rate?: number | null
          safety_briefings_completed?: number | null
          safety_briefing_rate?: number | null
          equipment_checks_completed?: number | null
          equipment_check_rate?: number | null
          passenger_injuries?: number | null
          crew_injuries?: number | null
          safety_complaints?: number | null
          overall_trm_score?: number | null
          score_breakdown?: Json | null
          previous_month_score?: number | null
          score_change?: number | null
          calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          metric_period?: string
          total_trips?: number | null
          completed_trips?: number | null
          cancelled_trips?: number | null
          incidents_count?: number | null
          incidents_high_severity?: number | null
          incidents_resolved?: number | null
          near_misses_count?: number | null
          risk_assessments_required?: number | null
          risk_assessments_completed?: number | null
          risk_assessments_rate?: number | null
          average_risk_score?: number | null
          high_risk_trips?: number | null
          sos_alerts_count?: number | null
          average_response_time_minutes?: number | null
          fastest_response_time_minutes?: number | null
          slowest_response_time_minutes?: number | null
          guides_total?: number | null
          guides_training_compliant?: number | null
          training_compliance_rate?: number | null
          safety_briefings_completed?: number | null
          safety_briefing_rate?: number | null
          equipment_checks_completed?: number | null
          equipment_check_rate?: number | null
          passenger_injuries?: number | null
          crew_injuries?: number | null
          safety_complaints?: number | null
          overall_trm_score?: number | null
          score_breakdown?: Json | null
          previous_month_score?: number | null
          score_change?: number | null
          calculated_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trm_quiz_questions: {
        Row: {
          id: string
          module_id: string
          question_text: string
          question_type: string | null
          options: Json | null
          correct_answer: boolean | null
          explanation: string | null
          points: number | null
          order_index: number | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          module_id: string
          question_text: string
          question_type?: string | null
          options?: Json | null
          correct_answer?: boolean | null
          explanation?: string | null
          points?: number | null
          order_index?: number | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          module_id?: string
          question_text?: string
          question_type?: string | null
          options?: Json | null
          correct_answer?: boolean | null
          explanation?: string | null
          points?: number | null
          order_index?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      trm_training_completions: {
        Row: {
          id: string
          module_id: string
          user_id: string
          branch_id: string | null
          started_at: string
          completed_at: string | null
          progress_percentage: number | null
          topics_completed: Json | null
          current_topic_index: number | null
          total_time_spent_minutes: number | null
          quiz_attempts: number | null
          quiz_score: number | null
          quiz_passed: boolean | null
          quiz_completed_at: string | null
          quiz_answers: Json | null
          certificate_issued: boolean | null
          certificate_url: string | null
          certificate_number: string | null
          valid_until: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          module_id: string
          user_id: string
          branch_id?: string | null
          started_at?: string
          completed_at?: string | null
          progress_percentage?: number | null
          topics_completed?: Json | null
          current_topic_index?: number | null
          total_time_spent_minutes?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          quiz_completed_at?: string | null
          quiz_answers?: Json | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          certificate_number?: string | null
          valid_until?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          module_id?: string
          user_id?: string
          branch_id?: string | null
          started_at?: string
          completed_at?: string | null
          progress_percentage?: number | null
          topics_completed?: Json | null
          current_topic_index?: number | null
          total_time_spent_minutes?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          quiz_passed?: boolean | null
          quiz_completed_at?: string | null
          quiz_answers?: Json | null
          certificate_issued?: boolean | null
          certificate_url?: string | null
          certificate_number?: string | null
          valid_until?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trm_training_modules: {
        Row: {
          id: string
          branch_id: string | null
          module_code: string
          title: string
          description: string | null
          training_type: string
          objectives: string[] | null
          learning_outcomes: string[] | null
          topics: Json | null
          total_duration_minutes: number | null
          has_quiz: boolean | null
          passing_score: number | null
          max_attempts: number | null
          material_urls: string[] | null
          video_urls: string[] | null
          prerequisites: string[] | null
          required_certifications: string[] | null
          target_roles: string[] | null
          is_active: boolean | null
          version: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          branch_id?: string | null
          module_code: string
          title: string
          description?: string | null
          training_type: string
          objectives?: string[] | null
          learning_outcomes?: string[] | null
          topics?: Json | null
          total_duration_minutes?: number | null
          has_quiz?: boolean | null
          passing_score?: number | null
          max_attempts?: number | null
          material_urls?: string[] | null
          video_urls?: string[] | null
          prerequisites?: string[] | null
          required_certifications?: string[] | null
          target_roles?: string[] | null
          is_active?: boolean | null
          version?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          module_code?: string
          title?: string
          description?: string | null
          training_type?: string
          objectives?: string[] | null
          learning_outcomes?: string[] | null
          topics?: Json | null
          total_duration_minutes?: number | null
          has_quiz?: boolean | null
          passing_score?: number | null
          max_attempts?: number | null
          material_urls?: string[] | null
          video_urls?: string[] | null
          prerequisites?: string[] | null
          required_certifications?: string[] | null
          target_roles?: string[] | null
          is_active?: boolean | null
          version?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      unified_notifications: {
        Row: {
          id: string
          user_id: string
          app: string
          type: string
          title: string
          message: string
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          app: string
          type: string
          title: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          app?: string
          type?: string
          title?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          id: string
          user_id: string
          purpose_id: string
          consent_given: boolean
          consent_method: string | null
          consent_timestamp: string | null
          ip_address: string | null
          user_agent: string | null
          device_info: Json | null
          withdrawn_at: string | null
          withdrawal_reason: string | null
          consent_version: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          purpose_id: string
          consent_given: boolean
          consent_method?: string | null
          consent_timestamp?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          consent_version?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          purpose_id?: string
          consent_given?: boolean
          consent_method?: string | null
          consent_timestamp?: string | null
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          withdrawn_at?: string | null
          withdrawal_reason?: string | null
          consent_version?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_contracts: {
        Row: {
          id: string
          user_id: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          document_url: string | null
          version: string | null
          signed_name: string
          signed_nik: string | null
          signed_at: string
          ip_address: string | null
          user_agent: string | null
          valid_from: string
          valid_until: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          document_url?: string | null
          version?: string | null
          signed_name: string
          signed_nik?: string | null
          signed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          valid_from?: string
          valid_until?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          document_url?: string | null
          version?: string | null
          signed_name?: string
          signed_nik?: string | null
          signed_at?: string
          ip_address?: string | null
          user_agent?: string | null
          valid_from?: string
          valid_until?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          user_name: string | null
          feedback_type: string
          category: string | null
          title: string
          description: string
          screenshots: string[] | null
          page_url: string | null
          user_agent: string | null
          device_info: Json | null
          priority: string | null
          status: string | null
          assigned_to: string | null
          assigned_at: string | null
          resolution_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          upvotes: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_name?: string | null
          feedback_type: string
          category?: string | null
          title: string
          description: string
          screenshots?: string[] | null
          page_url?: string | null
          user_agent?: string | null
          device_info?: Json | null
          priority?: string | null
          status?: string | null
          assigned_to?: string | null
          assigned_at?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          upvotes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          user_name?: string | null
          feedback_type?: string
          category?: string | null
          title?: string
          description?: string
          screenshots?: string[] | null
          page_url?: string | null
          user_agent?: string | null
          device_info?: Json | null
          priority?: string | null
          status?: string | null
          assigned_to?: string | null
          assigned_at?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          upvotes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          is_primary: boolean | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          suspended_at: string | null
          suspended_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          status?: string | null
          is_primary?: boolean | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          is_primary?: boolean | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_saved_filters: {
        Row: {
          id: string
          user_id: string
          module: string
          filter_name: string
          filter_conditions: Json
          is_default: boolean | null
          is_shared: boolean | null
          usage_count: number | null
          last_used_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          module: string
          filter_name: string
          filter_conditions: Json
          is_default?: boolean | null
          is_shared?: boolean | null
          usage_count?: number | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          module?: string
          filter_name?: string
          filter_conditions?: Json
          is_default?: boolean | null
          is_shared?: boolean | null
          usage_count?: number | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          branch_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          full_name: string
          phone: string | null
          avatar_url: string | null
          company_name: string | null
          company_address: string | null
          npwp: string | null
          nik: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          is_contract_signed: boolean | null
          contract_signed_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          address: string | null
          employee_number: string | null
          hire_date: string | null
          supervisor_id: string | null
          home_address: string | null
          siup_number: string | null
          siup_document_url: string | null
          partner_tier: string | null
          tier_assigned_at: string | null
          tier_assigned_by: string | null
          tier_auto_calculated: boolean | null
          email: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          is_verified: boolean | null
          logo_url: string | null
          points: number | null
          company_id: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          total_bookings: number | null
          total_spent: number | null
        }
        Insert: {
          id: string
          branch_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          company_name?: string | null
          company_address?: string | null
          npwp?: string | null
          nik?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          is_contract_signed?: boolean | null
          contract_signed_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          address?: string | null
          employee_number?: string | null
          hire_date?: string | null
          supervisor_id?: string | null
          home_address?: string | null
          siup_number?: string | null
          siup_document_url?: string | null
          partner_tier?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_auto_calculated?: boolean | null
          email?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          points?: number | null
          company_id?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          total_bookings?: number | null
          total_spent?: number | null
        }
        Update: {
          id?: string
          branch_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          company_name?: string | null
          company_address?: string | null
          npwp?: string | null
          nik?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          is_contract_signed?: boolean | null
          contract_signed_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          address?: string | null
          employee_number?: string | null
          hire_date?: string | null
          supervisor_id?: string | null
          home_address?: string | null
          siup_number?: string | null
          siup_document_url?: string | null
          partner_tier?: string | null
          tier_assigned_at?: string | null
          tier_assigned_by?: string | null
          tier_auto_calculated?: boolean | null
          email?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          is_verified?: boolean | null
          logo_url?: string | null
          points?: number | null
          company_id?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          total_bookings?: number | null
          total_spent?: number | null
        }
        Relationships: []
      }
      validation_logs: {
        Row: {
          id: string
          validation_type: string
          run_at: string
          total_checks: number
          passed: number
          failed: number
          warnings: number
          criticals: number
          status: string
          results: Json | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          validation_type: string
          run_at?: string
          total_checks?: number
          passed?: number
          failed?: number
          warnings?: number
          criticals?: number
          status?: string
          results?: Json | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          validation_type?: string
          run_at?: string
          total_checks?: number
          passed?: number
          failed?: number
          warnings?: number
          criticals?: number
          status?: string
          results?: Json | null
          error_message?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          branch_id: string
          name: string
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          description: string | null
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          bank_name: string | null
          bank_account_number: string | null
          bank_account_name: string | null
          default_price: number | null
          price_unit: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          description?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          default_price?: number | null
          price_unit?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          vendor_type?: Database["public"]["Enums"]["vendor_type"]
          description?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          bank_account_name?: string | null
          default_price?: number | null
          price_unit?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      waste_log_photos: {
        Row: {
          id: string
          waste_log_id: string
          photo_url: string
          photo_gps: Json | null
          captured_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          waste_log_id: string
          photo_url: string
          photo_gps?: Json | null
          captured_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          waste_log_id?: string
          photo_url?: string
          photo_gps?: Json | null
          captured_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      waste_logs: {
        Row: {
          id: string
          trip_id: string
          branch_id: string
          waste_type: Database["public"]["Enums"]["waste_type"]
          quantity: number
          unit: Database["public"]["Enums"]["waste_unit"]
          disposal_method: Database["public"]["Enums"]["disposal_method"]
          logged_by: string
          logged_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          branch_id: string
          waste_type: Database["public"]["Enums"]["waste_type"]
          quantity: number
          unit: Database["public"]["Enums"]["waste_unit"]
          disposal_method: Database["public"]["Enums"]["disposal_method"]
          logged_by: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          branch_id?: string
          waste_type?: Database["public"]["Enums"]["waste_type"]
          quantity?: number
          unit?: Database["public"]["Enums"]["waste_unit"]
          disposal_method?: Database["public"]["Enums"]["disposal_method"]
          logged_by?: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waste_types_lookup: {
        Row: {
          id: string
          type_name: string
          category: string
          description: string | null
          recommended_disposal: string | null
          icon: string | null
          sort_order: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type_name: string
          category: string
          description?: string | null
          recommended_disposal?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type_name?: string
          category?: string
          description?: string | null
          recommended_disposal?: string | null
          icon?: string | null
          sort_order?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      water_tank_logs: {
        Row: {
          id: string
          tank_id: string
          trip_id: string | null
          previous_level_liters: number | null
          new_level_liters: number
          change_liters: number | null
          action_type: string
          logged_by: string
          logged_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          tank_id: string
          trip_id?: string | null
          previous_level_liters?: number | null
          new_level_liters: number
          change_liters?: number | null
          action_type: string
          logged_by: string
          logged_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          tank_id?: string
          trip_id?: string | null
          previous_level_liters?: number | null
          new_level_liters?: number
          change_liters?: number | null
          action_type?: string
          logged_by?: string
          logged_at?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      water_tanks: {
        Row: {
          id: string
          branch_id: string
          vessel_id: string | null
          tank_name: string
          tank_type: string
          capacity_liters: number
          current_level_liters: number | null
          current_percentage: number | null
          last_checked_at: string | null
          last_refilled_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          branch_id: string
          vessel_id?: string | null
          tank_name: string
          tank_type: string
          capacity_liters: number
          current_level_liters?: number | null
          current_percentage?: number | null
          last_checked_at?: string | null
          last_refilled_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          branch_id?: string
          vessel_id?: string | null
          tank_name?: string
          tank_type?: string
          capacity_liters?: number
          current_level_liters?: number | null
          current_percentage?: number | null
          last_checked_at?: string | null
          last_refilled_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      water_usage_logs: {
        Row: {
          id: string
          trip_id: string | null
          branch_id: string
          usage_type: string
          quantity_liters: number
          source: string
          source_location: string | null
          logged_by: string
          logged_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          branch_id: string
          usage_type: string
          quantity_liters: number
          source?: string
          source_location?: string | null
          logged_by: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          branch_id?: string
          usage_type?: string
          quantity_liters?: number
          source?: string
          source_location?: string | null
          logged_by?: string
          logged_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          id: string
          location_key: string
          latitude: number | null
          longitude: number | null
          region: string | null
          current_weather: Json | null
          forecast_hourly: Json | null
          forecast_daily: Json | null
          maritime_conditions: Json | null
          source: string | null
          raw_response: Json | null
          fetched_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          location_key: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          current_weather?: Json | null
          forecast_hourly?: Json | null
          forecast_daily?: Json | null
          maritime_conditions?: Json | null
          source?: string | null
          raw_response?: Json | null
          fetched_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          location_key?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          current_weather?: Json | null
          forecast_hourly?: Json | null
          forecast_daily?: Json | null
          maritime_conditions?: Json | null
          source?: string | null
          raw_response?: Json | null
          fetched_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      zone_violation_reports: {
        Row: {
          id: string
          compliance_id: string
          zone_id: string
          trip_id: string
          branch_id: string | null
          violation_type: string
          severity: string
          description: string
          latitude: number | null
          longitude: number | null
          occurred_at: string
          evidence_urls: string[] | null
          gps_data: Json | null
          status: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          penalty_applied: string | null
          penalty_amount: number | null
          created_at: string | null
          updated_at: string | null
          reported_by: string | null
        }
        Insert: {
          id?: string
          compliance_id: string
          zone_id: string
          trip_id: string
          branch_id?: string | null
          violation_type: string
          severity?: string
          description: string
          latitude?: number | null
          longitude?: number | null
          occurred_at: string
          evidence_urls?: string[] | null
          gps_data?: Json | null
          status?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          penalty_applied?: string | null
          penalty_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
          reported_by?: string | null
        }
        Update: {
          id?: string
          compliance_id?: string
          zone_id?: string
          trip_id?: string
          branch_id?: string | null
          violation_type?: string
          severity?: string
          description?: string
          latitude?: number | null
          longitude?: number | null
          occurred_at?: string
          evidence_urls?: string[] | null
          gps_data?: Json | null
          status?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          penalty_applied?: string | null
          penalty_amount?: number | null
          created_at?: string | null
          updated_at?: string | null
          reported_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      corporate_usage_by_department: {
        Row: {
          corporate_id: string | null
          company_name: string | null
          department: string | null
          employee_count: number | null
          total_allocated: number | null
          total_used: number | null
          booking_count: number | null
        }
        Relationships: []
      }
      trip_profit_loss: {
        Row: {
          trip_id: string | null
          trip_code: string | null
          trip_date: string | null
          branch_id: string | null
          package_name: string | null
          gross_revenue: number | null
          payment_fees: number | null
          net_revenue: number | null
          internal_asset_cost: number | null
          external_costs: number | null
          guide_fees: number | null
          net_profit: number | null
        }
        Relationships: []
      }
      unified_customer_profiles: {
        Row: {
          unified_id: string | null
          name: string | null
          email: string | null
          phone: string | null
          source: string | null
          partner_customer_id: string | null
          customer_id: string | null
          total_bookings: number | null
          total_spent: number | null
          last_trip_date: string | null
          first_booking_date: string | null
        }
        Relationships: []
      }
      v_permenparekraf_criteria_summary: {
        Row: {
          business_type: string | null
          section_code: string | null
          criteria_count: number | null
          total_weight: number | null
          avg_max_score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_discount_code: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      array_to_halfvec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      array_to_sparsevec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      array_to_vector: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_calculate_co2_emissions: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_expire_certifications: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_expire_contracts: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_link_trip_to_master_contract: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_reassign_expired_assignments: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_terminate_on_critical_sanction: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_terminate_on_resignation_approved: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      auto_update_guide_wallet_balance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      award_partner_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      award_reward_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      binary_quantize: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      booking_requires_approval: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_assessment_grade: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_branch_training_compliance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_chse_score: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_co2_emissions: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_confirmation_deadline: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_contract_expires_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_crisis_response_time: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_destination_risk_score: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_guide_wallet_balance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_monthly_sustainability_metrics: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_partner_tier: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_refund: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_risk_score: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_trm_metrics: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      can_trip_start: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_brute_force_attack: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_budget_alert: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_certificate_expiry: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_contract_renewal: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_expiring_certifications: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_guide_certifications_valid: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_license_expiry: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_mandatory_training_reminders: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_missing_payments_count: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_training_compliance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_user_training_compliance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      check_wallet_milestones: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      complete_referral: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      cosine_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      create_emergency_notification_batch: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      decrypt_setting: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      encrypt_setting: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      ensure_single_default_bank_account: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      exec_sql: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      expire_gift_vouchers: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      expire_old_export_files: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      expire_partner_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      fix_balance_mismatches: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      fix_date_inconsistencies: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      fix_missing_wallets: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      fix_negative_balances: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      fix_orphaned_trip_guides: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_booking_code: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_contract_number: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_crisis_event_code: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_daily_insurance_manifests: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_incident_report_number: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_insurance_manifest: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_invoice_number: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      generate_referral_code: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_ab_test_variant: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_ai_usage_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_asita_membership: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_budget_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_community_impact_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_compliance_dashboard: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_compliance_score: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_current_seasonal_risk: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_expiring_certifications: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_guide_competency_completion: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_incident_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_location_advisories: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_near_miss_stats: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_nearby_zones: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_overdue_trainings: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_pending_approval_count: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_risk_level: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_season_multiplier: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_security_event_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_setting: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_supplier_compliance_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_suppliers_by_type: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_trip_emergency_contacts: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_trip_water_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_user_branch_id: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_user_consent: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_user_consent_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_user_role: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_validation_summary: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_accum: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_add: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_avg: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_cmp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_combine: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_concat: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_eq: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_ge: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_gt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_l2_squared_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_le: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_lt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_mul: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_ne: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_negative_inner_product: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_out: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_recv: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_send: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_spherical_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_sub: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_to_float4: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_to_sparsevec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_to_vector: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      halfvec_typmod_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      hamming_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      handle_new_user: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      handle_user_update: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      has_mra_tp_certification: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      hnsw_bit_support: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      hnswhandler: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      init_competitor_prices_trigger: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      inner_product: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_admin_from_jwt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_internal_staff: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_point_in_zone: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_super_admin: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_weather_cache_valid: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      is_within_geofence: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      ivfflathandler: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      jaccard_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      l1_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      l2_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      l2_norm: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      l2_normalize: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_audit: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_booking_activity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_destination_risk_change: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_guide_assignment_audit: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_partner_tier_change: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_settings_change: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_tank_level_change: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      log_waiver_signature: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      match_customer_by_email_phone: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      match_documents: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      perform_credit_repayment: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      perform_wallet_debit: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      process_approved_booking: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      redeem_partner_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      redeem_reward_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      refresh_feature_usage_stats: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      refresh_package_popularity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      refresh_package_rating_stats: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      restore_bank_account_original_data: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      run_daily_validation_check: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      set_read_at_on_read: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      set_thread_id_for_root_message: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      set_trip_guide_assigned_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_cmp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_eq: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_ge: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_gt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_l2_squared_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_le: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_lt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_ne: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_negative_inner_product: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_out: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_recv: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_send: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_to_halfvec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_to_vector: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sparsevec_typmod_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      subvector: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sync_all_guide_wallet_balances: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sync_guide_profile_from_user: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      sync_user_email: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      trigger_refresh_package_popularity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_admin_push_subscription_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_assignment_status: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_competitor_prices_trigger: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_compliance_status_from_assessment: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_contract_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_credit_used_on_debit: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_custom_reports_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_discount_codes_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_email_templates_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_gift_vouchers_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_guide_bank_accounts_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_guide_documents_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_guide_profile_availability: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_incident_reports_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_integration_settings_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_last_reminder_sent: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_near_miss_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_notification_templates_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_package_reviews_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_branches_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_broadcasts_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_contracts_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_inbox_messages_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_push_subscriptions_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_partner_tiers: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_review_helpful_count: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_sanction_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_seasons_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_supplier_assessment_timestamp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_updated_at_column: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      update_user_loyalty_points: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_all_guides_integrity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_all_trips_integrity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_discount_code: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_guide_data_integrity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_payment_integrity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      validate_trip_data_integrity: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_accum: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_add: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_avg: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_cmp: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_combine: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_concat: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_dims: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_eq: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_ge: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_gt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_l2_squared_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_le: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_lt: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_mul: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_ne: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_negative_inner_product: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_norm: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_out: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_recv: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_send: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_spherical_distance: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_sub: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_to_float4: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_to_halfvec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_to_sparsevec: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      vector_typmod_in: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
    ai_document_type: "sop" | "faq" | "policy" | "product_info" | "training"
    asset_status: "available" | "in_use" | "maintenance" | "retired"
    asset_type: "boat" | "speedboat" | "villa" | "vehicle" | "equipment"
    assignment_status: "pending" | "completed" | "overdue"
    attendance_status: "present" | "absent" | "late"
    audit_action: "create" | "read" | "update" | "delete" | "login" | "logout" | "export" | "unmask" | "approve" | "reject"
    booking_source: "website" | "admin" | "mitra" | "corporate" | "whatsapp" | "referral"
    booking_status: "draft" | "pending_payment" | "awaiting_full_payment" | "paid" | "confirmed" | "ongoing" | "cancelled" | "refunded" | "completed"
    broadcast_type: "weather_info" | "dock_info" | "sop_change" | "general_announcement"
    contract_type: "pkwt" | "pakta_integritas" | "nda" | "mitra_agreement"
    contribution_status: "pending" | "paid" | "late" | "missed"
    corporate_approval_status: "pending" | "approved" | "rejected" | "cancelled"
    corporate_transaction_type: "topup" | "employee_allocation" | "booking_debit" | "refund_credit" | "adjustment"
    crisis_type: "weather" | "medical" | "security" | "accident" | "natural_disaster" | "equipment_failure" | "other"
    cron_job_status: "running" | "completed" | "failed"
    customer_wallet_transaction_type: "refund_credit" | "booking_debit" | "topup" | "withdrawal" | "adjustment"
    deduction_reason: "late_check_in" | "missing_documentation" | "complaint" | "damage" | "other"
    deduction_type: "late_penalty" | "no_documentation" | "damage" | "other"
    discount_type: "percentage" | "fixed"
    disposal_method: "landfill" | "recycling" | "incineration" | "ocean"
    escalation_level: "level_1" | "level_2" | "level_3" | "critical"
    expense_category: "fuel" | "food" | "ticket" | "transport" | "equipment" | "emergency" | "other"
    expense_request_status: "draft" | "pending_manager" | "pending_director" | "approved" | "rejected" | "paid" | "cancelled"
    feedback_rating: "excellent" | "good" | "needs_improvement"
    fuel_type: "diesel" | "gasoline" | "other"
    guide_availability_status: "available" | "not_available"
    guide_contract_status: "draft" | "pending_signature" | "pending_company" | "active" | "expired" | "terminated" | "rejected"
    guide_contract_type: "per_trip" | "monthly" | "project" | "seasonal" | "annual"
    guide_current_status: "standby" | "on_trip" | "not_available"
    guide_license_status: "pending_review" | "document_verified" | "document_rejected" | "ready_for_assessment" | "assessment_in_progress" | "assessment_passed" | "assessment_failed" | "training_in_progress" | "training_completed" | "pending_approval" | "approved" | "rejected" | "license_issued" | "active" | "expired" | "revoked" | "suspended"
    guide_resign_status: "pending" | "approved" | "rejected" | "withdrawn"
    guide_role: "lead" | "assistant" | "driver" | "photographer"
    guide_sanction_severity: "low" | "medium" | "high" | "critical"
    guide_sanction_type: "warning" | "suspension" | "fine" | "demotion" | "termination"
    guide_wallet_transaction_type: "earning" | "withdraw_request" | "withdraw_approved" | "withdraw_rejected" | "adjustment"
    id_type: "ktp" | "passport" | "sim" | "other"
    inbox_parsing_status: "pending" | "parsed" | "failed" | "skipped"
    inventory_transaction_type: "purchase" | "usage" | "adjustment" | "transfer"
    invoice_status: "draft" | "sent" | "paid" | "cancelled"
    license_status: "valid" | "warning" | "critical" | "expired" | "suspended"
    license_type: "nib" | "skdn" | "sisupar" | "tdup" | "asita" | "chse"
    maintenance_status: "scheduled" | "in_progress" | "completed" | "cancelled"
    maintenance_type: "scheduled" | "emergency" | "inspection"
    manifest_status: "pending" | "generated" | "sent" | "failed"
    notification_channel: "whatsapp" | "email" | "push" | "sms"
    notification_status: "pending" | "sent" | "delivered" | "read" | "failed"
    package_status: "draft" | "published" | "archived"
    package_type: "open_trip" | "private_trip" | "corporate" | "kol_trip"
    partner_reward_source_type: "earn_booking" | "earn_referral" | "earn_milestone" | "earn_special" | "manual"
    partner_reward_transaction_type: "earn" | "redeem" | "expire" | "adjustment" | "refund"
    passenger_type: "adult" | "child" | "infant"
    payment_method: "xendit_invoice" | "xendit_va" | "xendit_qris" | "xendit_ewallet" | "xendit_card" | "mitra_wallet" | "manual_transfer" | "cash"
    payment_status: "pending" | "processing" | "paid" | "failed" | "expired" | "refunded"
    period_type: "monthly" | "quarterly" | "yearly"
    points_transaction_type: "earn_booking" | "earn_referral" | "earn_review" | "redeem" | "expire" | "adjustment"
    promo_item_type: "promo" | "update" | "announcement"
    promo_priority: "low" | "medium" | "high"
    question_type: "multiple_choice" | "rating"
    refund_status: "pending" | "approved" | "processing" | "completed" | "rejected"
    risk_category: "marine" | "land" | "mixed" | "air"
    salary_payment_status: "pending" | "documentation_required" | "ready" | "paid" | "cancelled"
    season_type: "high_season" | "peak_season" | "low_season"
    sos_alert_type: "emergency" | "medical" | "security" | "weather" | "mechanical" | "other"
    sos_status: "active" | "acknowledged" | "responding" | "resolved" | "false_alarm"
    split_bill_status: "pending" | "partial_paid" | "fully_paid" | "expired" | "cancelled"
    threat_level: "low" | "medium" | "high" | "critical"
    ticket_category: "facility_issue" | "food_issue" | "guide_complaint" | "safety_issue" | "payment_issue" | "refund_request" | "general_inquiry" | "other"
    ticket_priority: "low" | "medium" | "high" | "urgent"
    ticket_status: "open" | "in_progress" | "escalated" | "resolved" | "closed"
    training_category: "safety" | "customer_service" | "navigation" | "first_aid" | "equipment" | "other"
    training_frequency: "monthly" | "quarterly" | "yearly"
    training_status: "not_started" | "in_progress" | "completed" | "failed"
    training_type: "sop" | "safety" | "drill" | "chse" | "first_aid" | "other"
    travel_circle_status: "active" | "target_reached" | "redeemed" | "cancelled"
    trip_assignment_status: "pending_confirmation" | "confirmed" | "rejected" | "expired" | "auto_reassigned"
    trip_status: "scheduled" | "preparing" | "on_the_way" | "on_trip" | "completed" | "cancelled"
    user_role: "super_admin" | "investor" | "finance_manager" | "marketing" | "ops_admin" | "guide" | "mitra" | "customer" | "corporate"
    validation_severity: "critical" | "warning" | "info"
    vendor_type: "boat_rental" | "catering" | "transport" | "accommodation" | "ticket" | "equipment" | "other"
    wallet_transaction_type: "topup" | "booking_debit" | "refund_credit" | "adjustment" | "credit_repayment"
    waste_type: "plastic" | "organic" | "glass" | "hazmat"
    waste_unit: "kg" | "pieces"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
