#!/usr/bin/env node
/**
 * Generate TypeScript types directly from database schema
 * Queries information_schema to get table definitions
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Type definitions for new tables
const newTableTypes = `
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
`;

async function main() {
  console.log('🔄 Adding new table types to supabase.ts...\n');
  
  const typesPath = join(__dirname, '..', 'types/supabase.ts');
  let typesContent = readFileSync(typesPath, 'utf8');
  
  // Check if new tables already exist
  if (typesContent.includes('guide_equipment_checklists')) {
    console.log('✅ New tables already in types file');
    return;
  }
  
  // Find the Tables interface and add new tables
  // Look for pattern: Tables: { ... }
  const tablesMatch = typesContent.match(/(export type Tables = \{[\s\S]*?)(\n\s*\};)/);
  
  if (tablesMatch) {
    const beforeTables = tablesMatch[1];
    const afterTables = tablesMatch[2];
    
    // Add new tables before the closing brace
    const updatedTables = beforeTables + newTableTypes + afterTables;
    typesContent = typesContent.replace(tablesMatch[0], updatedTables);
    
    writeFileSync(typesPath, typesContent);
    console.log('✅ Added new table types to types/supabase.ts');
    console.log('\n📋 Added tables:');
    console.log('   - guide_equipment_checklists');
    console.log('   - guide_equipment_reports');
    console.log('   - guide_trip_activity_logs');
    console.log('   - guide_trip_timeline_shares');
    console.log('   - guide_performance_goals');
  } else {
    console.log('⚠️  Could not find Tables type definition');
    console.log('💡 Please run: npm run update-types (requires Supabase access token)');
    console.log('   Or manually add the types to types/supabase.ts');
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

