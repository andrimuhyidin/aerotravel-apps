-- Migration: 019-guide-ops-communication.sql
-- Description: Internal communication between Guide and Ops (Chat per trip & Broadcasts)

-- ============================================
-- TRIP CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS trip_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('guide', 'ops', 'admin')),
  message_text TEXT NOT NULL,
  template_type VARCHAR(50), -- 'delay_guest', 'bad_weather', 'boat_equipment_issue', 'custom'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Read status (optional, for future read receipts)
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id)
);

-- ============================================
-- OPS BROADCASTS
-- ============================================
DO $$ BEGIN
  CREATE TYPE broadcast_type AS ENUM (
    'weather_info',
    'dock_info',
    'sop_change',
    'general_announcement'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ops_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Broadcast Info
  broadcast_type broadcast_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Target (all guides on duty, or specific guides)
  target_guides UUID[], -- NULL means all guides on duty
  is_active BOOLEAN DEFAULT true,
  
  -- Priority
  is_urgent BOOLEAN DEFAULT false,
  
  -- Scheduling (optional)
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BROADCAST READ STATUS
-- ============================================
CREATE TABLE IF NOT EXISTS broadcast_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES ops_broadcasts(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(broadcast_id, guide_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_trip_id ON trip_chat_messages(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_sender_id ON trip_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_trip_chat_messages_created_at ON trip_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ops_broadcasts_branch_id ON ops_broadcasts(branch_id);
CREATE INDEX IF NOT EXISTS idx_ops_broadcasts_is_active ON ops_broadcasts(is_active);
CREATE INDEX IF NOT EXISTS idx_ops_broadcasts_created_at ON ops_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_broadcasts_scheduled_at ON ops_broadcasts(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_broadcast_reads_broadcast_id ON broadcast_reads(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_reads_guide_id ON broadcast_reads(guide_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE trip_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Trip Chat Messages: Guides can see messages for their assigned trips, Ops/Admin can see all
CREATE POLICY "trip_chat_messages_guide_access"
  ON trip_chat_messages FOR SELECT
  USING (
    -- Guide can see if they're assigned to the trip
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = trip_chat_messages.trip_id
      AND trip_guides.guide_id = auth.uid()
    )
    OR
    -- Ops/Admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ops', 'admin', 'super_admin')
    )
  );

CREATE POLICY "trip_chat_messages_guide_insert"
  ON trip_chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      -- Guide can send if assigned to trip
      EXISTS (
        SELECT 1 FROM trip_guides
        WHERE trip_guides.trip_id = trip_chat_messages.trip_id
        AND trip_guides.guide_id = auth.uid()
      )
      OR
      -- Ops/Admin can send to any trip
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('ops', 'admin', 'super_admin')
      )
    )
  );

-- Ops Broadcasts: Guides can see active broadcasts, Ops/Admin can manage
CREATE POLICY "ops_broadcasts_guide_read"
  ON ops_broadcasts FOR SELECT
  USING (
    is_active = true
    AND (
      -- All guides on duty (target_guides is NULL) or specific guides
      target_guides IS NULL
      OR auth.uid() = ANY(target_guides)
    )
    AND (
      -- Not expired
      expires_at IS NULL
      OR expires_at > NOW()
    )
    AND (
      -- Not scheduled in future
      scheduled_at IS NULL
      OR scheduled_at <= NOW()
    )
  );

CREATE POLICY "ops_broadcasts_ops_manage"
  ON ops_broadcasts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ops', 'admin', 'super_admin')
    )
  );

-- Broadcast Reads: Guides can mark as read
CREATE POLICY "broadcast_reads_guide_access"
  ON broadcast_reads FOR SELECT, INSERT
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());
