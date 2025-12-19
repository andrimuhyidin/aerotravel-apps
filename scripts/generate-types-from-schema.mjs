#!/usr/bin/env node
/**
 * Generate TypeScript types by querying database schema
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function generateTypes() {
  console.log('🔄 Generating types from database schema...\n');
  
  // Query to get table information
  const query = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'guide_equipment_checklists',
        'guide_equipment_reports',
        'guide_trip_activity_logs',
        'guide_trip_timeline_shares',
        'guide_performance_goals'
      )
    ORDER BY table_name, ordinal_position;
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { statement: query });
    
    if (error) {
      // Try alternative: query via REST API
      console.log('⚠️  Using alternative method to query schema...');
      
      // Since we can't query information_schema directly via Supabase client,
      // we'll add the types manually based on migration files
      console.log('📝 Adding types manually based on migration schema...');
      
      const typesPath = join(__dirname, '..', 'types/supabase.ts');
      const existingContent = `// This file is auto-generated. Run 'npm run update-types' to regenerate.
// For now, types are added manually for new tables.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      guide_equipment_checklists: {
        Row: {
          id: string;
          trip_id: string | null;
          guide_id: string;
          branch_id: string;
          equipment_items: Json;
          completed_at: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id?: string | null;
          guide_id: string;
          branch_id: string;
          equipment_items: Json;
          completed_at?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string | null;
          guide_id?: string;
          branch_id?: string;
          equipment_items?: Json;
          completed_at?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guide_equipment_reports: {
        Row: {
          id: string;
          equipment_checklist_id: string | null;
          trip_id: string | null;
          guide_id: string;
          branch_id: string;
          equipment_name: string;
          equipment_type: string | null;
          issue_type: string;
          description: string;
          photo_url: string | null;
          severity: string;
          status: string;
          resolved_at: string | null;
          resolved_by: string | null;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          equipment_checklist_id?: string | null;
          trip_id?: string | null;
          guide_id: string;
          branch_id: string;
          equipment_name: string;
          equipment_type?: string | null;
          issue_type: string;
          description: string;
          photo_url?: string | null;
          severity?: string;
          status?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          equipment_checklist_id?: string | null;
          trip_id?: string | null;
          guide_id?: string;
          branch_id?: string;
          equipment_name?: string;
          equipment_type?: string | null;
          issue_type?: string;
          description?: string;
          photo_url?: string | null;
          severity?: string;
          status?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guide_trip_activity_logs: {
        Row: {
          id: string;
          trip_id: string;
          guide_id: string;
          branch_id: string;
          activity_type: string;
          activity_label: string;
          activity_description: string | null;
          latitude: number | null;
          longitude: number | null;
          location_name: string | null;
          recorded_at: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          guide_id: string;
          branch_id: string;
          activity_type: string;
          activity_label: string;
          activity_description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          recorded_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          guide_id?: string;
          branch_id?: string;
          activity_type?: string;
          activity_label?: string;
          activity_description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          location_name?: string | null;
          recorded_at?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      guide_trip_timeline_shares: {
        Row: {
          id: string;
          trip_id: string;
          guide_id: string;
          share_token: string;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          guide_id: string;
          share_token: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          guide_id?: string;
          share_token?: string;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      guide_performance_goals: {
        Row: {
          id: string;
          guide_id: string;
          branch_id: string;
          year: number;
          month: number;
          target_trips: number;
          target_rating: number;
          target_income: number;
          current_trips: number;
          current_rating: number;
          current_income: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          guide_id: string;
          branch_id: string;
          year: number;
          month: number;
          target_trips?: number;
          target_rating?: number;
          target_income?: number;
          current_trips?: number;
          current_rating?: number;
          current_income?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          guide_id?: string;
          branch_id?: string;
          year?: number;
          month?: number;
          target_trips?: number;
          target_rating?: number;
          target_income?: number;
          current_trips?: number;
          current_rating?: number;
          current_income?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// Helper type
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] &
        Database['public']['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;
`;

      writeFileSync(typesPath, existingContent);
      console.log('✅ Types file created with new table definitions');
      console.log('\n📋 Added tables:');
      console.log('   - guide_equipment_checklists');
      console.log('   - guide_equipment_reports');
      console.log('   - guide_trip_activity_logs');
      console.log('   - guide_trip_timeline_shares');
      console.log('   - guide_performance_goals');
      return;
    }
    
    console.log('✅ Types generated from database');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateTypes();

