/**
 * Destinations Data
 * Comprehensive destination information
 */

export type Destination = {
  id: string;
  slug: string;
  name: string;
  province: string;
  description: string;
  longDescription: string;
  featuredImage: string;
  gallery: string[];
  highlights: string[];
  bestTime: string;
  weatherInfo: {
    drySeasonStart: string;
    drySeasonEnd: string;
    wetSeasonStart: string;
    wetSeasonEnd: string;
    avgTemperature: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  attractions: Array<{
    name: string;
    description: string;
    type: 'snorkeling' | 'diving' | 'beach' | 'island' | 'activity';
  }>;
  tips: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

/**
 * Get all destinations
 */
export async function getAllDestinations(): Promise<Destination[]> {
  // TODO: Replace with database query
  return getDestinationsData();
}

/**
 * Get destination by slug
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const destinations = await getAllDestinations();
  return destinations.find((d) => d.slug === slug) || null;
}

/**
 * Get destinations by province
 */
export async function getDestinationsByProvince(province: string): Promise<Destination[]> {
  const destinations = await getAllDestinations();
  return destinations.filter((d) => d.province === province);
}

/**
 * Sample destinations data
 */
function getDestinationsData(): Destination[] {
  return [
    {
      id: '1',
      slug: 'pahawang',
      name: 'Pulau Pahawang',
      province: 'Lampung',
      description:
        'Surga snorkeling dengan air laut jernih dan terumbu karang indah. Destinasi favorit untuk island hopping dan wisata bahari.',
      longDescription: `
Pulau Pahawang adalah destinasi wisata bahari yang terletak di Teluk Lampung. Dikenal dengan airnya yang jernih dan terumbu karang yang indah, Pahawang menjadi surga bagi para pecinta snorkeling dan diving.

Pulau ini terdiri dari dua pulau utama: Pahawang Besar dan Pahawang Kecil. Keduanya menawarkan pemandangan bawah laut yang menakjubkan dengan berbagai jenis ikan tropis dan terumbu karang yang masih terjaga.

Selain snorkeling, Anda juga bisa menikmati island hopping ke pulau-pulau kecil di sekitarnya, seperti Pulau Kelagian dan Pulau Tegal Mas. Setiap pulau memiliki keunikan tersendiri yang sayang untuk dilewatkan.
      `,
      featuredImage: '/images/destinations/pahawang-hero.jpg',
      gallery: [
        '/images/destinations/pahawang-1.jpg',
        '/images/destinations/pahawang-2.jpg',
        '/images/destinations/pahawang-3.jpg',
      ],
      highlights: [
        'Snorkeling dengan visibilitas hingga 15 meter',
        'Terumbu karang yang masih terjaga',
        'Island hopping ke 5+ pulau kecil',
        'Sunset view yang menakjubkan',
        'Spot foto Instagram-able',
      ],
      bestTime: 'April - Oktober (musim kemarau)',
      weatherInfo: {
        drySeasonStart: 'April',
        drySeasonEnd: 'Oktober',
        wetSeasonStart: 'November',
        wetSeasonEnd: 'Maret',
        avgTemperature: '26-32°C',
      },
      coordinates: {
        lat: -5.732,
        lng: 105.189,
      },
      attractions: [
        {
          name: 'Spot Snorkeling Pahawang Besar',
          description:
            'Area snorkeling dengan terumbu karang terbaik dan ikan-ikan tropis yang beragam',
          type: 'snorkeling',
        },
        {
          name: 'Pulau Kelagian',
          description: 'Pulau kecil dengan pasir putih dan spot foto yang Instagramable',
          type: 'island',
        },
        {
          name: 'Pulau Tegal Mas',
          description: 'Pulau dengan air laut yang sangat jernih, cocok untuk snorkeling',
          type: 'island',
        },
      ],
      tips: [
        'Bawa sunscreen SPF 50+ untuk perlindungan maksimal',
        'Gunakan rashguard untuk melindungi kulit dari sinar matahari',
        'Jangan sentuh terumbu karang saat snorkeling',
        'Bawa kamera underwater untuk dokumentasi',
        'Pesan paket trip jauh-jauh hari untuk harga terbaik',
      ],
      faqs: [
        {
          question: 'Kapan waktu terbaik mengunjungi Pahawang?',
          answer:
            'Waktu terbaik adalah April-Oktober saat musim kemarau. Laut lebih tenang dan cuaca cerah.',
        },
        {
          question: 'Apakah peralatan snorkeling disediakan?',
          answer:
            'Ya, sebagian besar paket trip sudah termasuk peralatan snorkeling (masker, snorkel, fin, dan life jacket).',
        },
        {
          question: 'Berapa lama perjalanan dari Bandar Lampung?',
          answer:
            'Sekitar 1 jam perjalanan darat dari Bandar Lampung ke pelabuhan, dilanjutkan 30-45 menit perjalanan laut.',
        },
      ],
    },
    {
      id: '2',
      slug: 'kiluan',
      name: 'Teluk Kiluan',
      province: 'Lampung',
      description:
        'Spot terbaik untuk melihat lumba-lumba di habitat aslinya. Teluk indah dengan pemandangan bukit hijau dan laut biru.',
      longDescription: `
Teluk Kiluan adalah destinasi wisata yang terkenal dengan dolphin watching. Setiap pagi, ratusan lumba-lumba muncul di perairan teluk untuk berburu ikan.

Selain dolphin watching, Teluk Kiluan juga menawarkan keindahan alam yang luar biasa. Dikelilingi oleh bukit-bukit hijau, teluk ini memiliki pantai dengan pasir putih dan air laut yang jernih.

Untuk pengalaman yang lebih adventurous, Anda bisa mendaki Bukit Kiluan untuk menikmati sunset dan pemandangan teluk dari ketinggian.
      `,
      featuredImage: '/images/destinations/kiluan-hero.jpg',
      gallery: [
        '/images/destinations/kiluan-1.jpg',
        '/images/destinations/kiluan-2.jpg',
      ],
      highlights: [
        'Dolphin watching dengan 90% success rate',
        'Snorkeling di spot tersembunyi',
        'Sunset view dari Bukit Kiluan',
        'Pantai pasir putih yang bersih',
        'Spot tracking lumba-lumba',
      ],
      bestTime: 'April - September (musim lumba-lumba)',
      weatherInfo: {
        drySeasonStart: 'April',
        drySeasonEnd: 'Oktober',
        wetSeasonStart: 'November',
        wetSeasonEnd: 'Maret',
        avgTemperature: '24-31°C',
      },
      coordinates: {
        lat: -5.693,
        lng: 104.694,
      },
      attractions: [
        {
          name: 'Dolphin Watching Point',
          description:
            'Spot terbaik untuk melihat lumba-lumba, waktu terbaik: 06:00-09:00',
          type: 'activity',
        },
        {
          name: 'Pantai Kiluan',
          description: 'Pantai dengan pasir putih dan air laut yang jernih',
          type: 'beach',
        },
        {
          name: 'Bukit Kiluan',
          description: 'Spot sunset terbaik dengan view teluk dari ketinggian',
          type: 'activity',
        },
      ],
      tips: [
        'Berangkat pagi-pagi untuk dolphin watching (06:00-07:00)',
        'Bawa jaket karena angin laut di pagi hari cukup dingin',
        'Jangan berenang terlalu dekat dengan lumba-lumba',
        'Naik ke Bukit Kiluan untuk sunset view yang epic',
        'Bawa power bank karena spot foto banyak',
      ],
      faqs: [
        {
          question: 'Apakah dijamin bisa melihat lumba-lumba?',
          answer:
            'Success rate sekitar 90% terutama di musim kemarau. Lumba-lumba muncul untuk berburu ikan di pagi hari.',
        },
        {
          question: 'Apakah bisa berenang dengan lumba-lumba?',
          answer:
            'Tidak disarankan untuk berenang langsung dengan lumba-lumba demi keselamatan dan konservasi satwa.',
        },
      ],
    },
    {
      id: '3',
      slug: 'labuan-bajo',
      name: 'Labuan Bajo',
      province: 'Nusa Tenggara Timur',
      description:
        'Gerbang menuju Taman Nasional Komodo. Destinasi world-class dengan keindahan alam yang menakjubkan.',
      longDescription: `
Labuan Bajo adalah kota pesisir yang menjadi pintu gerbang menuju Taman Nasional Komodo. Destinasi ini menawarkan pengalaman wisata kelas dunia dengan kombinasi keindahan bawah laut dan darat yang luar biasa.

Komodo, pink beach, snorkeling di Manta Point, dan sunset di Bukit Cinta adalah beberapa highlight yang wajib Anda kunjungi.
      `,
      featuredImage: '/images/destinations/labuan-bajo-hero.jpg',
      gallery: [],
      highlights: [
        'Melihat komodo di habitat asli',
        'Pink Beach - pantai pasir merah muda',
        'Snorkeling dengan Manta Ray',
        'Trekking ke Padar Island',
        'Sunset sailing',
      ],
      bestTime: 'April - November',
      weatherInfo: {
        drySeasonStart: 'April',
        drySeasonEnd: 'November',
        wetSeasonStart: 'Desember',
        wetSeasonEnd: 'Maret',
        avgTemperature: '25-33°C',
      },
      coordinates: {
        lat: -8.486,
        lng: 119.888,
      },
      attractions: [
        {
          name: 'Pulau Komodo',
          description: 'Habitat asli komodo dan trekking adventure',
          type: 'island',
        },
        {
          name: 'Pink Beach',
          description: 'Pantai dengan pasir berwarna pink yang unik',
          type: 'beach',
        },
        {
          name: 'Manta Point',
          description: 'Spot snorkeling dengan Manta Ray',
          type: 'snorkeling',
        },
      ],
      tips: [
        'Booking jauh-jauh hari karena high season',
        'Bawa trekking shoes untuk island hopping',
        'Respect wildlife - jangan terlalu dekat dengan komodo',
        'Bawa underwater camera untuk dokumentasi',
      ],
      faqs: [
        {
          question: 'Apakah aman melihat komodo?',
          answer:
            'Ya, selalu didampingi ranger berpengalaman. Ikuti instruksi dan jangan mendekati komodo.',
        },
      ],
    },
    {
      id: '4',
      slug: 'raja-ampat',
      name: 'Raja Ampat',
      province: 'Papua Barat',
      description:
        'Surga diving kelas dunia dengan biodiversity tertinggi di planet ini. Destinasi impian para penyelam.',
      longDescription: `
Raja Ampat adalah kepulauan yang terletak di ujung barat Papua. Dikenal sebagai tempat dengan biodiversity laut tertinggi di dunia, Raja Ampat adalah surga bagi para penyelam dan pecinta keindahan alam.

Dengan lebih dari 1,500 spesies ikan dan 600 spesies karang, Raja Ampat menawarkan pengalaman diving yang tak tertandingi. Pemandangan karst island yang ikonik juga menjadi daya tarik utama.
      `,
      featuredImage: '/images/destinations/raja-ampat-hero.jpg',
      gallery: [],
      highlights: [
        'Diving di spot kelas dunia',
        '1,500+ spesies ikan',
        'Karst island yang ikonik',
        'Piaynemo viewpoint',
        'Biodiversity tertinggi di dunia',
      ],
      bestTime: 'Oktober - April',
      weatherInfo: {
        drySeasonStart: 'Oktober',
        drySeasonEnd: 'April',
        wetSeasonStart: 'Mei',
        wetSeasonEnd: 'September',
        avgTemperature: '27-32°C',
      },
      coordinates: {
        lat: -0.233,
        lng: 130.517,
      },
      attractions: [
        {
          name: 'Piaynemo',
          description: 'Viewpoint ikonik dengan pemandangan karst island',
          type: 'island',
        },
        {
          name: 'Cape Kri',
          description: 'Spot diving terbaik dengan biodiversity tertinggi',
          type: 'diving',
        },
      ],
      tips: [
        'Budget tinggi - destinasi premium',
        'Bawa sertifikat diving jika ingin diving',
        'Booking liveaboard untuk pengalaman terbaik',
        'Bawa banyak kartu memori untuk foto',
      ],
      faqs: [],
    },
    {
      id: '5',
      slug: 'karimunjawa',
      name: 'Karimunjawa',
      province: 'Jawa Tengah',
      description:
        'Kepulauan tropis dengan 27 pulau indah. Alternatif wisata bahari yang terjangkau dan mudah diakses.',
      longDescription: `
Karimunjawa adalah kepulauan yang terdiri dari 27 pulau di Laut Jawa. Dengan akses yang mudah dari Semarang atau Jepara, Karimunjawa menjadi alternatif wisata bahari yang populer.

Snorkeling, island hopping, dan menikmati sunset adalah aktivitas favorit di sini.
      `,
      featuredImage: '/images/destinations/karimunjawa-hero.jpg',
      gallery: [],
      highlights: [
        '27 pulau untuk island hopping',
        'Snorkeling di spot terbaik',
        'Terjangkau dan mudah diakses',
        'Sunrise dan sunset yang indah',
      ],
      bestTime: 'Maret - Oktober',
      weatherInfo: {
        drySeasonStart: 'Maret',
        drySeasonEnd: 'Oktober',
        wetSeasonStart: 'November',
        wetSeasonEnd: 'Februari',
        avgTemperature: '26-32°C',
      },
      coordinates: {
        lat: -5.817,
        lng: 110.417,
      },
      attractions: [],
      tips: [
        'Akses via kapal ferry dari Jepara atau Semarang',
        'Bawa cash karena ATM terbatas',
        'Pesan homestay jauh-jauh hari',
      ],
      faqs: [],
    },
    {
      id: '6',
      slug: 'tanjung-lesung',
      name: 'Tanjung Lesung',
      province: 'Banten',
      description:
        'Pantai eksotis dengan pasir putih dan air laut jernih. Dekat dari Jakarta, cocok untuk weekend getaway.',
      longDescription: `
Tanjung Lesung adalah destinasi wisata pantai yang terletak di Banten, hanya beberapa jam dari Jakarta. Dengan pasir putih dan air laut yang jernih, Tanjung Lesung cocok untuk weekend getaway.

Selain berenang dan snorkeling, Anda juga bisa mengunjungi Pulau Umang dan menikmati berbagai watersport.
      `,
      featuredImage: '/images/destinations/tanjung-lesung-hero.jpg',
      gallery: [],
      highlights: [
        'Dekat dari Jakarta (3-4 jam)',
        'Pantai pasir putih yang bersih',
        'Watersport activities',
        'Resort & villa mewah',
      ],
      bestTime: 'April - Oktober',
      weatherInfo: {
        drySeasonStart: 'April',
        drySeasonEnd: 'Oktober',
        wetSeasonStart: 'November',
        wetSeasonEnd: 'Maret',
        avgTemperature: '25-32°C',
      },
      coordinates: {
        lat: -6.583,
        lng: 105.65,
      },
      attractions: [],
      tips: [
        'Hindari long weekend untuk menghindari macet',
        'Booking resort early untuk harga lebih baik',
        'Bawa perlengkapan watersport sendiri',
      ],
      faqs: [],
    },
  ];
}

