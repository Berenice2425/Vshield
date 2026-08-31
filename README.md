
# 🛡️ VShield

### AI-Powered Vehicle Security for Africa

> **Securing Nigeria, one vehicle at a time.**

VShield is an AI-powered vehicle security and biometric immobilization platform designed for the realities of the African mobility environment.

It combines **edge biometric authentication, intelligent threat analysis, vehicle immobilization, tamper detection, fleet monitoring, and cloud-based management** to create a vehicle security system that can continue protecting a vehicle even when internet connectivity is unavailable.

VShield is being developed for the **Google Africa Applied AI Lab 2026**.

---

## 🚨 The Problem

Vehicle security remains a serious challenge across Nigeria and other African markets.

Existing solutions frequently depend on:

- Physical keys
- Basic alarms
- GPS trackers
- Constant internet connectivity
- Reactive tracking after a vehicle has already been stolen

These systems can help locate a stolen vehicle, but they do not necessarily prevent an unauthorized person from starting or moving it.

Connectivity is another challenge.

A security system should not stop protecting a vehicle simply because mobile data, Wi-Fi, or a cloud service becomes unavailable.

VShield approaches the problem differently:

> **Verify the driver before allowing the vehicle to operate.**

---

# 💡 The VShield Solution

VShield combines a web-based management platform with a planned in-vehicle security module called the **VShield Brain**.

The system is designed around four principles:

### 1. Verify
Confirm that the person attempting to use the vehicle is authorized.

### 2. Detect
Identify suspicious vehicle activity and contextual threat signals.

### 3. Decide
Use local security rules together with AI-assisted threat analysis.

### 4. Protect
Prevent or restrict unauthorized vehicle operation and alert the owner.

---

# ✨ Core Features

## 🔐 Edge Biometric Authentication

VShield is designed to support:

- Facial authentication
- Fingerprint authentication
- Authorized-driver verification
- Offline authentication

Biometric matching is intentionally designed to occur on the **vehicle edge device**, rather than in the cloud.

Raw biometric images, templates, embeddings, fingerprints, and feature vectors must **never be stored in MongoDB or Azure Blob Storage**.

The cloud receives only verification metadata such as:

```json
{
  "vehicle_id": "...",
  "result": "Success",
  "confidence": 97.4,
  "timestamp": "..."
}
````

This architecture helps preserve user privacy while allowing the management platform to maintain useful security records.

---

## 🤖 Google Gemini Threat Intelligence

VShield integrates **Google Gemini** through a server-side AI threat-analysis service.

The current threat simulator evaluates contextual information such as:

* Location
* Time
* Vehicle movement pattern
* Suspicious activity context

Gemini produces structured threat intelligence that can include:

* Risk assessment
* Reasoning
* Recommended action

Example flow:

```text
Vehicle Context
      ↓
VShield Backend
      ↓
Google Gemini
      ↓
Threat Assessment
      ↓
Risk + Recommendation
```

Gemini credentials remain server-side and are never exposed to the browser.

---

# 🚙 VShield Brain

The VShield Brain is the planned edge hardware component installed inside the vehicle.

The architecture is designed around components such as:

```text
ESP32-S3
   │
   ├── Camera
   ├── Fingerprint Sensor
   ├── Tamper Detection
   ├── Secure Local Storage
   ├── Vehicle Control Interface
   └── Secure Communication
```

The most important design requirement is:

> **Core vehicle authentication and protection must remain operational without internet connectivity.**

Cloud connectivity enhances VShield but must not become a dependency for core immobilization security.

---

# 📴 Offline-First Security

VShield is being designed specifically for environments where connectivity cannot always be guaranteed.

The intended edge workflow is:

```text
Driver attempts vehicle access
            ↓
Edge biometric verification
            ↓
       Authorized?
        /       \
      YES        NO
       ↓          ↓
Vehicle Access   Block / Immobilize
       ↓          ↓
     Drive       Security Event
                    ↓
            Sync when available
```

This means temporary loss of cloud connectivity should not remove the vehicle's core security capability.

---

# 🧠 System Architecture

VShield uses a hybrid **Edge + Cloud + AI** architecture.

```text
┌──────────────────────────────┐
│       VShield Web App        │
│ React + TypeScript + Vite    │
└──────────────┬───────────────┘
               │
               │ HTTPS / REST API
               ▼
┌──────────────────────────────┐
│      Node.js / Express       │
│        VShield API           │
├──────────────────────────────┤
│ Authentication              │
│ Fleet Management            │
│ Alert Management            │
│ Biometric Metadata Logs     │
│ Threat Analysis             │
│ File Management             │
└───────┬─────────┬────────────┘
        │         │
        │         └──────────────► Google Gemini
        │                          Threat Intelligence
        │
        ├──────────────► MongoDB Atlas
        │                Application Data
        │
        └──────────────► Azure Blob Storage
                         Approved Non-Biometric Files


┌──────────────────────────────┐
│       VShield Brain          │
│      Vehicle Edge Layer      │
├──────────────────────────────┤
│ Biometric Processing        │
│ Driver Authentication       │
│ Tamper Detection            │
│ Immobilization Logic        │
│ Secure Local Storage        │
└──────────────────────────────┘

        RAW BIOMETRICS
              │
              X
       NEVER SENT TO CLOUD
```

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript
* REST APIs

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* JSON Web Tokens (JWT)
* bcrypt password hashing
* Protected API routes

### Artificial Intelligence

* Google Gemini
* `@google/genai`
* Server-side threat-analysis integration

### Cloud Storage

* Microsoft Azure Blob Storage

Azure storage is restricted to approved **non-biometric** objects and documents.

### Deployment

* Vercel
* Custom production domain

---

# 🌐 Live Application

### VShield

[https://www.vshieldng.online](https://www.vshieldng.online)

---

# 🗂️ Main Application Modules

## Dashboard

Provides an overview of:

* Registered vehicles
* Vehicle status
* Active alerts
* Immobilized vehicles
* Fleet activity
* AI threat analysis

---

## Fleet Management

Vehicle owners can manage registered vehicles and their current security state.

Vehicle states include:

```text
Armed
Driving
Immobilized
Parked
Maintenance
```

---

## Alerts

VShield supports security events including:

```text
Unauthorized Movement
Geofence Breach
Vehicle Tampering
Immobilization
Biometric Failure
Threat Detected
Other
```

Alerts can have severity levels:

```text
Low
Medium
High
Critical
```

and lifecycle states:

```text
Active
Acknowledged
Resolved
```

---

## Biometrics

The biometric dashboard displays verification information without storing raw biometric material in the cloud.

The cloud architecture is limited to metadata such as:

* Verification result
* Confidence
* Vehicle identifier
* Timestamp

Actual biometric processing belongs to the VShield edge security layer.

---

## AI Threat Simulator

The simulator demonstrates how Gemini can contribute contextual intelligence to the VShield security architecture.

Users can provide:

```text
Location Context
Time
Movement Pattern
```

The backend then requests a structured threat assessment from Gemini.

This allows VShield to move beyond static security rules toward context-aware vehicle protection.

---

# ☁️ Azure Blob Storage

Azure Blob Storage forms part of VShield's cloud infrastructure.

It is intended only for approved non-biometric files, such as:

* Vehicle photographs
* Inspection photographs
* Registration documents
* Ownership documents
* Maintenance documents
* Incident photographs
* Incident documents

### Important

Azure Blob Storage is **NOT** permitted to contain:

* Facial templates
* Fingerprint templates
* Biometric embeddings
* Biometric feature vectors
* Raw biometric captures
* Base64 biometric representations

Biometric security remains an edge responsibility.

---

# 🗄️ Data Architecture

Core MongoDB models include:

### User

```text
email
password
name
timestamps
```

Passwords are stored as bcrypt hashes.

### Vehicle

```text
name
plate_number
status
user_id
timestamps
```

### Alert

```text
vehicle_id
type
severity
message
status
location
timestamp
```

### Biometric Verification Log

```text
vehicle_id
result
confidence
timestamp
```

The biometric log deliberately contains **no biometric template or image field**.

---

# 🔒 Security & Privacy by Design

Vehicle security systems handle highly sensitive information.

VShield therefore follows several architectural principles:

### Edge-first biometrics

Biometric matching is performed locally.

### No raw biometrics in cloud storage

MongoDB and Azure are intentionally excluded from storing raw biometric data.

### Password protection

Passwords are hashed using bcrypt.

### API authentication

Protected backend endpoints use JWT authentication.

### Secret isolation

Credentials such as:

```text
MONGODB_URI
GEMINI_API_KEY
AZURE_STORAGE_CONNECTION_STRING
JWT_SECRET
```

must exist only in secure server-side environment variables.

They must never be committed to this repository.

---

# 🔑 Environment Configuration

Create the required server-side environment variables in your deployment environment.

Example names:

```env
MONGODB_URI=
JWT_SECRET=
GEMINI_API_KEY=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_NAME=
APP_URL=
```

**Never commit actual secrets to GitHub.**

---

# 💻 Local Development

Clone the repository:

```bash
git clone <repository-url>
cd VShield
```

Install dependencies:

```bash
npm install
```

Configure the required development environment variables.

Then start the development environment:

```bash
npm run dev
```

For a production build:

```bash
npm run build
```

---

# 🛡️ Graceful Degradation

One of VShield's important architectural principles is that cloud services should enhance vehicle security rather than define its availability.

For example:

```text
Gemini unavailable
        ↓
Core vehicle management continues

Cloud temporarily unavailable
        ↓
Edge authentication continues

Internet unavailable
        ↓
Local vehicle protection continues
```

This is particularly important for deployment across African connectivity environments.

---

# 🎯 Target Users

VShield is designed to serve several segments.

### Individual Vehicle Owners

People who want stronger protection than conventional alarms and GPS tracking.

### Families

Households managing multiple vehicles and authorized drivers.

### Fleet Operators

Logistics, transportation, delivery, rental, and corporate fleets requiring centralized monitoring.

### Enterprise Partners

Potential future integration opportunities include:

* Insurance companies
* Vehicle dealerships
* Fleet operators
* Mobility companies
* Corporate transportation providers

---

# 🌍 Why Africa?

VShield is not simply a global vehicle-security product localized for Africa.

Its architecture is influenced by African operating conditions:

* Intermittent connectivity
* Vehicle theft risk
* Need for affordable aftermarket security
* Large existing vehicle fleets
* Mixed vehicle ages and manufacturers
* Need for offline-capable systems

This leads to the fundamental VShield design principle:

> **Cloud intelligence when connected. Edge protection always.**

---

# 🧪 Current Development Status

VShield currently has a working full-stack software prototype covering major cloud and application components.

Implemented work includes:

* Web dashboard
* Fleet management interface
* Vehicle APIs
* MongoDB data models
* Authentication architecture
* JWT-protected API flow
* bcrypt password security
* Alert architecture
* Biometric verification metadata architecture
* Google Gemini threat-analysis integration
* Azure Blob Storage integration architecture
* Production deployment infrastructure
* Custom domain configuration

The next major development stage is the integration and validation of the **physical VShield Brain edge prototype** with the software platform.

---

# 🗺️ Development Roadmap

```text
Current
│
├── Full-stack VShield platform
├── Cloud architecture
├── Authentication
├── Fleet management
├── Alert system
├── Gemini threat simulator
└── Production deployment

Next
│
├── VShield Brain hardware prototype
├── Edge biometric engine
├── Secure enrollment
├── Hardware ↔ platform communication
├── Tamper detection
└── Controlled immobilization testing

Then
│
├── Closed vehicle pilot
├── Threat-model validation
├── Security testing
├── Fleet pilot
└── Commercial validation
```

---

# 🇳🇬 Google Africa Applied AI Lab 2026

VShield is submitted to the **Google Africa Applied AI Lab** as an African-built application of AI to a real-world security challenge.

Google AI is not intended to replace VShield's deterministic safety mechanisms or edge authentication.

Instead, Gemini provides an intelligence layer capable of interpreting contextual information and helping identify patterns that static security rules alone may miss.

The combination is:

```text
EDGE SECURITY
     +
CLOUD PLATFORM
     +
GOOGLE AI
     =
VSHIELD
```

Our objective is to progress from the current software prototype toward an integrated, validated vehicle security system.

---

# 🚀 Vision

VShield begins with vehicle theft prevention.

The larger vision is an intelligent vehicle trust layer capable of answering a simple but important question:

> **Should this vehicle be allowed to move right now?**

By combining privacy-preserving edge authentication with contextual AI and cloud fleet intelligence, VShield aims to make advanced vehicle security accessible across Africa.

---

## VShield

### Securing Nigeria, one vehicle at a time.

**Built in Africa. Designed for African realities. Powered by intelligent, privacy-conscious security.**

```
