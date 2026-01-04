/**
 * Seed FAQs
 * Migrate existing hardcoded FAQs to database
 */

-- Guide App FAQs
INSERT INTO faqs (app_type, category, question, answer, display_order, is_active) VALUES
('guide', 'general', 'Bagaimana cara melakukan check-in attendance?', 'Buka halaman Attendance, pastikan GPS aktif dan Anda berada dalam radius meeting point. Klik tombol "Check-In Sekarang" dan tunggu konfirmasi.', 1, true),
('guide', 'general', 'Bagaimana cara melihat manifest penumpang?', 'Buka halaman Manifest dari dashboard atau menu. Di sana Anda dapat melihat daftar penumpang, menandai status boarding/kembali, dan mengunggah link dokumentasi.', 2, true),
('guide', 'general', 'Bagaimana cara mencatat pengeluaran trip?', 'Masuk ke detail trip, lalu pilih menu "Pengeluaran". Tambahkan item pengeluaran dengan foto bukti, kemudian simpan. Pengeluaran akan direview oleh admin.', 3, true),
('guide', 'general', 'Kapan gaji akan dibayarkan?', 'Gaji dan pendapatan trip biasanya dibayarkan setiap akhir bulan atau sesuai jadwal yang telah ditentukan. Anda dapat melihat detail di halaman Wallet.', 4, true),
('guide', 'general', 'Bagaimana cara menggunakan fitur SOS?', 'Fitur SOS digunakan dalam keadaan darurat. Tekan dan tahan tombol SOS selama 3 detik untuk mengirimkan alert ke tim operasional.', 5, true),
('guide', 'general', 'Bagaimana cara mengubah status ketersediaan?', 'Buka halaman Dashboard, klik pada status availability saat ini, pilih status baru (Available/Busy/Offline) atau buka halaman "Atur Ketersediaan" untuk pengaturan lebih lanjut.', 6, true);

-- Package FAQs (global, not package-specific)
INSERT INTO faqs (app_type, category, question, answer, display_order, is_active) VALUES
('package', 'payment', 'Bagaimana cara melakukan pembayaran?', 'Pembayaran dapat dilakukan melalui transfer bank, kartu kredit, atau e-wallet. Setelah booking dikonfirmasi, Anda akan menerima invoice dengan instruksi pembayaran lengkap.', 1, true),
('package', 'itinerary', 'Apakah bisa request perubahan itinerary?', 'Perubahan itinerary dimungkinkan dengan persetujuan guide dan dapat dikenakan biaya tambahan tergantung jenis perubahan yang diminta. Harap menghubungi kami minimal 7 hari sebelum keberangkatan.', 2, true),
('package', 'documents', 'Dokumen apa saja yang perlu disiapkan?', 'Dokumen wajib: KTP/Paspor yang masih berlaku, bukti pembayaran, dan voucher trip. Untuk destinasi tertentu mungkin diperlukan dokumen tambahan seperti surat keterangan sehat atau vaksinasi.', 3, true),
('package', 'cancellation', 'Bagaimana kebijakan pembatalan trip?', 'Pembatalan 30+ hari sebelum keberangkatan: refund 100%. Pembatalan 15-29 hari: refund 50%. Pembatalan <14 hari: tidak ada refund. Untuk kondisi force majeure akan ditinjau case by case.', 4, true),
('package', 'payment', 'Apakah harga sudah termasuk asuransi perjalanan?', 'Harga paket belum termasuk asuransi perjalanan. Kami sangat merekomendasikan untuk mengambil asuransi perjalanan untuk keamanan dan kenyamanan Anda.', 5, true),
('package', 'general', 'Berapa minimal peserta untuk trip ini?', 'Minimal peserta untuk private trip adalah 2 pax. Untuk open trip, minimal kuota adalah 10 pax. Jika kuota tidak terpenuhi, trip dapat dibatalkan atau dijadwalkan ulang.', 6, true),
('package', 'itinerary', 'Apakah tersedia pilihan upgrade hotel atau kendaraan?', 'Ya, upgrade tersedia dengan biaya tambahan. Silakan menghubungi kami untuk pilihan upgrade dan informasi harga.', 7, true),
('package', 'cancellation', 'Bagaimana jika ada perubahan jadwal dari pihak operator?', 'Jika terjadi perubahan dari pihak kami, Anda akan diberitahu minimal 7 hari sebelumnya. Anda berhak untuk reschedule tanpa biaya atau full refund.', 8, true);

