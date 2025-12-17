/**
 * Dynamic Map Component (Leaflet with SSR: false)
 * Sesuai PRD - Maps & GIS
 * 
 * Leaflet map component with dynamic import to prevent SSR issues
 */

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import Leaflet (SSR: false)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export type MapLocation = {
  lat: number;
  lng: number;
  name?: string;
  description?: string;
};

export type DynamicMapProps = {
  center: [number, number];
  zoom?: number;
  markers?: MapLocation[];
  height?: string;
  className?: string;
};

export function DynamicMap({
  center,
  zoom = 13,
  markers = [],
  height = '400px',
  className = '',
}: DynamicMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker, index) => (
          <Marker key={index} position={[marker.lat, marker.lng]}>
            {marker.name && (
              <Popup>
                <div>
                  <strong>{marker.name}</strong>
                  {marker.description && <p>{marker.description}</p>}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

