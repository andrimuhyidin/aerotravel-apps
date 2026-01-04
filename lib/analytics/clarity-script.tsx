/**
 * Microsoft Clarity Script Component
 * Loads Clarity script with Next.js optimization
 */

'use client';

import Script from 'next/script';
import { useEffect } from 'react';

import { initClarity, claritySetUserType, clarityIdentify } from './clarity';

type ClarityScriptProps = {
  projectId?: string;
  userId?: string;
  userType?: 'guest' | 'customer' | 'partner' | 'guide' | 'admin';
};

export function ClarityScript({ projectId, userId, userType }: ClarityScriptProps) {
  const clarityProjectId =
    projectId || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    // Initialize after script loads
    if (clarityProjectId) {
      initClarity(clarityProjectId);

      // Set user identification if available
      if (userId) {
        clarityIdentify(userId);
      }

      // Set user type for segmentation
      if (userType) {
        claritySetUserType(userType);
      }
    }
  }, [clarityProjectId, userId, userType]);

  if (!clarityProjectId) {
    return null;
  }

  return (
    <Script
      id="clarity-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityProjectId}");
        `,
      }}
    />
  );
}

/**
 * Clarity Provider for app-wide context
 */
export function ClarityProvider({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <>
      {projectId && <ClarityScript projectId={projectId} />}
      {children}
    </>
  );
}

