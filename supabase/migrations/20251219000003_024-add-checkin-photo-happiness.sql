-- Migration: 024-add-checkin-photo-happiness.sql
-- Description: Add photo, happiness, and description fields to trip_guides check-in
-- Created: 2025-12-19

-- Add check-in photo, happiness, and description columns to trip_guides
ALTER TABLE trip_guides
  ADD COLUMN IF NOT EXISTS check_in_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS check_in_happiness INTEGER CHECK (check_in_happiness >= 1 AND check_in_happiness <= 5),
  ADD COLUMN IF NOT EXISTS check_in_description TEXT,
  ADD COLUMN IF NOT EXISTS check_in_accuracy_meters DECIMAL(6,2);

-- Add comment for documentation
COMMENT ON COLUMN trip_guides.check_in_photo_url IS 'URL foto check-in yang wajib diambil';
COMMENT ON COLUMN trip_guides.check_in_happiness IS 'Level kebahagiaan 1-5 saat check-in';
COMMENT ON COLUMN trip_guides.check_in_description IS 'Deskripsi/catatan saat check-in';
