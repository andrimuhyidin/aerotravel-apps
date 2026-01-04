-- Seed Blog Articles
-- Migrates sample blog articles to database
-- Run this after migration 20260103000013_blog-articles.sql

-- Get default branch (first active branch)
DO $$
DECLARE
  default_branch_id UUID;
  author_user_id UUID;
BEGIN
  -- Get first active branch
  SELECT id INTO default_branch_id
  FROM branches
  WHERE is_active = true
  AND deleted_at IS NULL
  LIMIT 1;

  -- Get first admin/marketing user as author (or create placeholder)
  SELECT id INTO author_user_id
  FROM users
  WHERE role IN ('super_admin', 'marketing', 'ops_admin')
  AND is_active = true
  AND deleted_at IS NULL
  LIMIT 1;

  -- If no branch found, skip seeding
  IF default_branch_id IS NULL THEN
    RAISE NOTICE 'No active branch found. Skipping blog articles seed.';
    RETURN;
  END IF;

  -- Insert sample blog articles
  INSERT INTO blog_articles (
    branch_id,
    slug,
    title,
    excerpt,
    content,
    featured_image,
    category,
    tags,
    author_id,
    status,
    published_at,
    views,
    read_time,
    meta_title,
    meta_description
  ) VALUES
  (
    default_branch_id,
    'tips-perjalanan-pahawang-pertama-kali',
    'Tips Perjalanan ke Pahawang untuk Pertama Kali',
    'Panduan lengkap untuk traveler yang pertama kali mengunjungi Pulau Pahawang. Mulai dari persiapan hingga tips hemat.',
    '# Tips Perjalanan ke Pahawang untuk Pertama Kali

Pulau Pahawang adalah salah satu destinasi wisata bahari paling populer di Lampung. Jika ini kali pertama Anda berkunjung, berikut tips yang perlu Anda ketahui.

## Persiapan Sebelum Berangkat

### 1. Waktu Terbaik Berkunjung
Waktu terbaik mengunjungi Pahawang adalah April-Oktober saat cuaca cerah dan laut tenang.

### 2. Barang yang Perlu Dibawa
- Sunscreen SPF 50+
- Kacamata renang/snorkeling
- Baju ganti 2-3 set
- Obat-obatan pribadi
- Power bank
- Waterproof bag

## Di Lokasi

### Aktivitas Wajib Coba
1. **Snorkeling** - Air jernih dengan terumbu karang indah
2. **Island Hopping** - Kunjungi pulau-pulau kecil sekitar
3. **Sunset Viewing** - Pemandangan sunset yang memukau

### Tips Hemat
- Pesan paket trip jauh-jauh hari
- Bawa bekal dari rumah
- Datang dengan grup untuk split cost

## Kesimpulan

Pahawang menawarkan pengalaman wisata bahari yang tak terlupakan. Dengan persiapan yang tepat, perjalanan Anda akan lebih menyenangkan!',
    '/images/blog/pahawang-tips.jpg',
    'tips-perjalanan',
    ARRAY['pahawang', 'lampung', 'snorkeling', 'island-hopping'],
    author_user_id,
    'published',
    '2024-01-15T10:00:00Z'::timestamptz,
    1250,
    5,
    'Tips Perjalanan ke Pahawang untuk Pertama Kali | Blog Aero Travel',
    'Panduan lengkap untuk traveler yang pertama kali mengunjungi Pulau Pahawang. Mulai dari persiapan hingga tips hemat.'
  ),
  (
    default_branch_id,
    'packing-list-snorkeling',
    'Packing List Lengkap untuk Trip Snorkeling',
    'Checklist barang yang wajib dibawa saat trip snorkeling agar perjalanan Anda lebih nyaman dan aman.',
    '# Packing List Lengkap untuk Trip Snorkeling

Snorkeling adalah aktivitas favorit di wisata bahari. Berikut packing list lengkap agar trip Anda maksimal.

## Essentials

### Peralatan Snorkeling
- Masker snorkeling
- Snorkel (pipe)
- Fin/kaki katak
- Life jacket (biasanya disediakan)

### Pakaian
- Swimwear/baju renang
- Rashguard (untuk melindungi dari matahari)
- Baju ganti 2-3 set
- Handuk microfiber

### Perlindungan
- Sunscreen waterproof SPF 50+
- Lip balm dengan SPF
- Topi/cap
- Kacamata hitam

## Optional tapi Recommended

- Underwater camera/GoPro
- Waterproof phone case
- Anti-seasickness pills
- Dry bag untuk barang berharga

## Tips Pro

1. **Jangan bawa perhiasan** - Bisa hilang saat berenang
2. **Pack light** - Semakin ringan semakin baik
3. **Waterproof everything** - Air laut ada di mana-mana

Happy snorkeling! 🤿',
    '/images/blog/snorkeling-packing.jpg',
    'packing-list',
    ARRAY['snorkeling', 'packing-list', 'diving', 'underwater'],
    author_user_id,
    'published',
    '2024-01-10T08:00:00Z'::timestamptz,
    890,
    4,
    'Packing List Lengkap untuk Trip Snorkeling | Blog Aero Travel',
    'Checklist barang yang wajib dibawa saat trip snorkeling agar perjalanan Anda lebih nyaman dan aman.'
  )
  ON CONFLICT (branch_id, slug) DO NOTHING;

  RAISE NOTICE 'Blog articles seeded successfully!';
END $$;

