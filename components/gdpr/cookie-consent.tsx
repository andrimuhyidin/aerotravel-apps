/**
 * Cookie Consent Banner
 * GDPR/PDP compliant cookie consent component
 */

'use client';

import { useState, useEffect } from 'react';
import CookieConsent from 'react-cookie-consent';
import { acceptAllCookies, rejectAllCookies, hasConsent } from '@/lib/gdpr/cookie-preferences';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = hasConsent();
    setShowBanner(!consent);
  }, []);

  if (!showBanner) {
    return null;
  }

  const handleAccept = () => {
    acceptAllCookies();
    setShowBanner(false);
  };

  const handleDecline = () => {
    rejectAllCookies();
    setShowBanner(false);
  };

  return (
    <CookieConsent
      location="bottom"
      buttonText="Terima Semua"
      declineButtonText="Tolak Non-Esensial"
      enableDeclineButton
      onAccept={handleAccept}
      onDecline={handleDecline}
      cookieName="aero-cookie-consent"
      style={{
        background: 'hsl(var(--background))',
        borderTop: '1px solid hsl(var(--border))',
        color: 'hsl(var(--foreground))',
        padding: '1rem',
        alignItems: 'center',
        boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)',
      }}
      buttonStyle={{
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        fontSize: '14px',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: 'hsl(var(--muted-foreground))',
        fontSize: '14px',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '500',
        border: '1px solid hsl(var(--border))',
        cursor: 'pointer',
      }}
      expires={365}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          🍪 Kami menggunakan cookies
        </p>
        <p className="text-xs text-muted-foreground">
          Kami menggunakan cookies untuk meningkatkan pengalaman Anda, menganalisis traffic website, 
          dan personalisasi konten. Dengan mengklik "Terima Semua", Anda menyetujui penggunaan cookies 
          kami sesuai dengan{' '}
          <a
            href="/id/legal/privacy"
            className="underline hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kebijakan Privasi
          </a>
          .
        </p>
      </div>
    </CookieConsent>
  );
}

