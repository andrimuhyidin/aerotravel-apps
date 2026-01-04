-- Migration: 016-guide-expenses-rls.sql
-- Description: RLS policies to allow guides to manage trip_expenses on their assigned trips

-- Guides can see trip_expenses for trips they are assigned to
CREATE POLICY "trip_expenses_select_guide" ON trip_expenses
  FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_guides WHERE guide_id = auth.uid()
    )
  );

-- Guides can insert trip_expenses for trips they are assigned to
CREATE POLICY "trip_expenses_insert_guide" ON trip_expenses
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM trip_guides WHERE guide_id = auth.uid()
    )
  );

