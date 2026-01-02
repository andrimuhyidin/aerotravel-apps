/**
 * useImageAlt Hook
 * Helper untuk generate meaningful alt text untuk images
 * WCAG 2.1 AA - 1.1.1 Non-text Content
 */

'use client';

/**
 * Generate alt text untuk package/destination images
 */
export function usePackageImageAlt(packageName: string, destination?: string): string {
  if (destination) {
    return `Foto paket wisata ${packageName} ke ${destination}`;
  }
  return `Foto paket wisata ${packageName}`;
}

/**
 * Generate alt text untuk user profile images
 */
export function useProfileImageAlt(userName: string, role?: string): string {
  if (role) {
    return `Foto profil ${userName} - ${role}`;
  }
  return `Foto profil ${userName}`;
}

/**
 * Generate alt text untuk gallery images
 */
export function useGalleryImageAlt(index: number, total: number, description?: string): string {
  const position = `Gambar ${index + 1} dari ${total}`;
  if (description) {
    return `${position}: ${description}`;
  }
  return position;
}

/**
 * Generate alt text untuk document/KTP images
 */
export function useDocumentImageAlt(documentType: string, ownerName?: string): string {
  if (ownerName) {
    return `${documentType} milik ${ownerName}`;
  }
  return documentType;
}

/**
 * Check if alt text is meaningful (not just filename or generic)
 */
export function isAltTextMeaningful(altText: string): boolean {
  const genericPatterns = [
    /^image$/i,
    /^photo$/i,
    /^picture$/i,
    /^img$/i,
    /^\d+\.(jpg|jpeg|png|gif|webp)$/i,
    /^untitled$/i,
    /^screenshot$/i,
  ];

  return !genericPatterns.some((pattern) => pattern.test(altText.trim()));
}

/**
 * Sanitize and improve alt text
 */
export function improveAltText(altText: string, context?: string): string {
  // Remove file extensions
  let improved = altText.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '');
  
  // Replace underscores and hyphens with spaces
  improved = improved.replace(/[_-]/g, ' ');
  
  // Capitalize first letter
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  
  // Add context if provided and alt text is generic
  if (context && !isAltTextMeaningful(improved)) {
    improved = `${context}: ${improved}`;
  }
  
  return improved;
}

