/**
 * Script untuk membuat test data trip assignment dengan status pending_confirmation
 * Usage: node scripts/test-trip-confirmation.mjs
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});

async function createTestTripAssignment() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get a guide user
    const { rows: guides } = await client.query(`
      SELECT id, full_name, phone
      FROM users
      WHERE role = 'guide'
      AND deleted_at IS NULL
      LIMIT 1
    `);

    if (guides.length === 0) {
      console.error('❌ No guide found. Please create a guide user first.');
      process.exit(1);
    }

    const guide = guides[0];
    console.log(`📋 Using guide: ${guide.full_name} (${guide.id})`);

    // Get or create a trip (future date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
    const tripDate = futureDate.toISOString().split('T')[0];

    const { rows: existingTrips } = await client.query(`
      SELECT id, trip_code, trip_date
      FROM trips
      WHERE trip_date >= $1
      AND status IN ('scheduled')
      LIMIT 1
    `, [tripDate]);

    let tripId;
    let tripCode;

    if (existingTrips.length > 0) {
      tripId = existingTrips[0].id;
      tripCode = existingTrips[0].trip_code;
      console.log(`📦 Using existing trip: ${tripCode} (${tripId})`);
    } else {
      // Create a test trip
      const { rows: packages } = await client.query(`
        SELECT id FROM packages LIMIT 1
      `);

      if (packages.length === 0) {
        console.error('❌ No package found. Please create a package first.');
        process.exit(1);
      }

      const packageId = packages[0].id;
      tripCode = `TEST-${Date.now().toString().slice(-6)}`;

      // Get a branch
      const { rows: branches } = await client.query(`
        SELECT id FROM branches LIMIT 1
      `);

      if (branches.length === 0) {
        console.error('❌ No branch found. Please create a branch first.');
        process.exit(1);
      }

      const branchId = branches[0].id;

      const { rows: newTrips } = await client.query(`
        INSERT INTO trips (
          trip_code,
          trip_date,
          package_id,
          status,
          total_pax,
          branch_id
        )
        VALUES ($1, $2, $3, 'scheduled', 10, $4)
        RETURNING id, trip_code
      `, [tripCode, tripDate, packageId, branchId]);

      tripId = newTrips[0].id;
      tripCode = newTrips[0].trip_code;
      console.log(`✨ Created new trip: ${tripCode} (${tripId})`);
    }

    // Check if assignment already exists
    const { rows: existingAssignments } = await client.query(`
      SELECT id, assignment_status
      FROM trip_guides
      WHERE trip_id = $1 AND guide_id = $2
    `, [tripId, guide.id]);

    if (existingAssignments.length > 0) {
      // Update to pending_confirmation
      const hMinusOne = new Date(tripDate);
      hMinusOne.setDate(hMinusOne.getDate() - 1);
      hMinusOne.setHours(22, 0, 0, 0);

      const now = new Date();
      const minimumDeadline = new Date(now);
      minimumDeadline.setHours(22, 0, 0, 0);
      if (minimumDeadline < now) {
        minimumDeadline.setDate(minimumDeadline.getDate() + 1);
      }

      const confirmationDeadline = hMinusOne < minimumDeadline ? minimumDeadline : hMinusOne;

      await client.query(`
        UPDATE trip_guides
        SET 
          assignment_status = 'pending_confirmation',
          confirmation_deadline = $1,
          confirmed_at = NULL,
          rejected_at = NULL,
          rejection_reason = NULL
        WHERE id = $2
      `, [confirmationDeadline.toISOString(), existingAssignments[0].id]);

      console.log(`✅ Updated assignment to pending_confirmation`);
      console.log(`   Deadline: ${confirmationDeadline.toLocaleString('id-ID')}`);
    } else {
      // Create new assignment with pending_confirmation
      const hMinusOne = new Date(tripDate);
      hMinusOne.setDate(hMinusOne.getDate() - 1);
      hMinusOne.setHours(22, 0, 0, 0);

      const now = new Date();
      const minimumDeadline = new Date(now);
      minimumDeadline.setHours(22, 0, 0, 0);
      if (minimumDeadline < now) {
        minimumDeadline.setDate(minimumDeadline.getDate() + 1);
      }

      const confirmationDeadline = hMinusOne < minimumDeadline ? minimumDeadline : hMinusOne;

      await client.query(`
        INSERT INTO trip_guides (
          trip_id,
          guide_id,
          guide_role,
          fee_amount,
          assignment_status,
          confirmation_deadline,
          assignment_method,
          assigned_at
        )
        VALUES ($1, $2, 'lead', 300000, 'pending_confirmation', $3, 'manual', NOW())
      `, [tripId, guide.id, confirmationDeadline.toISOString()]);

      console.log(`✅ Created new assignment with pending_confirmation`);
      console.log(`   Deadline: ${confirmationDeadline.toLocaleString('id-ID')}`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log(`\n📱 Now you can test the confirmation UI at:`);
    console.log(`   http://localhost:3000/id/guide/trips`);
    console.log(`\n👤 Guide: ${guide.full_name}`);
    console.log(`📦 Trip: ${tripCode}`);
    console.log(`📅 Trip Date: ${tripDate}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestTripAssignment();
