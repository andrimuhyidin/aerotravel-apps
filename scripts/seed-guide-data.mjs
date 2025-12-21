#!/usr/bin/env node

/**
 * Seed Guide App Data
 * Inserts seed data for guide_challenges, guide_promos, guide_quick_actions, and guide_menu_items
 * 
 * Usage:
 *   node scripts/seed-guide-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedData() {
  console.log('🌱 Seeding Guide App data...\n');

  try {
    // ============================================
    // 1. SEED QUICK ACTIONS
    // ============================================
    console.log('📌 Seeding Quick Actions...');
    const quickActions = [
      { branch_id: null, href: '/guide/attendance', label: 'Absensi', icon_name: 'MapPin', color: 'bg-emerald-500', description: 'Check-in lokasi', display_order: 1, is_active: true },
      { branch_id: null, href: '/guide/trips', label: 'Trip Saya', icon_name: 'Calendar', color: 'bg-blue-500', description: 'Lihat jadwal trip', display_order: 2, is_active: true },
      { branch_id: null, href: '/guide/manifest', label: 'Manifest', icon_name: 'ClipboardList', color: 'bg-indigo-500', description: 'Cek tamu', display_order: 3, is_active: true },
      { branch_id: null, href: '/guide/wallet', label: 'Dompet', icon_name: 'Wallet', color: 'bg-amber-500', description: 'Saldo & pendapatan', display_order: 4, is_active: true },
      { branch_id: null, href: '/guide/sos', label: 'SOS', icon_name: 'AlertTriangle', color: 'bg-red-500', description: 'Darurat', display_order: 5, is_active: true },
      { branch_id: null, href: '/guide/insights', label: 'Insight', icon_name: 'BarChart3', color: 'bg-purple-500', description: 'Ringkasan performa', display_order: 6, is_active: true },
      { branch_id: null, href: '/guide/status', label: 'Status', icon_name: 'Clock', color: 'bg-slate-700', description: 'Atur ketersediaan', display_order: 7, is_active: true },
      { branch_id: null, href: '/guide/training', label: 'Pelatihan', icon_name: 'GraduationCap', color: 'bg-teal-500', description: 'Modul pelatihan', display_order: 8, is_active: true },
      { branch_id: null, href: '/guide/crew/directory', label: 'Crew', icon_name: 'Users', color: 'bg-cyan-500', description: 'Direktori guide', display_order: 9, is_active: true },
      { branch_id: null, href: '/guide/notifications', label: 'Notifikasi', icon_name: 'Bell', color: 'bg-pink-500', description: 'Pemberitahuan', display_order: 10, is_active: true },
    ];

    // Check existing and insert new
    for (const action of quickActions) {
      const { data: existing } = await supabase
        .from('guide_quick_actions')
        .select('id')
        .eq('href', action.href)
        .eq('branch_id', action.branch_id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('guide_quick_actions')
          .insert(action);
        
        if (error) {
          console.warn(`  ⚠️  Failed to insert quick action: ${action.label}`, error.message);
        } else {
          console.log(`  ✅ Inserted: ${action.label}`);
        }
      } else {
        console.log(`  ⏭️  Skipped (exists): ${action.label}`);
      }
    }

    // ============================================
    // 2. SEED MENU ITEMS
    // ============================================
    console.log('\n📋 Seeding Menu Items...');
    const menuItems = [
      // Akun Section
      { branch_id: null, section: 'Akun', href: '/guide/profile/edit', label: 'Edit Profil', icon_name: 'User', description: 'Ubah informasi profil', display_order: 1, is_active: true },
      { branch_id: null, section: 'Akun', href: '/guide/contracts', label: 'Kontrak Kerja', icon_name: 'FileText', description: 'Lihat dan kelola kontrak kerja Anda', display_order: 2, is_active: true },
      { branch_id: null, section: 'Akun', href: '/guide/id-card', label: 'ID Card', icon_name: 'CreditCard', description: 'Kartu identitas guide', display_order: 3, is_active: true },
      { branch_id: null, section: 'Akun', href: '/guide/profile/password', label: 'Ubah Password', icon_name: 'Lock', description: 'Ganti kata sandi', display_order: 4, is_active: true },
      { branch_id: null, section: 'Akun', href: '/guide/insights', label: 'Insight & Performance', icon_name: 'BarChart3', description: 'Analisis performa lengkap, trend bulanan, dan rekomendasi', display_order: 5, is_active: true },
      { branch_id: null, section: 'Akun', href: '/guide/rewards', label: 'Reward Points', icon_name: 'Gift', description: 'Poin reward, katalog, dan riwayat penukaran', display_order: 6, is_active: true },
      // Pembelajaran Section
      { branch_id: null, section: 'Pembelajaran', href: '/guide/onboarding', label: 'Onboarding', icon_name: 'GraduationCap', description: 'Lengkapi onboarding untuk memulai', display_order: 1, is_active: true },
      { branch_id: null, section: 'Pembelajaran', href: '/guide/training', label: 'Training', icon_name: 'GraduationCap', description: 'Modul pelatihan dan sertifikasi', display_order: 2, is_active: true },
      { branch_id: null, section: 'Pembelajaran', href: '/guide/learning', label: 'Learning Hub', icon_name: 'BookOpen', description: 'Panduan, SOP, dan tips untuk Guide', display_order: 3, is_active: true },
      // Dukungan Section
      { branch_id: null, section: 'Dukungan', href: '/guide/notifications', label: 'Notifikasi', icon_name: 'Bell', description: 'Pemberitahuan penting', display_order: 1, is_active: true },
      { branch_id: null, section: 'Dukungan', href: '/guide/sos', label: 'SOS Emergency', icon_name: 'AlertTriangle', description: 'Tombol darurat', display_order: 2, is_active: true },
      { branch_id: null, section: 'Dukungan', href: '/guide/feedback/new', label: 'Beri Feedback', icon_name: 'MessageSquare', description: 'Kirim masukan', display_order: 3, is_active: true },
      // Pengaturan Section
      { branch_id: null, section: 'Pengaturan', href: '/guide/settings', label: 'Pengaturan Aplikasi', icon_name: 'Settings', description: 'Pengaturan aplikasi', display_order: 1, is_active: true },
      { branch_id: null, section: 'Pengaturan', href: '/guide/preferences', label: 'Preferensi', icon_name: 'Sliders', description: 'Pilih preferensi trip', display_order: 2, is_active: true },
      { branch_id: null, section: 'Pengaturan', href: '/legal/privacy', label: 'Kebijakan Privasi', icon_name: 'Shield', description: 'Kebijakan privasi', display_order: 3, is_active: true },
      { branch_id: null, section: 'Pengaturan', href: '/legal/terms', label: 'Syarat & Ketentuan', icon_name: 'FileText', description: 'Syarat dan ketentuan', display_order: 4, is_active: true },
    ];

    for (const item of menuItems) {
      const { data: existing } = await supabase
        .from('guide_menu_items')
        .select('id')
        .eq('href', item.href)
        .eq('section', item.section)
        .eq('branch_id', item.branch_id)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('guide_menu_items')
          .insert(item);
        
        if (error) {
          console.warn(`  ⚠️  Failed to insert menu item: ${item.label}`, error.message);
        } else {
          console.log(`  ✅ Inserted: ${item.label} (${item.section})`);
        }
      } else {
        console.log(`  ⏭️  Skipped (exists): ${item.label} (${item.section})`);
      }
    }

    // ============================================
    // 3. SEED PROMOS
    // ============================================
    console.log('\n🎁 Seeding Promos & Updates...');
    const now = new Date();
    const promos = [
      {
        branch_id: null,
        type: 'announcement',
        title: 'Update SOP Keamanan',
        subtitle: 'Mohon baca SOP terbaru',
        description: 'SOP keamanan telah diperbarui. Silakan baca di dashboard.',
        link: '/guide/learning',
        badge: 'PENTING',
        gradient: 'from-red-500 to-orange-600',
        priority: 'high',
        start_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: null,
        is_active: true,
      },
      {
        branch_id: null,
        type: 'promo',
        title: 'Bonus Trip Desember',
        subtitle: 'Dapatkan bonus tambahan!',
        description: 'Setiap trip yang diselesaikan di bulan Desember akan mendapat bonus 10% dari fee.',
        link: '/guide/wallet',
        badge: 'HOT',
        gradient: 'from-emerald-500 to-teal-600',
        priority: 'medium',
        start_date: now.toISOString(),
        end_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      },
      {
        branch_id: null,
        type: 'update',
        title: 'Fitur Baru: Offline Map',
        subtitle: 'Peta offline sekarang tersedia',
        description: 'Download peta untuk digunakan saat offline di menu Lokasi.',
        link: '/guide/locations',
        badge: 'NEW',
        gradient: 'from-blue-500 to-indigo-600',
        priority: 'low',
        start_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: null,
        is_active: true,
      },
      {
        branch_id: null,
        type: 'promo',
        title: 'Challenge Bulanan',
        subtitle: 'Ikuti challenge dan menang hadiah',
        description: 'Selesaikan 15 trip dalam sebulan dan dapatkan hadiah spesial.',
        link: '/guide/challenges',
        badge: 'REWARD',
        gradient: 'from-purple-500 to-pink-600',
        priority: 'medium',
        start_date: now.toISOString(),
        end_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      },
    ];

    for (const promo of promos) {
      const { data: existing } = await supabase
        .from('guide_promos')
        .select('id')
        .eq('title', promo.title)
        .eq('type', promo.type)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('guide_promos')
          .insert(promo);
        
        if (error) {
          console.warn(`  ⚠️  Failed to insert promo: ${promo.title}`, error.message);
        } else {
          console.log(`  ✅ Inserted: ${promo.title} (${promo.type})`);
        }
      } else {
        console.log(`  ⏭️  Skipped (exists): ${promo.title}`);
      }
    }

    // ============================================
    // 4. VERIFY RESULTS
    // ============================================
    console.log('\n📊 Verifying seed data...\n');

    const { count: qaCount } = await supabase
      .from('guide_quick_actions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: miCount } = await supabase
      .from('guide_menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: promoCount } = await supabase
      .from('guide_promos')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log('Results:');
    console.log(`  ✅ Quick Actions: ${qaCount || 0} active`);
    console.log(`  ✅ Menu Items: ${miCount || 0} active`);
    console.log(`  ✅ Promos: ${promoCount || 0} active`);
    console.log('\n✅ Seed data completed successfully!');
    console.log('\nNote: Challenges will be created automatically by the API when guides access the challenges page.');

    return 0;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return 1;
  }
}

seedData().then(code => process.exit(code));

