/**
 * Risk Scoring System for Pre-Trip Safety
 * Calculates risk score based on checklist responses, weather, and other factors
 * Risk levels: GREEN (0-30), YELLOW (31-60), RED (61-100)
 */

import { logger } from '@/lib/utils/logger';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export type RiskFactor = {
  id: string;
  name: string;
  weight: number; // 0-1
  value: number; // 0-100
  source: 'checklist' | 'weather' | 'equipment' | 'certification' | 'passenger' | 'custom';
  details?: string;
};

export type RiskAssessment = {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  blocked: boolean;
  blockReason?: string;
  overrideAllowed: boolean;
  recommendations: string[];
  assessedAt: string;
};

export type ChecklistResponse = {
  itemId: string;
  checked: boolean;
  notes?: string;
};

export type WeatherData = {
  condition: string;
  windSpeed?: number; // km/h
  waveHeight?: number; // meters
  visibility?: number; // km
  hasAlert?: boolean;
  alertType?: string;
};

export type EquipmentStatus = {
  totalItems: number;
  checkedItems: number;
  itemsNeedingRepair: number;
  lifejacketCount: number;
  passengerCount: number;
};

export type CertificationStatus = {
  validCertifications: number;
  expiredCertifications: number;
  expiringWithin30Days: number;
};

/**
 * Calculate risk score from multiple factors
 */
export function calculateRiskScore(params: {
  checklistResponses: ChecklistResponse[];
  weather?: WeatherData;
  equipment?: EquipmentStatus;
  certifications?: CertificationStatus;
  passengerCount?: number;
}): RiskAssessment {
  const factors: RiskFactor[] = [];
  const recommendations: string[] = [];

  // 1. Checklist Risk (weight: 0.3)
  const checklistRisk = calculateChecklistRisk(params.checklistResponses);
  factors.push({
    id: 'checklist',
    name: 'Safety Checklist',
    weight: 0.3,
    value: checklistRisk.score,
    source: 'checklist',
    details: checklistRisk.details,
  });
  if (checklistRisk.recommendations.length > 0) {
    recommendations.push(...checklistRisk.recommendations);
  }

  // 2. Weather Risk (weight: 0.25)
  if (params.weather) {
    const weatherRisk = calculateWeatherRisk(params.weather);
    factors.push({
      id: 'weather',
      name: 'Kondisi Cuaca',
      weight: 0.25,
      value: weatherRisk.score,
      source: 'weather',
      details: weatherRisk.details,
    });
    if (weatherRisk.recommendations.length > 0) {
      recommendations.push(...weatherRisk.recommendations);
    }
  }

  // 3. Equipment Risk (weight: 0.25)
  if (params.equipment) {
    const equipmentRisk = calculateEquipmentRisk(params.equipment);
    factors.push({
      id: 'equipment',
      name: 'Kondisi Peralatan',
      weight: 0.25,
      value: equipmentRisk.score,
      source: 'equipment',
      details: equipmentRisk.details,
    });
    if (equipmentRisk.recommendations.length > 0) {
      recommendations.push(...equipmentRisk.recommendations);
    }
  }

  // 4. Certification Risk (weight: 0.2)
  if (params.certifications) {
    const certRisk = calculateCertificationRisk(params.certifications);
    factors.push({
      id: 'certification',
      name: 'Sertifikasi',
      weight: 0.2,
      value: certRisk.score,
      source: 'certification',
      details: certRisk.details,
    });
    if (certRisk.recommendations.length > 0) {
      recommendations.push(...certRisk.recommendations);
    }
  }

  // Calculate weighted average score
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedScore = factors.reduce((sum, f) => sum + (f.value * f.weight), 0);
  const score = Math.round(weightedScore / totalWeight);

  // Determine risk level
  const level = getRiskLevel(score);

  // Determine if trip should be blocked
  const blocked = level === 'RED';
  const blockReason = blocked
    ? `Risk score ${score} melebihi ambang batas aman (60). Trip tidak dapat dimulai.`
    : undefined;

  logger.info('Risk assessment calculated', {
    score,
    level,
    blocked,
    factorCount: factors.length,
  });

  return {
    score,
    level,
    factors,
    blocked,
    blockReason,
    overrideAllowed: level !== 'RED' || score < 80, // Allow override up to 80
    recommendations,
    assessedAt: new Date().toISOString(),
  };
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'GREEN';
  if (score <= 60) return 'YELLOW';
  return 'RED';
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'GREEN':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'YELLOW':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'RED':
      return 'bg-red-100 text-red-800 border-red-200';
  }
}

/**
 * Get risk level label
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'GREEN':
      return 'Aman';
    case 'YELLOW':
      return 'Perlu Perhatian';
    case 'RED':
      return 'Risiko Tinggi';
  }
}

// Helper functions for individual risk calculations

function calculateChecklistRisk(responses: ChecklistResponse[]): {
  score: number;
  details: string;
  recommendations: string[];
} {
  if (responses.length === 0) {
    return {
      score: 100,
      details: 'Checklist belum dilengkapi',
      recommendations: ['Lengkapi safety checklist sebelum memulai trip'],
    };
  }

  const checkedCount = responses.filter(r => r.checked).length;
  const uncheckedCount = responses.length - checkedCount;
  const completionRate = checkedCount / responses.length;

  // Score inversely proportional to completion
  const score = Math.round((1 - completionRate) * 100);

  const recommendations: string[] = [];
  if (uncheckedCount > 0) {
    recommendations.push(`${uncheckedCount} item checklist belum dicentang`);
  }

  return {
    score,
    details: `${checkedCount}/${responses.length} item selesai`,
    recommendations,
  };
}

function calculateWeatherRisk(weather: WeatherData): {
  score: number;
  details: string;
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Weather alert check
  if (weather.hasAlert) {
    score += 50;
    recommendations.push(`Peringatan cuaca: ${weather.alertType || 'Aktif'}`);
  }

  // Wind speed check
  if (weather.windSpeed !== undefined) {
    if (weather.windSpeed > 30) {
      score += 30;
      recommendations.push(`Angin kencang (${weather.windSpeed} km/h) - Pertimbangkan penundaan`);
    } else if (weather.windSpeed > 20) {
      score += 15;
    }
  }

  // Wave height check
  if (weather.waveHeight !== undefined) {
    if (weather.waveHeight > 2) {
      score += 40;
      recommendations.push(`Gelombang tinggi (${weather.waveHeight}m) - Tidak aman untuk aktivitas laut`);
    } else if (weather.waveHeight > 1) {
      score += 20;
    }
  }

  // Visibility check
  if (weather.visibility !== undefined && weather.visibility < 1) {
    score += 20;
    recommendations.push('Visibility rendah - Hati-hati navigasi');
  }

  // Condition check
  const badConditions = ['storm', 'heavy rain', 'thunderstorm', 'badai', 'hujan lebat'];
  if (badConditions.some(c => weather.condition.toLowerCase().includes(c))) {
    score += 30;
  }

  return {
    score: Math.min(score, 100),
    details: weather.condition,
    recommendations,
  };
}

function calculateEquipmentRisk(equipment: EquipmentStatus): {
  score: number;
  details: string;
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Checklist completion
  if (equipment.totalItems > 0) {
    const completionRate = equipment.checkedItems / equipment.totalItems;
    score += Math.round((1 - completionRate) * 40);
  }

  // Items needing repair
  if (equipment.itemsNeedingRepair > 0) {
    score += equipment.itemsNeedingRepair * 15;
    recommendations.push(`${equipment.itemsNeedingRepair} peralatan perlu perbaikan`);
  }

  // Lifejacket check - CRITICAL
  if (equipment.lifejacketCount < equipment.passengerCount) {
    const deficit = equipment.passengerCount - equipment.lifejacketCount;
    score += 50;
    recommendations.push(`KRITIS: Kekurangan ${deficit} life jacket untuk penumpang`);
  }

  return {
    score: Math.min(score, 100),
    details: `${equipment.checkedItems}/${equipment.totalItems} peralatan siap`,
    recommendations,
  };
}

function calculateCertificationRisk(certifications: CertificationStatus): {
  score: number;
  details: string;
  recommendations: string[];
} {
  let score = 0;
  const recommendations: string[] = [];

  // Expired certifications - CRITICAL
  if (certifications.expiredCertifications > 0) {
    score += certifications.expiredCertifications * 40;
    recommendations.push(`KRITIS: ${certifications.expiredCertifications} sertifikasi sudah expired`);
  }

  // Expiring soon
  if (certifications.expiringWithin30Days > 0) {
    score += certifications.expiringWithin30Days * 10;
    recommendations.push(`${certifications.expiringWithin30Days} sertifikasi akan expired dalam 30 hari`);
  }

  return {
    score: Math.min(score, 100),
    details: `${certifications.validCertifications} sertifikasi valid`,
    recommendations,
  };
}

/**
 * Validate if admin override is allowed
 */
export function canAdminOverride(assessment: RiskAssessment): boolean {
  // Never allow override for scores >= 80 (extremely dangerous)
  if (assessment.score >= 80) {
    return false;
  }

  // Check for critical factors
  const criticalFactors = assessment.factors.filter(f => f.value >= 80);
  if (criticalFactors.length > 0) {
    return false;
  }

  return assessment.overrideAllowed;
}

