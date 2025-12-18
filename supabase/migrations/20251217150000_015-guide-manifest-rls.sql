-- Migration: 015-guide-manifest-rls.sql
-- Description: RLS policies to allow guides to read booking_passengers & trip_bookings for their assigned trips

-- Guides should be able to see only passengers for trips they are assigned to via trip_guides

-- booking_passengers: allow SELECT when passenger belongs to a booking attached to a trip
-- where the current user is assigned as guide via trip_guides
CREATE POLICY "booking_passengers_select_guide" ON booking_passengers
  FOR SELECT
  USING (
    booking_id IN (
      SELECT tb.booking_id
      FROM trip_bookings tb
      JOIN trip_guides tg ON tg.trip_id = tb.trip_id
      WHERE tg.guide_id = auth.uid()
    )
  );

-- trip_bookings: allow SELECT for trips where current user is an assigned guide
CREATE POLICY "trip_bookings_select_guide" ON trip_bookings
  FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_guides WHERE guide_id = auth.uid()
    )
  );
