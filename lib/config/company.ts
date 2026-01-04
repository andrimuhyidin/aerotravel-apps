/**
 * Company Configuration
 * Centralized company information for contracts, invoices, etc.
 * 
 * @deprecated Use settings from database via lib/settings instead
 * This file is kept for backward compatibility and fallback values
 */

export const COMPANY_CONFIG = {
  name: 'MyAeroTravel ID',
  address: 'Jakarta, Indonesia',
  phone: '+62-XXX-XXXX-XXXX', // Update with actual phone
  email: 'info@myaerotravel.id', // Update with actual email
  website: 'https://myaerotravel.id',
} as const;

/**
 * Get company config from settings with fallback
 * Use this in server components
 */
export async function getCompanyConfig() {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [name, email, phone, address] = await Promise.all([
      getSetting('branding.app_name'),
      getSetting('contact.email'),
      getSetting('contact.phone'),
      getSetting('contact.address'),
    ]);

    return {
      name: (name as string) || COMPANY_CONFIG.name,
      email: (email as string) || COMPANY_CONFIG.email,
      phone: (phone as string) || COMPANY_CONFIG.phone,
      address:
        typeof address === 'object' && address !== null
          ? `${(address as { street?: string }).street || ''}, ${(address as { city?: string }).city || ''}`
          : COMPANY_CONFIG.address,
      website: COMPANY_CONFIG.website,
    };
  } catch {
    return COMPANY_CONFIG;
  }
}
