/**
 * Seed Legal Pages
 * Migrate existing hardcoded legal page content to database
 */

-- Terms and Conditions
INSERT INTO legal_pages (page_type, title, content_html, is_active) VALUES
('terms', 'Syarat dan Ketentuan', 
'<div class="prose prose-sm max-w-none">
  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">1. Definisi</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li><strong>"Aero Travel"</strong> adalah penyedia jasa perjalanan wisata bahari</li>
      <li><strong>"Pelanggan"</strong> adalah pengguna yang memesan layanan</li>
      <li><strong>"Guide"</strong> adalah pemandu wisata yang terdaftar dan terverifikasi</li>
      <li><strong>"Trip"</strong> adalah perjalanan wisata yang disediakan oleh Aero Travel</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">2. Pemesanan & Pembayaran</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Pemesanan dianggap sah setelah pembayaran DP minimal 50%</li>
      <li>Pelunasan maksimal H-3 sebelum keberangkatan</li>
      <li>Pembatalan akan dikenakan biaya sesuai kebijakan</li>
      <li>Pembayaran dapat dilakukan melalui transfer bank atau metode pembayaran yang tersedia</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">3. Kebijakan Pembatalan</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>H-7 atau lebih: Refund 75%</li>
      <li>H-3 s/d H-6: Refund 50%</li>
      <li>H-1 s/d H-2: Refund 25%</li>
      <li>Hari-H: Tidak ada refund</li>
      <li>Pembatalan oleh Aero Travel karena force majeure akan mendapatkan refund penuh atau penjadwalan ulang</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">4. Keselamatan</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Peserta wajib mengikuti instruksi guide dan petugas keselamatan</li>
      <li>Peserta bertanggung jawab atas keselamatan pribadi</li>
      <li>Aero Travel menyediakan asuransi perjalanan dasar</li>
      <li>Peserta dengan kondisi medis tertentu wajib memberitahu sebelum keberangkatan</li>
      <li>Peserta di bawah umur harus didampingi oleh orang tua atau wali</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">5. Force Majeure</h3>
    <p class="mb-3 text-sm text-muted-foreground">Aero Travel tidak bertanggung jawab atas pembatalan akibat:</p>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Cuaca buruk / bencana alam</li>
      <li>Kebijakan pemerintah</li>
      <li>Kondisi darurat lainnya</li>
      <li>Pandemi atau wabah penyakit</li>
      <li>Perang, kerusuhan, atau konflik</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">6. Persetujuan Data</h3>
    <p class="mb-3 text-sm text-muted-foreground">Dengan menyetujui, Anda mengizinkan Aero Travel untuk:</p>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Menyimpan data pribadi untuk keperluan pemesanan</li>
      <li>Menghubungi via WhatsApp/Email untuk informasi trip</li>
      <li>Menggunakan foto perjalanan untuk keperluan promosi</li>
      <li>Menggunakan data untuk keperluan analitik dan peningkatan layanan</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">7. Ketentuan untuk Guide</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Guide wajib memiliki sertifikat dan dokumen yang diperlukan</li>
      <li>Guide bertanggung jawab atas keselamatan peserta selama trip</li>
      <li>Guide wajib mengikuti SOP dan prosedur keselamatan yang ditetapkan</li>
      <li>Guide wajib melaporkan insiden atau kejadian yang terjadi selama trip</li>
      <li>Pembayaran guide akan dilakukan sesuai dengan perjanjian yang telah disepakati</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">8. Hak Kekayaan Intelektual</h3>
    <ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
      <li>Semua konten, logo, dan materi di website dan aplikasi Aero Travel adalah milik Aero Travel</li>
      <li>Penggunaan konten tanpa izin akan ditindak sesuai hukum yang berlaku</li>
    </ul>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">9. Perubahan Ketentuan</h3>
    <p class="text-sm text-muted-foreground">Aero Travel berhak mengubah syarat dan ketentuan ini kapan saja tanpa pemberitahuan sebelumnya. Perubahan akan berlaku efektif setelah dipublikasikan di website atau aplikasi. Penggunaan layanan setelah perubahan berarti Anda menyetujui ketentuan yang baru.</p>
  </section>

  <section class="mb-8">
    <h3 class="mb-3 text-base font-semibold">10. Hukum yang Berlaku</h3>
    <p class="text-sm text-muted-foreground">Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan melalui musyawarah, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.</p>
  </section>
</div>', 
true)
ON CONFLICT (page_type) DO UPDATE SET
  title = EXCLUDED.title,
  content_html = EXCLUDED.content_html,
  last_updated = NOW(),
  updated_at = NOW();

-- Privacy Policy
INSERT INTO legal_pages (page_type, title, content_html, is_active) VALUES
('privacy', 'Kebijakan Privasi',
'<div class="space-y-4">
  <div>
    <h2 class="mb-2 text-sm font-semibold">1. Pengenalan</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kebijakan Privasi ini menjelaskan bagaimana Aero Travel ("kami", "kita", atau "perusahaan") mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda ketika Anda menggunakan aplikasi Guide App dan layanan terkait.</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">2. Informasi yang Kami Kumpulkan</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami dapat mengumpulkan informasi berikut:
- Informasi Pribadi: nama lengkap, email, nomor telepon, alamat
- Informasi Profil: foto profil, NIK, informasi bank untuk pembayaran
- Data Lokasi: koordinat GPS saat menggunakan fitur attendance dan tracking
- Data Trip: informasi tentang trip yang ditugaskan, manifest penumpang, dokumentasi
- Data Teknis: alamat IP, jenis perangkat, sistem operasi, versi aplikasi</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">3. Bagaimana Kami Menggunakan Informasi</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami menggunakan informasi yang dikumpulkan untuk:
- Menyediakan dan mengelola layanan Guide App
- Memproses pembayaran gaji dan pendapatan
- Melacak kehadiran dan lokasi untuk keamanan
- Mengelola manifest penumpang dan dokumentasi trip
- Mengirim notifikasi penting tentang trip dan pembaruan
- Meningkatkan kualitas layanan dan pengalaman pengguna</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">4. Perlindungan Data</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran. Data disimpan di server yang aman dan dienkripsi.</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">5. Pembagian Data</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami dapat membagikan data hanya dalam situasi berikut:
- Dengan persetujuan Anda
- Untuk mematuhi kewajiban hukum
- Dengan vendor layanan yang membantu operasional (dengan perjanjian kerahasiaan)
- Dalam keadaan darurat untuk keselamatan</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">6. Hak Anda</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Anda memiliki hak untuk:
- Mengakses data pribadi Anda
- Memperbaiki data yang tidak akurat
- Meminta penghapusan data
- Menolak pemrosesan data tertentu
- Portabilitas data</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">7. Retensi Data</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami menyimpan data pribadi Anda selama diperlukan untuk tujuan yang dijelaskan dalam kebijakan ini, atau sesuai dengan persyaratan hukum. Data dapat dihapus setelah periode retensi yang berlaku.</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">8. Perubahan Kebijakan</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan melalui aplikasi atau email. Kami menyarankan Anda untuk meninjau kebijakan ini secara berkala.</p>
  </div>

  <div>
    <h2 class="mb-2 text-sm font-semibold">9. Kontak</h2>
    <p class="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
- Email: privacy@aerotravel.co.id
- Telepon: +62 812 3456 7890
- Alamat: Bandar Lampung, Indonesia</p>
  </div>
</div>',
true)
ON CONFLICT (page_type) DO UPDATE SET
  title = EXCLUDED.title,
  content_html = EXCLUDED.content_html,
  last_updated = NOW(),
  updated_at = NOW();

-- DPO Page (simplified, main content will be in settings)
INSERT INTO legal_pages (page_type, title, content_html, is_active) VALUES
('dpo', 'Data Protection Officer',
'<div>
  <p class="mx-auto max-w-2xl text-muted-foreground">Sesuai dengan UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi, kami menunjuk DPO untuk menangani pertanyaan terkait privasi dan perlindungan data.</p>
</div>',
true)
ON CONFLICT (page_type) DO UPDATE SET
  title = EXCLUDED.title,
  content_html = EXCLUDED.content_html,
  last_updated = NOW(),
  updated_at = NOW();

