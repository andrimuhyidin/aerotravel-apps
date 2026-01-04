-- Migration: 026-guide-color-system.sql
-- Description: Improve color system for quick actions with semantic meaning
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- UPDATE COLOR SYSTEM
-- ============================================
-- Color mapping dengan semantic meaning:
-- RED: Emergency/Critical (SOS, Insiden)
-- EMERALD: Primary Actions (most important)
-- BLUE: Information/Status (Trip, Status)
-- PURPLE: Analytics (Insight)
-- YELLOW: Communication (Broadcast)
-- GREEN: Financial (Dompet)
-- GRAY: Settings (Preferensi)

UPDATE guide_quick_actions
SET color = CASE
  -- Emergency/Critical (RED)
  WHEN href = '/guide/sos' THEN 'bg-red-500'
  WHEN href = '/guide/incidents' THEN 'bg-red-600'
  
  -- Primary Actions (EMERALD)
  WHEN href = '/guide/trips' THEN 'bg-emerald-500'
  
  -- Information/Status (BLUE)
  WHEN href = '/guide/status' THEN 'bg-blue-500'
  
  -- Analytics (PURPLE)
  WHEN href = '/guide/insights' THEN 'bg-purple-500'
  
  -- Communication (YELLOW/AMBER)
  WHEN href = '/guide/broadcasts' THEN 'bg-amber-500'
  
  -- Financial (GREEN)
  WHEN href = '/guide/wallet' THEN 'bg-green-500'
  
  -- Navigation (INDIGO)
  WHEN href = '/guide/locations' THEN 'bg-indigo-500'
  
  -- Settings (GRAY)
  WHEN href = '/guide/preferences' THEN 'bg-gray-500'
  
  ELSE color
END
WHERE branch_id IS NULL; -- Only update global actions

COMMIT;
