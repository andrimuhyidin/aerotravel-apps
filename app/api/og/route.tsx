/**
 * Dynamic Open Graph Image Generator
 * Route: /api/og?title=...&subtitle=...
 *
 * Uses @vercel/og for edge-runtime OG image generation
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Get params
  const title = searchParams.get('title') || 'Aero Travel';
  const subtitle =
    searchParams.get('subtitle') || 'Integrated Travel Ecosystem';
  const type = searchParams.get('type') || 'default'; // default, package, trip

  // Color themes
  const themes = {
    default: {
      bg: 'linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0284c7 100%)',
      accent: '#14b8a6',
    },
    package: {
      bg: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      accent: '#8b5cf6',
    },
    trip: {
      bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
      accent: '#f97316',
    },
  };

  const theme = themes[type as keyof typeof themes] || themes.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            🌊
          </div>
          <span
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            Aero Travel
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.1,
            margin: 0,
            padding: '0 40px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: '700px',
            marginTop: '24px',
            padding: '0 40px',
          }}
        >
          {subtitle}
        </p>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          <span>aerotravel.co.id</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

