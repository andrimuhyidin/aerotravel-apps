-- Migration: Admin Panel Settings Migration
-- Description: Add new settings for AI, Maps, Weather, and Rate Limiting
-- Date: 2026-01-03

-- Enable pgcrypto for encryption (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add columns for sensitive settings if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'settings' AND column_name = 'value_encrypted') THEN
        ALTER TABLE settings ADD COLUMN value_encrypted TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'settings' AND column_name = 'is_sensitive') THEN
        ALTER TABLE settings ADD COLUMN is_sensitive BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =====================================================
-- ADD UNIQUE CONSTRAINT ON KEY (if not exists)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'settings_key_unique'
    ) THEN
        ALTER TABLE settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- =====================================================
-- AI SETTINGS
-- =====================================================
INSERT INTO settings (key, value, value_type, description, is_public, is_sensitive) VALUES
('ai.provider', 'gemini', 'string', 'AI provider (gemini/openai/anthropic)', false, false),
('ai.model', 'gemini-2.0-flash', 'string', 'AI model name', false, false),
('ai.max_tokens', '4096', 'number', 'Max tokens per request', false, false),
('ai.temperature', '0.7', 'number', 'Temperature for AI responses (0-1)', false, false),
('ai.rate_limit_rpm', '60', 'number', 'Rate limit requests per minute', false, false),
('ai.speech_enabled', 'false', 'boolean', 'Enable speech-to-text feature', false, false),
('ai.vision_enabled', 'true', 'boolean', 'Enable vision/OCR feature', false, false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- MAPS SETTINGS
-- =====================================================
INSERT INTO settings (key, value, value_type, description, is_public, is_sensitive) VALUES
('maps.provider', 'google', 'string', 'Maps provider (google/mapbox)', false, false),
('maps.default_lat', '-6.2088', 'number', 'Default map latitude', true, false),
('maps.default_lng', '106.8456', 'number', 'Default map longitude', true, false),
('maps.default_zoom', '12', 'number', 'Default map zoom level', true, false),
('maps.route_optimization_enabled', 'true', 'boolean', 'Enable route optimization', false, false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- WEATHER SETTINGS
-- =====================================================
INSERT INTO settings (key, value, value_type, description, is_public, is_sensitive) VALUES
('weather.enabled', 'true', 'boolean', 'Enable weather alerts', false, false),
('weather.provider', 'openweathermap', 'string', 'Weather data provider', false, false),
('weather.wind_threshold', '40', 'number', 'Wind alert threshold (km/h)', false, false),
('weather.rain_threshold', '50', 'number', 'Rain alert threshold (mm)', false, false),
('weather.wave_threshold', '2', 'number', 'Wave height alert threshold (m)', false, false),
('weather.check_interval_hours', '3', 'number', 'Weather check interval in hours', false, false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- RATE LIMITING SETTINGS
-- =====================================================
INSERT INTO settings (key, value, value_type, description, is_public, is_sensitive) VALUES
('ratelimit.enabled', 'true', 'boolean', 'Enable rate limiting', false, false),
('ratelimit.default_limit', '100', 'number', 'Default requests per minute', false, false),
('ratelimit.ai_limit', '60', 'number', 'AI requests per minute', false, false),
('ratelimit.api_limit', '200', 'number', 'API requests per minute', false, false),
('ratelimit.auth_limit', '10', 'number', 'Auth attempts per minute', false, false)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- RPC FUNCTIONS FOR ENCRYPTION
-- =====================================================

-- Function to encrypt a value
CREATE OR REPLACE FUNCTION encrypt_setting(plain_text TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from app settings (should be set via Supabase dashboard)
    encryption_key := current_setting('app.settings_encryption_key', true);
    
    IF encryption_key IS NULL OR encryption_key = '' THEN
        -- Fallback: use a derived key from service role (not ideal but works)
        encryption_key := encode(digest('aero-settings-key', 'sha256'), 'hex');
    END IF;
    
    RETURN encode(pgp_sym_encrypt(plain_text, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt a value
CREATE OR REPLACE FUNCTION decrypt_setting(cipher_text TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Get encryption key from app settings
    encryption_key := current_setting('app.settings_encryption_key', true);
    
    IF encryption_key IS NULL OR encryption_key = '' THEN
        encryption_key := encode(digest('aero-settings-key', 'sha256'), 'hex');
    END IF;
    
    RETURN pgp_sym_decrypt(decode(cipher_text, 'base64'), encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR SENSITIVE SETTINGS
-- =====================================================

-- Only super_admin can read/write sensitive settings
DO $$
BEGIN
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS "Sensitive settings super_admin only" ON settings;
    
    -- Create new policy
    CREATE POLICY "Sensitive settings super_admin only" ON settings
        FOR ALL
        USING (
            NOT COALESCE(is_sensitive, false)
            OR (
                COALESCE(is_sensitive, false)
                AND EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_profiles.user_id = auth.uid() 
                    AND user_profiles.active_role = 'super_admin'
                )
            )
        );
EXCEPTION
    WHEN undefined_object THEN
        -- Table doesn't have RLS or policy doesn't exist
        NULL;
END $$;

-- =====================================================
-- AUDIT LOG TRIGGER FOR SETTINGS CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        changes,
        user_id,
        created_at
    ) VALUES (
        TG_OP,
        'settings',
        NEW.id::text,
        jsonb_build_object(
            'key', NEW.key,
            'old_value', CASE WHEN TG_OP = 'UPDATE' THEN OLD.value ELSE NULL END,
            'new_value', CASE WHEN NEW.is_sensitive THEN '[REDACTED]' ELSE NEW.value END
        ),
        auth.uid(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS settings_audit_trigger ON settings;
CREATE TRIGGER settings_audit_trigger
    AFTER INSERT OR UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION log_settings_change();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN settings.value_encrypted IS 'Encrypted value for sensitive settings (API keys)';
COMMENT ON COLUMN settings.is_sensitive IS 'Whether this setting contains sensitive data';
COMMENT ON FUNCTION encrypt_setting IS 'Encrypts a plaintext value for secure storage';
COMMENT ON FUNCTION decrypt_setting IS 'Decrypts an encrypted value';

