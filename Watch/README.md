# Mood Manager - Wear OS

Wear OS data collection app for the **Mood Manager** project.

Collects user biometric signals (heart rate, HRV, stress indicators) and audio events (laughter, sighs) through Health Services API and AudioRecord, then sends them to **Firebase Firestore**.

---

## Technology Stack

- **Language**: Kotlin
- **Platform**: Android / Wear OS SDK
- **Min SDK**: 30 (Android 11)
- **Target SDK**: 36 (Android 15)
- **Key APIs/SDKs**:
  - Firebase SDK (Firestore, Storage)
  - Health Services API
  - AudioRecord API
- **Background**: ForegroundService (1-minute interval data collection)

---

## Project Structure

```
Watch/
├── app/
│   ├── src/main/
│   │   ├── java/com/moodmanager/watch/presentation/
│   │   │   ├── MainActivity.kt          # Main activity
│   │   │   ├── PeriodicDataService.kt  # Periodic biometric data collection service
│   │   │   ├── AudioEventService.kt     # Audio event collection service
│   │   │   ├── FirebaseViewModel.kt    # Firestore data transmission logic
│   │   │   └── theme/Theme.kt          # UI theme
│   │   ├── res/                        # Resource files
│   │   └── AndroidManifest.xml        # App manifest
│   ├── google-services.json           # Firebase configuration file (Git excluded)
│   └── build.gradle.kts               # App build configuration
├── build.gradle.kts                   # Project build configuration
└── README.md                          # This file
```

---

## Setup

### 1. Firebase Configuration

1. Create a project or select an existing project in [Firebase Console](https://console.firebase.google.com/)
2. Add Android app:
   - Package name: `com.moodmanager.watch`
   - App nickname: `Mood Manager Watch`
3. Download `google-services.json` file
4. Create actual `app/google-services.json` file based on `app/google-services.json.example`
   - Or place the downloaded file directly in the `app/` folder

> ⚠️ **Warning**: The `google-services.json` file contains sensitive information (API keys) and should not be committed to Git.  
> It is already excluded in `.gitignore`. Refer to `google-services.json.example` if needed.

### 2. Local Configuration

The `local.properties` file is automatically generated and contains the Android SDK path.  
This file is not committed to Git (excluded in `.gitignore`).

### 3. Permissions

The app requests the following permissions:
- **Internet**: Firestore data transmission
- **Microphone**: Audio event collection (`RECORD_AUDIO`)
- **Body Sensors**: Health Services API usage (`BODY_SENSORS`)
- **Health Services**: Read heart rate, HRV, respiratory rate, sleep data
- **Foreground Service**: Background data collection

Permissions are automatically requested at runtime.

---

## Build and Run

### Requirements

- **Android Studio**: Otter | 2025.2.1 or higher recommended
- **JDK**: 17 or higher
- **Wear OS Emulator** or **Physical Wear OS Device**

### Build Steps

1. **Open Project**
   ```bash
   # Open apps/watch folder in Android Studio
   ```

2. **Gradle Sync**
   - Automatically synced in Android Studio, or
   - Click `File > Sync Project with Gradle Files`

3. **Verify Firebase Configuration**
   - Check if `app/google-services.json` file exists
   - If not, download from Firebase Console

4. **Build and Run**
   - Select Wear OS emulator or physical device
   - `Run > Run 'app'` or `Shift + F10`

---

## Data Structure

### Firestore Collection Structure

```
users/
└── {userId}/
    ├── raw_periodic/    # Periodic biometric data (1-minute intervals)
    └── raw_events/      # Audio events (laughter/sighs)
```

### 1. raw_periodic (Periodic Biometric Data)

**Collection Interval**: 1 minute  
**Collection Service**: `PeriodicDataService`  
**Document ID**: Timestamp (ms) string

#### Data Fields

| Field | Type | Description |
|------|------|-------------|
| `timestamp` | number | Unix timestamp (ms) |
| `heart_rate_avg` | number | Average heart rate (bpm) |
| `heart_rate_min` | number | Minimum heart rate (bpm) |
| `heart_rate_max` | number | Maximum heart rate (bpm) |
| `hrv_sdnn` | number | Heart rate variability (SDNN) |
| `respiratory_rate_avg` | number | Average respiratory rate (breaths/min) |
| `movement_count` | number | Movement detection count |
| `is_fallback` | boolean | Sensor measurement flag |

#### Example Path
```
users/testUser/raw_periodic/1763532000123
```

### 2. raw_events (Audio Events)

**Collection Interval**: 2-second recording every 1 minute  
**Collection Service**: `AudioEventService`  
**Storage Condition**: Only valid events are stored (silence/unknown excluded)  
**Auto Generation**: If no events for 1 hour, 1 dummy data is automatically generated

#### Data Fields

| Field | Type | Description |
|------|------|-------------|
| `timestamp` | number | Event occurrence time (Unix ms) |
| `audio_base64` | string | Base64-encoded WAV audio (required) |
| `ml_processed` | string | ML processing status: `"pending"` / `"completed"` / `"failed"` (required) |

**Note**: The following fields are no longer used by ML but may exist in older data:
- `event_dbfs` (removed)
- `event_duration_ms` (removed)
- `event_type_guess` (removed)

#### Example Path
```
users/testUser/raw_events/autoDocId12345
```

---

## Audio Format

### WAV (Base64) Format

WearOS records audio with the following settings:

- **Format**: PCM 16bit
- **Channels**: Mono (single channel)
- **Sample Rate**: 8000 Hz
- **Encoding**: WAV header + PCM body encoded as Base64

### Python Decoding Example

```python
import base64
import io
import soundfile as sf

def decode_base64_wav(base64_str):
    """Decode Base64 WAV string to numpy array"""
    wav_bytes = base64.b64decode(base64_str)
    audio, samplerate = sf.read(io.BytesIO(wav_bytes))
    return audio, samplerate

# Usage example
doc = firestore_doc  # Firestore document
if doc.get("audio_base64"):
    audio, sr = decode_base64_wav(doc["audio_base64"])
    # Can be used directly with ML model
    prediction = model(audio, sr)
```

---

## Data Collection Process

### 1. Periodic Biometric Data (PeriodicDataService)

```
1-minute loop
  ↓
Collect data from Health Services API
  ↓
Add to Firestore raw_periodic collection (add)
  ↓
Wait for next cycle
```

### 2. Audio Events (AudioEventService)

```
1-minute loop
  ↓
Record 2 seconds with AudioRecord
  ↓
Calculate RMS/dBFS to filter silent segments
  ↓
Store only valid events in Firestore
  ↓
Generate 1 dummy data if no events for 1 hour
  ↓
Wait for next cycle
```

**Note**: Audio events are generated every minute as dummy data for testing. Actual audio recording and event type guessing are not implemented in the current version.

---

## Key Components

### MainActivity.kt
- Main activity of the app
- Starts foreground service when app launches

### PeriodicDataService.kt
- **Role**: Periodic biometric data collection
- **Interval**: 1 minute
- **Data**: Heart rate, HRV, respiratory rate, movement
- **Transmission**: `users/{userId}/raw_periodic` collection

### AudioEventService.kt
- **Role**: Audio event collection (laughter/sighs)
- **Interval**: 2-second recording every 1 minute
- **Current Implementation**: Generates dummy audio events every minute
- **Transmission**: `users/{userId}/raw_events` collection
- **Fields**: `timestamp`, `audio_base64`, `ml_processed: "pending"`

### FirebaseViewModel.kt
- **Role**: Firestore data transmission logic
- **Functions**: 
  - `sendDummyPeriodicData()`: Send dummy biometric data
  - `sendDummyAudioEvent()`: Send dummy audio event
  - In actual service, transmits data collected from Health Services API and AudioRecord

---

## Integration Information

### Next.js Web App Integration

Data sent by the WearOS app is processed in the Next.js web app as follows:

1. **raw_periodic data**:
   - Calculate stress index
   - Analyze sleep patterns
   - Track heart rate changes

2. **raw_events data**:
   - Send to ML server for laughter/sigh classification
   - Construct emotion timeline
   - Use for mood inference

### ML Server Integration

- ML server retrieves `audio_base64` data from `raw_events` collection and classifies
- Sends classification results to Next.js web app

---

## Important Notes

### Data Storage Rules

| Item | Rule |
|------|------|
| Audio unknown | Not stored |
| Silence | Not stored |
| Actual event occurrence | Stored |
| No events for 1 hour | Generate 1 random dummy |
| Base64 WAV | Can be decoded back to WAV in ML |
| Firestore path | Must be `users/{userId}/raw_events` |

### Security

- Do not commit `google-services.json` file to Git
- Do not commit `local.properties` file to Git
- Be careful not to expose Firebase API keys

---

## Troubleshooting

### Build Errors

1. **Gradle Sync Failure**
   - Run `File > Invalidate Caches / Restart`
   - Run `./gradlew clean` and rebuild

2. **Missing google-services.json**
   - Download file from Firebase Console
   - Place in `app/` folder

### Runtime Errors

1. **Permission Denied**
   - Manually allow permissions in app settings
   - Or reinstall app and request permissions again

2. **Firestore Connection Failure**
   - Check internet connection
   - Verify Firebase project settings
   - Check `google-services.json` file

---

## License

This project follows the license of the main project.
