/**
 * Dashboard Greeting Component
 * Time-based greeting dengan partner name
 * Match Guide Apps greeting pattern
 */

'use client';

import { useEffect, useState } from 'react';

type DashboardGreetingProps = {
  partnerName?: string;
  contextualMessage?: string;
};

export function DashboardGreeting({
  partnerName,
  contextualMessage,
}: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState('Selamat Pagi');

  useEffect(() => {
    // Calculate greeting on client-side to prevent hydration mismatch
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Selamat Pagi');
    } else if (hour < 17) {
      setGreeting('Selamat Siang');
    } else {
      setGreeting('Selamat Malam');
    }
  }, []);

  const displayName = partnerName || 'Partner';

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
        {greeting}, {displayName}! 👋
      </h1>
      {contextualMessage ? (
        <p className="mt-1.5 text-sm text-white/90">{contextualMessage}</p>
      ) : (
        <p className="mt-1.5 text-sm text-white/90">
          Ringkasan aktivitas dan kinerja Anda
        </p>
      )}
    </div>
  );
}

