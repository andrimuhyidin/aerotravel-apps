-- Seed Destinations
-- Migrates sample destinations to database
-- Run this after migration 20260103000014_destinations.sql

DO $$
DECLARE
  default_branch_id UUID;
BEGIN
  -- Get first active branch
  SELECT id INTO default_branch_id
  FROM branches
  WHERE is_active = true
  AND deleted_at IS NULL
  LIMIT 1;

  -- If no branch found, skip seeding
  IF default_branch_id IS NULL THEN
    RAISE NOTICE 'No active branch found. Skipping destinations seed.';
    RETURN;
  END IF;

  -- Insert sample destinations
  INSERT INTO destinations (
    branch_id,
    slug,
    name,
    province,
    description,
    long_description,
    featured_image,
    gallery,
    highlights,
    best_time,
    weather_info,
    coordinates,
    attractions,
    tips,
    faqs,
    meta_title,
    meta_description
  ) VALUES
  (
    default_branch_id,
    'pahawang',
    'Pulau Pahawang',
    'Lampung',
    'Surga snorkeling dengan air laut jernih dan terumbu karang indah. Destinasi favorit untuk island hopping dan wisata bahari.',
    'Pulau Pahawang adalah destinasi wisata bahari yang terletak di Teluk Lampung. Dikenal dengan airnya yang jernih dan terumbu karang yang indah, Pahawang menjadi surga bagi para pecinta snorkeling dan diving.

Pulau ini terdiri dari dua pulau utama: Pahawang Besar dan Pahawang Kecil. Keduanya menawarkan pemandangan bawah laut yang menakjubkan dengan berbagai jenis ikan tropis dan terumbu karang yang masih terjaga.

Selain snorkeling, Anda juga bisa menikmati island hopping ke pulau-pulau kecil di sekitarnya, seperti Pulau Kelagian dan Pulau Tegal Mas. Setiap pulau memiliki keunikan tersendiri yang sayang untuk dilewatkan.',
    '/images/destinations/pahawang-hero.jpg',
    ARRAY['/images/destinations/pahawang-1.jpg', '/images/destinations/pahawang-2.jpg', '/images/destinations/pahawang-3.jpg'],
    ARRAY['Snorkeling dengan visibilitas hingga 15 meter', 'Terumbu karang yang masih terjaga', 'Island hopping ke 5+ pulau kecil', 'Sunset view yang menakjubkan', 'Spot foto Instagram-able'],
    'April - Oktober (musim kemarau)',
    '{"drySeasonStart": "April", "drySeasonEnd": "Oktober", "wetSeasonStart": "November", "wetSeasonEnd": "Maret", "avgTemperature": "26-32°C"}'::jsonb,
    '{"lat": -5.732, "lng": 105.189}'::jsonb,
    '[
      {"name": "Spot Snorkeling Pahawang Besar", "description": "Area snorkeling dengan terumbu karang terbaik dan ikan-ikan tropis yang beragam", "type": "snorkeling"},
      {"name": "Pulau Kelagian", "description": "Pulau kecil dengan pasir putih dan spot foto yang Instagramable", "type": "island"},
      {"name": "Pulau Tegal Mas", "description": "Pulau dengan air laut yang sangat jernih, cocok untuk snorkeling", "type": "island"}
    ]'::jsonb,
    ARRAY['Bawa sunscreen SPF 50+ untuk perlindungan maksimal', 'Gunakan rashguard untuk melindungi kulit dari sinar matahari', 'Jangan sentuh terumbu karang saat snorkeling', 'Bawa kamera underwater untuk dokumentasi', 'Pesan paket trip jauh-jauh hari untuk harga terbaik'],
    '[
      {"question": "Kapan waktu terbaik mengunjungi Pahawang?", "answer": "Waktu terbaik adalah April-Oktober saat musim kemarau. Laut lebih tenang dan cuaca cerah."},
      {"question": "Apakah peralatan snorkeling disediakan?", "answer": "Ya, sebagian besar paket trip sudah termasuk peralatan snorkeling (masker, snorkel, fin, dan life jacket)."},
      {"question": "Berapa lama perjalanan dari Bandar Lampung?", "answer": "Sekitar 1 jam perjalanan darat dari Bandar Lampung ke pelabuhan, dilanjutkan 30-45 menit perjalanan laut."}
    ]'::jsonb,
    'Pulau Pahawang - Surga Snorkeling Lampung | Aero Travel',
    'Surga snorkeling dengan air laut jernih dan terumbu karang indah. Destinasi favorit untuk island hopping dan wisata bahari.'
  ),
  (
    default_branch_id,
    'kiluan',
    'Teluk Kiluan',
    'Lampung',
    'Spot terbaik untuk melihat lumba-lumba di habitat aslinya. Teluk indah dengan pemandangan bukit hijau dan laut biru.',
    'Teluk Kiluan adalah destinasi wisata yang terkenal dengan dolphin watching. Setiap pagi, ratusan lumba-lumba muncul di perairan teluk untuk berburu ikan.

Selain dolphin watching, Teluk Kiluan juga menawarkan keindahan alam yang luar biasa. Dikelilingi oleh bukit-bukit hijau, teluk ini memiliki pantai dengan pasir putih dan air laut yang jernih.

Untuk pengalaman yang lebih adventurous, Anda bisa mendaki Bukit Kiluan untuk menikmati sunset dan pemandangan teluk dari ketinggian.',
    '/images/destinations/kiluan-hero.jpg',
    ARRAY['/images/destinations/kiluan-1.jpg', '/images/destinations/kiluan-2.jpg'],
    ARRAY['Dolphin watching dengan 90% success rate', 'Snorkeling di spot tersembunyi', 'Sunset view dari Bukit Kiluan', 'Pantai pasir putih yang bersih', 'Spot tracking lumba-lumba'],
    'April - September (musim lumba-lumba)',
    '{"drySeasonStart": "April", "drySeasonEnd": "Oktober", "wetSeasonStart": "November", "wetSeasonEnd": "Maret", "avgTemperature": "24-31°C"}'::jsonb,
    '{"lat": -5.693, "lng": 104.694}'::jsonb,
    '[
      {"name": "Dolphin Watching Point", "description": "Spot terbaik untuk melihat lumba-lumba, waktu terbaik: 06:00-09:00", "type": "activity"},
      {"name": "Pantai Kiluan", "description": "Pantai dengan pasir putih dan air laut yang jernih", "type": "beach"},
      {"name": "Bukit Kiluan", "description": "Spot sunset terbaik dengan view teluk dari ketinggian", "type": "activity"}
    ]'::jsonb,
    ARRAY['Berangkat pagi-pagi untuk dolphin watching (06:00-07:00)', 'Bawa jaket karena angin laut di pagi hari cukup dingin', 'Jangan berenang terlalu dekat dengan lumba-lumba', 'Naik ke Bukit Kiluan untuk sunset view yang epic', 'Bawa power bank karena spot foto banyak'],
    '[
      {"question": "Apakah dijamin bisa melihat lumba-lumba?", "answer": "Success rate sekitar 90% terutama di musim kemarau. Lumba-lumba muncul untuk berburu ikan di pagi hari."},
      {"question": "Apakah bisa berenang dengan lumba-lumba?", "answer": "Tidak disarankan untuk berenang langsung dengan lumba-lumba demi keselamatan dan konservasi satwa."}
    ]'::jsonb,
    'Teluk Kiluan - Dolphin Watching Lampung | Aero Travel',
    'Spot terbaik untuk melihat lumba-lumba di habitat aslinya. Teluk indah dengan pemandangan bukit hijau dan laut biru.'
  )
  ON CONFLICT (branch_id, slug) DO NOTHING;

  RAISE NOTICE 'Destinations seeded successfully!';
END $$;

