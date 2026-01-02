/**
 * Authors Database
 * Static author data for E-E-A-T SEO signals
 */

import type { AuthorSchemaInput } from './types';

// ============================================
// Author Type Extended
// ============================================

export type Author = AuthorSchemaInput & {
  id: string;
  role: string;
  verified: boolean;
  expertise: string[];
  bio: string;
  shortBio: string;
};

// ============================================
// Authors Database
// ============================================

export const AUTHORS: Record<string, Author> = {
  founder: {
    id: 'founder',
    name: 'Ahmad Fadli',
    jobTitle: 'Founder & CEO',
    role: 'Founder',
    description:
      'Pendiri MyAeroTravel dengan pengalaman lebih dari 10 tahun di industri pariwisata Indonesia.',
    image: '/team/ahmad-fadli.jpg',
    url: 'https://aerotravel.co.id/team/ahmad-fadli',
    email: 'ahmad@myaerotravel.id',
    sameAs: [
      'https://www.linkedin.com/in/ahmad-fadli',
      'https://twitter.com/ahmadfadli',
    ],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
    verified: true,
    expertise: ['Marine Tourism', 'Travel Management', 'Destination Development'],
    bio: 'Ahmad Fadli adalah pendiri dan CEO MyAeroTravel, sebuah platform travel management terkemuka di Indonesia. Dengan latar belakang di bidang pariwisata dan teknologi, Ahmad telah memimpin transformasi digital industri travel di Lampung dan sekitarnya. Pengalamannya selama lebih dari satu dekade mencakup pengembangan destinasi wisata bahari, manajemen operasional travel, dan inovasi teknologi untuk meningkatkan pengalaman wisatawan.',
    shortBio: 'Pendiri MyAeroTravel dengan 10+ tahun pengalaman di industri pariwisata.',
  },

  operationsHead: {
    id: 'operations-head',
    name: 'Siti Nurhaliza',
    jobTitle: 'Head of Operations',
    role: 'Operations',
    description:
      'Memimpin tim operasional MyAeroTravel dengan fokus pada keselamatan dan kepuasan pelanggan.',
    image: '/team/siti-nurhaliza.jpg',
    url: 'https://aerotravel.co.id/team/siti-nurhaliza',
    email: 'siti@myaerotravel.id',
    sameAs: ['https://www.linkedin.com/in/siti-nurhaliza-travel'],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
    verified: true,
    expertise: ['Operations Management', 'Safety Protocols', 'Customer Experience'],
    bio: 'Siti Nurhaliza memimpin divisi operasional MyAeroTravel, memastikan setiap perjalanan berjalan dengan aman dan menyenangkan. Dengan sertifikasi dalam manajemen risiko wisata dan pengalaman luas dalam koordinasi tim lapangan, Siti bertanggung jawab atas standar keselamatan yang ketat dan pengalaman pelanggan yang luar biasa.',
    shortBio: 'Head of Operations dengan keahlian manajemen keselamatan wisata.',
  },

  tripCurator: {
    id: 'trip-curator',
    name: 'Budi Santoso',
    jobTitle: 'Senior Trip Curator',
    role: 'Content',
    description:
      'Trip curator berpengalaman yang merancang pengalaman wisata unik dan berkesan.',
    image: '/team/budi-santoso.jpg',
    url: 'https://aerotravel.co.id/team/budi-santoso',
    email: 'budi@myaerotravel.id',
    sameAs: ['https://www.instagram.com/budisantoso_travel'],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
    verified: true,
    expertise: ['Trip Planning', 'Destination Expertise', 'Photography'],
    bio: 'Budi Santoso adalah Senior Trip Curator di MyAeroTravel yang telah menjelajahi lebih dari 50 destinasi di Indonesia. Keahliannya dalam merancang itinerary yang sempurna dan pengetahuan mendalam tentang destinasi wisata bahari menjadikannya curator handal untuk pengalaman wisata yang tak terlupakan.',
    shortBio: 'Trip Curator dengan pengalaman menjelajahi 50+ destinasi Indonesia.',
  },

  marketingHead: {
    id: 'marketing-head',
    name: 'Dewi Lestari',
    jobTitle: 'Head of Marketing',
    role: 'Marketing',
    description: 'Memimpin strategi pemasaran dan branding MyAeroTravel.',
    image: '/team/dewi-lestari.jpg',
    url: 'https://aerotravel.co.id/team/dewi-lestari',
    email: 'dewi@myaerotravel.id',
    sameAs: [
      'https://www.linkedin.com/in/dewi-lestari-marketing',
      'https://twitter.com/dewilestari',
    ],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
    verified: true,
    expertise: ['Digital Marketing', 'Content Strategy', 'Brand Development'],
    bio: 'Dewi Lestari memimpin tim pemasaran MyAeroTravel dengan fokus pada strategi digital dan pengembangan brand. Pengalamannya di industri travel dan digital marketing membantu MyAeroTravel menjangkau lebih banyak wisatawan Indonesia.',
    shortBio: 'Head of Marketing dengan keahlian digital marketing dan branding.',
  },

  techLead: {
    id: 'tech-lead',
    name: 'Ricky Wijaya',
    jobTitle: 'Chief Technology Officer',
    role: 'Technology',
    description: 'Memimpin pengembangan teknologi dan inovasi digital MyAeroTravel.',
    image: '/team/ricky-wijaya.jpg',
    url: 'https://aerotravel.co.id/team/ricky-wijaya',
    email: 'ricky@myaerotravel.id',
    sameAs: [
      'https://www.linkedin.com/in/ricky-wijaya-tech',
      'https://github.com/rickywijaya',
    ],
    worksFor: {
      name: 'MyAeroTravel',
      url: 'https://aerotravel.co.id',
    },
    verified: true,
    expertise: ['Software Engineering', 'AI/ML', 'Travel Tech'],
    bio: 'Ricky Wijaya adalah CTO MyAeroTravel yang bertanggung jawab atas pengembangan platform teknologi. Dengan latar belakang di perusahaan teknologi terkemuka, Ricky memimpin tim dalam membangun solusi inovatif termasuk AI-powered booking assistant dan real-time trip tracking.',
    shortBio: 'CTO dengan keahlian di AI/ML dan travel technology.',
  },
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get author by ID
 */
export function getAuthor(id: string): Author | undefined {
  return AUTHORS[id];
}

/**
 * Get all authors
 */
export function getAllAuthors(): Author[] {
  return Object.values(AUTHORS);
}

/**
 * Get default author for content
 */
export function getDefaultAuthor(): Author {
  return AUTHORS.tripCurator;
}

/**
 * Get author for schema.org
 */
export function getAuthorForSchema(id: string): AuthorSchemaInput {
  const author = AUTHORS[id];
  if (!author) {
    return {
      name: 'MyAeroTravel Team',
      worksFor: {
        name: 'MyAeroTravel',
        url: 'https://aerotravel.co.id',
      },
    };
  }

  return {
    name: author.name,
    jobTitle: author.jobTitle,
    description: author.description,
    image: author.image,
    url: author.url,
    email: author.email,
    sameAs: author.sameAs,
    worksFor: author.worksFor,
  };
}

/**
 * Get authors by role
 */
export function getAuthorsByRole(role: string): Author[] {
  return Object.values(AUTHORS).filter((author) => author.role === role);
}

