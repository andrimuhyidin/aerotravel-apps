-- ============================================
-- Seed Payment Data
-- Description: Sample payment records untuk testing payment flow
-- Created: 2025-01-04
-- ============================================

-- Payment for completed bookings (status: paid)
INSERT INTO payments (id, booking_id, payment_code, amount, fee_amount, net_amount, payment_method, status, external_id, paid_at, created_at) VALUES
-- Completed bookings with paid payments
(gen_random_uuid(), '10000000-0000-0000-0000-000000000001', 'INV-20251217-001', 500000.00, 5000.00, 495000.00, 'xendit_qris', 'paid', 'xnd_inv_001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(gen_random_uuid(), '10000000-0000-0000-0000-000000000002', 'INV-20251217-002', 450000.00, 4500.00, 445500.00, 'xendit_va', 'paid', 'xnd_inv_002', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
(gen_random_uuid(), '10000000-0000-0000-0000-000000000003', 'INV-20251217-003', 600000.00, 6000.00, 594000.00, 'xendit_ewallet', 'paid', 'xnd_inv_003', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
(gen_random_uuid(), 'e88b5bda-3083-4b57-a6d3-6a04b71c99c3', 'INV-20251218-001', 1500000.00, 15000.00, 1485000.00, 'xendit_card', 'paid', 'xnd_inv_004', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
(gen_random_uuid(), 'e8cc32b9-a7df-47a4-8112-696629b8a3d6', 'INV-20251218-002', 1250000.00, 12500.00, 1237500.00, 'xendit_qris', 'paid', 'xnd_inv_005', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
(gen_random_uuid(), 'b1ca780e-bc2b-4879-83d5-6a0f4fddc088', 'INV-20251218-003', 1000000.00, 10000.00, 990000.00, 'mitra_wallet', 'paid', 'wallet_001', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(gen_random_uuid(), '05a548dc-e981-45f6-993e-4491256d090d', 'INV-20251219-001', 1125000.00, 11250.00, 1113750.00, 'xendit_va', 'paid', 'xnd_inv_007', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
(gen_random_uuid(), '02451ab0-15e5-4489-b44d-bb79c1c7e416', 'INV-20251219-002', 1125000.00, 11250.00, 1113750.00, 'xendit_qris', 'paid', 'xnd_inv_008', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
(gen_random_uuid(), '366e294d-72df-4f34-9610-0af0ce518cf2', 'INV-20251219-003', 1125000.00, 11250.00, 1113750.00, 'xendit_ewallet', 'paid', 'xnd_inv_009', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
(gen_random_uuid(), '14873c68-8f5f-4a40-bd5b-738d00f62cb2', 'INV-20251220-001', 1125000.00, 11250.00, 1113750.00, 'manual_transfer', 'paid', 'manual_001', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
(gen_random_uuid(), '2123046e-1491-4d0d-8a46-41e13399e4a3', 'INV-20251220-002', 1125000.00, 11250.00, 1113750.00, 'xendit_card', 'paid', 'xnd_inv_011', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

-- Confirmed bookings with paid payments
(gen_random_uuid(), 'e2c87c74-2db2-4c34-abf6-4462dbe47a9d', 'INV-20251222-001', 1000000.00, 10000.00, 990000.00, 'xendit_qris', 'paid', 'xnd_inv_012', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'ffb2fb24-137a-42ef-b738-d096c5dde099', 'INV-20251222-002', 1000000.00, 10000.00, 990000.00, 'xendit_va', 'paid', 'xnd_inv_013', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(gen_random_uuid(), '438c7b75-6250-4fdc-88ea-bc93c14acd16', 'INV-20251222-003', 1000000.00, 10000.00, 990000.00, 'mitra_wallet', 'paid', 'wallet_002', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(gen_random_uuid(), '07d59fac-338b-47c2-bf3f-7240b3bc40b2', 'INV-20251222-004', 1000000.00, 10000.00, 990000.00, 'xendit_ewallet', 'paid', 'xnd_inv_015', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), '71a0d95c-508f-4449-bee5-543fdd5c525b', 'INV-20251222-005', 1000000.00, 10000.00, 990000.00, 'xendit_card', 'paid', 'xnd_inv_016', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '3e8b22fe-9b19-4380-bd4a-cb67f5b7e597', 'INV-20251222-006', 1000000.00, 10000.00, 990000.00, 'xendit_qris', 'paid', 'xnd_inv_017', NOW(), NOW())

ON CONFLICT (payment_code) DO NOTHING;

-- Add some sample payments with different statuses for testing
INSERT INTO payments (id, booking_id, payment_code, amount, payment_method, status, external_id, payment_url, expired_at, created_at) VALUES
-- Pending payment (awaiting customer action)
(gen_random_uuid(), NULL, 'INV-PENDING-001', 750000.00, 'xendit_invoice', 'pending', 'xnd_pending_001', 'https://checkout.xendit.co/pending001', NOW() + INTERVAL '24 hours', NOW()),
-- Expired payment
(gen_random_uuid(), NULL, 'INV-EXPIRED-001', 500000.00, 'xendit_va', 'expired', 'xnd_expired_001', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
-- Failed payment
(gen_random_uuid(), NULL, 'INV-FAILED-001', 1200000.00, 'xendit_card', 'failed', 'xnd_failed_001', NULL, NULL, NOW() - INTERVAL '1 day')

ON CONFLICT (payment_code) DO NOTHING;

-- Summary
DO $$
DECLARE
    payment_count INTEGER;
BEGIN
    SELECT count(*) INTO payment_count FROM payments;
    RAISE NOTICE 'Total payments in database: %', payment_count;
END $$;
