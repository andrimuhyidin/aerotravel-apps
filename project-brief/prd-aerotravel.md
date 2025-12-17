# **PRODUCT REQUIREMENT DOCUMENT (PRD)**

| Informasi Dokumen | Detail |
| :---- | :---- |
| **Project Code** | AERO-ERP-2025 |
| **Nama Aplikasi** | MyAeroTravel ID (Integrated Travel Ecosystem) |
| **Tipe Sistem** | Enterprise Resource Planning (ERP) & Super App (PWA) |
| **Versi Dokumen** | 3.0 (Expanded Master Revision \- Strategic Baseline) |
| **Tanggal Efektif** | 16 Desember 2025 |
| **Pemilik Produk** | PT Aero Travel Indonesia & PT Elang Samudera Utama |
| **Status** | **APPROVED FOR DEVELOPMENT** |

## 

## **DAFTAR ISI**

[DAFTAR ISI	2](#heading=)

[**1\. EXECUTIVE SUMMARY & OBJECTIVES	6**](#1.-executive-summary-&-objectives)

[1.1 Latar Belakang & Urgensi Masalah	6](#1.1-latar-belakang-&-urgensi-masalah)

[1.2 Visi Produk	6](#1.2-visi-produk)

[1.3 Filosofi Bisnis Utama: "The Twin Engines \+ AI Brain"	7](#1.3-filosofi-bisnis-utama:-"the-twin-engines-+-ai-brain")

[1.4 Tujuan Strategis (Strategic Objectives)	7](#1.4-tujuan-strategis-\(strategic-objectives\))

[A. Digital Governance (System-as-Law)	7](#a.-digital-governance-\(system-as-law\))

[B. Operational Excellence & Scalability	8](#b.-operational-excellence-&-scalability)

[C. Viral Growth & Hyper-Efficiency	8](#c.-viral-growth-&-hyper-efficiency)

[D. World-Class Safety Standard	8](#d.-world-class-safety-standard)

[1.5 Key Performance Indicators (KPI) Keberhasilan Sistem	8](#1.5-key-performance-indicators-\(kpi\)-keberhasilan-sistem)

[**2\. ARSITEKTUR SISTEM (SYSTEM ARCHITECTURE)	10**](#2.-arsitektur-sistem-\(system-architecture\))

[2.1 Filosofi Arsitektur	10](#2.1-filosofi-arsitektur)

[2.2 Modern Tech Stack & Decision Matrix	10](#2.2-modern-tech-stack-&-decision-matrix)

[A. CORE APPLICATION LAYER (Fondasi Aplikasi)	10](#a.-core-application-layer-\(fondasi-aplikasi\))

[B. DATA & INTELLIGENCE LAYER (Otak & Memori)	11](#b.-data-&-intelligence-layer-\(otak-&-memori\))

[C. INFRASTRUCTURE & INTEGRATION (Jalur Komunikasi)	12](#c.-infrastructure-&-integration-\(jalur-komunikasi\))

[D. SYSTEM SUPPORT & DEVOPS (Kesehatan Sistem)	13](#d.-system-support-&-devops-\(kesehatan-sistem\))

[E. ANALYTICS & EXPERIMENTATION (Pertumbuhan & Kontrol)	14](#e.-analytics-&-experimentation-\(pertumbuhan-&-kontrol\))

[F. UTILITIES & BUSINESS SUPPORT (Pendukung Operasional)	15](#f.-utilities-&-business-support-\(pendukung-operasional\))

[2.3 Strategi Pengembangan Lokal (Local Development)	15](#2.3-strategi-pengembangan-lokal-\(local-development\))

[2.4 Data Flow & Integration Strategy	16](#2.4-data-flow-&-integration-strategy)

[2.5 Keamanan & Skalabilitas	16](#2.5-keamanan-&-skalabilitas)

[2.6 Estimasi Biaya & Trade-Off	16](#2.6-estimasi-biaya-&-trade-off)

[A. Estimasi Biaya Operasional (Cloud Cost)	16](#a.-estimasi-biaya-operasional-\(cloud-cost\))

[B. Trade-off Kunci	17](#b.-trade-off-kunci)

[2.7 System Context Diagram	17](#2.7-system-context-diagram)

[2.8 STRUKTUR DOMAIN & ROUTING	19](#2.8-struktur-domain-&-routing)

[A. Peta URL (Routing Map)	19](#heading=)

[B. Logika Middleware (Routing Guard)	20](#heading=)

[2.9 SKALABILITAS & KEAMANAN (SCALABILITY STRATEGY)	20](#2.9-skalabilitas-&-keamanan-\(scalability-strategy\))

[A. Multi-Branch Architecture (Ready for Expansion)	20](#heading=)

[B. Global Localization Strategy (Timezone & Currency)	20](#heading=)

[C. Database Scaling (Connection Pooling)	20](#heading=)

[D. Row Level Security (RLS)	21](#heading=)

[E. Offline-First Architecture (Guide App)	21](#e.-offline-first-architecture-\(guide-app\))

[**3\. USER PERSONAS & ACCESS CONTROL	22**](#3.-user-personas-&-access-control)

[3.1 STRATEGI PENGELOLAAN IDENTITAS (IDENTITY STRATEGY)	22](#heading=)

[A. Filosofi Hak Akses	22](#heading=)

[B. Mekanisme Keamanan	22](#heading=)

[3.2 PROFIL PENGGUNA DETIL (USER PERSONAS)	22](#heading=)

[KELOMPOK 1: STRATEGIC & CONTROL (Manajemen Puncak)	22](#heading=)

[1\. SUPER ADMIN (OWNER / DIREKTUR UTAMA)	22](#heading=)

[2\. INVESTOR / KOMISARIS (STAKEHOLDER)	23](#heading=)

[3\. FINANCE MANAGER	23](#heading=)

[KELOMPOK 2: OPERATIONAL TWIN ENGINES (Pelaksana)	23](#heading=)

[4\. MARKETING & CS (AERO ENGINE)	23](#heading=)

[5\. ADMIN OPERASIONAL (ELANG ENGINE)	23](#heading=)

[6\. TOUR GUIDE (FIELD OPS)	24](#heading=)

[KELOMPOK 3: EXTERNAL USERS (Pihak Luar)	24](#heading=)

[7\. MITRA / AGENT (B2B PARTNER)	24](#heading=)

[8\. CUSTOMER (PUBLIC B2C)	24](#heading=)

[9\. CORPORATE CLIENT (B2B ENTERPRISE)	24](#heading=)

[3.3 MATRIX AKSES (CRUD PERMISSION)	24](#heading=)

[3.4 SEGREGATION OF DUTIES (PENCEGAHAN FRAUD)	25](#heading=)

[3.5 PRIVACY & DATA MASKING	26](#3.5-privacy-&-data-masking)

[**4\. FUNCTIONAL REQUIREMENTS (CORE MODULES)	27**](#4.-functional-requirements-\(core-modules\))

[4.1 MODUL TATA KELOLA & HR (GOVERNANCE GATEKEEPER)	27](#heading=)

[A. E-Contract & Legal Consent Enforcement	27](#heading=)

[B. Authority Matrix (Jenjang Wewenang Keuangan)	27](#heading=)

[C. GPS Attendance & Auto-Penalty (SOP Guide)	28](#heading=)

[4.2 MODUL PRODUK & HARGA (COMMERCIAL ENGINE)	28](#heading=)

[A. Tiered Pricing Engine & Child Policy	28](#heading=)

[B. Dynamic Seasonality	28](#heading=)

[C. Dual Pricing Display	29](#heading=)

[4.3 MODUL PENJUALAN & BOOKING (FRONT OFFICE)	29](#heading=)

[A. Smart Booking Wizard & Tax Logic	29](#heading=)

[B. Mitra Portal (B2B Ecosystem)	29](#heading=)

[C. Payment Gateway & Auto-Verification	30](#heading=)

[4.4 MODUL OPERASIONAL (ELANG SAMUDERA \- BACK OFFICE)	30](#heading=)

[A. Resource Scheduler & Maintenance Blocker	30](#heading=)

[B. Trip Merging (Konsolidasi Open Trip)	30](#heading=)

[C. Vendor & Inventory Management	30](#heading=)

[4.5 MODUL KEUANGAN (FINANCE CONTROL)	31](#heading=)

[A. Shadow P\&L (Laba Rugi Per Trip)	31](#heading=)

[B. Payroll Gatekeeper (SOP Kunci Gaji)	31](#heading=)

[C. Auto-Refund Calculator	31](#c.-auto-refund-calculator)

[4.6 MODUL CORPORATE PORTAL (B2B ENTERPRISE)	31](#4.6-modul-corporate-portal-\(b2b-enterprise\))

[4.7 MODUL COMPLAINT & TICKETING (CS SUPPORT)	32](#4.7-modul-complaint-&-ticketing-\(cs-support\))

[**5\. FUNCTIONAL REQUIREMENTS (GROWTH & INNOVATION)	33**](#5.-functional-requirements-\(growth-&-innovation\))

[5.1 MODUL SOCIAL COMMERCE (VIRAL ENGINE)	33](#heading=)

[A. Split Bill (Patungan Digital)	33](#heading=)

[B. Travel Circle (Arisan/Tabungan Bersama)	33](#heading=)

[C. KOL / Influencer Trip	34](#heading=)

[5.2 MODUL AI & AUTOMATION (SMART LAYER)	34](#heading=)

[A. AeroBot (AI Concierge)	34](#heading=)

[B. Vision AI (Auto-Verify Payment)	34](#heading=)

[C. AI Content Spinner (SEO Generator)	35](#heading=)

[5.3 MODUL MARKETING & LOYALTY (RETENTION ENGINE)	35](#heading=)

[A. Programmatic SEO Architecture	35](#heading=)

[B. Loyalty System (AeroPoints & Referral)	35](#heading=)

[C. Social Proof Gating	35](#c.-social-proof-gating)

[5.4 INTERACTIVE GUIDE EXPERIENCE (UBER-LIKE VIEW)	36](#5.4-interactive-guide-experience-\(uber-like-view\))

[**6\. FUNCTIONAL REQUIREMENTS (SAFETY & COMPLIANCE)	37**](#6.-functional-requirements-\(safety-&-compliance\))

[6.1 MODUL KESELAMATAN & RESPON DARURAT (SAFETY MANAGEMENT SYSTEM)	37](#heading=)

[A. Panic Button (SOS Alert System)	37](#heading=)

[B. Auto-Insurance Manifest (Otomasi Asuransi)	37](#heading=)

[C. Live Tracking (Posisi Armada)	38](#heading=)

[6.2 MODUL KEPATUHAN DATA & HUKUM (LEGAL & PRIVACY)	38](#heading=)

[A. Auto-Retention Policy (Penghapusan Data Otomatis)	38](#heading=)

[B. Data Masking (Privacy Shield untuk Mitra)	38](#heading=)

[C. Digital Liability Waiver (Pelepasan Tuntutan)	39](#heading=)

[6.3 MODUL KESEHATAN ASET (ASSET COMPLIANCE)	39](#heading=)

[A. Maintenance Blocker	39](#heading=)

[B. Inventory Audit (Logistik)	39](#b.-inventory-audit-\(logistik\))

[**7\. DEVELOPMENT ROADMAP (PHASING)	40**](#7.-development-roadmap-\(phasing\))

[7.1 STRATEGI RILIS (PHASING STRATEGY)	40](#heading=)

[7.2 DETIL RENCANA KERJA (SPRINT PLAN)	40](#heading=)

[FASE 1: THE CORE FOUNDATION (Internal Stability)	40](#heading=)

[Bulan 1: Infrastruktur & Governance	40](#heading=)

[Bulan 2: Operasional Kantor & Keuangan	41](#heading=)

[FASE 2: THE FIELD & PARTNER ECOSYSTEM (Operational Efficiency)	41](#heading=)

[Bulan 3: Aplikasi Lapangan (Guide App)	41](#heading=)

[Bulan 4: Portal Mitra (B2B)	41](#heading=)

[FASE 3: THE GROWTH & AI REVOLUTION (Revenue Booster)	42](#heading=)

[Bulan 5: Customer App & Payment	42](#heading=)

[Bulan 6: AI & Automation	42](#heading=)

[7.3 ALOKASI SUMBER DAYA (RESOURCE PLAN)	42](#heading=)

[7.4 MANAJEMEN RISIKO RILIS (ROLLOUT PLAN)	43](#heading=)

[7.5 MAINTENANCE & SUPPORT (POST-LAUNCH)	43](#7.5-maintenance-&-support-\(post-launch\))

[**8\. ACCEPTANCE CRITERIA & LEMBAR PERSETUJUAN	44**](#8.-acceptance-criteria-&-lembar-persetujuan)

[8.1 KRITERIA PENERIMAAN SISTEM (USER ACCEPTANCE CRITERIA)	44](#heading=)

[A. Kriteria Fungsional (Functional Success)	44](#heading=)

[B. Kriteria Kualitas & Performa (Non-Functional Success)	44](#heading=)

[C. Kriteria Operasional (Operational Success)	44](#heading=)

[8.2 PROSEDUR PENGUJIAN (TESTING PROCEDURE)	45](#heading=)

[8.3 LEMBAR PERSETUJUAN (PROJECT SIGN-OFF)	45](#8.3-lembar-persetujuan-\(project-sign-off\))

# **1\. EXECUTIVE SUMMARY & OBJECTIVES** {#1.-executive-summary-&-objectives}

## **1.1 Latar Belakang & Urgensi Masalah** {#1.1-latar-belakang-&-urgensi-masalah}

Saat ini, PT Aero Travel Indonesia (Aero) dan PT Elang Samudera Utama (Elang) berada di titik infleksi pertumbuhan yang krusial. Namun, skalabilitas bisnis terhambat oleh operasional yang masih dijalankan menggunakan metode konvensional dan terfragmentasi. Ketergantungan pada pencatatan manual (Excel/Buku Tulis) dan komunikasi via WhatsApp menciptakan "Silo Data" yang menimbulkan risiko bisnis nyata:

* **Data Terpisah (Siloed Data) & Discrepancy:** Penjualan dicatat di Excel Marketing, Aset Logistik di buku Admin Lapangan, dan Arus Kas di Spreadsheet Keuangan yang berbeda. Hal ini menyebabkan risiko selisih data (*data discrepancy*) yang tinggi, di mana laporan profit bisa berbeda dengan uang di bank, serta potensi kebocoran profit akibat logistik yang tidak terlacak (*untracked inventory*).  
* **Inefisiensi Operasional & Ketergantungan Manual:** Proses inti bisnis seperti pembuatan penawaran (*quotation*), pengecekan ketersediaan kapal (*availability check*), hingga rekap gaji guide masih dilakukan secara manual satu per satu. Ini tidak hanya memakan waktu (*time-consuming*), tetapi juga tidak *scalable* saat volume pesanan meningkat, serta sangat rawan terhadap kesalahan manusia (*human error*) yang dapat merusak reputasi pelayanan.  
* **SOP di Atas Kertas (Lack of Enforcement):** Aturan perusahaan—seperti denda keterlambatan guide atau kewajiban upload dokumentasi—seringkali hanya menjadi aturan tertulis yang dilanggar di lapangan. Tanpa sistem yang secara teknis "memaksa" kepatuhan, kedisiplinan tim bergantung sepenuhnya pada pengawasan manusia yang terbatas.  
* **Hilangnya Potensi Pasar (Opportunity Loss):** Belum maksimalnya pemanfaatan teknologi modern (seperti SEO Programmatic & AI Automation) mengakibatkan akuisisi pelanggan sangat bergantung pada iklan berbayar atau chat manual, menghambat pertumbuhan organik yang eksponensial.

Oleh karena itu, transformasi digital melalui proyek ini bukan sekadar opsi peningkatan teknologi, melainkan kebutuhan mendesak (*imperative*) untuk mengubah fundamental perusahaan menjadi entitas korporat yang profesional, *scalable*, dan siap menerima investasi (*investable*).

## **1.2 Visi Produk** {#1.2-visi-produk}

Membangun **MyAeroTravel ID**, sebuah ekosistem digital terpusat (*Single Source of Truth*) yang mentransformasi perusahaan dari "Agen Travel Konvensional" menjadi **"Tech-Enabled Travel Company"**.

Sistem ini dirancang sebagai **Platform End-to-End** yang menjembatani kesenjangan antara fungsi hulu (Marketing/Customer) dan hilir (Operasional Lapangan/Guide). Visi utamanya adalah menciptakan "Super App" wisata maritim yang bekerja secara *real-time*, transparan, dan otomatis, dengan karakteristik:

1. **AI-Driven:** Menggunakan kecerdasan buatan untuk efisiensi biaya operasional dan kecepatan layanan 24/7.  
2. **Social-First:** Tumbuh secara viral melalui fitur sosial antar pengguna (Split Bill/Arisan), mengubah pelanggan menjadi promotor.  
3. **Safety-Guaranteed:** Menjadikan standar keselamatan sebagai fitur baku sistem, bukan sekadar janji lisan.

## **1.3 Filosofi Bisnis Utama: "The Twin Engines \+ AI Brain"** {#1.3-filosofi-bisnis-utama:-"the-twin-engines-+-ai-brain"}

Sistem dirancang di atas struktur pondasi unik untuk mengakomodir sinergi dua entitas bisnis:

1. **Profit Center (Engine AERO):**  
   * **Fokus:** Penjualan (*Revenue Generation*), Manajemen Mitra (B2B), Customer Service, dan Marketing.  
   * **Goal:** Memaksimalkan omset penjualan, memperluas jaringan kemitraan, dan meningkatkan *Lifetime Value* (LTV) pelanggan.  
2. **Cost & Asset Center (Engine ELANG):**  
   * **Fokus:** Manajemen Aset Fisik (Kapal/Villa), Logistik (BBM/Konsumsi), SDM Lapangan, dan Pemeliharaan (*Maintenance*).  
   * **Goal:** Efisiensi biaya operasional (*Cost Efficiency*), manajemen vendor yang ketat, dan optimalisasi utilitas aset.  
3. **The Bridge (Jembatan Keuangan \- Shadow P\&L):**  
   * Sistem berfungsi sebagai jembatan otomatis yang mencatat **"Internal Transaction"** (Sewa Aset). Setiap kali Aero membuat Trip, sistem secara digital memotong biaya sewa ke Elang. Ini menghasilkan Laporan Laba Rugi (*Shadow P\&L*) yang akurat per trip secara *real-time* tanpa perlu proses transfer uang manual yang rumit setiap saat.  
4. **The AI Brain (Intelligence Layer):**  
   * Lapisan kecerdasan buatan (DeepSeek/OCR) yang bekerja sebagai "karyawan digital" di latar belakang. AI ini bertugas melayani pertanyaan customer, memverifikasi bukti pembayaran secara instan, dan mengolah data mentah menjadi wawasan keputusan bagi manajemen.

## **1.4 Tujuan Strategis (Strategic Objectives)** {#1.4-tujuan-strategis-(strategic-objectives)}

### **A. Digital Governance (System-as-Law)** {#a.-digital-governance-(system-as-law)}

Mengubah paradigma manajemen dari "Saling Percaya" menjadi "Saling Terverifikasi". Sistem menegakkan Tata Kelola Perusahaan dan SOP secara mutlak melalui logika kode program (*Code enforcement*), menghilangkan faktor "sungkan" antar karyawan.

1. *Implementasi:* Gaji Guide terkunci otomatis (*greyed out*) jika dokumentasi nihil. Pengeluaran di atas limit wewenang wajib melalui persetujuan digital Direktur.

### **B. Operational Excellence & Scalability** {#b.-operational-excellence-&-scalability}

Menghilangkan inefisiensi lapangan seperti *double-booking* kapal dan kebocoran logistik melalui manajemen inventaris yang terintegrasi. Sistem juga menyiapkan arsitektur teknis yang siap untuk ekspansi Multi-Cabang (Lampung, Bali, Labuan Bajo) tanpa perlu membangun ulang sistem dari nol.

### **C. Viral Growth & Hyper-Efficiency** {#c.-viral-growth-&-hyper-efficiency}

Mengurangi beban kerja manual administrasi hingga 70% dengan otomatisasi (AI Chatbot & OCR), memungkinkan tim fokus pada strategi. Di sisi lain, sistem menciptakan "Viral Loop" melalui fitur Social Commerce (Split Bill/Arisan) yang mendorong akuisisi pelanggan baru secara organik dan murah.

### **D. World-Class Safety Standard** {#d.-world-class-safety-standard}

Mengangkat standar keselamatan wisata laut ke level Enterprise, yang menjadi nilai jual utama dibanding kompetitor.

1. *Implementasi:* Integrasi *Panic Button* (GPS Tracking Real-time), Asuransi Otomatis (Auto-Manifest Email), dan Kepatuhan Data Privasi sesuai UU PDP.

## **1.5 Key Performance Indicators (KPI) Keberhasilan Sistem** {#1.5-key-performance-indicators-(kpi)-keberhasilan-sistem}

Sistem ini dinilai sukses jika mencapai target kuantitatif berikut pasca-peluncuran (Fase 1-3):

| Metrik | Target Capaian | Cara Pengukuran & Implikasi |
| :---- | :---- | :---- |
| **Akurasi Keuangan** | **100% (Zero Gap)** | Selisih Laporan Keuangan Sistem vs Mutasi Bank harus Rp 0\. Menghilangkan potensi *fraud* atau kesalahan pencatatan. |
| **Kecepatan Layanan** | **\< 1 Menit / \< 10 Detik** | Waktu admin membuat Quotation manual (\< 1 menit) dan waktu respons Chatbot AI menjawab customer (\< 10 detik). |
| **Efisiensi Operasional** | **100% Compliance** | Tingkat kepatuhan Guide upload foto & Admin PO Vendor mencapai 100% karena sistem mengunci proses selanjutnya jika syarat tidak terpenuhi. |
| **Akuisisi User** | **Growth \> 20% MoM** | Pertumbuhan pengguna baru (*User Acquisition*) yang berasal dari kanal organik (SEO) & Fitur Viral (Split Bill/Referral). |
| **Reliability** | **99.9% Uptime** | Sistem dan Aplikasi Guide berfungsi normal untuk input data kritis bahkan di area *blank spot* (Offline Mode), menjamin data lapangan selalu terekam. |

## 

# **2\. ARSITEKTUR SISTEM (SYSTEM ARCHITECTURE)** {#2.-arsitektur-sistem-(system-architecture)}

## **2.1 Filosofi Arsitektur** {#2.1-filosofi-arsitektur}

Kami meninggalkan pendekatan Monolith Kuno demi arsitektur yang gesit dan tangguh:

* **Serverless First:** Meminimalkan manajemen server fisik (*NoOps*) untuk mengurangi biaya *idle* dan kerumitan maintenance.  
* **Edge Native:** Logika aplikasi didistribusikan di *Edge Network* (server yang dekat dengan user) untuk latensi ultra-rendah.  
* **Offline-First:** Aplikasi lapangan (Guide App) dirancang dengan teknologi *Service Workers* agar tetap berfungsi penuh tanpa koneksi internet, dengan sinkronisasi otomatis saat online.  
* **AI-Native Cost Efficiency:** Menggunakan model AI canggih namun hemat biaya (**DeepSeek**) sebagai otak operasional, bukan sekadar fitur tambahan.  
* **Observability Driven:** Sistem dirancang untuk "bisa diamati" (*observable*) sejak hari pertama, memungkinkan deteksi masalah sebelum pengguna melaporkannya.  
* **Data Sovereignty:** Mengontrol penuh kanal komunikasi kritis (WhatsApp) melalui infrastruktur mandiri (*Self-Hosted*) untuk privasi dan efisiensi biaya.

## **2.2 Modern Tech Stack & Decision Matrix** {#2.2-modern-tech-stack-&-decision-matrix}

Berikut adalah spesifikasi teknologi lengkap yang dikategorikan berdasarkan fungsinya.

### **A. CORE APPLICATION LAYER (Fondasi Aplikasi)** {#a.-core-application-layer-(fondasi-aplikasi)}

*Teknologi utama untuk membangun antarmuka dan logika bisnis.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **Framework** | **Next.js 14 (App Router)** | Standar industri modern. Mendukung *React Server Components (RSC)* untuk performa backend di frontend dan SEO Programmatic. |
| **Language** | **TypeScript** | *Strict Mode*. Menjamin keamanan tipe data (*Type Safety*) untuk mencegah 90% bug fatal (misal: salah tipe data uang) sejak fase coding. |
| **PWA Engine** | **Serwist** | Pengganti Mobile App Native. Memungkinkan aplikasi diinstal tanpa App Store dan memiliki strategi *caching* agresif untuk sinyal laut yang buruk. |
| **Server State** | **TanStack Query (v5)** | Manajemen data API tercanggih. Menangani *caching*, *deduplication*, dan sinkronisasi data background otomatis. |
| **Client State** | **Zustand** | Manajemen state global yang ringan (kb kecil) untuk data sesi user (misal: Wizard Booking). |
| **Form & Validation** | **React Hook Form \+ Zod** | Standar validasi formulir paling efisien. Memastikan data input user bersih dan sesuai kontrak database sebelum diproses. |
| **UI System** | **Shadcn UI \+ Tailwind** | Komponen UI yang ringan, modular, *copy-paste friendly*, dan sangat mudah dikustomisasi sesuai *branding* Aero. |

### **B. DATA & INTELLIGENCE LAYER (Otak & Memori)** {#b.-data-&-intelligence-layer-(otak-&-memori)}

*Penyimpanan data dan integrasi kecerdasan buatan.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **Database** | **Supabase (PostgreSQL)** | *All-in-one Backend* (Auth, DB, Realtime, Storage). Hemat biaya DevOps dan memiliki fitur RLS (*Row Level Security*) yang kuat. |
| **Vector DB** | **pgvector (on Supabase)** | Menyimpan *embedding* dokumen SOP/Harga untuk *Knowledge Base* AeroBot (RAG). |
| **Object Storage** | **Supabase Storage** | Penyimpanan aman untuk Foto Dokumentasi & Bukti Transfer dengan fitur *Private Buckets* dan *Auto-Expiration*. |
| **AI Logic (Brain)** | **DeepSeek-V3** | **Cost Efficiency King.** LLM dengan performa setara GPT-4o namun biaya \~90% lebih murah. Sangat fasih Bahasa Indonesia untuk Chatbot. |
| **AI Vision (Eyes)** | **DeepSeek-OCR / Gemini Flash** | Model OCR canggih untuk membaca foto bukti transfer dengan akurasi tinggi terhadap dokumen miring/buram. |

### **C. INFRASTRUCTURE & INTEGRATION (Jalur Komunikasi)** {#c.-infrastructure-&-integration-(jalur-komunikasi)}

*Infrastruktur server dan komunikasi eksternal.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **Hosting** | **Vercel** | Infrastruktur global (*Edge Network*) dengan *Zero-config deployment* dan CI/CD terintegrasi. |
| **WhatsApp** | **WAHA (Docker Self-Hosted)** | **Freedom & Cost.** API WhatsApp mandiri. Memberikan kontrol penuh atas data chat, privasi, dan *unlimited messaging* tanpa biaya per pesan. |
| **Payment** | **Midtrans** | Agregator pembayaran paling stabil di Indonesia (QRIS, VA, CC, PayLater) dengan dukungan *Webhook* reliabel. |
| **Email** | **Resend** | API Email modern dengan *deliverability* tinggi (masuk Inbox) untuk pengiriman dokumen resmi (Invoice/Tiket Asuransi). |
| **DNS & Security** | **Cloudflare** | Lapisan keamanan tambahan (WAF) untuk proteksi DDoS dan manajemen DNS yang cepat. |

### **D. SYSTEM SUPPORT & DEVOPS (Kesehatan Sistem)** {#d.-system-support-&-devops-(kesehatan-sistem)}

*Alat bantu untuk menjaga sistem tetap hidup dan bebas bug.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **Monitoring** | **Sentry** | **Error Tracking.** Melacak *crash* aplikasi secara real-time lengkap dengan rekaman video sesi user (*Session Replay*) untuk debugging. |
| **Testing** | **Playwright** | **Automated QA.** Robot yang mengetes fitur Booking secara otomatis setiap kali developer update kode. Mencegah fitur *critical* rusak tanpa sadar. |
| **Logging** | **OpenTelemetry (OTEL)** | Standar industri untuk melacak performa API (*Tracing*) dan mengidentifikasi *bottleneck* sistem. |
| **Rate Limiting** | **Upstash Redis** | **Cost Guard.** Membatasi jumlah request ke API AI (misal: max 10 chat/menit per user) agar tagihan tidak meledak karena serangan bot. |

### **E. ANALYTICS & EXPERIMENTATION (Pertumbuhan & Kontrol)** {#e.-analytics-&-experimentation-(pertumbuhan-&-kontrol)}

*Alat bantu untuk mengukur keberhasilan bisnis dan mengontrol risiko rilis.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **Product Analytics** | **PostHog** | **All-in-One Analytics.** Melacak *user journey* (funnel booking), rekaman sesi, dan heatmap. |
| **Feature Flags** | **PostHog** | **Risk Control.** Memungkinkan perilisan fitur baru ke sebagian user (*Canary Release*) atau mematikan fitur error dalam 1 detik (*Kill Switch*). |
| **Web Analytics** | **Google Analytics 4 (GA4)** | **Marketing Metrics.** Standar emas untuk mengukur efektivitas kampanye iklan dan SEO traffic. |

### **F. UTILITIES & BUSINESS SUPPORT (Pendukung Operasional)** {#f.-utilities-&-business-support-(pendukung-operasional)}

*Library spesifik untuk fitur bisnis.*

| Komponen | Teknologi Pilihan | Alasan Pemilihan (The "Why") |
| :---- | :---- | :---- |
| **PDF Generator** | **@react-pdf/renderer** | Membuat E-Ticket dan Invoice PDF secara dinamis di server dengan layout profesional. |
| **Maps & GIS** | **Mapbox / Leaflet** | Visualisasi Peta Wisata dan Tracking Lokasi Guide (Panic Button). |
| **Job Scheduler** | **Supabase pg\_cron** | Menjalankan tugas otomatis: Auto-delete KTP H+30, Kirim Email Manifest, Reminder Tagihan. |
| **Timezone Mgmt** | **date-fns-tz** | Menangani perbedaan waktu (WIB/WITA) untuk ekspansi Multi-Cabang. |
| **Excel Parser** | **SheetJS (XLSX)** | Export/Import data manifest dan laporan keuangan ke format Excel. |

## **2.3 Strategi Pengembangan Lokal (Local Development)** {#2.3-strategi-pengembangan-lokal-(local-development)}

Untuk memastikan konsistensi kode antar developer dan meminimalkan masalah konfigurasi (*"It works on my machine"*), lingkungan pengembangan diwajibkan menggunakan **Docker**.

**Komponen Dockerized (docker-compose.yml):**

4. **App Container:** Next.js (Node 18 Alpine).  
5. **DB Container:** PostgreSQL \+ pgvector (Simulasi Supabase lokal).  
6. **Redis Container:** Simulasi Rate Limiting & Queue.  
7. **WA Engine Container:** Instance lokal WAHA untuk testing notifikasi WhatsApp tanpa biaya.

## **2.4 Data Flow & Integration Strategy** {#2.4-data-flow-&-integration-strategy}

**A. Strategi Offline (Guide App Flow)**

5. **Sync:** Di dermaga, aplikasi mengunduh data Trip ke **IndexedDB**.  
6. **Action:** Guide input Absensi/Ceklist di laut (Offline). UI update "Sukses" (Optimistic).  
7. **Queue:** Data disimpan di antrian lokal.  
8. **Re-Sync:** Saat sinyal kembali, data otomatis terkirim ke Supabase.

**B. Strategi AI Automation (AeroBot)**

2. **Proteksi:** Request masuk dicek oleh **Rate Limiter (Redis)**.  
3. **Reasoning:** DeepSeek-V3 menganalisis maksud user ("Cek Harga" vs "Komplain").  
4. **Retrieval:** Sistem mencari data relevan di Supabase package\_prices atau ai\_documents (SOP).  
5. **Response:** DeepSeek memformat jawaban natural \-\> Kirim via WAHA.

## **2.5 Keamanan & Skalabilitas** {#2.5-keamanan-&-skalabilitas}

**A. Multi-Tenancy (Cabang)**

* Database Level: Setiap tabel memiliki kolom branch\_id.  
* Sistem siap ekspansi ke Bali/Labuan Bajo tanpa *rewrite* database.

**B. Row Level Security (RLS)**

* Keamanan level database. Mitra A *secara fisik* dilarang membaca data Mitra B.

**C. Feature Flagging**

* Fitur berisiko (Payment, AI) dibungkus *Flag* (PostHog) agar bisa dimatikan instan jika error.

## **2.6 Estimasi Biaya & Trade-Off** {#2.6-estimasi-biaya-&-trade-off}

### **A. Estimasi Biaya Operasional (Cloud Cost)** {#a.-estimasi-biaya-operasional-(cloud-cost)}

| Item | Fase MVP (Launch) | Fase Growth | Keterangan |
| :---- | :---- | :---- | :---- |
| **Vercel** | $20/bln (Pro) | Scale by User | Wajib Pro untuk tim \> 1 orang. |
| **Supabase** | $25/bln (Pro) | Scale by Storage | Wajib Pro untuk *Daily Backup*. |
| **DeepSeek API** | \~$5/bln | \~$20/bln | Estimasi 1.000 chat CS & SEO content. |
| **WAHA (VPS)** | \~$6/bln | $10/bln | Sewa VPS murah untuk host Docker WA. |
| **Support Tools** | $0 (Free Tier) | \~$50/bln | Sentry/PostHog gratis di awal. |
| **TOTAL** | **\~$56 / bulan** | **Fleksibel** | **Rp 850rb \- 1 Juta / bulan**. Sangat efisien. |

### **B. Trade-off Kunci** {#b.-trade-off-kunci}

2. **Self-Hosted WhatsApp (WAHA):**  
   * *Untung:* Hemat jutaan rupiah, privasi penuh.  
   * *Rugi:* Butuh maintenance server Docker mandiri.  
3. **DeepSeek AI:**  
   * *Untung:* Biaya 90% lebih murah dari OpenAI dengan performa setara.  
   * *Rugi:* Server di China. (Mitigasi: Jangan kirim data PII/Sensitif seperti NIK ke AI, hanya data umum).

## **2.7 System Context Diagram** {#2.7-system-context-diagram}

graph TD  
    %% Users  
    User(\[Customer/Mitra/Guide\]) \--\> |HTTPS| Cloudflare\[Cloudflare DNS/WAF\]  
    Cloudflare \--\> CDN\[Vercel Edge Network\]  
      
    %% App Layer  
    subgraph "MyAeroTravel ID (Next.js)"  
        UI\[UI Components\]  
        Middleware\[Auth & Branch Middleware\]  
        API\[Server Actions\]  
        OTEL\[OpenTelemetry SDK\]  
        Flag\[PostHog SDK\]  
    end  
      
    CDN \--\> UI  
    UI \--\> Middleware \--\> API  
    UI \--\> Flag  
      
    %% Caching & Rate Limit  
    subgraph "Performance Layer"  
        Redis\[Upstash Redis (Rate Limit)\]  
        ISR\[ISR Cache\]  
    end  
      
    API \--\> Redis  
    CDN \--\> ISR  
      
    %% Backend Services  
    subgraph "Backend Services"  
        DB\[(Supabase PostgreSQL)\]  
        Vector\[(pgvector)\]  
        Storage\[Supabase Storage\]  
        Auth\[Supabase Auth\]  
    end  
      
    API \--\> DB & Vector & Storage & Auth  
      
    %% Third Party & AI  
    subgraph "Integrations"  
        Payment\[Midtrans\]  
        AI\_Brain\[DeepSeek API\]  
        AI\_Vision\[DeepSeek-OCR\]  
        WA\[WAHA Docker\]  
    end  
      
    API \--\> Payment  
    API \--\> AI\_Brain  
    API \--\> AI\_Vision  
    DB \--\> |Webhook| WA  
      
    %% Monitoring & Analytics  
    API \--\> |Traces/Logs| Monitor\[Sentry\]  
    UI \--\> |Events| Analytics\[PostHog/GA4\]

## **2.8 STRUKTUR DOMAIN & ROUTING** {#2.8-struktur-domain-&-routing}

Kami menetapkan strategi **Single Domain Monolith** untuk memaksimalkan *SEO Authority* dan memudahkan manajemen sesi pengguna. Penggunaan subdomain (seperti mitra.aero.id) **DILARANG** kecuali untuk keperluan teknis khusus (misal: CDN/API), agar *traffic ranking* Google terpusat di domain utama.

### **A. Peta URL (Routing Map)**

| Path URL | Peruntukan (Persona) | Sifat Halaman | Teknologi Rendering |
| :---- | :---- | :---- | :---- |
| aerotravel.co.id/ | **Public / Customer** | Halaman Marketing, Artikel. | **SSR (Server Side Rendering)** untuk SEO maksimal. |
| aerotravel.co.id/p/\[city\]/\[slug\] | **Public (SEO)** | Landing page dinamis (misal: /p/lampung/pahawang-murah). | **ISR (Incremental Static Regen)** untuk performa tinggi. |
| aerotravel.co.id/book | **Customer** | Wizard Booking & Payment. | **CSR (Client Side Rendering)** untuk interaksi cepat. |
| aerotravel.co.id/mitra | **Mitra (Agent)** | Dashboard B2B, Topup, Whitelabel. | **Protected Route** (Wajib Login). |
| aerotravel.co.id/console | **Internal (Admin/Ops)** | ERP Dashboard, Laporan Keuangan, CRM. | **Protected Route** (High Security). |
| aerotravel.co.id/guide | **Tour Guide** | Mobile View Only (Absensi, Manifest). | **PWA Mode** (Offline Capability). |
| aerotravel.co.id/api/v1/\* | **System Integration** | Endpoint untuk PWA sync dan akses pihak ketiga. | **API Routes (Edge)**. |
| aerotravel.co.id/webhooks/\* | **External Triggers** | Endpoint untuk Midtrans/WAHA callback. | **API Routes (Serverless)**. |

### **B. Logika Middleware (Routing Guard)**

Developer wajib memasang *Middleware* pada Next.js untuk memilah trafik sebelum masuk ke halaman:

8. **Cek Sesi:** Apakah user login? Jika tidak, lempar ke /login.  
9. **Cek Role:**  
   * Jika Role \= guide tapi akses /console, lempar balik ke /guide.  
   * Jika Role \= mitra tapi akses /console, lempar balik ke /mitra.  
10. **Cek Cabang (Branch Injection):** (Lihat poin 2.9).

## **2.9 SKALABILITAS & KEAMANAN (SCALABILITY STRATEGY)** {#2.9-skalabilitas-&-keamanan-(scalability-strategy)}

### **A. Multi-Branch Architecture (Ready for Expansion)**

Sistem disiapkan untuk ekspansi ke Bali (DPS), Labuan Bajo (LBJ), dst, tanpa perlu *rewrite* kode database.

6. **Database Level:** Setiap tabel transaksi (bookings, trips, expenses) dan master data (assets, packages) **WAJIB** memiliki kolom branch\_id (UUID).  
7. **Application Level (Branch Injection):**  
   * Saat user login, sistem mendeteksi branch\_id user tersebut (misal: Admin Bali).  
   * Middleware Next.js secara otomatis menyuntikkan filter WHERE branch\_id \= 'Bali' ke setiap query database yang dilakukan user tersebut.  
   * **Hasil:** Admin Bali tidak akan pernah melihat data Admin Lampung, dan sebaliknya. Super Admin (HQ) bisa melihat semua (branch\_id \= null atau *all*).

### **B. Global Localization Strategy (Timezone & Currency)**

Untuk mendukung operasional lintas waktu (WIB/WITA/WIT) dan mata uang di masa depan:

* **Timezone:** Semua waktu di database disimpan dalam format **UTC (ISO 8601\)**. Konversi ke waktu lokal (misal: "Jemput jam 07.00 WITA") dilakukan di sisi *Frontend* berdasarkan lokasi Branch.  
* **Currency:** Struktur harga mendukung multi-currency di level database, namun *default view* dikunci ke IDR untuk Fase 1\.

### **C. Database Scaling (Connection Pooling)**

Mencegah *bottleneck* koneksi database saat trafik tinggi (misal: Viral Campaign):

* **Supavisor:** Wajib menggunakan *Connection Pooler* bawaan Supabase (Mode: Transaction) pada environment Production untuk menangani ribuan koneksi simultan dari fungsi Serverless.

### **D. Row Level Security (RLS)**

Keamanan diterapkan di lapisan Database (PostgreSQL), bukan hanya di Aplikasi.

4. **Aturan:** CREATE POLICY "Mitra Isolation" ON bookings FOR SELECT USING (auth.uid() \= mitra\_id);  
5. **Dampak:** Meskipun hacker berhasil menembus API aplikasi, mereka tidak bisa melakukan *dump* data milik mitra lain karena database akan menolaknya.

### **E. Offline-First Architecture (Guide App)** {#e.-offline-first-architecture-(guide-app)}

2. **Masalah:** Sinyal di laut/pulau sering hilang.  
3. **Solusi:**  
   * **Pre-load:** Saat Guide membuka apps di dermaga (ada sinyal), data Manifest & Trip hari ini didownload ke **IndexedDB** lokal.  
   * **Queueing:** Saat Guide input absensi/foto di laut (No Signal), data masuk ke antrian lokal (*Mutation Queue*).  
   * **Auto-Sync:** Begitu HP mendapatkan sinyal kembali, antrian otomatis di-upload ke server Supabase.

# **3\. USER PERSONAS & ACCESS CONTROL** {#3.-user-personas-&-access-control}

Bagian ini mendefinisikan aktor-aktor yang terlibat dalam ekosistem MyAeroTravel ID dan hak akses mereka. Sistem menerapkan prinsip *Least Privilege* (Hanya memberikan akses yang dibutuhkan) dan *Segregation of Duties* (Pemisahan tugas kritis) untuk menjamin keamanan operasional.

## **3.1 STRATEGI PENGELOLAAN IDENTITAS (IDENTITY STRATEGY)**

### **A. Filosofi Hak Akses**

Sistem tidak hanya membedakan "Admin" dan "User", tetapi memecah peran secara granular berdasarkan fungsi bisnis:

* **Twin Engines Separation:** Tim Marketing (Aero) tidak boleh melihat dapur biaya operasional (Elang), dan Tim Ops (Elang) tidak perlu tahu omset penjualan (Aero).  
* **Data Isolation:** Mitra B2B terisolasi total satu sama lain.  
* **Governance Enforcement:** Persetujuan pengeluaran uang dipisahkan dari pengajuan pengeluaran.

### **B. Mekanisme Keamanan**

11. **Authentication:** Menggunakan Supabase Auth (Email/Password & Social Login).  
12. **Authorization:** Menggunakan RLS (*Row Level Security*) di PostgreSQL. Aturan akses ditanam di level database, bukan hanya di aplikasi.  
13. **Session Management:**  
    * *Web Admin:* Auto-logout setelah 30 menit inaktif (Security).  
    * *Mobile Guide:* Sesi bertahan 30 hari (Convenience untuk lapangan).

## **3.2 PROFIL PENGGUNA DETIL (USER PERSONAS)**

Sistem membagi pengguna menjadi **3 Kelompok Besar**: Strategic, Operational, dan External.

### **KELOMPOK 1: STRATEGIC & CONTROL (Manajemen Puncak)**

#### **1\. SUPER ADMIN (OWNER / DIREKTUR UTAMA)**

8. **Peran:** Pemilik kekuasaan tertinggi sistem.  
9. **Tujuan:** Audit kinerja bisnis secara menyeluruh dan mengambil keputusan strategis.  
10. **Hak Akses Eksklusif:**  
    * Melihat **Laporan Laba Rugi Gabungan** (Net Profit Real).  
    * Melakukan **Approval Digital** untuk transaksi \> Rp 5.000.000.  
    * Mengakses **Audit Log** (Melihat siapa yang menghapus/mengubah data).  
    * Membuka sensor data (*Unmasking*) No HP Customer Mitra dalam kondisi darurat.  
    * Manajemen User (Tambah/Hapus/Blokir Staff).

#### **2\. INVESTOR / KOMISARIS (STAKEHOLDER)**

* **Peran:** Pemilik modal pasif (Silent Partner).  
* **Tujuan:** Memantau kesehatan investasi secara transparan.  
* **Batasan Akses (VIEW ONLY):**  
  * Hanya bisa melihat Dashboard Grafik (Omset, Cost, Profit).  
  * **TIDAK BISA** menambah, mengedit, atau menghapus data apapun.  
  * **TIDAK BISA** melihat data operasional mikro (misal: Chat customer).

#### **3\. FINANCE MANAGER**

6. **Peran:** Penjaga gawang arus kas perusahaan.  
7. **Tujuan:** Memastikan setiap rupiah masuk dan keluar terekam akurat.  
8. **Hak Akses Kunci:**  
   * **Verifikasi Pembayaran:** Mengubah status Waiting Payment \-\> Paid (Manual/OCR).  
   * **Payroll Executor:** Satu-satunya role yang bisa klik tombol "Cairkan Gaji Guide".  
   * **Tax Management:** Mengatur PPN/PPH.  
   * **Rekonsiliasi:** Export data transaksi untuk dicocokkan dengan Mutasi Bank.

### **KELOMPOK 2: OPERATIONAL TWIN ENGINES (Pelaksana)**

#### **4\. MARKETING & CS (AERO ENGINE)**

2. **Peran:** Ujung tombak pendapatan (*Revenue Generator*).  
3. **Tujuan:** Mendapatkan booking sebanyak mungkin dan melayani customer.  
4. **Hak Akses:**  
   * **Booking Entry:** Membuat order baru.  
   * **Quotation:** Membuat penawaran harga.  
   * **CRM:** Melihat database pelanggan.  
5. **BATASAN KERAS (Blind Spots):**  
   * **BUT A BIAYA:** Tidak bisa melihat Gaji Guide, Harga Sewa Kapal Internal, atau HPP Logistik. (Hanya fokus pada Harga Jual).

#### **5\. ADMIN OPERASIONAL (ELANG ENGINE)**

* **Peran:** Pengelola aset dan logistik (*Cost Controller*).  
* **Tujuan:** Memastikan trip berjalan lancar dan aset terawat.  
* **Hak Akses:**  
  * **Resource Scheduler:** Mengatur jadwal Kapal & Guide.  
  * **Trip Merging:** Menggabungkan booking menjadi manifest.  
  * **Vendor PO:** Input belanja ke vendor luar.  
  * **Asset Mgmt:** Input jadwal maintenance kapal.  
* **BATASAN KERAS (Blind Spots):**  
  * **BUTA OMSET:** Tidak bisa melihat Total Nilai Transaksi Penjualan (Hanya fokus pada Kuantitas Pax dan Biaya).

#### **6\. TOUR GUIDE (FIELD OPS)**

* **Peran:** Eksekutor lapangan.  
* **Interface:** Menggunakan tampilan khusus **Mobile View (PWA)** yang sederhana.  
* **Hak Akses:**  
  * **Absensi:** Tombol Check-in/Check-out (GPS Locked).  
  * **Manifest:** Melihat daftar nama tamu hari ini.  
  * **Evidence:** Upload foto dokumentasi & struk pengeluaran darurat.  
* **Batasan:** Hanya aktif saat ada penugasan (H-1 s/d H+1 Trip). Tidak bisa akses data trip lain.

### **KELOMPOK 3: EXTERNAL USERS (Pihak Luar)**

#### **7\. MITRA / AGENT (B2B PARTNER)**

* **Peran:** Reseller paket wisata.  
* **Hak Akses:**  
  * **NTA Booking:** Melihat dan booking dengan harga modal agen.  
  * **Whitelabel:** Download invoice dengan logo sendiri.  
  * **Deposit:** Cek saldo dan riwayat pemakaian.  
* **Security:** Terisolasi total (Silo). Tidak bisa melihat bookingan Mitra lain.

#### **8\. CUSTOMER (PUBLIC B2C)**

* **Peran:** Pembeli akhir.  
* **Hak Akses:**  
  * Booking Wizard & Payment.  
  * Aksess Itinerary & Foto (Read Only).  
  * Review & Rating.

#### **9\. CORPORATE CLIENT (B2B ENTERPRISE)**

* **Peran:** HRD atau PIC Perusahaan Klien (Gathering Kantor).  
* **Tujuan:** Mengelola jatah liburan karyawan dan monitoring anggaran gathering.  
* **Hak Akses Khusus:**  
  * **Employee Allocation:** Mengalokasikan saldo/paket trip ke email karyawan.  
  * **Corporate Invoice:** Download tagihan resmi (Faktur Pajak) untuk finance kantor.  
  * **Trip Monitor:** Melihat status keberangkatan rombongan kantor.

## **3.3 MATRIX AKSES (CRUD PERMISSION)**

Tabel ini menjadi acuan developer dalam mengatur *Permission Logic* di Database & API.

| Modul Data | Super Admin | Investor | Finance | Marketing | Ops Elang | Guide | Mitra | Corporate |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Booking** | Full | View | View | **Create/Edit** | View (Pax) | View (Manifest) | Create (Own) | Create (Bulk) |
| **Payment (Verifikasi)** | Full | View | **Execute** | View | No Access | No Access | Pay Only | Pay Only |
| **Harga Jual (Publish)** | Full | View | View | View | No Access | No Access | View | View (Contract) |
| **Harga Modal (HPP)** | Full | View | View | No Access | **View** | No Access | No Access | No Access |
| **Aset (Kapal/Villa)** | Full | View | View | View (Avail) | **Create/Edit** | No Access | No Access | No Access |
| **Gaji Guide** | Full | View | **Execute** | No Access | View (Draft) | View (Own) | No Access | No Access |
| **Laporan Profit** | Full | **View** | View | No Access | No Access | No Access | No Access | No Access |
| **User Management** | **Full** | No Access | No Access | No Access | No Access | No Access | No Access | Manage Emp. |

## **3.4 SEGREGATION OF DUTIES (PENCEGAHAN FRAUD)**

Sistem secara teknis mencegah satu orang menguasai proses dari hulu ke hilir untuk menghindari kecurangan.

1. **Pemisahan Penjualan & Penerimaan Uang:**  
   * *Marketing* boleh membuat Booking, tapi tombol "Verifikasi Pembayaran" non-aktif di akun mereka.  
   * *Finance* boleh memverifikasi pembayaran, tapi tidak boleh mengedit harga paket atau membuat booking fiktif.  
2. **Pemisahan Pengajuan & Pembayaran:**  
   * *Admin Ops* boleh mengajukan belanja (misal: Beli Solar), tapi tidak bisa mencairkan uangnya sendiri di sistem.  
   * *Finance* mencairkan uang hanya jika ada pengajuan dari Ops yang sudah di-approve sistem.  
3. **Pemisahan Aset & Operasional:**  
   * *Marketing* bisa melihat ketersediaan kapal, tapi tidak bisa memblokir/mengubah jadwal maintenance kapal (Wewenang Ops).

## **3.5 PRIVACY & DATA MASKING** {#3.5-privacy-&-data-masking}

Untuk menjaga etika bisnis B2B dan keamanan data pribadi:

1. **Mitra Shield:** Saat Marketing Aero membuka data booking dari Mitra, Nomor HP dan Email Tamu Mitra akan tampil sebagai 0812-xxxx-8899 (Masked). Tombol "Unmask" hanya tersedia untuk Super Admin dengan alasan audit.  
2. **Data Retention:** Foto KTP/Paspor di tabel booking\_passengers hanya bisa diakses selama trip aktif \+ 30 hari. Setelah itu, link file akan kadaluarsa/dihapus otomatis oleh sistem, menyisakan status "Verified" saja.

# **4\. FUNCTIONAL REQUIREMENTS (CORE MODULES)** {#4.-functional-requirements-(core-modules)}

Bagian ini merinci spesifikasi fungsional untuk modul-modul inti. Setiap fitur dirancang dengan prinsip **"System-as-Law"**, di mana aturan bisnis dan SOP perusahaan ditegakkan secara otomatis oleh logika kode.

## **4.1 MODUL TATA KELOLA & HR (GOVERNANCE GATEKEEPER)**

*Fungsi: Menegakkan aturan perusahaan dan kepatuhan hukum secara otomatis sebelum operasional dimulai.*

### **A. E-Contract & Legal Consent Enforcement**

* **User Story:** "Sebagai Admin atau Guide baru, saya wajib menyetujui aturan main perusahaan secara legal sebelum diberikan akses ke data sensitif."  
* **Logika Sistem:**  
  * **Trigger Otomatis:** Saat user dengan role internal atau guide melakukan login pertama kali (*First Login*).  
  * **Status Check:** Sistem memeriksa kolom is\_contract\_signed pada tabel profiles.  
  * **UI Blocking (Overlay):**  
    * Jika status FALSE, user dialihkan paksa ke halaman /legal/sign.  
    * Semua menu navigasi (Sidebar/Header) disembunyikan. User tidak bisa keluar/navigate away.  
  * **Consent Mechanism:**  
    * User wajib membaca dokumen (Sistem mendeteksi event *scroll* hingga akhir container dokumen).  
    * User mengetikkan **Nama Lengkap** dan **NIK** sebagai tanda tangan digital.  
  * **Output:** Update status menjadi TRUE, rekam signed\_at, ip\_address, dan user\_agent di log audit. Akses menu dibuka.

### **B. Authority Matrix (Jenjang Wewenang Keuangan)**

* **User Story:** "Mencegah pengeluaran dana besar tanpa persetujuan berjenjang."  
* **Logika Workflow:**  
  * **Input:** Admin Ops/Finance membuat pengajuan dana (*Expense Request*).  
  * **Routing Approval Otomatis:**  
    * **\< Rp 500.000 (Micro):** Status langsung APPROVED. Saldo kas kecil terpotong otomatis.  
    * **Rp 500.000 \- Rp 5.000.000 (Mid):** Status PENDING\_MANAGER. Notifikasi WA dikirim ke Manager. Tombol "Approve" hanya muncul di akun Manager.  
    * **\> Rp 5.000.000 (Macro):** Status PENDING\_DIRECTOR. Notifikasi WA ke Direktur Utama. Wajib input PIN/OTP untuk konfirmasi persetujuan.  
  * **System Lock:** Tombol "Transfer Dana" di modul Finance terkunci (Disabled) selama status belum APPROVED.

### **C. GPS Attendance & Auto-Penalty (SOP Guide)**

9. **User Story:** "Memastikan kedisiplinan Guide di lapangan secara objektif."  
10. **Logika Sistem:**  
    * **Geofencing:** Tombol "Check-In" di aplikasi Guide hanya aktif (Enabled) jika GPS mendeteksi posisi dalam radius **50 meter** dari titik kumpul (Dermaga Ketapang/Master Point).  
    * **Server Time:** Waktu check-in menggunakan waktu server (NTP), bukan jam HP (mencegah guide memanipulasi jam HP).  
    * **Auto-Fine:**  
      * Jika check\_in\_time \> 07:30 WIB (atau waktu trip yang ditentukan), sistem menandai status LATE.  
      * Sistem otomatis membuat entri potong gaji di tabel salary\_deductions sebesar **Rp 25.000** (Configurable).  
      * Notifikasi muncul di HP Guide: "Anda terlambat. Potongan Rp 25.000 diterapkan otomatis."

## **4.2 MODUL PRODUK & HARGA (COMMERCIAL ENGINE)**

*Fungsi: Otomatisasi perhitungan harga kompleks (Tiered, Usia, Season).*

### **A. Tiered Pricing Engine & Child Policy**

* **User Story:** "Harga harus akurat memperhitungkan jumlah peserta dewasa dan kebijakan anak secara otomatis."  
* **Logika Kalkulasi:**  
  1. **Input:** Package\_ID, Adult\_Pax, Child\_Pax (2-5 th), Infant\_Pax (\<2 th).  
  2. **Tier Determination:**  
     * Penentuan harga dasar per orang HANYA berdasarkan jumlah Adult\_Pax.  
     * *Query:* SELECT price FROM package\_prices WHERE package\_id \= X AND min\_pax \<= Adult\_Pax AND max\_pax \>= Adult\_Pax.  
  3. **Total Calculation:**  
     * Biaya Dewasa \= Adult\_Pax × Harga\_Tier.  
     * Biaya Anak \= Child\_Pax × (Harga\_Tier × 50%) *(Diskon 50% by default)*.  
     * Biaya Bayi \= 0 (Gratis).  
  4. **Grand Total:** Penjumlahan ketiga komponen tersebut.

### **B. Dynamic Seasonality**

* **User Story:** "Otomatisasi kenaikan harga saat High Season tanpa perlu edit manual satu per satu."  
* **Logika Prioritas:**  
  1. Cek tanggal trip di tabel season\_calendar.  
  2. **Prioritas 1 (High Season):** Jika tanggal ada di kalender (misal: Lebaran), terapkan markup (misal \+20% atau nominal tetap sesuai data paket).  
  3. **Prioritas 2 (Weekend):** Jika hari \= Sabtu/Minggu, gunakan kolom price\_weekend jika ada.  
  4. **Prioritas 3 (Weekday):** Gunakan harga dasar price\_publish.

### **C. Dual Pricing Display**

* **Logika Frontend:**  
  * **Role Public:** Hanya melihat price\_publish.  
  * **Role Mitra:**  
    * Melihat price\_publish (dicoret).  
    * Melihat price\_nta (Harga Modal).  
    * Label Highlight: "Potensi Cuan: Rp \[Publish \- NTA\]".

## **4.3 MODUL PENJUALAN & BOOKING (FRONT OFFICE)**

*Fungsi: Gerbang transaksi Customer dan Mitra dengan pengalaman seamless.*

### **A. Smart Booking Wizard & Tax Logic**

* **Alur Proses:**  
  1. **Availability Check:** Cek kuota Hard Limit (Kamar Villa). Jika penuh, tanggal di kalender menjadi abu-abu (Disabled).  
  2. **Input Data:** Jumlah Pax & Identitas Pemesan.  
  3. **Pricing Calculation:** Hitung subtotal berdasarkan Tiered Engine.  
  4. **Tax Calculation (Pajak):**  
     * Cek config branch: tax\_inclusive?  
     * Jika False: Tambahkan baris PPN (1.1% atau 11% sesuai setting) pada total bayar.  
     * Jika True: Tampilkan label "Harga termasuk Pajak".  
  5. **Checkout:** Generate Snap Token Midtrans.

### **B. Mitra Portal (B2B Ecosystem)**

* **Fitur Kunci:**  
  * **Deposit System:** Mitra top-up saldo via transfer. Saat booking, pilih metode "Potong Saldo". Status langsung CONFIRMED tanpa menunggu verifikasi manual admin.  
  * **Whitelabel Invoice:** Saat Mitra download tiket untuk tamu, sistem me-render PDF menggunakan **Logo & Alamat Mitra** (bukan Aero), menjaga branding Mitra di mata konsumennya.

### **C. Payment Gateway & Auto-Verification**

* **Logika Webhook:**  
  * Endpoint /api/webhooks/midtrans mendengarkan status transaksi.  
  * settlement: Update booking PAID \-\> Trigger WA Tiket ke Customer & Notif ke Admin.  
  * expire: Update booking CANCELLED \-\> Kembalikan stok kuota aset (*Release Inventory*).

## **4.4 MODUL OPERASIONAL (ELANG SAMUDERA \- BACK OFFICE)**

*Fungsi: Manajemen aset fisik dan efisiensi logistik lapangan.*

### **A. Resource Scheduler & Maintenance Blocker**

* **User Story:** "Mencegah penggunaan aset yang rusak atau bentrok jadwal."  
* **Logika Konflik:**  
  1. **Maintenance Guard:** Jika status kapal di database \= MAINTENANCE (sedang docking/rusak), kapal tersebut berwarna Merah dan **tidak bisa dipilih** untuk trip baru pada rentang tanggal maintenance.  
  2. **Double Booking Guard:** Jika Kapal A sudah di-assign ke Trip ID 101 pada jam 08.00-12.00, sistem menolak assignment Kapal A ke Trip lain pada rentang waktu yang sama (Overlap check).

### **B. Trip Merging (Konsolidasi Open Trip)**

* **Fitur:**  
  * Admin melihat daftar booking Open Trip yang "Yatim Piatu" (Belum dapat kapal) di tanggal yang sama.  
  * **Drag-and-Drop:** Admin memilih Booking A (2 org) \+ Booking B (3 org).  
  * **Merge:** Sistem membuat 1 Trip\_Master baru (5 pax).  
  * **Manifest:** Generate satu PDF Manifest gabungan untuk Guide (berisi semua nama dari Booking A & B).

### **C. Vendor & Inventory Management**

* **Inventory Tracking:**  
  * Setiap paket punya "Resep Logistik" (misal: Pahawang \= 2L BBM/pax \+ 2 Botol Air/pax).  
  * Saat trip selesai, sistem mengurangi stok gudang otomatis.  
  * Admin gudang melakukan *Stock Opname* fisik berkala untuk cek selisih (deteksi kebocoran/pencurian).  
* **Vendor Price Lock:**  
  * Database harga vendor luar (Kapal Nelayan/Katering) dikunci di master data. Admin Ops hanya bisa memilih dari *Dropdown*, tidak bisa input harga manual (Mencegah *mark-up* harga sewa).

## **4.5 MODUL KEUANGAN (FINANCE CONTROL)**

*Fungsi: Transparansi arus kas dan profitabilitas.*

### **A. Shadow P\&L (Laba Rugi Per Trip)**

* **User Story:** "Mengetahui profit bersih per trip secara real-time."  
* **Rumus Otomatis:**  
  * Net Revenue \= Total Penjualan \- (Pajak \+ Fee Midtrans).  
  * Internal Cost \= Biaya Sewa Aset Elang (Transfer Pricing dari tabel Assets).  
  * External Cost \= Vendor Luar \+ Gaji Guide \+ Logistik Real \+ Tiket Masuk.  
  * **Profit Trip** \= Net Revenue \- (Internal Cost \+ External Cost).

### **B. Payroll Gatekeeper (SOP Kunci Gaji)**

* **Logika Sistem:**  
  * Halaman Payroll Guide menampilkan daftar gaji yang harus dibayar.  
  * Tombol "Cairkan Gaji" default \= **DISABLED (Abu-abu)**.  
  * **Unlock Condition:** Tombol berubah **ENABLED (Hijau)** HANYA JIKA kolom link\_dokumentasi pada data trip sudah terisi URL valid (Regex check) dan status trip COMPLETED.

### **C. Auto-Refund Calculator** {#c.-auto-refund-calculator}

* **Logika Sistem:**  
  * Saat Admin membatalkan booking, sistem menghitung selisih hari (Trip Date \- Cancel Date).  
  * **Rules:**  
    * H \> 30: Refund 100% (minus admin fee).  
    * H 14-30: Refund 50%.  
    * H \< 7: Refund 0%.  
  * Angka refund muncul otomatis di form, Admin tidak bisa ubah manual (kecuali Super Admin dengan override).

## **4.6 MODUL CORPORATE PORTAL (B2B ENTERPRISE)** {#4.6-modul-corporate-portal-(b2b-enterprise)}

*Fungsi: Memfasilitasi klien perusahaan besar untuk manajemen trip karyawan.*

* **Employee Allocation System:**  
  * **User Story:** "Sebagai HRD Bank, saya ingin membagikan jatah liburan ke 100 karyawan tanpa booking satu-satu."  
  * **Logika:**  
    1. HRD Top-up Deposit Perusahaan (misal Rp 1 Miliar).  
    2. HRD upload CSV data karyawan (Email & Limit Saldo).  
    3. Sistem mengirim undangan email ke karyawan.  
    4. Karyawan login, melihat saldo "Corporate Balance", dan bisa booking trip sendiri (potong saldo kantor).  
* **Corporate Invoicing:**  
  * **Fitur:** Generate Faktur Pajak otomatis dan Laporan Penggunaan Saldo per Departemen untuk keperluan audit internal klien.

## **4.7 MODUL COMPLAINT & TICKETING (CS SUPPORT)** {#4.7-modul-complaint-&-ticketing-(cs-support)}

*Fungsi: Penanganan masalah lapangan yang terukur.*

* **Ticket System:**  
  * **Trigger:** Guide atau Customer input "Lapor Masalah" di aplikasi.  
  * **Kategori:** *Fasilitas Rusak, Makanan Basi, Guide Tidak Ramah, Lainnya*.  
  * **SLA Timer:** Tiket memiliki batas waktu (misal: 30 menit). Jika Admin Ops tidak merespon dalam 30 menit, tiket tereskalasi ke Manager (Notifikasi WA).  
  * **Resolution Log:** Admin wajib isi "Tindakan Perbaikan" sebelum tiket bisa di-close.

# **5\. FUNCTIONAL REQUIREMENTS (GROWTH & INNOVATION)** {#5.-functional-requirements-(growth-&-innovation)}

Bagian ini merinci fitur-fitur inovatif yang dirancang untuk mendorong pertumbuhan pengguna secara eksponensial (Viral Loop), meningkatkan retensi pelanggan, dan memaksimalkan efisiensi operasional melalui kecerdasan buatan.

## **5.1 MODUL SOCIAL COMMERCE (VIRAL ENGINE)**

*Tujuan: Mengubah setiap pelanggan menjadi agen pemasaran yang membawa pengguna baru.*

### **A. Split Bill (Patungan Digital)**

* **User Story:** "Sebagai ketua rombongan, saya ingin teman-teman saya membayar sendiri bagian mereka agar saya tidak perlu menalangi biaya besar."  
* **Logika Sistem & Alur:**  
  * **Inisiasi:** Ketua grup memilih paket, input total pax (misal 10 orang), dan memilih metode bayar "Split Bill".  
  * **Generasi Link:** Sistem membagi total tagihan menjadi 10 bagian rata (atau nominal custom per orang). Sistem men-generate 10 *Unique Payment Link* (Midtrans).  
  * **Distribusi:** Ketua grup menyalin link tersebut dan membagikannya ke grup WhatsApp.  
  * **Tracking Real-time:** Di dashboard "My Trip", Ketua bisa melihat siapa yang sudah bayar (Hijau) dan belum (Merah).  
  * **Status Booking:**  
    * Booking berstatus AWAITING\_FULL\_PAYMENT.  
    * Slot aset (Kapal/Villa) di-*hold* selama 24 jam (Timer Countdown).  
  * **Penyelesaian:**  
    * Jika semua lunas dalam 24 jam \-\> Status CONFIRMED.  
    * Jika ada yang belum lunas \-\> Opsi bagi Ketua: "Bayar Sisa (Talangi)" atau "Batal".  
    * **Fail-Safe:** Jika batal, dana teman yang sudah masuk di-refund otomatis ke **Wallet Saldo** (bukan rekening bank) untuk mengunci *revenue* di dalam ekosistem Aero.

### **B. Travel Circle (Arisan/Tabungan Bersama)**

* **User Story:** "Kami sekelompok teman ingin liburan tahun depan, tapi butuh disiplin menabung bersama."  
* **Logika Sistem:**  
  * **Setup:** User membuat grup "Circle" (misal: "Labuan Bajo 2026"), set target dana (Rp 50 Juta), dan iuran bulanan (Rp 500rb/orang).  
  * **Auto-Reminder:** Sistem mengirim notifikasi tagihan/debet otomatis setiap tanggal 1 via WA/Email.  
  * **Lock-in Mechanism:** Saldo yang terkumpul masuk ke Virtual Account Pool grup. Saldo ini **TIDAK BISA DITARIK TUNAI** ke rekening pribadi. Hanya bisa digunakan ("Redeem") untuk pembayaran booking trip di Aero Travel.  
  * **Transparansi:** Setiap anggota bisa melihat total saldo terkumpul, tapi hanya Admin Grup yang bisa melakukan eksekusi booking.

### **C. KOL / Influencer Trip**

* **User Story:** "Saya ingin ikut trip eksklusif yang dipandu oleh selebgram favorit saya."  
* **Fitur Khusus:**  
  * **Exclusive Page:** Landing page khusus dengan foto/video KOL sebagai *Host*.  
  * **Premium Pricing:** Harga paket di-markup untuk margin lebih tinggi \+ *fee* KOL.  
  * **Group Chat:** User yang sudah lunas otomatis di-invite ke dalam grup chat eksklusif di aplikasi bersama sang KOL.

## **5.2 MODUL AI & AUTOMATION (SMART LAYER)**

*Tujuan: Efisiensi SDM ekstrem menggunakan teknologi DeepSeek & OCR (sesuai Tech Stack).*

### **A. AeroBot (AI Concierge)**

4. **User Story:** "Saya ingin bertanya harga dan ketersediaan jam 2 pagi dan mendapat jawaban instan."  
5. **Teknologi:** DeepSeek-V3 via WAHA (WhatsApp) & Web Widget.  
6. **Logika RAG (Retrieval Augmented Generation):**  
   * **Ingest:** User bertanya "Tanggal 25 Desember kosong gak buat 5 orang?".  
   * **Retrieve:** AI mengecek tabel inventory dan package\_prices.  
   * **Generate:** AI menjawab "Masih tersedia Kak\! Karena High Season, harganya Rp X. Mau booking?".  
   * **Guardrails:** AI dilarang menjawab pertanyaan sensitif (Gaji Guide, Profit, Politik). Jika buntu, AI menjawab "Mohon tunggu, Admin manusia akan segera membantu" dan men-trigger notifikasi ke CS.

### **B. Vision AI (Auto-Verify Payment)**

* **User Story:** "Saya sudah transfer, saya tidak mau menunggu lama untuk konfirmasi."  
* **Teknologi:** DeepSeek-OCR / Gemini Flash.  
* **Logika:**  
  1. User upload foto struk (ATM/M-Banking).  
  2. AI membaca gambar dan mengekstrak: Tanggal, Jam, Nominal, Bank Pengirim, Bank Penerima.  
  3. Sistem mencocokkan data ekstrak dengan booking\_id dan total\_amount.  
  4. **Auto-Approve:** Jika tingkat kecocokan (*confidence score*) \> 95%, status booking langsung berubah jadi PAID. Finance tidak perlu cek mutasi manual.

### **C. AI Content Spinner (SEO Generator)**

* **User Story:** "Website harus punya ribuan halaman pencarian tanpa perlu menulis manual."  
* **Logika:**  
  1. Sistem mengambil data paket master (misal: "Pahawang").  
  2. Sistem mengkombinasikan dengan 500 kota asal di Indonesia.  
  3. AI menulis ulang (*spin*) deskripsi paket untuk setiap kombinasi kota agar unik (menghindari penalti *Duplicate Content* Google).  
  4. **Hasil:** Halaman /paket-wisata-pahawang-dari-surabaya, /paket-wisata-pahawang-dari-medan, dst.

## **5.3 MODUL MARKETING & LOYALTY (RETENTION ENGINE)**

*Tujuan: Mengikat pelanggan agar terus kembali berbelanja.*

### **A. Programmatic SEO Architecture**

* **Strategi:** Membanjiri mesin pencari dengan halaman spesifik (*Long-tail Keywords*).  
* **Implementasi:** Menggunakan Next.js ISR (*Incremental Static Regeneration*) untuk men-generate halaman SEO statis yang sangat cepat di-load, berisi konten unik dari AI Content Spinner.

### **B. Loyalty System (AeroPoints & Referral)**

* **AeroPoints:**  
  * **Earn:** Setiap transaksi kelipatan Rp 100.000 mendapatkan 10 Poin.  
  * **Burn:** Poin bisa digunakan sebagai potongan harga langsung di halaman Checkout (1 Poin \= Rp 1).  
* **Referral Code (Member Get Member):**  
  * User A membagikan kode AERO-BUDI.  
  * Teman B mendaftar pakai kode \-\> Dapat diskon pengguna baru Rp 50.000.  
  * Setelah Teman B trip selesai \-\> User A dapat komisi 10.000 Poin.

### **C. Social Proof Gating** {#c.-social-proof-gating}

* **User Story:** "Saya ingin melihat foto-foto liburan saya."  
* **Logika:**  
  * H+1 Trip selesai, user mendapat notifikasi link galeri foto.  
  * Saat link dibuka, foto tampil *blur* atau terkunci.  
  * **Unlock Condition:** User wajib memberikan Rating Bintang & Ulasan Singkat.  
  * Setelah submit, foto terbuka dan bisa didownload HD. Review otomatis tampil di halaman depan website.

## **5.4 INTERACTIVE GUIDE EXPERIENCE (UBER-LIKE VIEW)** {#5.4-interactive-guide-experience-(uber-like-view)}

*Fungsi: Memberikan ketenangan pikiran dan pengalaman premium ke customer.*

* **Live Tracking (Customer View):**  
  * **Trigger:** Status Trip berubah menjadi `ON_THE_WAY` (H-1 Jam penjemputan).  
  * **Fitur:** Customer bisa melihat posisi GPS Mobil/Kapal penjemput di peta aplikasi secara real-time.  
  * **ETA:** Sistem menghitung estimasi waktu tiba (*Estimated Time of Arrival*) berdasarkan lalu lintas/jarak laut.

# **6\. FUNCTIONAL REQUIREMENTS (SAFETY & COMPLIANCE)** {#6.-functional-requirements-(safety-&-compliance)}

Bagian ini merinci spesifikasi fungsional untuk modul keselamatan dan kepatuhan. Tujuannya adalah melindungi nyawa peserta trip, mengamankan data pribadi sesuai UU PDP, dan melindungi perusahaan dari tuntutan hukum.

## **6.1 MODUL KESELAMATAN & RESPON DARURAT (SAFETY MANAGEMENT SYSTEM)**

*Tujuan: Penanganan insiden fisik di lapangan secara cepat dan terukur.*

### **A. Panic Button (SOS Alert System)**

* **User Story:** "Sebagai Guide di tengah laut, jika terjadi kecelakaan atau ancaman, saya butuh bantuan kantor pusat secepatnya tanpa harus mengetik chat panjang."  
* **Logika Sistem & Alur:**  
  * **Trigger:** Tombol merah besar bertuliskan **"SOS"** di Header aplikasi Guide (Mobile View).  
  * **Action:** Guide menekan tombol tahan selama 3 detik (untuk mencegah kepencet tidak sengaja).  
  * **System Process:**  
    * Aplikasi mengambil koordinat GPS terkini (*High Accuracy Mode*).  
    * Sistem mengirim **Push Notification Prioritas Tinggi** (dengan suara sirine/beda nada) ke Dashboard Admin Ops dan HP Super Admin (Owner).  
    * Sistem otomatis mengirim pesan WhatsApp ke Grup Internal Manajemen: *"PERINGATAN: Sinyal SOS diterima dari Trip \[Nama Trip\] oleh Guide \[Nama\]. Lokasi: \[Link Google Maps\]."*  
  * **Output:** Mode "Emergency" aktif di dashboard Admin, menampilkan peta lokasi guide secara real-time.

### **B. Auto-Insurance Manifest (Otomasi Asuransi)**

11. **User Story:** "Memastikan setiap tamu yang berangkat sudah terdaftar asuransi tanpa admin harus kirim email manual subuh-subuh."  
12. **Logika Sistem:**  
    * **Schedule:** Cron Job (Skrip Otomatis) berjalan setiap hari pukul **06.00 WIB**.  
    * **Query:** Sistem menarik data booking\_passengers (Nama Lengkap, NIK, Tanggal Lahir) untuk semua Trip yang statusnya CONFIRMED pada tanggal tersebut.  
    * **Generate:** Membuat file PDF/CSV dengan format baku pihak asuransi (Jasa Raharja/Rekanan Swasta).  
    * **Action:** Mengirim email via API (Resend/SMTP) ke alamat email Agen Asuransi dengan subjek: *"Manifest Asuransi Aero Travel \- \[Tanggal Hari Ini\]"*.  
    * **Audit:** Menyimpan log "Email Sent" di dashboard Admin untuk bukti klaim jika diperlukan.

### **C. Live Tracking (Posisi Armada)**

* **User Story:** "Admin Ops ingin tahu posisi kapal ada di mana untuk estimasi waktu sandar."  
* **Logika Sistem:**  
  * Selama status trip ON\_TRIP, aplikasi Guide mengirimkan *ping* koordinat GPS ke server setiap 5-10 menit (Background Service).  
  * Admin Ops dapat melihat sebaran titik lokasi seluruh Guide aktif dalam satu peta (*Maps View*).

## **6.2 MODUL KEPATUHAN DATA & HUKUM (LEGAL & PRIVACY)**

*Tujuan: Kepatuhan terhadap UU Perlindungan Data Pribadi (PDP) dan Etika Bisnis B2B.*

### **A. Auto-Retention Policy (Penghapusan Data Otomatis)**

11. **User Story:** "Perusahaan tidak boleh menyimpan foto KTP tamu selamanya karena risiko kebocoran data."  
12. **Logika Sistem:**  
    * **Schedule:** Cron Job berjalan setiap malam pukul 00.00.  
    * **Condition:** Cari data Trip yang end\_date sudah melewati **30 hari** (Configurable).  
    * **Action:**  
      * Hapus file fisik Foto KTP/Paspor dari *Cloud Storage* (Supabase Storage).  
      * Update kolom database id\_card\_url menjadi NULL atau string DELETED\_BY\_SYSTEM\_POLICY.  
    * **Exception:** Data teks (Nama & NIK) tetap disimpan (Encrypted) untuk keperluan riwayat transaksi, hanya file gambar yang dihapus.

### **B. Data Masking (Privacy Shield untuk Mitra)**

* **User Story:** "Mitra B2B takut data tamunya dicuri (bypass) oleh Aero Travel."  
* **Logika Sistem:**  
  * **Role Check:** Jika user yang login adalah Marketing Aero atau Admin Ops.  
  * **Data Source Check:** Jika data booking berasal dari source \= mitra.  
  * **Display Logic:**  
    * Nomor HP tamu ditampilkan sebagai: 0812-\*\*\*\*-8990.  
    * Email tamu ditampilkan sebagai: budi\*\*\*@gmail.com.  
  * **Unmasking:** Tombol "Lihat Data Asli" hanya tersedia untuk **Super Admin** dan setiap klik tercatat di *Audit Log* (Alasan harus diisi).

### **C. Digital Liability Waiver (Pelepasan Tuntutan)**

* **User Story:** "Melindungi perusahaan dari tuntutan hukum jika terjadi kecelakaan akibat force majeure."  
* **Logika Sistem:**  
  * Pada halaman *Checkout* (sebelum bayar), terdapat Checkbox Wajib: *"Saya telah membaca dan menyetujui Syarat & Ketentuan serta Kebijakan Privasi."*  
  * Teks S\&K berisi klausul pelepasan tuntutan hukum.  
  * Tombol "Bayar Sekarang" **DISABLED** sampai checkbox dicentang.  
  * Sistem menyimpan status consent \= true dan consent\_timestamp di database booking.

## **6.3 MODUL KESEHATAN ASET (ASSET COMPLIANCE)**

*Tujuan: Mencegah penggunaan aset yang tidak layak jalan.*

### **A. Maintenance Blocker**

* **User Story:** "Mencegah marketing menjual tiket kapal yang sedang rusak/docking."  
* **Logika Sistem:**  
  1. **Input:** Admin Ops menandai status Aset (Kapal A) menjadi MAINTENANCE pada rentang tanggal tertentu (misal: 1-3 Januari).  
  2. **Validation:**  
     * Jika Marketing mencoba assign Kapal A di tanggal tersebut \-\> **ERROR BLOCKER**.  
     * Jika Customer mencari paket Private Trip di tanggal tersebut dan Kapal A adalah satu-satunya aset \-\> **DATE DISABLED** (Tanggal tidak bisa dipilih).  
  3. **Alert:** Sistem memberi notifikasi H-7 sebelum jadwal *Maintenance Rutin* (berdasarkan jam terbang mesin/periode waktu).

### **B. Inventory Audit (Logistik)** {#b.-inventory-audit-(logistik)}

* **User Story:** "Mencegah selisih stok BBM dan konsumsi."  
* **Logika Sistem:**  
  * Setiap selesai trip, Guide/Admin wajib input "Pemakaian Aktual".  
  * Sistem membandingkan "Standar Resep" vs "Pemakaian Aktual".  
  * Jika selisih \> 10% (misal bensin boros tidak wajar), sistem menandai trip tersebut dengan flag ANOMALY di Laporan Keuangan untuk diaudit Manager.

# **7\. DEVELOPMENT ROADMAP (PHASING)** {#7.-development-roadmap-(phasing)}

Rencana pengembangan ini dirancang dengan pendekatan *Agile Iterative*. Setiap fase memiliki tujuan bisnis yang jelas (*Milestone*) dan kriteria kelulusan (*Exit Criteria*) sebelum lanjut ke fase berikutnya.

## **7.1 STRATEGI RILIS (PHASING STRATEGY)**

Kita membagi peluncuran menjadi 3 Fase Utama selama 6 bulan, dengan prioritas pada **Stabilitas Internal** sebelum **Ekspansi Eksternal**.

| Fase | Fokus Utama | Target Audience | Durasi Estimasi |
| :---- | :---- | :---- | :---- |
| **FASE 1: THE CORE (Foundation)** | Digitalisasi Operasional Internal & Governance | Admin, Marketing, Ops, Finance | Bulan 1-2 |
| **FASE 2: THE FIELD (Ecosystem)** | Efisiensi Lapangan & Mitra B2B | Tour Guide, Mitra Agent | Bulan 3-4 |
| **FASE 3: THE GROWTH (Scale-Up)** | Otomatisasi AI & Penjualan Publik | Customer B2C, SEO | Bulan 5-6 |

## **7.2 DETIL RENCANA KERJA (SPRINT PLAN)**

### **FASE 1: THE CORE FOUNDATION (Internal Stability)**

*Goal: Menghentikan penggunaan Excel manual, menegakkan SOP, dan validasi data keuangan.*

#### **Bulan 1: Infrastruktur & Governance**

* **Setup Environment:**  
  * Inisiasi Next.js Project & PWA Setup.  
  * Setup Database Supabase (Schema V2) & RLS Security.  
  * Docker Environment untuk Local Development (WAHA/Redis).  
* **Modul Governance (System-as-Law):**  
  * Implementasi E-Contract (PKWT/Pakta Integritas) pada Login.  
  * Implementasi Authority Matrix (Limit Approval Keuangan).  
* **Modul Produk & Harga:**  
  * Import Master Data Destinasi & Paket.  
  * Coding Logic *Tiered Pricing* & *High Season*.

#### **Bulan 2: Operasional Kantor & Keuangan**

* **Modul Marketing (Internal Booking):**  
  * Form input booking manual untuk Admin.  
  * Generate PDF Quotation otomatis.  
* **Modul Operasional (Back Office):**  
  * Resource Scheduler (Kalender Kapal/Guide).  
  * Trip Merging Logic.  
* **Modul Keuangan Dasar:**  
  * Shadow P\&L Report (Laba Rugi per Trip).  
  * Rekonsiliasi Pembayaran Manual.

**EXIT CRITERIA FASE 1:**

7. Admin Marketing bisa membuat Invoice dalam \< 1 menit.  
8. Admin Ops bisa melihat jadwal kapal tanpa bentrok.  
9. Selisih data keuangan sistem vs bank \= 0\.

### **FASE 2: THE FIELD & PARTNER ECOSYSTEM (Operational Efficiency)**

*Goal: Menghubungkan orang lapangan dan mitra agen ke dalam sistem secara real-time.*

#### **Bulan 3: Aplikasi Lapangan (Guide App)**

6. **Modul Guide (Mobile View):**  
   * Fitur Absensi GPS Geofencing & Denda Otomatis.  
   * Digital Manifest & Ceklist Tamu.  
   * Fitur Upload Dokumentasi (Syarat Gaji).  
7. **Modul Safety:**  
   * Panic Button (SOS) Integration.  
   * Auto-Insurance Email Manifest (Cron Job).  
8. **Offline Capability:**  
   * Implementasi *Service Workers* & *IndexedDB* untuk mode tanpa sinyal.

#### **Bulan 4: Portal Mitra (B2B)**

1. **Modul Mitra:**  
   * Dashboard Booking NTA (Harga Net).  
   * Whitelabel Invoice Generator.  
   * Management Deposit Saldo.  
2. **Modul Inventory:**  
   * Pencatatan stok logistik (BBM/Konsumsi).  
   * Vendor Price Lock (Database harga luar).

**EXIT CRITERIA FASE 2:**

* Guide di laut bisa absen dan upload foto.  
* Mitra bisa booking sendiri tanpa chat Admin Aero.  
* Gaji guide cair otomatis hanya jika foto sudah diupload.

### **FASE 3: THE GROWTH & AI REVOLUTION (Revenue Booster)**

*Goal: Membuka keran penjualan langsung ke publik dan efisiensi SDM dengan AI.*

#### **Bulan 5: Customer App & Payment**

1. **Modul Customer (B2C):**  
   * Booking Wizard UI (Public Web).  
   * Integrasi Payment Gateway (Midtrans \- QRIS/VA/CC).  
   * Fitur Split Bill & Travel Circle (Arisan).  
2. **Modul Growth:**  
   * Loyalty System (AeroPoints).  
   * Social Proof System (Review for Photo).

#### **Bulan 6: AI & Automation**

1. **AI Integration:**  
   * AeroBot (CS Chatbot) via WAHA.  
   * Vision AI (OCR Bukti Transfer).  
   * Content Spinner untuk SEO Programmatic.  
2. **Programmatic SEO:**  
   * Generate 1.000+ Landing Page dinamis (/paket-pahawang-dari-surabaya).  
3. **Corporate Module (Activation):**  
   * Dashboard HRD untuk klien B2B Enterprise.

**EXIT CRITERIA FASE 3:**

* Traffic website meningkat \>30% dari SEO.  
* Beban CS berkurang 50% berkat AeroBot.  
* Transaksi otomatis (Midtrans) berjalan lancar.

## **7.3 ALOKASI SUMBER DAYA (RESOURCE PLAN)**

Untuk mencapai timeline di atas, dibutuhkan tim teknis dengan komposisi:

| Peran | Tanggung Jawab Utama | Alokasi Waktu |
| :---- | :---- | :---- |
| **Project Manager** | Mengawal Sprint, QA, dan User Acceptance Test (UAT). | Full-time |
| **Lead Developer** | Arsitektur Sistem, Database, Security, Review Code. | Full-time |
| **Frontend Dev** | UI/UX Next.js, PWA Guide, Dashboard Admin. | Full-time |
| **Backend Dev** | API Supabase, AI Integration, Cron Jobs. | Full-time |
| **UI/UX Designer** | Desain Mockup & Prototype (Fase awal). | Part-time (Project Based) |

## **7.4 MANAJEMEN RISIKO RILIS (ROLLOUT PLAN)**

Agar tidak terjadi kekacauan saat sistem *Go-Live*, diterapkan strategi rilis bertahap:

1. **Alpha Release (Internal Only):**  
   * Hanya digunakan oleh 2-3 Admin senior.  
   * Data masih paralel dengan Excel (Double Entry) selama 1 minggu untuk validasi akurasi.  
2. **Beta Release (Limited Pilot):**  
   * Melibatkan 5 Guide terpercaya dan 3 Mitra Prioritas.  
   * Menguji fitur GPS dan Deposit Mitra.  
3. **Grand Launch (Public):**  
   * Membuka akses web untuk Customer Umum.  
   * Mengaktifkan Iklan & SEO.

## **7.5 MAINTENANCE & SUPPORT (POST-LAUNCH)** {#7.5-maintenance-&-support-(post-launch)}

Setelah FASE 3 selesai, masuk ke periode *Maintenance*:

* **Monitoring:** Pengecekan harian log Sentry & Server Health.  
* **Data Cleaning:** Penghapusan rutin file KTP (Privacy Compliance).  
* **Security Patch:** Update library Next.js/Supabase secara berkala.  
* **Feature Update:** Pengembangan fitur masa depan (IoT Kapal, dll).

# **8\. ACCEPTANCE CRITERIA & LEMBAR PERSETUJUAN** {#8.-acceptance-criteria-&-lembar-persetujuan}

Bagian ini mendefinisikan kriteria kelulusan sistem sebelum dinyatakan "Go Live" dan menjadi bukti formal kesepakatan spesifikasi proyek MyAeroTravel ID.

## **8.1 KRITERIA PENERIMAAN SISTEM (USER ACCEPTANCE CRITERIA)**

Proyek dinyatakan selesai dan dapat diterima jika memenuhi indikator berikut secara objektif:

### **A. Kriteria Fungsional (Functional Success)**

* \[ \] **Zero Data Loss:** Database berhasil menyimpan dan menampilkan kembali 100% data booking tanpa korup.  
* \[ \] **Accurate Pricing:** Mesin harga (*Tiered Pricing*) menghasilkan angka yang tepat sesuai tabel Excel untuk skenario: 2 pax, 5 pax, dan 10 pax (termasuk diskon anak).  
* \[ \] **Governance Lock:** User Admin **TIDAK BISA** membuat booking fiktif atau menghapus data keuangan tanpa jejak (*Audit Log*).  
* \[ \] **Safety Ready:** Tombol Panic Button di aplikasi Guide berhasil mengirim notifikasi real-time dan lokasi GPS akurat ke Dashboard Admin.  
* \[ \] **Offline Mode:** Aplikasi Guide dapat membuka halaman Manifest dan menyimpan data Absensi saat koneksi internet dimatikan (Airplane Mode), lalu sinkronisasi otomatis saat online kembali.

### **B. Kriteria Kualitas & Performa (Non-Functional Success)**

14. \[ \] **Kecepatan:** Halaman utama (*Landing Page*) memiliki skor Google Lighthouse Performance \> 90 (Hijau).  
15. \[ \] **Keamanan:** Data Mitra A tidak bocor ke Mitra B saat diuji coba (*Penetration Test* level dasar).  
16. \[ \] **Kompatibilitas:** Tampilan PWA responsif dan tidak pecah di perangkat Android (Chrome) dan iOS (Safari).  
17. \[ \] **Integrasi:** Webhook Midtrans berhasil mengubah status pembayaran secara otomatis dalam waktu \< 10 detik.

### **C. Kriteria Operasional (Operational Success)**

9. \[ \] **Zero Discrepancy:** Simulasi Laporan Laba Rugi Sistem cocok 100% dengan hitungan manual Finance pada sampel 10 trip.  
10. \[ \] **Migrasi Data:** Seluruh data Paket Wisata & Aset dari file Excel lama berhasil diimport ke Database baru.

## **8.2 PROSEDUR PENGUJIAN (TESTING PROCEDURE)**

Sebelum tanda tangan serah terima, sistem wajib melewati tahapan:

13. **Unit Testing:** Developer memastikan setiap fungsi kode berjalan benar (diuji oleh Tim Teknis).  
14. **System Integration Testing (SIT):** Memastikan Modul Marketing, Ops, dan Keuangan terhubung lancar (diuji oleh QA).  
15. **User Acceptance Testing (UAT):**  
    * **Siapa:** Perwakilan Admin Marketing, Admin Ops, Finance, dan 2 Guide Senior.  
    * **Apa:** Menggunakan aplikasi untuk simulasi 1 siklus trip penuh (Booking \-\> Bayar \-\> Jalan \-\> Laporan).  
    * **Hasil:** Form UAT ditandatangani "LULUS" oleh setiap perwakilan divisi.

## **8.3 LEMBAR PERSETUJUAN (PROJECT SIGN-OFF)** {#8.3-lembar-persetujuan-(project-sign-off)}

Dengan ini, dokumen **Product Requirement Document (PRD) Versi 1.0 (Final)** untuk proyek **MyAeroTravel ID** disetujui sebagai acuan mutlak pengembangan. Segala fitur di luar dokumen ini akan dianggap sebagai *Change Request* (Permintaan Perubahan) yang mungkin dikenakan biaya atau waktu tambahan.

**Pihak Pemilik Produk (Business Owner):**

| Nama | Jabatan | Tanggal | Tanda Tangan |
| :---- | :---- | :---- | :---- |
| **Adien Rohyanudin, S.T** | Direktur Utama | \_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_ |
| **\[Nama Komisaris/Investor\]** | Komisaris | \_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_ |

**Pihak Pelaksana (Technical Team):**

| Nama | Jabatan | Tanggal | Tanda Tangan |
| :---- | :---- | :---- | :---- |
| **\[Nama Lead Developer\]** | Tech Lead | \_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_ |
| **\[Nama PM\]** | Project Manager | \_\_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_\_ |

