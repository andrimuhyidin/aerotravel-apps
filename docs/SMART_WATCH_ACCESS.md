# Smart Watch Companion App - Akses & Integrasi

## Overview

Smart Watch Companion App untuk Guide Apps dapat diakses melalui **Progressive Web App (PWA)** yang dioptimasi untuk layar smartwatch kecil. Aplikasi ini memungkinkan guide mengakses fitur penting langsung dari smartwatch mereka.

## Akses Aplikasi

### URL Akses
```
https://your-domain.com/[locale]/guide/watch
```

**Contoh:**
- `https://aerotravel.co.id/id/guide/watch`
- `https://aerotravel.co.id/en/guide/watch`

### Cara Mengakses di Smart Watch

#### Apple Watch (watchOS)
1. Buka Safari di iPhone
2. Buka URL: `https://your-domain.com/[locale]/guide/watch`
3. Tap tombol "Share" → "Add to Home Screen"
4. Nama: "Guide Watch App"
5. Icon akan muncul di home screen iPhone
6. Buka Watch app di iPhone → "My Watch" → "Installed on Apple Watch"
7. Aktifkan "Guide Watch App"
8. Aplikasi akan muncul di Apple Watch

#### Wear OS (Android Wear)
1. Buka Chrome di smartphone Android
2. Buka URL: `https://your-domain.com/[locale]/guide/watch`
3. Tap menu (3 dots) → "Add to Home screen"
4. Buka aplikasi dari home screen
5. Sync ke smartwatch melalui Wear OS app

#### Web Browser (Fallback)
- Dapat diakses langsung melalui browser di smartwatch yang mendukung web browsing
- Auto-optimized untuk layar kecil (max-width 400px)

## API Endpoints

### Watch-Specific Endpoints

#### 1. Get Watch Status (Lightweight)
```http
GET /api/guide/watch/status
```

**Response:**
```json
{
  "status": "on_trip" | "standby",
  "trip": {
    "id": "uuid",
    "code": "TRIP-001",
    "name": "Snorkeling Tour",
    "status": "in_progress",
    "passengerCount": 15,
    "date": "2025-01-30",
    "checkInStatus": "checked_in" | "not_checked_in"
  },
  "sosActive": false,
  "sosId": null,
  "stats": {
    "totalTrips": 42
  },
  "timestamp": "2025-01-30T10:00:00Z"
}
```

#### 2. Watch Heartbeat (Health Check)
```http
POST /api/guide/watch/heartbeat
Content-Type: application/json

{
  "batteryLevel": 85,
  "heartRate": 72,
  "watchType": "apple" | "wearos" | "web",
  "location": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-01-30T10:00:00Z",
  "updates": []
}
```

#### 3. Get Quick Actions
```http
GET /api/guide/watch/quick-actions
```

**Response:**
```json
{
  "actions": [
    {
      "id": "sos",
      "label": "SOS Emergency",
      "icon": "alert-triangle",
      "enabled": true,
      "color": "red",
      "priority": 1
    },
    {
      "id": "check_in",
      "label": "Check In",
      "icon": "check-circle",
      "enabled": true,
      "color": "blue",
      "priority": 2
    }
  ],
  "currentTrip": {
    "id": "uuid",
    "code": "TRIP-001",
    "status": "in_progress"
  }
}
```

### Existing Endpoints (Reusable)

#### SOS Alert
```http
POST /api/guide/sos
Content-Type: application/json

{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "incident_type": "medical" | "security" | "weather" | "accident" | "other",
  "message": "Optional message",
  "notify_nearby_crew": true
}
```

#### Get Current Trip
```http
GET /api/guide/trips?status=ongoing&limit=1
```

#### Get Guide Stats
```http
GET /api/guide/stats
```

## Fitur yang Tersedia

### 1. SOS Emergency Button
- **Long-press 3 detik** untuk trigger SOS
- Otomatis mengirim lokasi GPS
- Notifikasi ke tim operasional via WhatsApp
- Auto-streaming lokasi setiap 30 detik

### 2. Trip Status Display
- Trip code
- Jumlah penumpang
- Status check-in
- Waktu saat ini

### 3. Quick Actions
- Check-in (jika trip aktif)
- View trip details
- Call Ops (emergency contact)
- Refresh data

### 4. Heart Rate Monitoring (Experimental)
- Menggunakan Web Sensor API (jika tersedia)
- Menampilkan detak jantung real-time
- Fallback graceful jika sensor tidak tersedia

### 5. Stats Display
- Total trips completed
- Average rating
- Quick stats

## Authentication

Akses menggunakan authentication yang sama dengan aplikasi utama:
- Session cookie (automatic)
- JWT token (jika menggunakan API secara langsung)

**Tidak perlu** authentication khusus untuk watch - menggunakan session guide yang sudah login.

## Rate Limiting

- **Watch Status**: Max 1 request per 30 detik
- **Heartbeat**: Max 1 request per 10 detik
- **SOS**: Unlimited (emergency)

## Offline Support

- Watch app menggunakan service worker untuk offline caching
- Data terakhir akan ditampilkan saat offline
- SOS akan di-queue untuk dikirim saat online kembali

## Performance Optimization

### Untuk Watch Display
1. **Lightweight Data**: Hanya data esensial (status, trip code, passenger count)
2. **Minimal Images**: Tidak ada gambar besar, hanya icon
3. **Fast Refresh**: Auto-refresh setiap 30 detik (dapat diubah ke 10 detik)
4. **Dark Mode**: Default dark mode untuk menghemat battery
5. **Minimal UI**: Large touch targets, minimal text

### Network Optimization
- Response size < 2KB untuk status endpoint
- Gzip compression enabled
- Cache headers untuk static assets

## Testing

### Manual Testing
1. Buka URL di browser desktop dengan dev tools
2. Resize window ke 400x400px (simulasi watch screen)
3. Test semua fitur:
   - SOS button (long-press)
   - Check-in button
   - Quick actions
   - Refresh toggle

### Browser Compatibility
- ✅ Safari (iOS/watchOS)
- ✅ Chrome (Android/Wear OS)
- ✅ Edge (Windows devices)
- ⚠️ Limited support untuk sensor APIs (experimental)

## Troubleshooting

### Aplikasi tidak muncul di watch
- Pastikan PWA sudah di-"Add to Home Screen"
- Cek Watch app settings di iPhone/Android
- Pastikan watch terhubung dengan phone

### SOS tidak terkirim
- Cek koneksi internet
- Pastikan GPS enabled
- Check console untuk error messages

### Heart rate tidak muncul
- Web Sensor API masih experimental
- Hanya tersedia di beberapa browser
- Native watch apps akan memiliki akses penuh ke sensor

## Native Watch Apps (Future Enhancement)

Untuk akses penuh ke sensor dan fitur watch, native apps dapat dikembangkan:

### Apple Watch (watchOS)
- **Language**: Swift 5.9+
- **Framework**: WatchKit
- **HealthKit**: Akses penuh ke heart rate, fall detection
- **WatchConnectivity**: Sync dengan iPhone app

### Wear OS
- **Language**: Kotlin
- **Framework**: Jetpack Compose for Wear OS
- **Health Services API**: Akses ke heart rate, activity tracking
- **Data Layer API**: Sync dengan Android phone

## Security Considerations

1. **HTTPS Only**: Semua komunikasi via HTTPS
2. **Session-based Auth**: Menggunakan session cookie (secure, httpOnly)
3. **Rate Limiting**: Mencegah abuse
4. **Location Privacy**: GPS hanya dikirim saat SOS atau trip active
5. **Battery Optimization**: Minimal background activity

## Next Steps

1. ✅ PWA Implementation (Completed)
2. ⏳ Native Watch Apps (Future)
3. ⏳ Advanced Health Monitoring (Future)
4. ⏳ Offline-first Optimization (In Progress)

## Support

Untuk pertanyaan atau masalah:
- Check documentation: `/docs/SMART_WATCH_APP_ARCHITECTURE.md`
- Contact: ops@aerotravel.co.id
- GitHub Issues: (if applicable)

