/**
 * Risk Calculator Utility
 * PRD: Pre-Trip Safety Risk Check
 * Formula: (wave_height × 20) + (wind_speed × 10) + (missing_crew × 25) + (missing_equipment × 30)
 * Threshold: > 70 = BLOCK trip
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskAssessmentInput = {
  waveHeight?: number | null;
  windSpeed?: number | null;
  weatherCondition?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | null;
  crewReady: boolean;
  equipmentComplete: boolean;
};

export type RiskAssessmentResult = {
  riskScore: number;
  riskLevel: RiskLevel;
  isSafe: boolean;
  isBlocked: boolean;
  canStart: boolean;
  message: string;
  factors: {
    waveScore: number;
    windScore: number;
    weatherScore: number;
    crewScore: number;
    equipmentScore: number;
  };
};

/**
 * Calculate risk score based on conditions
 * @param input Risk assessment input
 * @returns Risk assessment result
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentResult {
  const { waveHeight, windSpeed, weatherCondition, crewReady, equipmentComplete } = input;

  // Wave height scoring (wave_height × 20)
  let waveScore = 0;
  if (waveHeight !== null && waveHeight !== undefined) {
    waveScore = Math.round(waveHeight * 20);
  }

  // Wind speed scoring (wind_speed × 10)
  // Note: wind_speed should be in km/h
  let windScore = 0;
  if (windSpeed !== null && windSpeed !== undefined) {
    windScore = Math.round(windSpeed * 10);
  }

  // Weather condition scoring
  let weatherScore = 0;
  switch (weatherCondition) {
    case 'clear':
      weatherScore = 0;
      break;
    case 'cloudy':
      weatherScore = 5;
      break;
    case 'rainy':
      weatherScore = 15;
      break;
    case 'stormy':
      weatherScore = 30;
      break;
    default:
      weatherScore = 0;
  }

  // Crew ready scoring (missing_crew × 25)
  const crewScore = crewReady ? 0 : 25;

  // Equipment complete scoring (missing_equipment × 30)
  const equipmentScore = equipmentComplete ? 0 : 30;

  // Total risk score
  const riskScore = waveScore + windScore + weatherScore + crewScore + equipmentScore;

  // Determine risk level
  const riskLevel = getRiskLevel(riskScore);

  // Threshold: > 70 = BLOCK trip
  const isBlocked = riskScore > 70;
  const isSafe = riskScore <= 70;
  const canStart = isSafe && !isBlocked;

  // Generate message
  let message: string;
  if (isBlocked) {
    message = `Risk score terlalu tinggi (${riskScore} > 70). Trip tidak dapat dimulai. Hubungi Admin Ops untuk override.`;
  } else if (riskScore <= 30) {
    message = 'Kondisi aman. Trip dapat dimulai.';
  } else if (riskScore <= 50) {
    message = 'Risiko sedang. Perhatikan kondisi sebelum memulai trip.';
  } else {
    message = 'Risiko tinggi. Pertimbangkan untuk menunda trip.';
  }

  return {
    riskScore,
    riskLevel,
    isSafe,
    isBlocked,
    canStart,
    message,
    factors: {
      waveScore,
      windScore,
      weatherScore,
      crewScore,
      equipmentScore,
    },
  };
}

/**
 * Get risk level from score
 * @param score Risk score
 * @returns Risk level
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) {
    return 'low';
  } else if (score <= 50) {
    return 'medium';
  } else if (score <= 75) {
    return 'high';
  } else {
    return 'critical';
  }
}

/**
 * Check if trip can start based on risk assessment
 * @param riskScore Risk score
 * @param hasAdminOverride Whether admin has approved override
 * @returns Whether trip can start
 */
export function canTripStart(riskScore: number, hasAdminOverride: boolean = false): boolean {
  // If risk score > 70, block unless admin approved
  if (riskScore > 70 && !hasAdminOverride) {
    return false;
  }
  return true;
}

/**
 * Estimate wave height from wind speed
 * Rough approximation for UI convenience
 * @param windSpeed Wind speed in km/h
 * @returns Estimated wave height in meters
 */
export function estimateWaveHeight(windSpeed: number): number {
  // Max 2.5m for safety
  return Math.min(2.5, windSpeed / 20);
}

