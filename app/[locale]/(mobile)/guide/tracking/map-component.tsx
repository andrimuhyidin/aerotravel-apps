'use client';

/**
 * Map Component for Live Tracking
 * Uses Leaflet for map visualization
 */

import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useRef } from 'react';

import { Coordinates, MeetingPoint } from '@/lib/guide/geofencing';

// Fix Leaflet marker icons
const guideIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: #059669; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const meetingPointIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type BreadcrumbPoint = {
  latitude: number;
  longitude: number;
  timestamp?: string;
};

type MapComponentProps = {
  center: Coordinates;
  guideLocation: Coordinates;
  meetingPoints: MeetingPoint[];
  breadcrumbTrail?: BreadcrumbPoint[];
  showBreadcrumb?: boolean;
};

export default function MapComponent({
  center,
  guideLocation,
  meetingPoints,
  breadcrumbTrail = [],
  showBreadcrumb = false,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const guideMarkerRef = useRef<L.Marker | null>(null);
  const breadcrumbPolylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = L.map(containerRef.current).setView(
      [center.latitude, center.longitude],
      15
    );

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current);

    // Add meeting point markers and geofence circles
    meetingPoints.forEach((point) => {
      L.marker([point.coordinates.latitude, point.coordinates.longitude], {
        icon: meetingPointIcon,
      })
        .bindPopup(`<b>${point.name}</b><br/>Radius: ${point.radiusMeters}m`)
        .addTo(mapRef.current!);

      // Add geofence circle
      L.circle([point.coordinates.latitude, point.coordinates.longitude], {
        radius: point.radiusMeters,
        color: '#f59e0b',
        fillColor: '#fef3c7',
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(mapRef.current!);
    });

    // Add guide marker
    guideMarkerRef.current = L.marker(
      [guideLocation.latitude, guideLocation.longitude],
      { icon: guideIcon }
    )
      .bindPopup('Posisi Anda')
      .addTo(mapRef.current);

    return () => {
      if (breadcrumbPolylineRef.current) {
        mapRef.current?.removeLayer(breadcrumbPolylineRef.current);
        breadcrumbPolylineRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update breadcrumb trail
  useEffect(() => {
    if (!mapRef.current || !showBreadcrumb || breadcrumbTrail.length < 2) {
      if (breadcrumbPolylineRef.current) {
        mapRef.current?.removeLayer(breadcrumbPolylineRef.current);
        breadcrumbPolylineRef.current = null;
      }
      return;
    }

    const latlngs = breadcrumbTrail.map((point) => [
      point.latitude,
      point.longitude,
    ] as [number, number]);

    if (breadcrumbPolylineRef.current) {
      breadcrumbPolylineRef.current.setLatLngs(latlngs);
    } else {
      breadcrumbPolylineRef.current = L.polyline(latlngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1,
      }).addTo(mapRef.current);
    }
  }, [breadcrumbTrail, showBreadcrumb]);

  // Update guide marker position
  useEffect(() => {
    if (guideMarkerRef.current) {
      guideMarkerRef.current.setLatLng([guideLocation.latitude, guideLocation.longitude]);
    }
    if (mapRef.current) {
      mapRef.current.panTo([guideLocation.latitude, guideLocation.longitude]);
    }
  }, [guideLocation]);

  return <div ref={containerRef} className="h-full w-full" />;
}
