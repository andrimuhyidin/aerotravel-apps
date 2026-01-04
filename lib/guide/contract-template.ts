/**
 * Contract Content Template
 * Standard industry best practices for guide/freelancer contracts
 */

export type ContractContent = {
  // Preamble
  preamble?: string;
  
  // Parties
  parties: {
    company: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    guide: {
      name: string;
      address?: string;
      phone?: string;
      email?: string;
      idNumber?: string; // KTP/NIK
    };
  };
  
  // Contract Details
  contractDetails: {
    contractNumber: string;
    contractType: 'annual';
    effectiveDate: string;
    expiryDate: string;
    renewalDate?: string;
  };
  
  // Scope of Work
  scopeOfWork: {
    description: string;
    responsibilities: string[];
    deliverables: string[];
    performanceStandards: string[];
  };
  
  // Compensation
  compensation: {
    feeStructure: 'per_trip_assignment';
    paymentTerms: string;
    paymentMethod: string;
    taxObligations: string;
  };
  
  // Terms & Conditions
  terms: {
    employmentType: 'freelancer';
    exclusivity?: string;
    nonCompete?: string;
    confidentiality: string;
    intellectualProperty: string;
    termination: {
      byCompany: string;
      byGuide: string;
      noticePeriod: string;
    };
    disputeResolution: string;
    governingLaw: string;
    amendments: string;
    entireAgreement: string;
  };
  
  // Additional Clauses
  additionalClauses?: {
    insurance?: string;
    equipment?: string;
    training?: string;
    codeOfConduct?: string;
    safety?: string;
    dataProtection?: string;
  };
};

/**
 * Generate default contract content template
 */
export function generateDefaultContractContent(
  companyName: string,
  guideName: string,
  contractNumber: string,
  startDate: string,
  endDate: string,
  guideInfo?: {
    address?: string;
    phone?: string;
    email?: string;
    idNumber?: string;
  }
): ContractContent {
  return {
    preamble: `Perjanjian Kerja Sama ini dibuat dan ditandatangani pada hari ini oleh dan antara:`,
    
    parties: {
      company: {
        name: companyName,
        address: 'Jl. Contoh No. 123, Jakarta',
        phone: '+62-21-12345678',
        email: 'info@aerotravel.co.id',
      },
      guide: {
        name: guideName,
        address: guideInfo?.address,
        phone: guideInfo?.phone,
        email: guideInfo?.email,
        idNumber: guideInfo?.idNumber,
      },
    },
    
    contractDetails: {
      contractNumber,
      contractType: 'annual',
      effectiveDate: startDate,
      expiryDate: endDate,
      renewalDate: endDate,
    },
    
    scopeOfWork: {
      description: 'Guide akan menyediakan jasa pemandu wisata untuk trip-trip yang ditugaskan oleh Perusahaan selama periode kontrak.',
      responsibilities: [
        'Menyediakan jasa pemandu wisata profesional dengan standar kualitas tinggi',
        'Memastikan keselamatan dan kenyamanan peserta trip',
        'Menyampaikan informasi yang akurat tentang destinasi wisata',
        'Mematuhi jadwal dan itinerary yang telah ditetapkan',
        'Melaporkan insiden atau masalah yang terjadi selama trip',
        'Mengisi dokumentasi trip sesuai dengan ketentuan perusahaan',
        'Menjaga reputasi dan citra perusahaan',
      ],
      deliverables: [
        'Laporan trip yang lengkap dan tepat waktu',
        'Foto dokumentasi trip sesuai standar',
        'Feedback dari peserta trip',
        'Manifest passenger yang akurat',
      ],
      performanceStandards: [
        'Rating minimal 4.5 dari 5.0',
        'Tidak ada keluhan serius dari peserta trip',
        'Kepatuhan terhadap SOP perusahaan',
        'Kehadiran tepat waktu untuk semua trip assignment',
      ],
    },
    
    compensation: {
      feeStructure: 'per_trip_assignment',
      paymentTerms: 'Pembayaran dilakukan setelah trip selesai dan diverifikasi oleh perusahaan. Fee akan ditransfer ke rekening guide dalam waktu maksimal 7 hari kerja setelah trip selesai.',
      paymentMethod: 'Transfer bank ke rekening yang telah didaftarkan',
      taxObligations: 'Guide bertanggung jawab atas kewajiban perpajakan sesuai dengan ketentuan yang berlaku. Perusahaan akan melakukan pemotongan PPh Pasal 21/23 sesuai ketentuan perpajakan yang berlaku.',
    },
    
    terms: {
      employmentType: 'freelancer',
      exclusivity: 'Guide dapat bekerja dengan perusahaan lain selama tidak bertentangan dengan kepentingan perusahaan dan tidak mengganggu kualitas pelayanan.',
      nonCompete: 'Selama masa kontrak dan 6 bulan setelah berakhirnya kontrak, Guide tidak diperkenankan bekerja dengan kompetitor langsung yang dapat merugikan perusahaan.',
      confidentiality: 'Guide wajib menjaga kerahasiaan informasi perusahaan, termasuk namun tidak terbatas pada: data pelanggan, strategi bisnis, harga paket, dan informasi internal lainnya.',
      intellectualProperty: 'Semua materi, foto, video, dan konten yang dihasilkan selama trip menjadi hak milik perusahaan. Guide memberikan hak non-eksklusif kepada perusahaan untuk menggunakan konten tersebut untuk keperluan promosi dan pemasaran.',
      termination: {
        byCompany: 'Perusahaan dapat mengakhiri kontrak dengan pemberitahuan tertulis 30 hari sebelumnya atau segera jika terjadi pelanggaran serius terhadap ketentuan kontrak.',
        byGuide: 'Guide dapat mengajukan pengunduran diri dengan pemberitahuan tertulis minimal 30 hari sebelumnya.',
        noticePeriod: '30 hari kalender',
      },
      disputeResolution: 'Setiap sengketa yang timbul dari atau berkaitan dengan perjanjian ini akan diselesaikan melalui musyawarah mufakat terlebih dahulu. Jika tidak tercapai kesepakatan, akan diselesaikan melalui arbitrase atau pengadilan negeri yang berwenang di Jakarta.',
      governingLaw: 'Perjanjian ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia.',
      amendments: 'Perubahan atau penambahan terhadap perjanjian ini hanya dapat dilakukan dengan persetujuan tertulis dari kedua belah pihak.',
      entireAgreement: 'Perjanjian ini merupakan perjanjian lengkap antara para pihak dan menggantikan semua perjanjian, kesepakatan, atau komunikasi sebelumnya terkait subjek perjanjian ini.',
    },
    
    additionalClauses: {
      insurance: 'Perusahaan akan menyediakan asuransi kecelakaan kerja untuk Guide selama melaksanakan tugas trip. Guide diwajibkan memiliki asuransi kesehatan pribadi.',
      equipment: 'Perusahaan akan menyediakan peralatan yang diperlukan untuk pelaksanaan trip. Guide bertanggung jawab untuk menjaga dan merawat peralatan tersebut.',
      training: 'Perusahaan akan menyediakan pelatihan dan pembekalan kepada Guide sesuai dengan kebutuhan. Guide wajib mengikuti pelatihan yang diwajibkan.',
      codeOfConduct: 'Guide wajib mematuhi kode etik dan standar perilaku yang ditetapkan oleh perusahaan, termasuk menjaga profesionalisme, sopan santun, dan integritas.',
      safety: 'Guide wajib memprioritaskan keselamatan peserta trip dan dirinya sendiri. Guide harus mengikuti protokol keselamatan yang ditetapkan oleh perusahaan.',
      dataProtection: 'Guide wajib melindungi data pribadi peserta trip sesuai dengan ketentuan perlindungan data pribadi yang berlaku.',
    },
  };
}

/**
 * Format contract content for display
 */
export function formatContractContentForDisplay(content: ContractContent): string {
  let formatted = '';
  
  // Preamble
  if (content.preamble) {
    formatted += `${content.preamble}\n\n`;
  }
  
  // Parties
  formatted += `PIHAK PERTAMA (PERUSAHAAN):\n`;
  formatted += `Nama Perusahaan: ${content.parties.company.name}\n`;
  if (content.parties.company.address) {
    formatted += `Alamat: ${content.parties.company.address}\n`;
  }
  if (content.parties.company.phone) {
    formatted += `Telepon: ${content.parties.company.phone}\n`;
  }
  if (content.parties.company.email) {
    formatted += `Email: ${content.parties.company.email}\n`;
  }
  formatted += `Selanjutnya disebut sebagai "PERUSAHAAN"\n\n`;
  
  formatted += `PIHAK KEDUA (GUIDE):\n`;
  formatted += `Nama Lengkap: ${content.parties.guide.name}\n`;
  if (content.parties.guide.idNumber) {
    formatted += `No. KTP/NIK: ${content.parties.guide.idNumber}\n`;
  }
  if (content.parties.guide.address) {
    formatted += `Alamat: ${content.parties.guide.address}\n`;
  }
  if (content.parties.guide.phone) {
    formatted += `Telepon: ${content.parties.guide.phone}\n`;
  }
  if (content.parties.guide.email) {
    formatted += `Email: ${content.parties.guide.email}\n`;
  }
  formatted += `Selanjutnya disebut sebagai "GUIDE"\n\n`;
  
  formatted += `Kedua belah pihak secara bersama-sama disebut sebagai "PARA PIHAK" dan secara sendiri-sendiri disebut sebagai "PIHAK".\n\n`;
  
  // Contract Details
  formatted += `PASAL 1 - KETENTUAN UMUM\n\n`;
  formatted += `Pada hari ini, ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, telah dibuat dan disepakati Perjanjian Kerja Sama antara:\n\n`;
  formatted += `Nomor Kontrak: ${content.contractDetails.contractNumber}\n`;
  formatted += `Jenis Kontrak: Kontrak Kerja Tahunan (Master Contract)\n`;
  formatted += `Tanggal Mulai: ${new Date(content.contractDetails.effectiveDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
  formatted += `Tanggal Berakhir: ${new Date(content.contractDetails.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
  if (content.contractDetails.renewalDate) {
    formatted += `Tanggal Perpanjangan: ${new Date(content.contractDetails.renewalDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
  }
  formatted += `\n`;
  
  // Scope of Work
  formatted += `PASAL 2 - RUANG LINGKUP KERJA\n`;
  formatted += `${content.scopeOfWork.description}\n\n`;
  
  formatted += `2.1. Tanggung Jawab Guide:\n`;
  content.scopeOfWork.responsibilities.forEach((resp, idx) => {
    formatted += `   ${idx + 1}. ${resp}\n`;
  });
  formatted += `\n`;
  
  formatted += `2.2. Deliverables:\n`;
  content.scopeOfWork.deliverables.forEach((deliverable, idx) => {
    formatted += `   ${idx + 1}. ${deliverable}\n`;
  });
  formatted += `\n`;
  
  formatted += `2.3. Standar Kinerja:\n`;
  content.scopeOfWork.performanceStandards.forEach((standard, idx) => {
    formatted += `   ${idx + 1}. ${standard}\n`;
  });
  formatted += `\n`;
  
  // Compensation
  formatted += `PASAL 3 - KOMPENSASI DAN PEMBAYARAN\n`;
  formatted += `3.1. Struktur Fee: ${content.compensation.feeStructure === 'per_trip_assignment' ? 'Fee per Trip Assignment' : content.compensation.feeStructure}\n`;
  formatted += `3.2. Syarat Pembayaran: ${content.compensation.paymentTerms}\n`;
  formatted += `3.3. Metode Pembayaran: ${content.compensation.paymentMethod}\n`;
  formatted += `3.4. Kewajiban Perpajakan: ${content.compensation.taxObligations}\n`;
  formatted += `\n`;
  
  // Terms
  formatted += `PASAL 4 - SYARAT DAN KETENTUAN\n`;
  formatted += `4.1. Status Hubungan Kerja: ${content.terms.employmentType === 'freelancer' ? 'Freelancer/Independent Contractor' : content.terms.employmentType}\n`;
  if (content.terms.exclusivity) {
    formatted += `4.2. Eksklusivitas: ${content.terms.exclusivity}\n`;
  }
  if (content.terms.nonCompete) {
    formatted += `4.3. Non-Compete: ${content.terms.nonCompete}\n`;
  }
  formatted += `4.4. Kerahasiaan: ${content.terms.confidentiality}\n`;
  formatted += `4.5. Hak Kekayaan Intelektual: ${content.terms.intellectualProperty}\n`;
  formatted += `4.6. Pengakhiran Kontrak:\n`;
  formatted += `   a. Oleh Perusahaan: ${content.terms.termination.byCompany}\n`;
  formatted += `   b. Oleh Guide: ${content.terms.termination.byGuide}\n`;
  formatted += `   c. Masa Pemberitahuan: ${content.terms.termination.noticePeriod}\n`;
  formatted += `4.7. Penyelesaian Sengketa: ${content.terms.disputeResolution}\n`;
  formatted += `4.8. Hukum yang Berlaku: ${content.terms.governingLaw}\n`;
  formatted += `4.9. Perubahan Perjanjian: ${content.terms.amendments}\n`;
  formatted += `4.10. Perjanjian Lengkap: ${content.terms.entireAgreement}\n`;
  formatted += `\n`;
  
  // Additional Clauses
  if (content.additionalClauses) {
    formatted += `PASAL 5 - KETENTUAN TAMBAHAN\n`;
    if (content.additionalClauses.insurance) {
      formatted += `5.1. Asuransi: ${content.additionalClauses.insurance}\n`;
    }
    if (content.additionalClauses.equipment) {
      formatted += `5.2. Peralatan: ${content.additionalClauses.equipment}\n`;
    }
    if (content.additionalClauses.training) {
      formatted += `5.3. Pelatihan: ${content.additionalClauses.training}\n`;
    }
    if (content.additionalClauses.codeOfConduct) {
      formatted += `5.4. Kode Etik: ${content.additionalClauses.codeOfConduct}\n`;
    }
    if (content.additionalClauses.safety) {
      formatted += `5.5. Keselamatan: ${content.additionalClauses.safety}\n`;
    }
    if (content.additionalClauses.dataProtection) {
      formatted += `5.6. Perlindungan Data: ${content.additionalClauses.dataProtection}\n`;
    }
    formatted += `\n`;
  }
  
  formatted += `PASAL 6 - PENUTUP\n`;
  formatted += `Perjanjian ini berlaku efektif sejak ditandatangani oleh kedua belah pihak dan akan tetap berlaku sampai dengan tanggal berakhirnya kontrak atau sampai diakhiri sesuai dengan ketentuan dalam perjanjian ini.\n\n`;
  formatted += `Dengan menandatangani perjanjian ini, kedua belah pihak menyatakan telah membaca, memahami, dan menyetujui semua ketentuan yang tercantum dalam perjanjian ini.\n`;
  
  return formatted;
}
