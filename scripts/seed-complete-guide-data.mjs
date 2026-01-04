import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD || '#AeroTVL2025';

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

// Extract project ref
const urlMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
  console.error('❌ Invalid SUPABASE_URL format');
  process.exit(1);
}

const projectRef = urlMatch[1];
const DATABASE_URL = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${projectRef}.supabase.co:5432/postgres`;

async function runSeed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // 1. Get Active Guide User
    console.log('🔍 Finding active guide user...');
    // Prioritize specific user if known, else first guide
    const targetUserId = '093249c7-4719-4b97-894b-7cd6f2a84372'; 
    
    let userResult;
    try {
      userResult = await client.query(`SELECT id FROM users WHERE id = $1`, [targetUserId]);
    } catch (e) {
      console.log('User check failed, trying simple query...');
    }
    
    if (!userResult || userResult.rows.length === 0) {
      console.log('⚠️ Target user not found, finding any guide...');
      try {
        userResult = await client.query(`SELECT id FROM users WHERE role = 'guide' LIMIT 1`);
      } catch (e) {
        // If role column doesn't exist, try just getting any user
        userResult = await client.query(`SELECT id FROM users LIMIT 1`);
      }
    }

    if (!userResult || userResult.rows.length === 0) {
      throw new Error('No guide user found in database. Please seed users first.');
    }

    const guideId = userResult.rows[0].id;
    // const guideEmail = userResult.rows[0].email; // Email might not exist in public.users
    console.log(`👤 Seeding data for guide ID: ${guideId}\n`);

    // 2. Seed Wallet
    console.log('💰 Seeding Wallet...');
    // Check if wallet exists
    let walletResult = await client.query(`SELECT id FROM guide_wallets WHERE guide_id = $1`, [guideId]);
    let walletId;

    if (walletResult.rows.length === 0) {
      // Create wallet
      const newWallet = await client.query(`
        INSERT INTO guide_wallets (guide_id, balance, pending_balance)
        VALUES ($1, 2500000, 500000)
        RETURNING id
      `, [guideId]);
      walletId = newWallet.rows[0].id;
      console.log('   ✅ Wallet created with Rp 2.500.000 balance');
      
      // Create transactions
      await client.query(`
        INSERT INTO guide_wallet_transactions (wallet_id, amount, transaction_type, description, status, created_at)
        VALUES 
          ($1, 1500000, 'earning', 'Fee Trip Labuan Bajo', 'completed', NOW() - INTERVAL '5 days'),
          ($1, 1000000, 'earning', 'Fee Trip Komodo', 'completed', NOW() - INTERVAL '2 days'),
          ($1, 500000, 'pending', 'Fee Trip Raja Ampat', 'pending', NOW())
      `, [walletId]);
      console.log('   ✅ Wallet transactions created');
    } else {
      walletId = walletResult.rows[0].id;
      console.log('   ℹ️ Wallet already exists');
    }

    // 3. Seed Reward Points
    console.log('\n🏆 Seeding Reward Points...');
    let pointsResult = await client.query(`SELECT id FROM guide_reward_points WHERE guide_id = $1`, [guideId]);
    
    if (pointsResult.rows.length === 0) {
      await client.query(`
        INSERT INTO guide_reward_points (guide_id, balance, lifetime_earned)
        VALUES ($1, 1250, 1500)
      `, [guideId]);
      
      // Transactions
      await client.query(`
        INSERT INTO guide_reward_transactions (guide_id, points, transaction_type, source_type, description, expires_at)
        VALUES 
          ($1, 500, 'earn', 'trip', 'Trip Completion Bonus', NOW() + INTERVAL '1 year'),
          ($1, 500, 'earn', 'challenge', 'Monthly Challenge Completed', NOW() + INTERVAL '1 year'),
          ($1, 250, 'redeem', 'merch', 'Redeemed for T-Shirt', NULL),
          ($1, 500, 'earn', 'badge', 'Earned "Expert Guide" Badge', NOW() + INTERVAL '1 year')
      `, [guideId]);
      console.log('   ✅ Reward points seeded (1250 pts)');
    } else {
      console.log('   ℹ️ Reward points already exist');
    }

    // 4. Seed Certifications
    console.log('\n📜 Seeding Certifications...');
    // Delete existing to avoid duplicates logic complexity
    await client.query(`DELETE FROM guide_certifications_tracker WHERE guide_id = $1`, [guideId]);
    
    await client.query(`
      INSERT INTO guide_certifications_tracker 
      (guide_id, certification_type, certification_name, issuer, expiry_date, status, is_active)
      VALUES 
        ($1, 'license', 'Lisensi Pemandu Wisata (HPI)', 'BNSP', NOW() + INTERVAL '45 days', 'verified', true),
        ($1, 'first_aid', 'First Aid / CPR', 'Red Cross Indonesia', NOW() + INTERVAL '180 days', 'verified', true),
        ($1, 'skill', 'Advanced Diving (PADI)', 'PADI', NOW() + INTERVAL '365 days', 'verified', true),
        ($1, 'language', 'English Proficiency (TOEFL)', 'ETS', NOW() - INTERVAL '10 days', 'expired', false)
    `, [guideId]);
    console.log('   ✅ Certifications seeded (1 expiring soon, 1 expired)');

    // 5. Seed Social Posts
    console.log('\n📱 Seeding Social Posts...');
    await client.query(`DELETE FROM guide_social_posts WHERE guide_id = $1`, [guideId]);
    
    await client.query(`
      INSERT INTO guide_social_posts (guide_id, content, likes_count, comments_count)
      VALUES 
        ($1, 'Trip hari ini luar biasa! Cuaca cerah di Pulau Padar. ☀️🌊', 24, 5),
        ($1, 'Baru saja menyelesaikan sertifikasi First Aid. Safety first! ⛑️', 45, 12)
    `, [guideId]);
    console.log('   ✅ Social posts seeded');

    // 6. Seed Challenges (if empty)
    console.log('\n🎯 Checking Challenges...');
    const challengeCount = await client.query(`SELECT COUNT(*) FROM guide_challenges WHERE guide_id = $1`, [guideId]);
    if (parseInt(challengeCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO guide_challenges (guide_id, challenge_type, title, description, target_value, current_value, target_date, status, reward_points)
        VALUES 
          ($1, 'trip_count', 'Selesaikan 5 Trip', 'Selesaikan 5 trip bulan ini', 5, 2, NOW() + INTERVAL '15 days', 'active', 500),
          ($1, 'rating', 'Bintang Lima', 'Dapatkan 3 rating bintang 5 berturut-turut', 3, 1, NOW() + INTERVAL '30 days', 'active', 300)
      `, [guideId]);
      console.log('   ✅ Challenges seeded');
    } else {
      console.log('   ℹ️ Challenges already exist');
    }

    // 7. Seed Promos (if empty)
    console.log('\n📢 Checking Promos...');
    const promoCount = await client.query(`SELECT COUNT(*) FROM guide_promos`);
    if (parseInt(promoCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO guide_promos (type, title, subtitle, description, link, badge, gradient, priority, start_date, is_active)
        VALUES 
          ('announcement', 'Update SOP Keamanan', 'Mohon baca SOP terbaru', 'SOP keamanan telah diperbarui. Silakan baca di dashboard.', '/guide/learning', 'PENTING', 'from-red-500 to-orange-600', 'high', NOW() - INTERVAL '2 days', true),
          ('promo', 'Bonus Trip Desember', 'Dapatkan bonus tambahan!', 'Setiap trip yang diselesaikan di bulan Desember akan mendapat bonus 10% dari fee.', '/guide/wallet', 'HOT', 'from-emerald-500 to-teal-600', 'medium', NOW(), true),
          ('update', 'Fitur Baru: Offline Map', 'Peta offline sekarang tersedia', 'Download peta untuk digunakan saat offline di menu Lokasi.', '/guide/locations', 'NEW', 'from-blue-500 to-indigo-600', 'low', NOW() - INTERVAL '5 days', true)
      `);
      console.log('   ✅ Promos seeded');
    } else {
      console.log('   ℹ️ Promos already exist');
    }

    console.log('\n✨ Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();

