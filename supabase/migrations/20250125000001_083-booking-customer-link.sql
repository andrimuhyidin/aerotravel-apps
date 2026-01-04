-- Migration: 083-booking-customer-link.sql
-- Description: Add customer_id column to bookings table for linking to partner_customers
-- Created: 2025-01-25
-- Reference: Partner Portal Phase 1 Implementation Plan

-- ============================================
-- ADD CUSTOMER_ID COLUMN TO BOOKINGS
-- ============================================
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES partner_customers(id) ON DELETE SET NULL;

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN bookings.customer_id IS 'Optional link to partner_customers table for CRM functionality';

