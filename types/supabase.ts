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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_documents: {
        Row: {
          branch_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          document_type: Database["public"]["Enums"]["ai_document_type"]
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          document_type: Database["public"]["Enums"]["ai_document_type"]
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["ai_document_type"]
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          actual_cost: number | null
          asset_id: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string
          end_date: string
          estimated_cost: number | null
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          start_date: string
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          actual_cost?: number | null
          asset_id: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          end_date: string
          estimated_cost?: number | null
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          start_date: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          actual_cost?: number | null
          asset_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          end_date?: string
          estimated_cost?: number | null
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          branch_id: string
          capacity: number | null
          code: string
          created_at: string | null
          current_location: string | null
          deleted_at: string | null
          description: string | null
          engine_hours: number | null
          home_base: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_owned: boolean | null
          last_maintenance_date: string | null
          name: string
          next_maintenance_date: string | null
          owner_name: string | null
          owner_phone: string | null
          photo_url: string | null
          registration_expiry: string | null
          registration_number: string | null
          rental_price_per_day: number | null
          rental_price_per_trip: number | null
          specifications: Json | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string | null
        }
        Insert: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          branch_id: string
          capacity?: number | null
          code: string
          created_at?: string | null
          current_location?: string | null
          deleted_at?: string | null
          description?: string | null
          engine_hours?: number | null
          home_base?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          name: string
          next_maintenance_date?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          photo_url?: string | null
          registration_expiry?: string | null
          registration_number?: string | null
          rental_price_per_day?: number | null
          rental_price_per_trip?: number | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          branch_id?: string
          capacity?: number | null
          code?: string
          created_at?: string | null
          current_location?: string | null
          deleted_at?: string | null
          description?: string | null
          engine_hours?: number | null
          home_base?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_owned?: boolean | null
          last_maintenance_date?: string | null
          name?: string
          next_maintenance_date?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          photo_url?: string | null
          registration_expiry?: string | null
          registration_number?: string | null
          rental_price_per_day?: number | null
          rental_price_per_trip?: number | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_passengers: {
        Row: {
          booking_id: string
          created_at: string | null
          date_of_birth: string | null
          dietary_requirements: string | null
          email: string | null
          emergency_name: string | null
          emergency_phone: string | null
          full_name: string
          health_conditions: string | null
          id: string
          id_card_url: string | null
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          id_verified: boolean | null
          passenger_type: Database["public"]["Enums"]["passenger_type"]
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          date_of_birth?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          full_name: string
          health_conditions?: string | null
          id?: string
          id_card_url?: string | null
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          id_verified?: boolean | null
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          date_of_birth?: string | null
          dietary_requirements?: string | null
          email?: string | null
          emergency_name?: string | null
          emergency_phone?: string | null
          full_name?: string
          health_conditions?: string | null
          id?: string
          id_card_url?: string | null
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          id_verified?: boolean | null
          passenger_type?: Database["public"]["Enums"]["passenger_type"]
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          adult_pax: number
          booking_code: string
          booking_date: string
          branch_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          child_pax: number
          consent_agreed: boolean | null
          consent_agreed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          discount_amount: number | null
          id: string
          infant_pax: number
          internal_notes: string | null
          mitra_id: string | null
          nta_price_per_adult: number | null
          nta_total: number | null
          package_id: string
          price_per_adult: number
          price_per_child: number
          referral_code: string | null
          source: Database["public"]["Enums"]["booking_source"]
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          trip_date: string
          updated_at: string | null
        }
        Insert: {
          adult_pax?: number
          booking_code: string
          booking_date?: string
          branch_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          child_pax?: number
          consent_agreed?: boolean | null
          consent_agreed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          discount_amount?: number | null
          id?: string
          infant_pax?: number
          internal_notes?: string | null
          mitra_id?: string | null
          nta_price_per_adult?: number | null
          nta_total?: number | null
          package_id: string
          price_per_adult: number
          price_per_child?: number
          referral_code?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          trip_date: string
          updated_at?: string | null
        }
        Update: {
          adult_pax?: number
          booking_code?: string
          booking_date?: string
          branch_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          child_pax?: number
          consent_agreed?: boolean | null
          consent_agreed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          discount_amount?: number | null
          id?: string
          infant_pax?: number
          internal_notes?: string | null
          mitra_id?: string | null
          nta_price_per_adult?: number | null
          nta_total?: number | null
          package_id?: string
          price_per_adult?: number
          price_per_child?: number
          referral_code?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          trip_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mitra_id_fkey"
            columns: ["mitra_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          tax_inclusive: boolean | null
          tax_rate: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          tax_inclusive?: boolean | null
          tax_rate?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      corporate_clients: {
        Row: {
          branch_id: string
          company_address: string | null
          company_email: string | null
          company_name: string
          company_phone: string | null
          contract_document_url: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          credit_limit: number | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          npwp: string | null
          npwp_address: string | null
          npwp_name: string | null
          pic_email: string | null
          pic_id: string | null
          pic_name: string | null
          pic_phone: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          company_address?: string | null
          company_email?: string | null
          company_name: string
          company_phone?: string | null
          contract_document_url?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          credit_limit?: number | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          npwp?: string | null
          npwp_address?: string | null
          npwp_name?: string | null
          pic_email?: string | null
          pic_id?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          company_address?: string | null
          company_email?: string | null
          company_name?: string
          company_phone?: string | null
          contract_document_url?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          credit_limit?: number | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          npwp?: string | null
          npwp_address?: string | null
          npwp_name?: string | null
          pic_email?: string | null
          pic_id?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_clients_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_clients_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_deposit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          deposit_id: string
          description: string | null
          employee_id: string | null
          id: string
          transaction_type: Database["public"]["Enums"]["corporate_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_id: string
          description?: string | null
          employee_id?: string | null
          id?: string
          transaction_type: Database["public"]["Enums"]["corporate_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_id?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          transaction_type?: Database["public"]["Enums"]["corporate_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "corporate_deposit_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_deposit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_deposit_transactions_deposit_id_fkey"
            columns: ["deposit_id"]
            isOneToOne: false
            referencedRelation: "corporate_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_deposit_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_deposits: {
        Row: {
          balance: number
          corporate_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          corporate_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          corporate_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_deposits_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_employees: {
        Row: {
          allocated_amount: number | null
          corporate_id: string
          created_at: string | null
          department: string | null
          email: string
          employee_id_number: string | null
          full_name: string
          id: string
          invitation_sent_at: string | null
          is_active: boolean | null
          phone: string | null
          registered_at: string | null
          remaining_amount: number | null
          updated_at: string | null
          used_amount: number | null
          user_id: string | null
        }
        Insert: {
          allocated_amount?: number | null
          corporate_id: string
          created_at?: string | null
          department?: string | null
          email: string
          employee_id_number?: string | null
          full_name: string
          id?: string
          invitation_sent_at?: string | null
          is_active?: boolean | null
          phone?: string | null
          registered_at?: string | null
          remaining_amount?: number | null
          updated_at?: string | null
          used_amount?: number | null
          user_id?: string | null
        }
        Update: {
          allocated_amount?: number | null
          corporate_id?: string
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id_number?: string | null
          full_name?: string
          id?: string
          invitation_sent_at?: string | null
          is_active?: boolean | null
          phone?: string | null
          registered_at?: string | null
          remaining_amount?: number | null
          updated_at?: string | null
          used_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_employees_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invoice_items: {
        Row: {
          booking_id: string | null
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invoice_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "corporate_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invoices: {
        Row: {
          corporate_id: string
          created_at: string | null
          created_by: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          paid_amount: number | null
          paid_at: string | null
          payment_reference: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number | null
          tax_invoice_date: string | null
          tax_invoice_number: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          corporate_id: string
          created_at?: string | null
          created_by?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount?: number | null
          tax_invoice_date?: string | null
          tax_invoice_number?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          corporate_id?: string
          created_at?: string | null
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_invoice_date?: string | null
          tax_invoice_number?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invoices_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          job_name: string
          job_type: string
          metadata: Json | null
          records_processed: number | null
          started_at: string
          status: Database["public"]["Enums"]["cron_job_status"]
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name: string
          job_type: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["cron_job_status"]
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name?: string
          job_type?: string
          metadata?: Json | null
          records_processed?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["cron_job_status"]
        }
        Relationships: []
      }
      customer_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          refund_id: string | null
          transaction_type: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          refund_id?: string | null
          transaction_type: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          refund_id?: string | null
          transaction_type?: Database["public"]["Enums"]["customer_wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_wallet_transactions_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "customer_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wallets: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_logs: {
        Row: {
          deleted_at: string
          entity_id: string
          entity_type: string
          files_deleted: string[] | null
          id: string
          original_trip_date: string | null
          retention_days: number
        }
        Insert: {
          deleted_at?: string
          entity_id: string
          entity_type: string
          files_deleted?: string[] | null
          id?: string
          original_trip_date?: string | null
          retention_days: number
        }
        Update: {
          deleted_at?: string
          entity_id?: string
          entity_type?: string
          files_deleted?: string[] | null
          id?: string
          original_trip_date?: string | null
          retention_days?: number
        }
        Relationships: []
      }
      expense_requests: {
        Row: {
          amount: number
          approval_level: number | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          branch_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          description: string
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_proof_url: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          request_code: string
          requested_by: string
          status: Database["public"]["Enums"]["expense_request_status"]
          trip_id: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approval_level?: number | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id: string
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_code: string
          requested_by: string
          status?: Database["public"]["Enums"]["expense_request_status"]
          trip_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approval_level?: number | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          description?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_proof_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          request_code?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["expense_request_status"]
          trip_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "expense_requests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_pings: {
        Row: {
          accuracy_meters: number | null
          altitude_meters: number | null
          battery_percent: number | null
          created_at: string | null
          guide_id: string
          heading: number | null
          id: string
          is_charging: boolean | null
          latitude: number
          longitude: number
          network_type: string | null
          recorded_at: string
          speed_kmh: number | null
          trip_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          altitude_meters?: number | null
          battery_percent?: number | null
          created_at?: string | null
          guide_id: string
          heading?: number | null
          id?: string
          is_charging?: boolean | null
          latitude: number
          longitude: number
          network_type?: string | null
          recorded_at?: string
          speed_kmh?: number | null
          trip_id: string
        }
        Update: {
          accuracy_meters?: number | null
          altitude_meters?: number | null
          battery_percent?: number | null
          created_at?: string | null
          guide_id?: string
          heading?: number | null
          id?: string
          is_charging?: boolean | null
          latitude?: number
          longitude?: number
          network_type?: string | null
          recorded_at?: string
          speed_kmh?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_pings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_pings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "gps_pings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_assessment_templates: {
        Row: {
          assessment_type: string
          branch_id: string | null
          category: string
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          is_required: boolean | null
          name: string
          passing_score: number | null
          questions: Json
          recurrence_interval: number | null
          result_categories: Json | null
          scoring_config: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assessment_type: string
          branch_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          is_required?: boolean | null
          name: string
          passing_score?: number | null
          questions: Json
          recurrence_interval?: number | null
          result_categories?: Json | null
          scoring_config?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assessment_type?: string
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          is_required?: boolean | null
          name?: string
          passing_score?: number | null
          questions?: Json
          recurrence_interval?: number | null
          result_categories?: Json | null
          scoring_config?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_assessment_templates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_assessments: {
        Row: {
          answers: Json
          category: string | null
          completed_at: string | null
          created_at: string | null
          guide_id: string
          id: string
          insights: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          started_at: string | null
          status: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          answers?: Json
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          guide_id: string
          id?: string
          insights?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          answers?: Json
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          guide_id?: string
          id?: string
          insights?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string | null
          status?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_assessments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_assessments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "guide_assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_availability: {
        Row: {
          available_from: string
          available_until: string
          created_at: string | null
          guide_id: string
          id: string
          reason: string | null
          status: Database["public"]["Enums"]["guide_availability_status"]
        }
        Insert: {
          available_from: string
          available_until: string
          created_at?: string | null
          guide_id: string
          id?: string
          reason?: string | null
          status: Database["public"]["Enums"]["guide_availability_status"]
        }
        Update: {
          available_from?: string
          available_until?: string
          created_at?: string | null
          guide_id?: string
          id?: string
          reason?: string | null
          status?: Database["public"]["Enums"]["guide_availability_status"]
        }
        Relationships: [
          {
            foreignKeyName: "guide_availability_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          approved_at: string | null
          approved_by: string | null
          bank_name: string
          branch_code: string | null
          branch_name: string | null
          created_at: string | null
          guide_id: string
          id: string
          is_default: boolean | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          approved_at?: string | null
          approved_by?: string | null
          bank_name: string
          branch_code?: string | null
          branch_name?: string | null
          created_at?: string | null
          guide_id: string
          id?: string
          is_default?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          approved_at?: string | null
          approved_by?: string | null
          bank_name?: string
          branch_code?: string | null
          branch_name?: string | null
          created_at?: string | null
          guide_id?: string
          id?: string
          is_default?: boolean | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_bank_accounts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_bank_accounts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_bank_accounts_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_certifications: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          expires_at: string | null
          guide_id: string
          id: string
          is_valid: boolean | null
          issued_at: string | null
          module_id: string
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          expires_at?: string | null
          guide_id: string
          id?: string
          is_valid?: boolean | null
          issued_at?: string | null
          module_id: string
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          expires_at?: string | null
          guide_id?: string
          id?: string
          is_valid?: boolean | null
          issued_at?: string | null
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_certifications_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_certifications_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "guide_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_challenges: {
        Row: {
          challenge_type: string
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          guide_id: string
          id: string
          reward_description: string | null
          start_date: string
          status: string | null
          target_date: string | null
          target_value: number
          title: string
          updated_at: string | null
        }
        Insert: {
          challenge_type: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          guide_id: string
          id?: string
          reward_description?: string | null
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_value: number
          title: string
          updated_at?: string | null
        }
        Update: {
          challenge_type?: string
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          guide_id?: string
          id?: string
          reward_description?: string | null
          start_date?: string
          status?: string | null
          target_date?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_challenges_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_contract_payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          wallet_transaction_id: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          wallet_transaction_id?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "guide_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_payments_wallet_transaction_id_fkey"
            columns: ["wallet_transaction_id"]
            isOneToOne: false
            referencedRelation: "guide_wallet_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_contract_resignations: {
        Row: {
          branch_id: string | null
          contract_id: string
          created_at: string | null
          effective_date: string
          guide_id: string
          id: string
          notice_period_days: number | null
          reason: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["guide_resign_status"] | null
          submitted_at: string | null
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          branch_id?: string | null
          contract_id: string
          created_at?: string | null
          effective_date: string
          guide_id: string
          id?: string
          notice_period_days?: number | null
          reason: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_resign_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          branch_id?: string | null
          contract_id?: string
          created_at?: string | null
          effective_date?: string
          guide_id?: string
          id?: string
          notice_period_days?: number | null
          reason?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_resign_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_contract_resignations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_resignations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "guide_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_resignations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_resignations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_contract_sanctions: {
        Row: {
          action_taken: string | null
          branch_id: string | null
          contract_id: string
          created_at: string | null
          description: string
          fine_amount: number | null
          guide_id: string
          id: string
          issued_at: string | null
          issued_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          sanction_type: Database["public"]["Enums"]["guide_sanction_type"]
          severity: Database["public"]["Enums"]["guide_sanction_severity"]
          status: string | null
          suspension_end_date: string | null
          suspension_start_date: string | null
          title: string
          updated_at: string | null
          violation_date: string
        }
        Insert: {
          action_taken?: string | null
          branch_id?: string | null
          contract_id: string
          created_at?: string | null
          description: string
          fine_amount?: number | null
          guide_id: string
          id?: string
          issued_at?: string | null
          issued_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sanction_type: Database["public"]["Enums"]["guide_sanction_type"]
          severity?: Database["public"]["Enums"]["guide_sanction_severity"]
          status?: string | null
          suspension_end_date?: string | null
          suspension_start_date?: string | null
          title: string
          updated_at?: string | null
          violation_date: string
        }
        Update: {
          action_taken?: string | null
          branch_id?: string | null
          contract_id?: string
          created_at?: string | null
          description?: string
          fine_amount?: number | null
          guide_id?: string
          id?: string
          issued_at?: string | null
          issued_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sanction_type?: Database["public"]["Enums"]["guide_sanction_type"]
          severity?: Database["public"]["Enums"]["guide_sanction_severity"]
          status?: string | null
          suspension_end_date?: string | null
          suspension_start_date?: string | null
          title?: string
          updated_at?: string | null
          violation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_contract_sanctions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_sanctions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "guide_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_sanctions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_sanctions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_sanctions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_contract_trips: {
        Row: {
          completed_at: string | null
          contract_id: string
          created_at: string | null
          fee_amount: number
          id: string
          status: string | null
          trip_code: string | null
          trip_date: string | null
          trip_id: string | null
        }
        Insert: {
          completed_at?: string | null
          contract_id: string
          created_at?: string | null
          fee_amount: number
          id?: string
          status?: string | null
          trip_code?: string | null
          trip_date?: string | null
          trip_id?: string | null
        }
        Update: {
          completed_at?: string | null
          contract_id?: string
          created_at?: string | null
          fee_amount?: number
          id?: string
          status?: string | null
          trip_code?: string | null
          trip_date?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_contract_trips_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "guide_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contract_trips_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_contract_trips_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_contracts: {
        Row: {
          branch_id: string | null
          company_signature_url: string | null
          company_signed_at: string | null
          contract_number: string | null
          contract_type: Database["public"]["Enums"]["guide_contract_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          expires_at: string | null
          fee_amount: number
          fee_type: string
          guide_id: string
          guide_signature_url: string | null
          guide_signed_at: string | null
          id: string
          payment_terms: string | null
          rejected_at: string | null
          rejection_reason: string | null
          signed_pdf_url: string | null
          start_date: string
          status: Database["public"]["Enums"]["guide_contract_status"] | null
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          terms_and_conditions: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          company_signature_url?: string | null
          company_signed_at?: string | null
          contract_number?: string | null
          contract_type: Database["public"]["Enums"]["guide_contract_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          expires_at?: string | null
          fee_amount: number
          fee_type?: string
          guide_id: string
          guide_signature_url?: string | null
          guide_signed_at?: string | null
          id?: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          signed_pdf_url?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["guide_contract_status"] | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms_and_conditions?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          company_signature_url?: string | null
          company_signed_at?: string | null
          contract_number?: string | null
          contract_type?: Database["public"]["Enums"]["guide_contract_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          expires_at?: string | null
          fee_amount?: number
          fee_type?: string
          guide_id?: string
          guide_signature_url?: string | null
          guide_signed_at?: string | null
          id?: string
          payment_terms?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          signed_pdf_url?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["guide_contract_status"] | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          terms_and_conditions?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_contracts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contracts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_contracts_terminated_by_fkey"
            columns: ["terminated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_document_verifications: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          document_url: string
          extracted_data: Json | null
          id: string
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          document_url: string
          extracted_data?: Json | null
          id?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          document_url?: string
          extracted_data?: Json | null
          id?: string
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_document_verifications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "guide_license_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_document_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_documents: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string | null
          document_name: string
          document_type: string
          expiry_date: string | null
          extracted_data: Json | null
          file_name: string | null
          file_size: number | null
          file_url: string
          guide_id: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          mime_type: string | null
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          document_name: string
          document_type: string
          expiry_date?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          guide_id: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: string
          expiry_date?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          guide_id?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_documents_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_emergency_contacts: {
        Row: {
          auto_notify: boolean | null
          created_at: string | null
          email: string | null
          guide_id: string
          id: string
          is_active: boolean | null
          name: string
          phone: string
          priority: number | null
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          auto_notify?: boolean | null
          created_at?: string | null
          email?: string | null
          guide_id: string
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          priority?: number | null
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_notify?: boolean | null
          created_at?: string | null
          email?: string | null
          guide_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          priority?: number | null
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_emergency_contacts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_equipment_checklists: {
        Row: {
          branch_id: string
          completed_at: string | null
          created_at: string | null
          equipment_items: Json
          guide_id: string
          id: string
          is_completed: boolean | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          completed_at?: string | null
          created_at?: string | null
          equipment_items?: Json
          guide_id: string
          id?: string
          is_completed?: boolean | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          completed_at?: string | null
          created_at?: string | null
          equipment_items?: Json
          guide_id?: string
          id?: string
          is_completed?: boolean | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_equipment_checklists_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_checklists_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_equipment_checklists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_equipment_reports: {
        Row: {
          branch_id: string
          created_at: string | null
          description: string
          equipment_checklist_id: string | null
          equipment_name: string
          equipment_type: string | null
          guide_id: string
          id: string
          issue_type: string
          photo_url: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          description: string
          equipment_checklist_id?: string | null
          equipment_name: string
          equipment_type?: string | null
          guide_id: string
          id?: string
          issue_type: string
          photo_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          description?: string
          equipment_checklist_id?: string | null
          equipment_name?: string
          equipment_type?: string | null
          guide_id?: string
          id?: string
          issue_type?: string
          photo_url?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_equipment_reports_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_reports_equipment_checklist_id_fkey"
            columns: ["equipment_checklist_id"]
            isOneToOne: false
            referencedRelation: "guide_equipment_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_reports_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_equipment_reports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_equipment_reports_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_feedback_attachments: {
        Row: {
          created_at: string
          feedback_id: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_feedback_attachments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "guide_feedbacks"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_feedbacks: {
        Row: {
          admin_id: string | null
          admin_response: string | null
          branch_id: string | null
          created_at: string
          feedback_type: string
          guide_id: string
          id: string
          is_anonymous: boolean | null
          message: string
          rating: number | null
          responded_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_response?: string | null
          branch_id?: string | null
          created_at?: string
          feedback_type: string
          guide_id: string
          id?: string
          is_anonymous?: boolean | null
          message: string
          rating?: number | null
          responded_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_response?: string | null
          branch_id?: string | null
          created_at?: string
          feedback_type?: string
          guide_id?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string
          rating?: number | null
          responded_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_feedbacks_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_feedbacks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_feedbacks_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_id_cards: {
        Row: {
          branch_id: string | null
          card_number: string
          created_at: string
          expiry_date: string
          guide_id: string
          id: string
          issue_date: string
          issued_by: string | null
          qr_code_data: string
          qr_code_url: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          status: string
          updated_at: string
          verification_token: string
        }
        Insert: {
          branch_id?: string | null
          card_number: string
          created_at?: string
          expiry_date: string
          guide_id: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          qr_code_data: string
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          status?: string
          updated_at?: string
          verification_token: string
        }
        Update: {
          branch_id?: string | null
          card_number?: string
          created_at?: string
          expiry_date?: string
          guide_id?: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          qr_code_data?: string
          qr_code_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          status?: string
          updated_at?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_id_cards_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_id_cards_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_id_cards_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_id_cards_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_license_applications: {
        Row: {
          application_data: Json
          application_number: string
          applied_at: string
          approval_decision: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assessment_results: Json | null
          branch_id: string | null
          created_at: string
          current_stage: string
          documents: Json | null
          guide_id: string
          id: string
          license_id: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["guide_license_status"]
          training_progress: Json | null
          updated_at: string
        }
        Insert: {
          application_data: Json
          application_number: string
          applied_at?: string
          approval_decision?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_results?: Json | null
          branch_id?: string | null
          created_at?: string
          current_stage?: string
          documents?: Json | null
          guide_id: string
          id?: string
          license_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_license_status"]
          training_progress?: Json | null
          updated_at?: string
        }
        Update: {
          application_data?: Json
          application_number?: string
          applied_at?: string
          approval_decision?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assessment_results?: Json | null
          branch_id?: string | null
          created_at?: string
          current_stage?: string
          documents?: Json | null
          guide_id?: string
          id?: string
          license_id?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_license_status"]
          training_progress?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_license_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_license_applications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_license_applications_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_license_applications_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "guide_id_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_license_applications_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_license_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_locations: {
        Row: {
          accuracy_meters: number | null
          guide_id: string
          id: string
          is_online: boolean | null
          last_seen_at: string
          latitude: number
          longitude: number
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          accuracy_meters?: number | null
          guide_id: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string
          latitude: number
          longitude: number
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accuracy_meters?: number | null
          guide_id?: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string
          latitude?: number
          longitude?: number
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_locations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_medical_info: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string | null
          current_medications: string[] | null
          emergency_notes: string | null
          guide_id: string
          id: string
          insurance_policy_number: string | null
          insurance_provider: string | null
          last_updated_at: string | null
          medical_conditions: string[] | null
          updated_at: string | null
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          emergency_notes?: string | null
          guide_id: string
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          last_updated_at?: string | null
          medical_conditions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          current_medications?: string[] | null
          emergency_notes?: string | null
          guide_id?: string
          id?: string
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          last_updated_at?: string | null
          medical_conditions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_medical_info_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_menu_items: {
        Row: {
          branch_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          href: string
          icon_name: string
          id: string
          is_active: boolean | null
          label: string
          section: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          href: string
          icon_name: string
          id?: string
          is_active?: boolean | null
          label: string
          section: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          href?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_menu_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_onboarding_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          current_step_id: string | null
          guide_id: string
          id: string
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step_id?: string | null
          guide_id: string
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          current_step_id?: string | null
          guide_id?: string
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_onboarding_progress_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "guide_onboarding_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_onboarding_progress_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_onboarding_step_completions: {
        Row: {
          completed_at: string | null
          completion_data: Json | null
          created_at: string | null
          id: string
          progress_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          step_id: string
          validation_result: Json | null
        }
        Insert: {
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string | null
          id?: string
          progress_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          step_id: string
          validation_result?: Json | null
        }
        Update: {
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string | null
          id?: string
          progress_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          step_id?: string
          validation_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_onboarding_step_completions_progress_id_fkey"
            columns: ["progress_id"]
            isOneToOne: false
            referencedRelation: "guide_onboarding_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_onboarding_step_completions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_onboarding_step_completions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "guide_onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_onboarding_steps: {
        Row: {
          branch_id: string | null
          created_at: string | null
          depends_on_step_id: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          instructions: string | null
          is_active: boolean | null
          is_required: boolean | null
          resource_type: string | null
          resource_url: string | null
          step_order: number
          step_type: string
          title: string
          updated_at: string | null
          validation_config: Json | null
          validation_type: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          depends_on_step_id?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_required?: boolean | null
          resource_type?: string | null
          resource_url?: string | null
          step_order: number
          step_type: string
          title: string
          updated_at?: string | null
          validation_config?: Json | null
          validation_type?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          depends_on_step_id?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          is_required?: boolean | null
          resource_type?: string | null
          resource_url?: string | null
          step_order?: number
          step_type?: string
          title?: string
          updated_at?: string | null
          validation_config?: Json | null
          validation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_onboarding_steps_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_onboarding_steps_depends_on_step_id_fkey"
            columns: ["depends_on_step_id"]
            isOneToOne: false
            referencedRelation: "guide_onboarding_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_performance_goals: {
        Row: {
          branch_id: string
          created_at: string | null
          current_income: number | null
          current_rating: number | null
          current_trips: number | null
          guide_id: string
          id: string
          is_active: boolean | null
          month: number
          target_income: number | null
          target_rating: number | null
          target_trips: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          current_income?: number | null
          current_rating?: number | null
          current_trips?: number | null
          guide_id: string
          id?: string
          is_active?: boolean | null
          month: number
          target_income?: number | null
          target_rating?: number | null
          target_trips?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          current_income?: number | null
          current_rating?: number | null
          current_trips?: number | null
          guide_id?: string
          id?: string
          is_active?: boolean | null
          month?: number
          target_income?: number | null
          target_rating?: number | null
          target_trips?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_performance_goals_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_performance_goals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_performance_metrics: {
        Row: {
          assessments_completed: number | null
          average_per_trip: number | null
          average_rating: number | null
          cancelled_trips: number | null
          completed_trips: number | null
          created_at: string | null
          customer_satisfaction_score: number | null
          guide_id: string
          id: string
          on_time_rate: number | null
          overall_score: number | null
          performance_tier: string | null
          period_end: string
          period_start: string
          period_type: string | null
          skills_improved: number | null
          total_earnings: number | null
          total_ratings: number | null
          total_trips: number | null
          updated_at: string | null
        }
        Insert: {
          assessments_completed?: number | null
          average_per_trip?: number | null
          average_rating?: number | null
          cancelled_trips?: number | null
          completed_trips?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          guide_id: string
          id?: string
          on_time_rate?: number | null
          overall_score?: number | null
          performance_tier?: string | null
          period_end: string
          period_start: string
          period_type?: string | null
          skills_improved?: number | null
          total_earnings?: number | null
          total_ratings?: number | null
          total_trips?: number | null
          updated_at?: string | null
        }
        Update: {
          assessments_completed?: number | null
          average_per_trip?: number | null
          average_rating?: number | null
          cancelled_trips?: number | null
          completed_trips?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          guide_id?: string
          id?: string
          on_time_rate?: number | null
          overall_score?: number | null
          performance_tier?: string | null
          period_end?: string
          period_start?: string
          period_type?: string | null
          skills_improved?: number | null
          total_earnings?: number | null
          total_ratings?: number | null
          total_trips?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_performance_metrics_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_preferences: {
        Row: {
          created_at: string | null
          dashboard_layout: Json | null
          favorite_destinations: string[] | null
          guide_id: string
          id: string
          learning_style: string | null
          max_trips_per_day: number | null
          max_trips_per_week: number | null
          notification_preferences: Json | null
          preferred_content_format: string | null
          preferred_days_of_week: number[] | null
          preferred_durations: string[] | null
          preferred_language: string | null
          preferred_locations: string[] | null
          preferred_time_slots: Json | null
          preferred_trip_types: string[] | null
          theme_preference: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dashboard_layout?: Json | null
          favorite_destinations?: string[] | null
          guide_id: string
          id?: string
          learning_style?: string | null
          max_trips_per_day?: number | null
          max_trips_per_week?: number | null
          notification_preferences?: Json | null
          preferred_content_format?: string | null
          preferred_days_of_week?: number[] | null
          preferred_durations?: string[] | null
          preferred_language?: string | null
          preferred_locations?: string[] | null
          preferred_time_slots?: Json | null
          preferred_trip_types?: string[] | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dashboard_layout?: Json | null
          favorite_destinations?: string[] | null
          guide_id?: string
          id?: string
          learning_style?: string | null
          max_trips_per_day?: number | null
          max_trips_per_week?: number | null
          notification_preferences?: Json | null
          preferred_content_format?: string | null
          preferred_days_of_week?: number[] | null
          preferred_durations?: string[] | null
          preferred_language?: string | null
          preferred_locations?: string[] | null
          preferred_time_slots?: Json | null
          preferred_trip_types?: string[] | null
          theme_preference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_preferences_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          guide_id: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          guide_id: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          guide_id?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_push_subscriptions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_quick_actions: {
        Row: {
          branch_id: string | null
          color: string
          created_at: string | null
          description: string | null
          display_order: number | null
          href: string
          icon_name: string
          id: string
          is_active: boolean | null
          label: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          color: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          href: string
          icon_name: string
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          color?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          href?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_quick_actions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_savings_goals: {
        Row: {
          auto_save_enabled: boolean | null
          auto_save_percent: number | null
          completed_at: string | null
          created_at: string | null
          current_amount: number
          guide_id: string
          id: string
          is_completed: boolean | null
          name: string
          target_amount: number
          updated_at: string | null
        }
        Insert: {
          auto_save_enabled?: boolean | null
          auto_save_percent?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number
          guide_id: string
          id?: string
          is_completed?: boolean | null
          name: string
          target_amount: number
          updated_at?: string | null
        }
        Update: {
          auto_save_enabled?: boolean | null
          auto_save_percent?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_amount?: number
          guide_id?: string
          id?: string
          is_completed?: boolean | null
          name?: string
          target_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_savings_goals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_skill_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          guide_id: string
          id: string
          milestones: Json | null
          priority: string | null
          skill_id: string
          status: string | null
          target_date: string | null
          target_level: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          guide_id: string
          id?: string
          milestones?: Json | null
          priority?: string | null
          skill_id: string
          status?: string | null
          target_date?: string | null
          target_level: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          guide_id?: string
          id?: string
          milestones?: Json | null
          priority?: string | null
          skill_id?: string
          status?: string | null
          target_date?: string | null
          target_level?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_skill_goals_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_skill_goals_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "guide_skills_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_skills: {
        Row: {
          created_at: string | null
          current_level: number
          guide_id: string
          id: string
          notes: string | null
          skill_id: string
          status: string | null
          target_level: number | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_evidence: Json | null
          validation_method: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number
          guide_id: string
          id?: string
          notes?: string | null
          skill_id: string
          status?: string | null
          target_level?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_evidence?: Json | null
          validation_method?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: number
          guide_id?: string
          id?: string
          notes?: string | null
          skill_id?: string
          status?: string | null
          target_level?: number | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_evidence?: Json | null
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_skills_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "guide_skills_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_skills_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_skills_catalog: {
        Row: {
          branch_id: string | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          levels: Json
          name: string
          requires_certification: boolean | null
          updated_at: string | null
          validation_method: string | null
        }
        Insert: {
          branch_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          levels: Json
          name: string
          requires_certification?: boolean | null
          updated_at?: string | null
          validation_method?: string | null
        }
        Update: {
          branch_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          levels?: Json
          name?: string
          requires_certification?: boolean | null
          updated_at?: string | null
          validation_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_skills_catalog_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_social_post_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          guide_id: string
          id: string
          post_id: string
          updated_at: string | null
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          guide_id: string
          id?: string
          post_id: string
          updated_at?: string | null
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          guide_id?: string
          id?: string
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_social_post_comments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_social_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "guide_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_social_post_likes: {
        Row: {
          created_at: string | null
          guide_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string | null
          guide_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string | null
          guide_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_social_post_likes_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_social_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "guide_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_social_posts: {
        Row: {
          caption: string
          comments_count: number | null
          created_at: string | null
          guide_id: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          likes_count: number | null
          photos: string[] | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          caption: string
          comments_count?: number | null
          created_at?: string | null
          guide_id: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          photos?: string[] | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          caption?: string
          comments_count?: number | null
          created_at?: string | null
          guide_id?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          photos?: string[] | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_social_posts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_social_posts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_social_posts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_status: {
        Row: {
          current_status: Database["public"]["Enums"]["guide_current_status"]
          guide_id: string
          note: string | null
          updated_at: string | null
        }
        Insert: {
          current_status?: Database["public"]["Enums"]["guide_current_status"]
          guide_id: string
          note?: string | null
          updated_at?: string | null
        }
        Update: {
          current_status?: Database["public"]["Enums"]["guide_current_status"]
          guide_id?: string
          note?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_status_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_survey_responses: {
        Row: {
          created_at: string | null
          guide_id: string
          id: string
          is_anonymous: boolean | null
          responses: Json
          submitted_at: string | null
          survey_id: string
          survey_type: string | null
        }
        Insert: {
          created_at?: string | null
          guide_id: string
          id?: string
          is_anonymous?: boolean | null
          responses: Json
          submitted_at?: string | null
          survey_id: string
          survey_type?: string | null
        }
        Update: {
          created_at?: string | null
          guide_id?: string
          id?: string
          is_anonymous?: boolean | null
          responses?: Json
          submitted_at?: string | null
          survey_id?: string
          survey_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_survey_responses_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_training_modules: {
        Row: {
          category: Database["public"]["Enums"]["training_category"]
          content: string
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_required: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["training_category"]
          content: string
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["training_category"]
          content?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      guide_training_progress: {
        Row: {
          completed_at: string | null
          guide_id: string
          id: string
          module_id: string
          progress_percent: number | null
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["training_status"] | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          guide_id: string
          id?: string
          module_id: string
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          guide_id?: string
          id?: string
          module_id?: string
          progress_percent?: number | null
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_training_progress_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "guide_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_training_quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          guide_id: string
          id: string
          module_id: string
          passed: boolean | null
          score: number
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          guide_id: string
          id?: string
          module_id: string
          passed?: boolean | null
          score: number
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          guide_id?: string
          id?: string
          module_id?: string
          passed?: boolean | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_training_quiz_attempts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_training_quiz_attempts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "guide_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_training_quizzes: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          display_order: number | null
          id: string
          module_id: string
          options: Json | null
          points: number | null
          question: string
          question_type: string | null
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          module_id: string
          options?: Json | null
          points?: number | null
          question: string
          question_type?: string | null
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          module_id?: string
          options?: Json | null
          points?: number | null
          question?: string
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_training_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "guide_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_trip_activity_logs: {
        Row: {
          activity_description: string | null
          activity_label: string
          activity_type: string
          branch_id: string
          created_at: string | null
          guide_id: string
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metadata: Json | null
          recorded_at: string
          trip_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_label: string
          activity_type: string
          branch_id: string
          created_at?: string | null
          guide_id: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          recorded_at?: string
          trip_id: string
        }
        Update: {
          activity_description?: string | null
          activity_label?: string
          activity_type?: string
          branch_id?: string
          created_at?: string | null
          guide_id?: string
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          recorded_at?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_trip_activity_logs_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_activity_logs_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_activity_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_trip_activity_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_trip_timeline_shares: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          guide_id: string
          id: string
          is_active: boolean | null
          share_token: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          guide_id: string
          id?: string
          is_active?: boolean | null
          share_token: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          guide_id?: string
          id?: string
          is_active?: boolean | null
          share_token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_trip_timeline_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_timeline_shares_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_trip_timeline_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "guide_trip_timeline_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_wallet_milestones: {
        Row: {
          achieved_at: string | null
          achievement_data: Json | null
          created_at: string | null
          guide_id: string
          id: string
          milestone_description: string | null
          milestone_name: string
          milestone_type: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_data?: Json | null
          created_at?: string | null
          guide_id: string
          id?: string
          milestone_description?: string | null
          milestone_name: string
          milestone_type: string
        }
        Update: {
          achieved_at?: string | null
          achievement_data?: Json | null
          created_at?: string | null
          guide_id?: string
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          milestone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_wallet_milestones_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          bank_account_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string | null
          transaction_type: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          transaction_type: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          transaction_type?: Database["public"]["Enums"]["guide_wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_wallet_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "guide_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "guide_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_wallets: {
        Row: {
          balance: number
          created_at: string | null
          guide_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          guide_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          guide_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_wallets_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_manifests: {
        Row: {
          branch_id: string
          created_at: string | null
          csv_url: string | null
          error_message: string | null
          id: string
          manifest_data: Json
          manifest_date: string
          passenger_count: number
          pdf_url: string | null
          sent_at: string | null
          sent_to: string | null
          status: Database["public"]["Enums"]["manifest_status"]
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          csv_url?: string | null
          error_message?: string | null
          id?: string
          manifest_data: Json
          manifest_date: string
          passenger_count: number
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["manifest_status"]
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          csv_url?: string | null
          error_message?: string | null
          id?: string
          manifest_data?: Json
          manifest_date?: string
          passenger_count?: number
          pdf_url?: string | null
          sent_at?: string | null
          sent_to?: string | null
          status?: Database["public"]["Enums"]["manifest_status"]
        }
        Relationships: [
          {
            foreignKeyName: "insurance_manifests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          branch_id: string
          created_at: string | null
          current_stock: number
          id: string
          min_stock: number | null
          name: string
          sku: string | null
          unit: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          current_stock?: number
          id?: string
          min_stock?: number | null
          name: string
          sku?: string | null
          unit: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          current_stock?: number
          id?: string
          min_stock?: number | null
          name?: string
          sku?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          stock_after: number
          stock_before: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          trip_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          quantity: number
          stock_after: number
          stock_before: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
          trip_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          stock_after?: number
          stock_before?: number
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "inventory_transactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_trips: {
        Row: {
          base_price: number
          chat_group_id: string | null
          created_at: string | null
          current_participants: number | null
          final_price: number
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          kol_bio: string | null
          kol_fee: number | null
          kol_handle: string | null
          kol_name: string
          kol_photo_url: string | null
          kol_platform: string | null
          max_participants: number
          package_id: string
          slug: string
          trip_date: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          base_price: number
          chat_group_id?: string | null
          created_at?: string | null
          current_participants?: number | null
          final_price: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          kol_bio?: string | null
          kol_fee?: number | null
          kol_handle?: string | null
          kol_name: string
          kol_photo_url?: string | null
          kol_platform?: string | null
          max_participants: number
          package_id: string
          slug: string
          trip_date: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          base_price?: number
          chat_group_id?: string | null
          created_at?: string | null
          current_participants?: number | null
          final_price?: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          kol_bio?: string | null
          kol_fee?: number | null
          kol_handle?: string | null
          kol_name?: string
          kol_photo_url?: string | null
          kol_platform?: string | null
          max_participants?: number
          package_id?: string
          slug?: string
          trip_date?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kol_trips_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          loyalty_id: string
          points: number
          referral_code: string | null
          transaction_type: Database["public"]["Enums"]["points_transaction_type"]
        }
        Insert: {
          balance_after: number
          balance_before: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          loyalty_id: string
          points: number
          referral_code?: string | null
          transaction_type: Database["public"]["Enums"]["points_transaction_type"]
        }
        Update: {
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          loyalty_id?: string
          points?: number
          referral_code?: string | null
          transaction_type?: Database["public"]["Enums"]["points_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_loyalty_id_fkey"
            columns: ["loyalty_id"]
            isOneToOne: false
            referencedRelation: "loyalty_points"
            referencedColumns: ["id"]
          },
        ]
      }
      manifest_checks: {
        Row: {
          boarded_at: string | null
          boarded_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          passenger_id: string
          returned_at: string | null
          returned_by: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          boarded_at?: string | null
          boarded_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          passenger_id: string
          returned_at?: string | null
          returned_by?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          boarded_at?: string | null
          boarded_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          passenger_id?: string
          returned_at?: string | null
          returned_by?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manifest_checks_boarded_by_fkey"
            columns: ["boarded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manifest_checks_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "booking_passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manifest_checks_returned_by_fkey"
            columns: ["returned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manifest_checks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "manifest_checks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_points: {
        Row: {
          branch_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters: number | null
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          radius_meters?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_points_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      mitra_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          payment_id: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_id?: string | null
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitra_wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitra_wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitra_wallet_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mitra_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "mitra_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      mitra_wallets: {
        Row: {
          balance: number
          created_at: string | null
          credit_limit: number | null
          id: string
          mitra_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          mitra_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          id?: string
          mitra_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mitra_wallets_mitra_id_fkey"
            columns: ["mitra_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string | null
          delivered_at: string | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          read_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          retry_count: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          subject: string | null
          template_name: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          template_name?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string | null
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          subject?: string | null
          template_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_prices: {
        Row: {
          cost_external: number | null
          cost_internal: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_pax: number
          min_pax: number
          package_id: string
          price_nta: number
          price_publish: number
          price_weekend: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          cost_external?: number | null
          cost_internal?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_pax: number
          min_pax: number
          package_id: string
          price_nta: number
          price_publish: number
          price_weekend?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          cost_external?: number | null
          cost_internal?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_pax?: number
          min_pax?: number
          package_id?: string
          price_nta?: number
          price_publish?: number
          price_weekend?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_prices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          branch_id: string
          child_discount_percent: number | null
          child_max_age: number | null
          child_min_age: number | null
          city: string | null
          code: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          destination: string
          duration_days: number
          duration_nights: number
          exclusions: string[] | null
          fuel_per_pax_liter: number | null
          gallery_urls: string[] | null
          id: string
          inclusions: string[] | null
          infant_max_age: number | null
          itinerary: Json | null
          max_pax: number
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          meta_description: string | null
          meta_title: string | null
          min_pax: number
          name: string
          package_type: Database["public"]["Enums"]["package_type"]
          province: string | null
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["package_status"]
          thumbnail_url: string | null
          updated_at: string | null
          water_per_pax_bottle: number | null
        }
        Insert: {
          branch_id: string
          child_discount_percent?: number | null
          child_max_age?: number | null
          child_min_age?: number | null
          city?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          destination: string
          duration_days?: number
          duration_nights?: number
          exclusions?: string[] | null
          fuel_per_pax_liter?: number | null
          gallery_urls?: string[] | null
          id?: string
          inclusions?: string[] | null
          infant_max_age?: number | null
          itinerary?: Json | null
          max_pax?: number
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_pax?: number
          name: string
          package_type?: Database["public"]["Enums"]["package_type"]
          province?: string | null
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["package_status"]
          thumbnail_url?: string | null
          updated_at?: string | null
          water_per_pax_bottle?: number | null
        }
        Update: {
          branch_id?: string
          child_discount_percent?: number | null
          child_max_age?: number | null
          child_min_age?: number | null
          city?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          destination?: string
          duration_days?: number
          duration_nights?: number
          exclusions?: string[] | null
          fuel_per_pax_liter?: number | null
          gallery_urls?: string[] | null
          id?: string
          inclusions?: string[] | null
          infant_max_age?: number | null
          itinerary?: Json | null
          max_pax?: number
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_pax?: number
          name?: string
          package_type?: Database["public"]["Enums"]["package_type"]
          province?: string | null
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["package_status"]
          thumbnail_url?: string | null
          updated_at?: string | null
          water_per_pax_bottle?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          expired_at: string | null
          external_id: string | null
          fee_amount: number | null
          id: string
          net_amount: number | null
          ocr_data: Json | null
          ocr_verified: boolean | null
          ocr_verified_at: string | null
          paid_at: string | null
          payer_email: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_code: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_url: string | null
          proof_image_url: string | null
          refunded_at: string | null
          split_bill_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          expired_at?: string | null
          external_id?: string | null
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          ocr_data?: Json | null
          ocr_verified?: boolean | null
          ocr_verified_at?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_code: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_url?: string | null
          proof_image_url?: string | null
          refunded_at?: string | null
          split_bill_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          expired_at?: string | null
          external_id?: string | null
          fee_amount?: number | null
          id?: string
          net_amount?: number | null
          ocr_data?: Json | null
          ocr_verified?: boolean | null
          ocr_verified_at?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_code?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_url?: string | null
          proof_image_url?: string | null
          refunded_at?: string | null
          split_bill_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          total_bookings: number | null
          total_commission: number | null
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_bookings?: number | null
          total_commission?: number | null
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_bookings?: number | null
          total_commission?: number | null
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          admin_fee: number | null
          approved_at: string | null
          approved_by: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          booking_id: string
          completed_at: string | null
          created_at: string | null
          days_before_trip: number
          disbursement_id: string | null
          id: string
          is_override: boolean | null
          original_amount: number
          override_by: string | null
          override_reason: string | null
          payment_id: string | null
          policy_applied: string | null
          processed_at: string | null
          refund_amount: number
          refund_percent: number
          refund_to: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          updated_at: string | null
        }
        Insert: {
          admin_fee?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          booking_id: string
          completed_at?: string | null
          created_at?: string | null
          days_before_trip: number
          disbursement_id?: string | null
          id?: string
          is_override?: boolean | null
          original_amount: number
          override_by?: string | null
          override_reason?: string | null
          payment_id?: string | null
          policy_applied?: string | null
          processed_at?: string | null
          refund_amount: number
          refund_percent: number
          refund_to?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string | null
        }
        Update: {
          admin_fee?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          booking_id?: string
          completed_at?: string | null
          created_at?: string | null
          days_before_trip?: number
          disbursement_id?: string | null
          id?: string
          is_override?: boolean | null
          original_amount?: number
          override_by?: string | null
          override_reason?: string | null
          payment_id?: string | null
          policy_applied?: string | null
          processed_at?: string | null
          refund_amount?: number
          refund_percent?: number
          refund_to?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string | null
          facility_rating: number | null
          guide_rating: number | null
          id: string
          is_published: boolean | null
          moderated_at: string | null
          moderated_by: string | null
          overall_rating: number
          photo_unlocked: boolean | null
          review_text: string | null
          reviewer_id: string | null
          reviewer_name: string
          updated_at: string | null
          value_rating: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          facility_rating?: number | null
          guide_rating?: number | null
          id?: string
          is_published?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          overall_rating: number
          photo_unlocked?: boolean | null
          review_text?: string | null
          reviewer_id?: string | null
          reviewer_name: string
          updated_at?: string | null
          value_rating?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          facility_rating?: number | null
          guide_rating?: number | null
          id?: string
          is_published?: boolean | null
          moderated_at?: string | null
          moderated_by?: string | null
          overall_rating?: number
          photo_unlocked?: boolean | null
          review_text?: string | null
          reviewer_id?: string | null
          reviewer_name?: string
          updated_at?: string | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_applications: {
        Row: {
          admin_notes: string | null
          applied_at: string | null
          created_at: string | null
          id: string
          message: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          applied_at?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requested_role: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          applied_at?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["user_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_deductions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          guide_id: string
          id: string
          is_auto: boolean | null
          reason: string
          salary_payment_id: string | null
          trip_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          deduction_type: Database["public"]["Enums"]["deduction_type"]
          guide_id: string
          id?: string
          is_auto?: boolean | null
          reason: string
          salary_payment_id?: string | null
          trip_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          deduction_type?: Database["public"]["Enums"]["deduction_type"]
          guide_id?: string
          id?: string
          is_auto?: boolean | null
          reason?: string
          salary_payment_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_deductions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_deductions_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_deductions_salary_payment_id_fkey"
            columns: ["salary_payment_id"]
            isOneToOne: false
            referencedRelation: "salary_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_deductions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "salary_deductions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          all_docs_uploaded: boolean | null
          base_amount: number
          bonus_amount: number | null
          branch_id: string
          created_at: string | null
          deduction_amount: number | null
          guide_id: string
          id: string
          net_amount: number
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          payment_reference: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["salary_payment_status"]
          updated_at: string | null
        }
        Insert: {
          all_docs_uploaded?: boolean | null
          base_amount?: number
          bonus_amount?: number | null
          branch_id: string
          created_at?: string | null
          deduction_amount?: number | null
          guide_id: string
          id?: string
          net_amount: number
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["salary_payment_status"]
          updated_at?: string | null
        }
        Update: {
          all_docs_uploaded?: boolean | null
          base_amount?: number
          bonus_amount?: number | null
          branch_id?: string
          created_at?: string | null
          deduction_amount?: number | null
          guide_id?: string
          id?: string
          net_amount?: number
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["salary_payment_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      season_calendar: {
        Row: {
          branch_id: string
          created_at: string | null
          end_date: string
          id: string
          markup_type: string | null
          markup_value: number
          name: string
          season_type: Database["public"]["Enums"]["season_type"]
          start_date: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          end_date: string
          id?: string
          markup_type?: string | null
          markup_value: number
          name: string
          season_type: Database["public"]["Enums"]["season_type"]
          start_date: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          markup_type?: string | null
          markup_value?: number
          name?: string
          season_type?: Database["public"]["Enums"]["season_type"]
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_calendar_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          branch_id: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
          value_type: string | null
        }
        Insert: {
          branch_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
          value_type?: string | null
        }
        Update: {
          branch_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          branch_id: string
          created_at: string | null
          guide_id: string
          id: string
          latitude: number
          location_name: string | null
          longitude: number
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["sos_status"]
          trip_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          branch_id: string
          created_at?: string | null
          guide_id: string
          id?: string
          latitude: number
          location_name?: string | null
          longitude: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          trip_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          branch_id?: string
          created_at?: string | null
          guide_id?: string
          id?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["sos_status"]
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sos_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "sos_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bill_participants: {
        Row: {
          amount: number
          created_at: string | null
          email: string | null
          id: string
          is_paid: boolean | null
          name: string
          paid_at: string | null
          payment_id: string | null
          payment_url: string | null
          phone: string | null
          split_bill_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          name: string
          paid_at?: string | null
          payment_id?: string | null
          payment_url?: string | null
          phone?: string | null
          split_bill_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          email?: string | null
          id?: string
          is_paid?: boolean | null
          name?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_url?: string | null
          phone?: string | null
          split_bill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_participants_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_bill_participants_split_bill_id_fkey"
            columns: ["split_bill_id"]
            isOneToOne: false
            referencedRelation: "split_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bills: {
        Row: {
          amount_per_person: number
          booking_id: string
          created_at: string | null
          creator_id: string | null
          creator_name: string
          creator_phone: string
          expires_at: string
          id: string
          paid_count: number | null
          split_count: number
          status: Database["public"]["Enums"]["split_bill_status"]
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_per_person: number
          booking_id: string
          created_at?: string | null
          creator_id?: string | null
          creator_name: string
          creator_phone: string
          expires_at: string
          id?: string
          paid_count?: number | null
          split_count: number
          status?: Database["public"]["Enums"]["split_bill_status"]
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_per_person?: number
          booking_id?: string
          created_at?: string | null
          creator_id?: string | null
          creator_name?: string
          creator_phone?: string
          expires_at?: string
          id?: string
          paid_count?: number | null
          split_count?: number
          status?: Database["public"]["Enums"]["split_bill_status"]
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_bills_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_bills_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          attachment_urls: string[] | null
          author_id: string | null
          author_name: string | null
          comment: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string
        }
        Insert: {
          attachment_urls?: string[] | null
          author_id?: string | null
          author_name?: string | null
          comment: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id: string
        }
        Update: {
          attachment_urls?: string[] | null
          author_id?: string | null
          author_name?: string | null
          comment?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          booking_id: string | null
          branch_id: string
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string | null
          description: string
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          reported_by: string | null
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          resolution_notes: string
          resolved_at: string | null
          resolved_by: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          sla_breached: boolean | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_code: string
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          branch_id: string
          category: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reported_by?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_notes?: string
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_code: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          branch_id?: string
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string | null
          description?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          reported_by?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          resolution_notes?: string
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_code?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "tickets_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_circle_contributions: {
        Row: {
          amount: number
          circle_id: string
          created_at: string | null
          id: string
          member_id: string
          paid_at: string | null
          payment_reference: string | null
          period_month: string
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["contribution_status"]
        }
        Insert: {
          amount: number
          circle_id: string
          created_at?: string | null
          id?: string
          member_id: string
          paid_at?: string | null
          payment_reference?: string | null
          period_month: string
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
        }
        Update: {
          amount?: number
          circle_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          paid_at?: string | null
          payment_reference?: string | null
          period_month?: string
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
        }
        Relationships: [
          {
            foreignKeyName: "travel_circle_contributions_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "travel_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_circle_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "travel_circle_members"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_circle_members: {
        Row: {
          circle_id: string
          email: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          name: string
          phone: string | null
          total_contributed: number | null
          user_id: string | null
        }
        Insert: {
          circle_id: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          name: string
          phone?: string | null
          total_contributed?: number | null
          user_id?: string | null
        }
        Update: {
          circle_id?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          name?: string
          phone?: string | null
          total_contributed?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "travel_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_circle_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_circles: {
        Row: {
          admin_id: string
          branch_id: string | null
          contribution_day: number | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          id: string
          monthly_contribution: number
          name: string
          status: Database["public"]["Enums"]["travel_circle_status"]
          target_amount: number
          target_date: string | null
          updated_at: string | null
          virtual_account_number: string | null
        }
        Insert: {
          admin_id: string
          branch_id?: string | null
          contribution_day?: number | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          monthly_contribution: number
          name: string
          status?: Database["public"]["Enums"]["travel_circle_status"]
          target_amount: number
          target_date?: string | null
          updated_at?: string | null
          virtual_account_number?: string | null
        }
        Update: {
          admin_id?: string
          branch_id?: string | null
          contribution_day?: number | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          id?: string
          monthly_contribution?: number
          name?: string
          status?: Database["public"]["Enums"]["travel_circle_status"]
          target_amount?: number
          target_date?: string | null
          updated_at?: string | null
          virtual_account_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_circles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_circles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_bookings: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          trip_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          trip_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          created_by: string | null
          description: string
          expected_amount: number | null
          id: string
          is_anomaly: boolean | null
          quantity: number | null
          receipt_url: string | null
          total_amount: number
          trip_id: string
          unit_price: number
          updated_at: string | null
          variance_percent: number | null
          vendor_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          created_by?: string | null
          description: string
          expected_amount?: number | null
          id?: string
          is_anomaly?: boolean | null
          quantity?: number | null
          receipt_url?: string | null
          total_amount: number
          trip_id: string
          unit_price: number
          updated_at?: string | null
          variance_percent?: number | null
          vendor_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          created_by?: string | null
          description?: string
          expected_amount?: number | null
          id?: string
          is_anomaly?: boolean | null
          quantity?: number | null
          receipt_url?: string | null
          total_amount?: number
          trip_id?: string
          unit_price?: number
          updated_at?: string | null
          variance_percent?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_guides: {
        Row: {
          assigned_at: string | null
          assignment_method: string | null
          assignment_status:
            | Database["public"]["Enums"]["trip_assignment_status"]
            | null
          auto_reassigned_at: string | null
          check_in_at: string | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_location: string | null
          check_out_at: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          confirmation_deadline: string | null
          confirmed_at: string | null
          created_at: string | null
          documentation_uploaded: boolean | null
          fee_amount: number
          guide_id: string
          guide_role: Database["public"]["Enums"]["guide_role"]
          id: string
          is_late: boolean | null
          reassigned_from_guide_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assignment_method?: string | null
          assignment_status?:
            | Database["public"]["Enums"]["trip_assignment_status"]
            | null
          auto_reassigned_at?: string | null
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_location?: string | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          documentation_uploaded?: boolean | null
          fee_amount: number
          guide_id: string
          guide_role?: Database["public"]["Enums"]["guide_role"]
          id?: string
          is_late?: boolean | null
          reassigned_from_guide_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assignment_method?: string | null
          assignment_status?:
            | Database["public"]["Enums"]["trip_assignment_status"]
            | null
          auto_reassigned_at?: string | null
          check_in_at?: string | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_location?: string | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          confirmation_deadline?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          documentation_uploaded?: boolean | null
          fee_amount?: number
          guide_id?: string
          guide_role?: Database["public"]["Enums"]["guide_role"]
          id?: string
          is_late?: boolean | null
          reassigned_from_guide_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_guides_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_guides_reassigned_from_guide_id_fkey"
            columns: ["reassigned_from_guide_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_guides_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_profit_loss"
            referencedColumns: ["trip_id"]
          },
          {
            foreignKeyName: "trip_guides_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_departure_time: string | null
          actual_return_time: string | null
          branch_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          departure_time: string | null
          documentation_uploaded_at: string | null
          documentation_url: string | null
          id: string
          notes: string | null
          package_id: string
          primary_asset_id: string | null
          return_time: string | null
          secondary_asset_id: string | null
          status: Database["public"]["Enums"]["trip_status"]
          total_pax: number
          trip_code: string
          trip_date: string
          updated_at: string | null
        }
        Insert: {
          actual_departure_time?: string | null
          actual_return_time?: string | null
          branch_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_time?: string | null
          documentation_uploaded_at?: string | null
          documentation_url?: string | null
          id?: string
          notes?: string | null
          package_id: string
          primary_asset_id?: string | null
          return_time?: string | null
          secondary_asset_id?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_pax?: number
          trip_code: string
          trip_date: string
          updated_at?: string | null
        }
        Update: {
          actual_departure_time?: string | null
          actual_return_time?: string | null
          branch_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          departure_time?: string | null
          documentation_uploaded_at?: string | null
          documentation_url?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          primary_asset_id?: string | null
          return_time?: string | null
          secondary_asset_id?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          total_pax?: number
          trip_code?: string
          trip_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_primary_asset_id_fkey"
            columns: ["primary_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_secondary_asset_id_fkey"
            columns: ["secondary_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contracts: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string | null
          document_url: string | null
          id: string
          ip_address: unknown
          signed_at: string
          signed_name: string
          signed_nik: string | null
          user_agent: string | null
          user_id: string
          valid_from: string
          valid_until: string | null
          version: string | null
        }
        Insert: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          document_url?: string | null
          id?: string
          ip_address?: unknown
          signed_at?: string
          signed_name: string
          signed_nik?: string | null
          user_agent?: string | null
          user_id: string
          valid_from?: string
          valid_until?: string | null
          version?: string | null
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string | null
          document_url?: string | null
          id?: string
          ip_address?: unknown
          signed_at?: string
          signed_name?: string
          signed_nik?: string | null
          user_agent?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          branch_id: string | null
          company_address: string | null
          company_name: string | null
          contract_signed_at: string | null
          created_at: string | null
          deleted_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_contract_signed: boolean | null
          last_login_at: string | null
          nik: string | null
          npwp: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_id?: string | null
          company_address?: string | null
          company_name?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_contract_signed?: boolean | null
          last_login_at?: string | null
          nik?: string | null
          npwp?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_id?: string | null
          company_address?: string | null
          company_name?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_contract_signed?: boolean | null
          last_login_at?: string | null
          nik?: string | null
          npwp?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          branch_id: string
          contact_person: string | null
          created_at: string | null
          default_price: number | null
          deleted_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          price_unit: string | null
          updated_at: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"]
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_id: string
          contact_person?: string | null
          created_at?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          price_unit?: string | null
          updated_at?: string | null
          vendor_type: Database["public"]["Enums"]["vendor_type"]
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_id?: string
          contact_person?: string | null
          created_at?: string | null
          default_price?: number | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          price_unit?: string | null
          updated_at?: string | null
          vendor_type?: Database["public"]["Enums"]["vendor_type"]
        }
        Relationships: [
          {
            foreignKeyName: "vendors_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      corporate_usage_by_department: {
        Row: {
          booking_count: number | null
          company_name: string | null
          corporate_id: string | null
          department: string | null
          employee_count: number | null
          total_allocated: number | null
          total_used: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_employees_corporate_id_fkey"
            columns: ["corporate_id"]
            isOneToOne: false
            referencedRelation: "corporate_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_profit_loss: {
        Row: {
          branch_id: string | null
          external_costs: number | null
          gross_revenue: number | null
          guide_fees: number | null
          internal_asset_cost: number | null
          net_profit: number | null
          net_revenue: number | null
          package_name: string | null
          payment_fees: number | null
          trip_code: string | null
          trip_date: string | null
          trip_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_expire_contracts: { Args: never; Returns: undefined }
      auto_reassign_expired_assignments: {
        Args: never
        Returns: {
          reassigned_count: number
          trip_ids: string[]
        }[]
      }
      calculate_confirmation_deadline: {
        Args: { p_trip_date: string }
        Returns: string
      }
      calculate_guide_wallet_balance: {
        Args: { p_wallet_id: string }
        Returns: number
      }
      calculate_refund: {
        Args: { p_booking_id: string; p_cancel_date?: string }
        Returns: {
          admin_fee: number
          days_before_trip: number
          original_amount: number
          policy_applied: string
          refund_amount: number
          refund_percent: number
        }[]
      }
      check_wallet_milestones: {
        Args: { p_balance: number; p_guide_id: string }
        Returns: {
          milestone_name: string
          milestone_type: string
        }[]
      }
      exec_sql: { Args: { statement: string }; Returns: undefined }
      generate_booking_code: { Args: never; Returns: string }
      get_setting: {
        Args: { p_branch_id?: string; p_key: string }
        Returns: string
      }
      get_user_branch_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_internal_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_within_geofence: {
        Args: { p_lat: number; p_lng: number; p_meeting_point_id: string }
        Returns: boolean
      }
      log_audit: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_description?: string
          p_entity_id: string
          p_entity_type: string
          p_new_values?: Json
          p_old_values?: Json
          p_user_id: string
        }
        Returns: string
      }
      sync_all_guide_wallet_balances: {
        Args: never
        Returns: {
          new_balance: number
          old_balance: number
          wallet_id: string
        }[]
      }
    }
    Enums: {
      ai_document_type: "sop" | "faq" | "policy" | "product_info" | "training"
      asset_status: "available" | "in_use" | "maintenance" | "retired"
      asset_type: "boat" | "speedboat" | "villa" | "vehicle" | "equipment"
      audit_action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "export"
        | "unmask"
        | "approve"
        | "reject"
      booking_source:
        | "website"
        | "admin"
        | "mitra"
        | "corporate"
        | "whatsapp"
        | "referral"
      booking_status:
        | "draft"
        | "pending_payment"
        | "awaiting_full_payment"
        | "paid"
        | "confirmed"
        | "cancelled"
        | "refunded"
        | "completed"
      contract_type: "pkwt" | "pakta_integritas" | "nda" | "mitra_agreement"
      contribution_status: "pending" | "paid" | "late" | "missed"
      corporate_transaction_type:
        | "topup"
        | "employee_allocation"
        | "booking_debit"
        | "refund_credit"
        | "adjustment"
      cron_job_status: "running" | "completed" | "failed"
      customer_wallet_transaction_type:
        | "refund_credit"
        | "booking_debit"
        | "topup"
        | "withdrawal"
        | "adjustment"
      deduction_reason:
        | "late_check_in"
        | "missing_documentation"
        | "complaint"
        | "damage"
        | "other"
      deduction_type: "late_penalty" | "no_documentation" | "damage" | "other"
      expense_category:
        | "fuel"
        | "food"
        | "ticket"
        | "transport"
        | "equipment"
        | "emergency"
        | "other"
      expense_request_status:
        | "draft"
        | "pending_manager"
        | "pending_director"
        | "approved"
        | "rejected"
        | "paid"
        | "cancelled"
      guide_availability_status: "available" | "not_available"
      guide_contract_status:
        | "draft"
        | "pending_signature"
        | "pending_company"
        | "active"
        | "expired"
        | "terminated"
        | "rejected"
      guide_contract_type:
        | "per_trip"
        | "monthly"
        | "project"
        | "seasonal"
        | "annual"
      guide_current_status: "standby" | "on_trip" | "not_available"
      guide_license_status:
        | "pending_review"
        | "document_verified"
        | "document_rejected"
        | "ready_for_assessment"
        | "assessment_in_progress"
        | "assessment_passed"
        | "assessment_failed"
        | "training_in_progress"
        | "training_completed"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "license_issued"
        | "active"
        | "expired"
        | "revoked"
        | "suspended"
      guide_resign_status: "pending" | "approved" | "rejected" | "withdrawn"
      guide_role: "lead" | "assistant" | "driver" | "photographer"
      guide_sanction_severity: "low" | "medium" | "high" | "critical"
      guide_sanction_type:
        | "warning"
        | "suspension"
        | "fine"
        | "demotion"
        | "termination"
      guide_wallet_transaction_type:
        | "earning"
        | "withdraw_request"
        | "withdraw_approved"
        | "withdraw_rejected"
        | "adjustment"
      id_type: "ktp" | "passport" | "sim" | "other"
      inventory_transaction_type:
        | "purchase"
        | "usage"
        | "adjustment"
        | "transfer"
      invoice_status: "draft" | "sent" | "paid" | "cancelled"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      maintenance_type: "scheduled" | "emergency" | "inspection"
      manifest_status: "pending" | "generated" | "sent" | "failed"
      notification_channel: "whatsapp" | "email" | "push" | "sms"
      notification_status: "pending" | "sent" | "delivered" | "read" | "failed"
      package_status: "draft" | "published" | "archived"
      package_type: "open_trip" | "private_trip" | "corporate" | "kol_trip"
      passenger_type: "adult" | "child" | "infant"
      payment_method:
        | "xendit_invoice"
        | "xendit_va"
        | "xendit_qris"
        | "xendit_ewallet"
        | "xendit_card"
        | "mitra_wallet"
        | "manual_transfer"
        | "cash"
      payment_status:
        | "pending"
        | "processing"
        | "paid"
        | "failed"
        | "expired"
        | "refunded"
      points_transaction_type:
        | "earn_booking"
        | "earn_referral"
        | "earn_review"
        | "redeem"
        | "expire"
        | "adjustment"
      refund_status:
        | "pending"
        | "approved"
        | "processing"
        | "completed"
        | "rejected"
      salary_payment_status:
        | "pending"
        | "documentation_required"
        | "ready"
        | "paid"
        | "cancelled"
      season_type: "high_season" | "peak_season" | "low_season"
      sos_alert_type:
        | "emergency"
        | "medical"
        | "security"
        | "weather"
        | "mechanical"
        | "other"
      sos_status:
        | "active"
        | "acknowledged"
        | "responding"
        | "resolved"
        | "false_alarm"
      split_bill_status:
        | "pending"
        | "partial_paid"
        | "fully_paid"
        | "expired"
        | "cancelled"
      ticket_category:
        | "facility_issue"
        | "food_issue"
        | "guide_complaint"
        | "safety_issue"
        | "payment_issue"
        | "refund_request"
        | "general_inquiry"
        | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
      training_category:
        | "safety"
        | "customer_service"
        | "navigation"
        | "first_aid"
        | "equipment"
        | "other"
      training_status: "not_started" | "in_progress" | "completed" | "failed"
      travel_circle_status:
        | "active"
        | "target_reached"
        | "redeemed"
        | "cancelled"
      trip_assignment_status:
        | "pending_confirmation"
        | "confirmed"
        | "rejected"
        | "expired"
        | "auto_reassigned"
      trip_status:
        | "scheduled"
        | "preparing"
        | "on_the_way"
        | "on_trip"
        | "completed"
        | "cancelled"
      user_role:
        | "super_admin"
        | "investor"
        | "finance_manager"
        | "marketing"
        | "ops_admin"
        | "guide"
        | "mitra"
        | "customer"
        | "corporate"
      vendor_type:
        | "boat_rental"
        | "catering"
        | "transport"
        | "accommodation"
        | "ticket"
        | "equipment"
        | "other"
      wallet_transaction_type:
        | "topup"
        | "booking_debit"
        | "refund_credit"
        | "adjustment"
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
      ai_document_type: ["sop", "faq", "policy", "product_info", "training"],
      asset_status: ["available", "in_use", "maintenance", "retired"],
      asset_type: ["boat", "speedboat", "villa", "vehicle", "equipment"],
      audit_action: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "logout",
        "export",
        "unmask",
        "approve",
        "reject",
      ],
      booking_source: [
        "website",
        "admin",
        "mitra",
        "corporate",
        "whatsapp",
        "referral",
      ],
      booking_status: [
        "draft",
        "pending_payment",
        "awaiting_full_payment",
        "paid",
        "confirmed",
        "cancelled",
        "refunded",
        "completed",
      ],
      contract_type: ["pkwt", "pakta_integritas", "nda", "mitra_agreement"],
      contribution_status: ["pending", "paid", "late", "missed"],
      corporate_transaction_type: [
        "topup",
        "employee_allocation",
        "booking_debit",
        "refund_credit",
        "adjustment",
      ],
      cron_job_status: ["running", "completed", "failed"],
      customer_wallet_transaction_type: [
        "refund_credit",
        "booking_debit",
        "topup",
        "withdrawal",
        "adjustment",
      ],
      deduction_reason: [
        "late_check_in",
        "missing_documentation",
        "complaint",
        "damage",
        "other",
      ],
      deduction_type: ["late_penalty", "no_documentation", "damage", "other"],
      expense_category: [
        "fuel",
        "food",
        "ticket",
        "transport",
        "equipment",
        "emergency",
        "other",
      ],
      expense_request_status: [
        "draft",
        "pending_manager",
        "pending_director",
        "approved",
        "rejected",
        "paid",
        "cancelled",
      ],
      guide_availability_status: ["available", "not_available"],
      guide_contract_status: [
        "draft",
        "pending_signature",
        "pending_company",
        "active",
        "expired",
        "terminated",
        "rejected",
      ],
      guide_contract_type: [
        "per_trip",
        "monthly",
        "project",
        "seasonal",
        "annual",
      ],
      guide_current_status: ["standby", "on_trip", "not_available"],
      guide_license_status: [
        "pending_review",
        "document_verified",
        "document_rejected",
        "ready_for_assessment",
        "assessment_in_progress",
        "assessment_passed",
        "assessment_failed",
        "training_in_progress",
        "training_completed",
        "pending_approval",
        "approved",
        "rejected",
        "license_issued",
        "active",
        "expired",
        "revoked",
        "suspended",
      ],
      guide_resign_status: ["pending", "approved", "rejected", "withdrawn"],
      guide_role: ["lead", "assistant", "driver", "photographer"],
      guide_sanction_severity: ["low", "medium", "high", "critical"],
      guide_sanction_type: [
        "warning",
        "suspension",
        "fine",
        "demotion",
        "termination",
      ],
      guide_wallet_transaction_type: [
        "earning",
        "withdraw_request",
        "withdraw_approved",
        "withdraw_rejected",
        "adjustment",
      ],
      id_type: ["ktp", "passport", "sim", "other"],
      inventory_transaction_type: [
        "purchase",
        "usage",
        "adjustment",
        "transfer",
      ],
      invoice_status: ["draft", "sent", "paid", "cancelled"],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      maintenance_type: ["scheduled", "emergency", "inspection"],
      manifest_status: ["pending", "generated", "sent", "failed"],
      notification_channel: ["whatsapp", "email", "push", "sms"],
      notification_status: ["pending", "sent", "delivered", "read", "failed"],
      package_status: ["draft", "published", "archived"],
      package_type: ["open_trip", "private_trip", "corporate", "kol_trip"],
      passenger_type: ["adult", "child", "infant"],
      payment_method: [
        "xendit_invoice",
        "xendit_va",
        "xendit_qris",
        "xendit_ewallet",
        "xendit_card",
        "mitra_wallet",
        "manual_transfer",
        "cash",
      ],
      payment_status: [
        "pending",
        "processing",
        "paid",
        "failed",
        "expired",
        "refunded",
      ],
      points_transaction_type: [
        "earn_booking",
        "earn_referral",
        "earn_review",
        "redeem",
        "expire",
        "adjustment",
      ],
      refund_status: [
        "pending",
        "approved",
        "processing",
        "completed",
        "rejected",
      ],
      salary_payment_status: [
        "pending",
        "documentation_required",
        "ready",
        "paid",
        "cancelled",
      ],
      season_type: ["high_season", "peak_season", "low_season"],
      sos_alert_type: [
        "emergency",
        "medical",
        "security",
        "weather",
        "mechanical",
        "other",
      ],
      sos_status: [
        "active",
        "acknowledged",
        "responding",
        "resolved",
        "false_alarm",
      ],
      split_bill_status: [
        "pending",
        "partial_paid",
        "fully_paid",
        "expired",
        "cancelled",
      ],
      ticket_category: [
        "facility_issue",
        "food_issue",
        "guide_complaint",
        "safety_issue",
        "payment_issue",
        "refund_request",
        "general_inquiry",
        "other",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "escalated", "resolved", "closed"],
      training_category: [
        "safety",
        "customer_service",
        "navigation",
        "first_aid",
        "equipment",
        "other",
      ],
      training_status: ["not_started", "in_progress", "completed", "failed"],
      travel_circle_status: [
        "active",
        "target_reached",
        "redeemed",
        "cancelled",
      ],
      trip_assignment_status: [
        "pending_confirmation",
        "confirmed",
        "rejected",
        "expired",
        "auto_reassigned",
      ],
      trip_status: [
        "scheduled",
        "preparing",
        "on_the_way",
        "on_trip",
        "completed",
        "cancelled",
      ],
      user_role: [
        "super_admin",
        "investor",
        "finance_manager",
        "marketing",
        "ops_admin",
        "guide",
        "mitra",
        "customer",
        "corporate",
      ],
      vendor_type: [
        "boat_rental",
        "catering",
        "transport",
        "accommodation",
        "ticket",
        "equipment",
        "other",
      ],
      wallet_transaction_type: [
        "topup",
        "booking_debit",
        "refund_credit",
        "adjustment",
      ],
    },
  },
} as const
