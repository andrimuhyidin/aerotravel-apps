# Smart Watch Companion App - Architecture Document

## Overview

Smart Watch Companion App untuk Guide Apps memungkinkan guide mengakses fitur penting langsung dari smartwatch mereka, terutama untuk situasi darurat dan navigasi cepat.

## Target Platforms

- **Apple Watch** (watchOS 10+)
- **Wear OS** (Android Wear 3.0+)

## Core Features

### 1. SOS Emergency
- **Quick SOS Button**: Satu tap untuk mengirim SOS alert
- **Auto GPS**: Otomatis mengirim lokasi GPS saat SOS
- **Haptic Feedback**: Konfirmasi haptic saat SOS terkirim
- **Status Indicator**: LED/haptic untuk konfirmasi server

### 2. Trip Status
- **Current Trip Info**: Menampilkan trip code, waktu, status
- **Quick Actions**: Start trip, end trip, check-in
- **Passenger Count**: Jumlah penumpang saat ini

### 3. Navigation
- **Compass**: Arah kompas untuk navigasi
- **Distance to Waypoint**: Jarak ke titik tujuan
- **Route Guidance**: Haptic feedback untuk belokan

### 4. Health & Safety
- **Heart Rate Monitor**: Tracking detak jantung (opsional)
- **Fall Detection**: Deteksi jatuh otomatis
- **Weather Alert**: Notifikasi cuaca buruk

### 5. Quick Notifications
- **Trip Updates**: Notifikasi trip penting
- **Emergency Alerts**: Alert dari admin/ops
- **Payment Notifications**: Konfirmasi pembayaran

## Technical Architecture

### Backend API Endpoints

#### Existing Endpoints (Reusable)
- `POST /api/guide/sos` - SOS alert
- `GET /api/guide/status` - Current status
- `GET /api/guide/trips/[id]` - Trip details
- `POST /api/guide/trips/[id]/start` - Start trip
- `POST /api/guide/trips/[id]/end` - End trip

#### New Endpoints (Watch-Specific)
- `GET /api/guide/watch/status` - Lightweight status for watch
- `POST /api/guide/watch/heartbeat` - Periodic health check
- `GET /api/guide/watch/quick-actions` - Quick actions list

### Data Format

#### Watch Status Response
```json
{
  "status": "on_trip",
  "trip": {
    "id": "uuid",
    "code": "TRIP-001",
    "status": "in_progress",
    "passengerCount": 15
  },
  "sosActive": false,
  "batteryLevel": 85
}
```

#### Quick Actions Response
```json
{
  "actions": [
    {
      "id": "start_trip",
      "label": "Start Trip",
      "icon": "play",
      "enabled": true
    },
    {
      "id": "sos",
      "label": "SOS",
      "icon": "alert",
      "enabled": true,
      "color": "red"
    }
  ]
}
```

## Native Implementation

### Apple Watch (watchOS)

#### Technology Stack
- **Language**: Swift 5.9+
- **Framework**: WatchKit, HealthKit, CoreLocation
- **Communication**: WatchConnectivity (iPhone pairing)

#### Project Structure
```
WatchApp/
├── WatchApp.swift
├── ContentView.swift
├── Views/
│   ├── SOSView.swift
│   ├── TripStatusView.swift
│   ├── NavigationView.swift
│   └── SettingsView.swift
├── Models/
│   ├── TripStatus.swift
│   ├── QuickAction.swift
│   └── SOSAlert.swift
├── Services/
│   ├── APIService.swift
│   ├── LocationService.swift
│   └── WatchConnectivityService.swift
└── Resources/
    ├── Assets.xcassets
    └── Info.plist
```

#### Key Components

**SOSView.swift**
```swift
import SwiftUI
import WatchKit
import CoreLocation

struct SOSView: View {
    @StateObject private var locationManager = LocationManager()
    @State private var isSending = false
    
    var body: some View {
        Button(action: sendSOS) {
            VStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.red)
                Text("SOS")
                    .font(.headline)
            }
        }
        .disabled(isSending)
    }
    
    private func sendSOS() {
        isSending = true
        let location = locationManager.currentLocation
        
        // Send to API
        APIService.shared.sendSOS(
            latitude: location.latitude,
            longitude: location.longitude
        ) { success in
            if success {
                WKInterfaceDevice.current().play(.notification)
            }
            isSending = false
        }
    }
}
```

### Wear OS (Android)

#### Technology Stack
- **Language**: Kotlin
- **Framework**: Wear OS SDK, Health Services, Location Services
- **Communication**: Data Layer API (Phone pairing)

#### Project Structure
```
wear/
├── src/main/
│   ├── java/com/aero/guide/watch/
│   │   ├── MainActivity.kt
│   │   ├── ui/
│   │   │   ├── SOSActivity.kt
│   │   │   ├── TripStatusActivity.kt
│   │   │   └── NavigationActivity.kt
│   │   ├── data/
│   │   │   ├── ApiService.kt
│   │   │   └── LocationService.kt
│   │   └── utils/
│   │       └── WatchConnectivity.kt
│   └── res/
│       ├── layout/
│       └── values/
└── build.gradle
```

#### Key Components

**SOSActivity.kt**
```kotlin
class SOSActivity : ComponentActivity() {
    private lateinit var locationClient: FusedLocationProviderClient
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        locationClient = LocationServices.getFusedLocationProviderClient(this)
        
        setContent {
            SOSButton()
        }
    }
    
    @Composable
    fun SOSButton() {
        Button(
            onClick = { sendSOS() },
            colors = ButtonDefaults.buttonColors(
                backgroundColor = Color.Red
            )
        ) {
            Text("SOS", style = MaterialTheme.typography.h4)
        }
    }
    
    private fun sendSOS() {
        locationClient.lastLocation.addOnSuccessListener { location ->
            ApiService.sendSOS(
                latitude = location.latitude,
                longitude = location.longitude
            ) { success ->
                if (success) {
                    // Haptic feedback
                    VibratorCompat.create(this).vibrate(
                        VibrationEffect.createPredefined(
                            VibrationEffect.EFFECT_HEAVY_CLICK
                        )
                    )
                }
            }
        }
    }
}
```

## Communication Protocol

### Watch ↔ Phone ↔ Server

1. **Watch → Phone**: WatchConnectivity / Data Layer API
2. **Phone → Server**: HTTP/HTTPS API calls
3. **Server → Phone**: Push notifications
4. **Phone → Watch**: WatchConnectivity / Data Layer API

### Data Synchronization

- **Real-time**: SOS alerts, trip status changes
- **Periodic**: Status updates (every 30 seconds when active)
- **On-demand**: Quick actions, trip details

## Security Considerations

1. **Authentication**: OAuth2 token stored securely on phone, shared with watch
2. **Encryption**: All API calls use HTTPS
3. **Location Privacy**: GPS data only sent when SOS activated or trip active
4. **Battery Optimization**: Minimal background activity

## Performance Optimization

1. **Battery Life**: 
   - Minimal GPS usage (only when needed)
   - Reduced API calls (caching)
   - Efficient data sync

2. **Network Usage**:
   - Compressed payloads
   - Batch updates when possible
   - Offline queue for failed requests

3. **UI Responsiveness**:
   - Lightweight views
   - Async operations
   - Local caching

## Development Roadmap

### Phase 1: Core Features (MVP)
- [ ] SOS button with GPS
- [ ] Trip status display
- [ ] Basic navigation (compass)
- [ ] Watch ↔ Phone communication

### Phase 2: Enhanced Features
- [ ] Quick actions menu
- [ ] Health monitoring
- [ ] Weather alerts
- [ ] Offline support

### Phase 3: Advanced Features
- [ ] Fall detection
- [ ] Voice commands
- [ ] Payment notifications
- [ ] Multi-language support

## Testing Strategy

1. **Unit Tests**: API services, data models
2. **Integration Tests**: Watch ↔ Phone communication
3. **E2E Tests**: Complete SOS flow, trip management
4. **Performance Tests**: Battery usage, network efficiency
5. **Field Tests**: Real-world usage scenarios

## Deployment

### Apple Watch
- **App Store**: Submit as companion app
- **TestFlight**: Beta testing
- **Requirements**: iOS 17+, watchOS 10+

### Wear OS
- **Google Play**: Submit as companion app
- **Internal Testing**: Beta channel
- **Requirements**: Android 8+, Wear OS 3.0+

## Maintenance

1. **Monitoring**: Crash reports, API errors, battery usage
2. **Updates**: Regular updates for OS compatibility
3. **Support**: User feedback, bug fixes
4. **Documentation**: Keep architecture docs updated

## References

- [Apple Watch Development Guide](https://developer.apple.com/watchos/)
- [Wear OS Developer Guide](https://developer.android.com/wear)
- [WatchConnectivity Framework](https://developer.apple.com/documentation/watchconnectivity)
- [Wear Data Layer API](https://developer.android.com/training/wearables/data-layer)

---

**Status**: Architecture Document - Ready for Implementation
**Last Updated**: 2025-12-22
**Next Steps**: Begin Phase 1 development with SOS feature

