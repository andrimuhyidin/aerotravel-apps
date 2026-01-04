import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mjzukilsgkdqmcusjdut.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_JT_3cgWg2As222JrSVy0AQ_S_McPr_R';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function insertQuickActions() {
  console.log('📦 Inserting quick actions...');
  
  const actions = [
    { branch_id: null, href: '/guide/attendance', label: 'Absensi', icon_name: 'MapPin', color: 'bg-emerald-500', description: 'Check-in lokasi', display_order: 1 },
    { branch_id: null, href: '/guide/manifest', label: 'Manifest', icon_name: 'ClipboardList', color: 'bg-blue-500', description: 'Cek tamu', display_order: 2 },
    { branch_id: null, href: '/guide/sos', label: 'SOS', icon_name: 'AlertTriangle', color: 'bg-red-500', description: 'Darurat', display_order: 3 },
    { branch_id: null, href: '/guide/insights', label: 'Insight', icon_name: 'BarChart3', color: 'bg-purple-500', description: 'Ringkasan performa', display_order: 4 },
    { branch_id: null, href: '/guide/incidents', label: 'Insiden', icon_name: 'FileText', color: 'bg-orange-500', description: 'Laporan insiden', display_order: 5 },
    { branch_id: null, href: '/guide/trips', label: 'Trip Saya', icon_name: 'Calendar', color: 'bg-indigo-500', description: 'Lihat jadwal', display_order: 6 },
    { branch_id: null, href: '/guide/status', label: 'Status', icon_name: 'Clock', color: 'bg-slate-700', description: 'Atur jadwal', display_order: 7 },
    { branch_id: null, href: '/guide/preferences', label: 'Preferensi', icon_name: 'Settings', color: 'bg-blue-600', description: 'Pilih preferensi trip', display_order: 8 },
    { branch_id: null, href: '/guide/wallet', label: 'Dompet', icon_name: 'Wallet', color: 'bg-amber-500', description: 'Saldo & pendapatan', display_order: 9 },
    { branch_id: null, href: '/guide/broadcasts', label: 'Broadcast', icon_name: 'Megaphone', color: 'bg-teal-500', description: 'Info dari Ops', display_order: 10 },
    { branch_id: null, href: '/guide/locations', label: 'Lokasi', icon_name: 'MapPin', color: 'bg-green-500', description: 'Peta offline', display_order: 11 },
  ];

  const { data, error } = await supabase
    .from('guide_quick_actions')
    .upsert(actions, { onConflict: 'href,label' });

  if (error) {
    console.error('❌ Error inserting quick actions:', error.message);
    return false;
  }
  console.log('✅ Quick actions inserted');
  return true;
}

async function insertMenuItems() {
  console.log('📦 Inserting menu items...');
  
  const items = [
    { branch_id: null, section: 'Akun', href: '/guide/profile/edit', label: 'Edit Profil', icon_name: 'User', description: 'Ubah informasi profil', display_order: 1 },
    { branch_id: null, section: 'Akun', href: '/guide/ratings', label: 'Rating & Ulasan', icon_name: 'Star', description: 'Lihat penilaian customer', display_order: 2 },
    { branch_id: null, section: 'Operasional', href: '/guide/insights', label: 'Insight Pribadi', icon_name: 'BarChart3', description: 'Ringkasan performa & riwayat penalty', display_order: 1 },
    { branch_id: null, section: 'Operasional', href: '/guide/broadcasts', label: 'Broadcast Ops', icon_name: 'Megaphone', description: 'Info penting dari tim operasional', display_order: 2 },
    { branch_id: null, section: 'Operasional', href: '/guide/incidents', label: 'Laporan Insiden', icon_name: 'FileText', description: 'Laporkan kejadian insiden', display_order: 3 },
    { branch_id: null, section: 'Pengaturan', href: '/guide/settings', label: 'Pengaturan', icon_name: 'Settings', description: 'Pengaturan aplikasi', display_order: 1 },
    { branch_id: null, section: 'Pengaturan', href: '/guide/documents', label: 'Dokumen', icon_name: 'FileText', description: 'Kelola dokumen', display_order: 2 },
    { branch_id: null, section: 'Pengaturan', href: '/legal/privacy', label: 'Kebijakan Privasi', icon_name: 'Shield', description: 'Kebijakan privasi', display_order: 3 },
    { branch_id: null, section: 'Pengaturan', href: '/help', label: 'Bantuan', icon_name: 'HelpCircle', description: 'Pusat bantuan', display_order: 4 },
  ];

  const { data, error } = await supabase
    .from('guide_menu_items')
    .upsert(items, { onConflict: 'href,label' });

  if (error) {
    console.error('❌ Error inserting menu items:', error.message);
    return false;
  }
  console.log('✅ Menu items inserted');
  return true;
}

async function main() {
  console.log('🚀 Starting Guide App data migration...\n');
  
  // Check if tables exist by trying to query them
  const { error: quickActionsError } = await supabase.from('guide_quick_actions').select('id').limit(1);
  if (quickActionsError) {
    console.error('❌ Table guide_quick_actions does not exist!');
    console.log('💡 Please run DDL migrations first via Supabase Dashboard SQL Editor:');
    console.log('   - supabase/migrations/20251219000000_021-guide-ui-config.sql\n');
    return;
  }

  const { error: menuItemsError } = await supabase.from('guide_menu_items').select('id').limit(1);
  if (menuItemsError) {
    console.error('❌ Table guide_menu_items does not exist!');
    console.log('💡 Please run DDL migrations first via Supabase Dashboard SQL Editor:');
    console.log('   - supabase/migrations/20251219000000_021-guide-ui-config.sql\n');
    return;
  }

  await insertQuickActions();
  await insertMenuItems();
  
  console.log('\n🎉 Data migration completed!');
  console.log('\n💡 For comprehensive sample data, run:');
  console.log('   supabase/migrations/20251219000002_023-guide-comprehensive-sample.sql');
  console.log('   via Supabase Dashboard SQL Editor');
}

main().catch(console.error);

