/**
 * BMKG Weather Advisory Integration
 * Fetches weather data from BMKG API for Duty of Care and ISO 31030 compliance
 *
 * Data Sources:
 * - BMKG Open Data API
 * - Maritime Weather API
 */

import { logger } from '@/lib/utils/logger';

// BMKG API endpoints
const BMKG_BASE_URL = 'https://data.bmkg.go.id/DataMKG/MEWS';
const BMKG_MARITIME_URL = 'https://data.bmkg.go.id/DataMKG/TEWS';

// Types
export type WeatherSeverity = 'info' | 'advisory' | 'watch' | 'warning' | 'danger';

export type BMKGWeatherData = {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    province: string;
  };
  current: {
    temperature: number;
    humidity: number;
    weather_code: string;
    weather_desc: string;
    wind_speed: number;
    wind_direction: string;
    visibility: number;
  };
  forecast: Array<{
    datetime: string;
    temperature: number;
    weather_code: string;
    weather_desc: string;
    wind_speed: number;
    humidity: number;
  }>;
  maritime?: {
    wave_height: number;
    wave_direction: string;
    sea_state: string;
    current_speed: number;
    tide_status: string;
  };
  warnings: Array<{
    type: string;
    severity: WeatherSeverity;
    title: string;
    description: string;
    valid_from: string;
    valid_until: string;
  }>;
};

export type TravelAdvisory = {
  source: 'bmkg' | 'kemenlu' | 'basarnas' | 'bnpb' | 'internal';
  advisory_type: 'weather' | 'maritime' | 'security' | 'health' | 'natural_disaster';
  severity: WeatherSeverity;
  title: string;
  description: string;
  recommendations: string[];
  affected_regions: string[];
  affected_locations: Array<{
    name: string;
    latitude: number;
    longitude: number;
    radius_km: number;
  }>;
  valid_from: Date;
  valid_until?: Date;
  weather_data?: Record<string, unknown>;
  maritime_data?: Record<string, unknown>;
};

// Wave height to severity mapping
function getWaveSeverity(waveHeight: number): WeatherSeverity {
  if (waveHeight >= 4) return 'danger';
  if (waveHeight >= 2.5) return 'warning';
  if (waveHeight >= 1.5) return 'watch';
  if (waveHeight >= 1) return 'advisory';
  return 'info';
}

// Wind speed to severity mapping (in knots)
function getWindSeverity(windSpeed: number): WeatherSeverity {
  if (windSpeed >= 34) return 'danger'; // Gale force
  if (windSpeed >= 25) return 'warning'; // Strong breeze
  if (windSpeed >= 17) return 'watch'; // Fresh breeze
  if (windSpeed >= 11) return 'advisory'; // Moderate breeze
  return 'info';
}

// Weather code to description mapping
const WEATHER_CODES: Record<string, string> = {
  '0': 'Cerah',
  '1': 'Cerah Berawan',
  '2': 'Cerah Berawan',
  '3': 'Berawan',
  '4': 'Berawan Tebal',
  '5': 'Udara Kabur',
  '10': 'Asap',
  '45': 'Kabut',
  '60': 'Hujan Ringan',
  '61': 'Hujan Sedang',
  '63': 'Hujan Lebat',
  '80': 'Hujan Lokal',
  '95': 'Hujan Petir',
  '97': 'Hujan Petir',
};

/**
 * Fetch weather data from BMKG API
 * Note: BMKG provides data in XML format, we need to parse it
 */
export async function fetchBMKGWeather(
  latitude: number,
  longitude: number,
  provinceCode: string = '35' // Default: DKI Jakarta
): Promise<BMKGWeatherData | null> {
  try {
    // BMKG uses province-based data files
    const url = `${BMKG_BASE_URL}/DigitalForecast-${provinceCode}.xml`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      logger.warn('BMKG API returned non-OK status', {
        status: response.status,
        provinceCode,
      });
      return null;
    }

    const xmlText = await response.text();

    // In a real implementation, we'd parse the XML
    // For now, return mock data structure
    logger.info('BMKG weather data fetched', { provinceCode });

    // Mock response for development
    return {
      location: {
        name: 'Unknown',
        latitude,
        longitude,
        province: provinceCode,
      },
      current: {
        temperature: 28,
        humidity: 75,
        weather_code: '3',
        weather_desc: 'Berawan',
        wind_speed: 15,
        wind_direction: 'W',
        visibility: 10,
      },
      forecast: [],
      warnings: [],
    };
  } catch (error) {
    logger.error('Failed to fetch BMKG weather', error, { latitude, longitude });
    return null;
  }
}

/**
 * Fetch maritime weather (wave height, sea conditions)
 */
export async function fetchMaritimeWeather(
  latitude: number,
  longitude: number
): Promise<BMKGWeatherData['maritime'] | null> {
  try {
    // BMKG maritime data endpoint
    // In production, this would fetch actual maritime data
    logger.info('Fetching maritime weather', { latitude, longitude });

    // Mock maritime data for development
    return {
      wave_height: 1.5,
      wave_direction: 'SW',
      sea_state: 'moderate',
      current_speed: 2,
      tide_status: 'rising',
    };
  } catch (error) {
    logger.error('Failed to fetch maritime weather', error, { latitude, longitude });
    return null;
  }
}

/**
 * Convert BMKG data to Travel Advisory format
 */
export function convertToTravelAdvisory(
  weatherData: BMKGWeatherData,
  location: { name: string; latitude: number; longitude: number }
): TravelAdvisory[] {
  const advisories: TravelAdvisory[] = [];

  // Check maritime conditions
  if (weatherData.maritime) {
    const { wave_height, current_speed } = weatherData.maritime;
    const waveSeverity = getWaveSeverity(wave_height);

    if (waveSeverity !== 'info') {
      advisories.push({
        source: 'bmkg',
        advisory_type: 'maritime',
        severity: waveSeverity,
        title: `Peringatan Gelombang ${wave_height >= 2.5 ? 'Tinggi' : 'Sedang'}`,
        description: `Tinggi gelombang mencapai ${wave_height}m di area ${location.name}. Harap berhati-hati.`,
        recommendations: [
          wave_height >= 2.5 ? 'Pertimbangkan untuk menunda perjalanan' : 'Monitor kondisi cuaca',
          'Pastikan semua penumpang menggunakan life jacket',
          'Siapkan peralatan darurat',
          'Jaga komunikasi dengan base camp',
        ],
        affected_regions: [location.name],
        affected_locations: [
          {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            radius_km: 50,
          },
        ],
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        maritime_data: {
          wave_height_m: wave_height,
          current_speed_knots: current_speed,
          sea_state: weatherData.maritime.sea_state,
        },
      });
    }
  }

  // Check wind conditions
  const windSeverity = getWindSeverity(weatherData.current.wind_speed);
  if (windSeverity !== 'info') {
    advisories.push({
      source: 'bmkg',
      advisory_type: 'weather',
      severity: windSeverity,
      title: `Peringatan Angin ${weatherData.current.wind_speed >= 25 ? 'Kencang' : 'Sedang'}`,
      description: `Kecepatan angin ${weatherData.current.wind_speed} knots dari arah ${weatherData.current.wind_direction}`,
      recommendations: [
        'Kurangi kecepatan kapal',
        'Amankan barang-barang yang mudah terbang',
        'Perhatikan keseimbangan penumpang',
      ],
      affected_regions: [location.name],
      affected_locations: [
        {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          radius_km: 50,
        },
      ],
      valid_from: new Date(),
      weather_data: {
        wind_speed_knots: weatherData.current.wind_speed,
        wind_direction: weatherData.current.wind_direction,
      },
    });
  }

  // Add any existing warnings from BMKG
  for (const warning of weatherData.warnings) {
    advisories.push({
      source: 'bmkg',
      advisory_type: warning.type as TravelAdvisory['advisory_type'],
      severity: warning.severity,
      title: warning.title,
      description: warning.description,
      recommendations: [],
      affected_regions: [location.name],
      affected_locations: [
        {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          radius_km: 100,
        },
      ],
      valid_from: new Date(warning.valid_from),
      valid_until: warning.valid_until ? new Date(warning.valid_until) : undefined,
    });
  }

  return advisories;
}

/**
 * Get weather description from code
 */
export function getWeatherDescription(code: string): string {
  return WEATHER_CODES[code] || 'Unknown';
}

/**
 * Province code mapping for BMKG API
 */
export const PROVINCE_CODES: Record<string, string> = {
  'DKI Jakarta': '31',
  Banten: '36',
  'Jawa Barat': '32',
  'Jawa Tengah': '33',
  'Jawa Timur': '35',
  Lampung: '18',
  Bali: '51',
  'Sulawesi Selatan': '73',
  'Kalimantan Timur': '64',
  'Sumatera Utara': '12',
};

/**
 * Get province code from region name
 */
export function getProvinceCode(region: string): string {
  return PROVINCE_CODES[region] || '31'; // Default to DKI Jakarta
}

