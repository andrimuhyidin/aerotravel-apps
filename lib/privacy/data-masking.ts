/**
 * Data Masking Utilities - Privacy Protection
 * Purpose: Mask sensitive personal data for display (UU PDP 2022)
 */

/**
 * Mask phone number
 * Examples:
 *  +6281234567890 -> +62812****7890
 *  08123456789 -> 0812****789
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';

  const cleaned = phone.replace(/\s+/g, '');

  // International format
  if (cleaned.startsWith('+62')) {
    if (cleaned.length <= 8) return cleaned;
    const prefix = cleaned.substring(0, 6); // +62812
    const suffix = cleaned.substring(cleaned.length - 4); // last 4 digits
    const maskLength = cleaned.length - 10;
    return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
  }

  // Local format
  if (cleaned.startsWith('0')) {
    if (cleaned.length <= 7) return cleaned;
    const prefix = cleaned.substring(0, 4); // 0812
    const suffix = cleaned.substring(cleaned.length - 3); // last 3 digits
    const maskLength = cleaned.length - 7;
    return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
  }

  return phone; // Return original if format not recognized
}

/**
 * Mask email address
 * Examples:
 *  john.doe@email.com -> j***e@email.com
 *  a@test.com -> a***@test.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '';

  const [localPart, domain] = email.split('@');

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Mask NIK (Indonesian National ID)
 * Example: 3201234567890123 -> 3201****7890123
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length !== 16) return '';

  const prefix = nik.substring(0, 4); // First 4 digits (province code)
  const suffix = nik.substring(8); // Last 8 digits
  return `${prefix}****${suffix}`;
}

/**
 * Mask full name (keep first and last name initial only)
 * Examples:
 *  John Michael Doe -> J*** M*** D***
 *  Budi Santoso -> B*** S***
 */
export function maskName(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  return parts.map((part) => `${part[0]}***`).join(' ');
}

/**
 * Mask bank account number
 * Example: 1234567890 -> 1234****90
 */
export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 6) return '';

  const prefix = accountNumber.substring(0, 4);
  const suffix = accountNumber.substring(accountNumber.length - 2);
  const maskLength = accountNumber.length - 6;
  return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
}

/**
 * Mask address (show only city/province)
 * Example: "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta" -> "Jakarta Pusat, DKI Jakarta"
 */
export function maskAddress(address: string): string {
  if (!address) return '';

  // Try to extract city and province (after last comma)
  const parts = address.split(',').map((p) => p.trim());

  if (parts.length >= 2) {
    // Return last 2 parts (city, province)
    return parts.slice(-2).join(', ');
  }

  return '***';
}

/**
 * Mask passport number
 * Example: A1234567 -> A12***67
 */
export function maskPassport(passportNumber: string): string {
  if (!passportNumber || passportNumber.length < 4) return '';

  const prefix = passportNumber.substring(0, 3);
  const suffix = passportNumber.substring(passportNumber.length - 2);
  const maskLength = passportNumber.length - 5;
  return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
}

/**
 * Mask credit card number
 * Example: 1234567890123456 -> 1234 **** **** 3456
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber) return '';

  const cleaned = cardNumber.replace(/\s+/g, '');

  if (cleaned.length < 13) return '';

  const first4 = cleaned.substring(0, 4);
  const last4 = cleaned.substring(cleaned.length - 4);
  return `${first4} **** **** ${last4}`;
}

// ============================================
// Manifest-Specific Masking
// ============================================

export type PassengerData = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  nik?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  medicalNotes?: string | null;
  userId?: string | null;
};

/**
 * Mask passenger manifest data
 * Used when guide views manifest - some sensitive fields are masked
 * 
 * Rules:
 * - If passenger is also a crew member (guide/staff), mask their personal data
 * - Always mask email fully for privacy
 * - Mask phone numbers partially
 * - Keep emergency contact visible (safety requirement)
 */
export function maskPassengerData(
  passenger: PassengerData,
  currentUserId: string,
  crewUserIds: string[]
): PassengerData {
  const isCrewMember = passenger.userId && crewUserIds.includes(passenger.userId);
  const isSelf = passenger.userId === currentUserId;

  if (isSelf) {
    // If viewing own data, show "(Anda)" label but mask sensitive data
    return {
      ...passenger,
      fullName: `${passenger.fullName} (Anda)`,
      email: passenger.email ? maskEmail(passenger.email) : null,
      phone: passenger.phone ? maskPhoneNumber(passenger.phone) : null,
      nik: passenger.nik ? maskNIK(passenger.nik) : null,
      address: passenger.address ? maskAddress(passenger.address) : null,
    };
  }

  if (isCrewMember) {
    // If passenger is crew, mask more aggressively
    return {
      ...passenger,
      fullName: `${maskName(passenger.fullName)} (Staff)`,
      email: null, // Hide completely
      phone: null, // Hide completely
      nik: null,
      address: null,
      emergencyContact: passenger.emergencyContact || null,
      emergencyPhone: passenger.emergencyPhone ? maskPhoneNumber(passenger.emergencyPhone) : null,
      medicalNotes: '***', // Hide medical info
    };
  }

  // Regular passenger - mask partially
  return {
    ...passenger,
    email: passenger.email ? maskEmail(passenger.email) : null,
    phone: passenger.phone ? maskPhoneNumber(passenger.phone) : null,
    nik: passenger.nik ? maskNIK(passenger.nik) : null,
    address: passenger.address ? maskAddress(passenger.address) : null,
    // Keep emergency contact visible (safety requirement)
  };
}

/**
 * Mask array of passengers
 */
export function maskPassengerManifest(
  passengers: PassengerData[],
  currentUserId: string,
  crewUserIds: string[] = []
): PassengerData[] {
  return passengers.map((passenger) =>
    maskPassengerData(passenger, currentUserId, crewUserIds)
  );
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if data should be masked based on user role and permissions
 */
export function shouldMaskData(
  userRole: string,
  dataType: string
): boolean {
  // Super admin and ops admin see unmasked data
  if (['super_admin', 'ops_admin'].includes(userRole)) {
    return false;
  }

  // Guide sees masked data for certain types
  if (userRole === 'guide') {
    return ['email', 'phone', 'nik', 'address'].includes(dataType);
  }

  // By default, mask sensitive data
  return true;
}

/**
 * Get masking configuration based on data type
 */
export function getMaskingFunction(dataType: string): (value: string) => string {
  const maskingFunctions: Record<string, (value: string) => string> = {
    phone: maskPhoneNumber,
    email: maskEmail,
    nik: maskNIK,
    name: maskName,
    bankAccount: maskBankAccount,
    address: maskAddress,
    passport: maskPassport,
    creditCard: maskCreditCard,
  };

  return maskingFunctions[dataType] || ((v) => v);
}

