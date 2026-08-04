<div align="center">

# 🌱 Smart IoT-Based Irrigation System

<img src="https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge&logo=vercel" />
<img src="https://img.shields.io/badge/License-Academic-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/FYP-BSCS%202026-purple?style=for-the-badge" />

<br />

**An intelligent, full-stack IoT platform that combines real-time sensor monitoring, AI-powered decision making, and remote pump control to automate agricultural irrigation.**

<br />

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-smartirrigiation--fyp.vercel.app-064e3b?style=for-the-badge)](https://smartirrigiation-fyp.vercel.app)
[![Backend API](https://img.shields.io/badge/⚙️_Backend_API-Railway-0f172a?style=for-the-badge)](https://backend-production-adbb.up.railway.app)
[![AI Service](https://img.shields.io/badge/🤖_AI_Service-Railway-8b5cf6?style=for-the-badge)](https://smart-irrigation-system-production-7dd7.up.railway.app)

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

</div>

<br />

## 📋 Table of Contents

- Overview
- Features
- System Architecture
- Technology Stack
- Hardware Components
- Wiring Configuration
- AI Model
- Project Structure
- Getting Started
- Environment Variables
- API Reference
- Deployment
- Team

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🌍 Overview

Water scarcity is one of the most pressing challenges in modern agriculture. Traditional irrigation methods waste enormous amounts of water through over-irrigation or under-irrigation, directly impacting both crop yields and water conservation efforts.

The **Smart IoT-Based Irrigation System** addresses this problem by integrating physical sensor hardware with an AI-powered cloud platform. The system continuously monitors soil moisture, temperature, and humidity through deployed field sensors, uses a trained Random Forest machine learning model to make intelligent irrigation decisions, and controls a physical water pump through a relay module — all without requiring constant human intervention.

Farmers can monitor their fields in real time, receive automated alerts, configure field-specific crop profiles, and view historical water usage data through a responsive web dashboard accessible from any device.

> 🎓 **Final Year Project** — Bachelor of Science in Computer Science  
> 🏛️ Capital University of Science and Technology (CUST), Islamabad  
> 📅 2026

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## ✨ Features

### 🖥️ Web Dashboard
- **Real-time sensor monitoring** — live temperature, soil moisture, and humidity readings updated every 5 seconds
- **Irrigation animation** — visual indicator when the pump is actively running
- **System alerts** — automated warnings for critically low soil moisture, high temperature, high humidity, and sensor offline status
- **Water usage chart** — 7-day estimated water consumption chart calculated from pump runtime and configurable flow rate
- **Responsive design** — fully functional on desktop, tablet, and mobile devices

### 🤖 AI-Powered Smart Mode
- Random Forest classifier trained on agricultural data across 5 crop types
- Evaluates live sensor readings every 30 seconds
- Makes autonomous pump ON/OFF decisions based on crop type, soil type, seedling stage, moisture, temperature, and humidity
- Returns confidence score alongside binary irrigation decision
- Automatically falls back to local threshold control if server is unreachable

### 💧 Pump Control
- **Manual mode** — direct toggle control from dashboard
- **Smart mode** — fully automated AI-driven control
- Runtime tracking with session history
- Daily water usage accumulation with persistent history across days
- Commands relayed from server → ESP32 → Arduino → relay within 5 seconds

### 🔔 Notifications
- In-app notification bell with unread count badge
- Admin can broadcast system-wide alerts or target individual farmers
- Support for image attachments in notifications
- Individual delete and clear-all functionality

### 👩‍🌾 Field Management
- Register multiple field profiles per account
- Configure crop type, soil type, area size, and seedling stage per field
- AI model uses field configuration to tailor irrigation decisions
- Irrigation event history per field

### 🔐 Authentication & Security
- Email-based OTP verification on signup
- Secure password reset flow with time-limited codes
- Two-step verification for sensitive changes (email, password)
- HTTPS-only data transmission
- Role-based access control (farmer / admin)

### 👨‍💼 Admin Panel
- User management with field counts and verification status
- Broadcast notifications to all registered farmers
- System-wide sensor data logs per user
- Admin dashboard with live statistics

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FARMER'S FIELD                              │
│                                                                     │
│   ┌──────────┐     Serial      ┌──────────┐     Wi-Fi              │
│   │ Arduino  │◄───────────────►│  ESP32   │◄──────────────────┐    │
│   │   Uno    │   9600 baud     │          │                   │    │
│   └──────────┘                 └──────────┘                   │    │
│        │                                                       │    │
│   ┌────┴──────────────────┐                                   │    │
│   │  Sensors & Actuators  │                                   │    │
│   │  • YL-69 Soil Sensor  │                                   │    │
│   │  • DHT11 Temp/Humid   │                                   │    │
│   │  • Relay Module       │                                   │    │
│   │  • Water Pump         │                                   │    │
│   └───────────────────────┘                                   │    │
└───────────────────────────────────────────────────────────────│────┘
                                                                │
                                                         HTTPS  │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLOUD INFRASTRUCTURE                            │
│                                                                     │
│   ┌─────────────────────┐        ┌────────────────────────────┐    │
│   │   Node.js Backend   │◄──────►│   Python Flask AI Service  │    │
│   │   (Railway)         │  HTTP  │   (Railway)                │    │
│   │                     │        │                            │    │
│   │  • REST API         │        │  • Random Forest Model     │    │
│   │  • Smart Loop 30s   │        │  • POST /predict           │    │
│   │  • Auth & Email     │        │  • Confidence scoring      │    │
│   └─────────┬───────────┘        └────────────────────────────┘    │
│             │                                                       │
│    ┌────────┴────────┐                                             │
│    │                 │                                             │
│    ▼                 ▼                                             │
│ ┌──────────┐   ┌──────────┐                                       │
│ │MongoDB   │   │MongoDB   │                                       │
│ │Cluster A │   │Cluster B │                                       │
│ │(Main DB) │   │(IoT DB)  │                                       │
│ │users     │   │readings  │                                       │
│ │fields    │   │SensorData│                                       │
│ │notifs    │   └──────────┘                                       │
│ └──────────┘                                                       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   │ HTTPS
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vercel)                           │
│                                                                     │
│  Dashboard │ Sensors │ History │ Fields │ Weather │ Settings        │
│            │         │         │        │         │                 │
│  Admin Panel: Users │ Notifications │ History │ Dashboard          │
└─────────────────────────────────────────────────────────────────────┘
```

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing with role-based guards |
| Bootstrap 5 | Responsive layout and base components |
| Recharts | Water usage bar chart and data visualization |
| Axios | HTTP client for all API calls |
| React Icons | Icon library (Font Awesome set) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| Mongoose | MongoDB ODM for both database clusters |
| bcryptjs | Password hashing |
| Nodemailer | OTP and alert email delivery via Gmail SMTP |
| cors | Cross-origin request handling |
| dotenv | Environment variable management |

### AI Microservice
| Technology | Purpose |
|---|---|
| Python + Flask | Lightweight API server for model inference |
| scikit-learn | Random Forest classifier training and prediction |
| pandas | Feature encoding and dataframe manipulation |
| joblib | Model serialization and deserialization |
| gunicorn | Production WSGI server |
| flask-cors | Cross-origin support for Node.js calls |

### Database
| Cluster | Purpose |
|---|---|
| MongoDB Atlas — Cluster A | Users, fields, notifications, irrigation events, sensor devices |
| MongoDB Atlas — Cluster B | Live sensor readings (IoT data, high write volume) |

### Hardware
| Component | Role |
|---|---|
| Arduino Uno | Sensor reading, relay control, local fallback logic |
| ESP32 Dev Board | Wi-Fi connectivity, HTTP client, Serial2 bridge |
| YL-69 Soil Sensor | Analog soil moisture measurement (0–1023 ADC → 1–100%) |
| DHT11 Sensor | Digital temperature and humidity reading |
| 5V Relay Module | Electrical switch for water pump activation |

### DevOps & Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting with automatic CI/CD from GitHub |
| Railway | Backend and AI service hosting with environment variables |
| GitHub | Version control and deployment trigger |

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🔩 Hardware Components

| Component | Specification |
|---|---|
| Microcontroller | Arduino Uno (ATmega328P, 5V logic, 10-bit ADC) |
| Wi-Fi Module | ESP32 DevKit (3.3V logic, dual-core, built-in Wi-Fi) |
| Soil Sensor | YL-69 resistive soil moisture sensor with LM393 comparator board |
| Temp/Humidity | DHT11 (0–50°C ±2°C, 20–80% RH ±5%) |
| Relay | 5V single-channel relay module (active LOW) |
| LEDs | 3× status LEDs (Green = OK, Yellow = out of range, Red = error) |
| Resistors | 220Ω × 3 (LEDs), 10kΩ × 1 (DHT11 pull-up), 1kΩ + 2kΩ (voltage divider) |

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🔌 Wiring Configuration

> ⚠️ **Critical:** Arduino operates at 5V logic. ESP32 operates at 3.3V logic. A voltage divider is **required** on the Arduino TX → ESP32 RX line to prevent damage.

### Voltage Divider (Arduino Pin 4 → ESP32 GPIO 16)
```
Arduino Pin 4 (TX) ──[1kΩ]──┬──── ESP32 GPIO 16 (RX2)
                             │
                           [2kΩ]
                             │
                            GND
```

### Complete Pin Mapping

| Component | Pin | Connects To | Notes |
|---|---|---|---|
| DHT11 VCC | — | Arduino 5V | Power |
| DHT11 GND | — | Arduino GND | Ground |
| DHT11 DATA | — | Arduino D2 | + 10kΩ pull-up to 5V |
| YL-69 VCC | — | Arduino 5V | Power |
| YL-69 GND | — | Arduino GND | Ground |
| YL-69 AO | — | Arduino A0 | Analog output only |
| Relay VCC | — | Arduino 5V | Power |
| Relay GND | — | Arduino GND | Ground |
| Relay IN | — | Arduino D7 | Active LOW signal |
| Green LED | — | Arduino D10 | Via 220Ω resistor |
| Yellow LED | — | Arduino D11 | Via 220Ω resistor |
| Red LED | — | Arduino D12 | Via 220Ω resistor |
| Arduino D4 (TX) | → | ESP32 GPIO 16 (RX2) | Via 1kΩ+2kΩ voltage divider |
| Arduino D3 (RX) | ← | ESP32 GPIO 17 (TX2) | Direct connection |
| Arduino GND | — | ESP32 GND | Shared ground — essential |
| ESP32 | — | Separate USB power | Do NOT power from Arduino 3.3V |

### LED Status Codes
| LED | Meaning |
|---|---|
| 🟢 Green | All sensors normal, system operating correctly |
| 🟡 Yellow | Readings outside configured environmental range |
| 🔴 Red | Sensor error, disconnected sensor, or invalid reading |

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🤖 AI Model

### Algorithm
**Random Forest Classifier** — an ensemble of decision trees that votes on the final prediction. Chosen for its robustness with tabular data, resistance to overfitting, and natural handling of mixed numerical and categorical features.

### Input Features (23 total after encoding)

| Feature | Type | Source |
|---|---|---|
| MOI (Moisture Index) | Numerical (1–100%) | YL-69 sensor via Arduino |
| Temperature | Numerical (°C) | DHT11 sensor |
| Humidity | Numerical (%) | DHT11 sensor |
| Crop Type | Categorical (one-hot) | Farmer field configuration |
| Soil Type | Categorical (one-hot) | Farmer field configuration |
| Seedling Stage | Categorical (one-hot) | Farmer field configuration |

### Supported Crops
`Wheat` · `Tomato` · `Potato` · `Carrot` · `Chilli`

### Output
```json
{
  "prediction": 1,
  "confidence": 0.87,
  "message": "Irrigate"
}
```
- `prediction: 1` → Turn pump ON
- `prediction: 0` → No irrigation needed
- `confidence` → Probability score from `predict_proba` (0.0 – 1.0)

### Smart Irrigation Loop
```
Every 30 seconds:
  For each user with Smart Mode enabled:
    1. Fetch latest sensor reading from IoT DB
    2. Fetch field configuration (crop, soil, stage)
    3. POST to Flask AI service /predict
    4. If prediction changed → update pumpStatus in MongoDB
    5. ESP32 polls /api/device/pump-command → sends PUMP:1 or PUMP:0 to Arduino
    6. Arduino activates/deactivates relay → pump turns on/off
```

### Fallback Behavior
If the AI service is unreachable (timeout > 10 seconds), the loop skips that cycle without changing the pump state. If the ESP32 cannot reach the server, it sends `MODE:LOCAL` to the Arduino, which then uses a configurable soil moisture threshold (default 40%) to control the relay independently.

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 📁 Project Structure

```
smart-irrigation-system/
│
├── 📂 src/                          # React frontend (Vite)
│   ├── 📂 pages/
│   │   ├── DashboardPage.jsx        # Live sensor readings, pump, alerts, water chart
│   │   ├── SensorsPage.jsx          # Hardware cards and raw data log
│   │   ├── HistoryPage.jsx          # Filterable sensor history with CSV export
│   │   ├── FieldsPage.jsx           # Field profiles and irrigation event log
│   │   ├── WeatherPage.jsx          # 7-day agricultural weather forecast
│   │   ├── SettingsPage.jsx         # Smart mode, thresholds, alerts, danger zone
│   │   ├── ProfilePage.jsx          # User profile management
│   │   ├── LoginPage.jsx            # Authentication
│   │   ├── SignupPage.jsx           # Registration with email OTP
│   │   ├── ForgotPassword.jsx       # Password recovery flow
│   │   ├── AdminDashboardPage.jsx   # Admin stats and overview
│   │   ├── AdminUsersPage.jsx       # Farmer management
│   │   ├── AdminHistoryPage.jsx     # Per-farmer sensor log
│   │   ├── AdminNotificationsPage.jsx # Notification broadcast
│   │   ├── AdminProfilePage.jsx     # Admin profile
│   │   └── TeamPage.jsx             # QR-code-accessed team page
│   │
│   ├── 📂 layouts/
│   │   ├── DashboardLayout.jsx      # Farmer layout (sidebar + header)
│   │   └── AdminLayout.jsx          # Admin layout (sidebar + header)
│   │
│   ├── 📂 Components/
│   │   ├── PumpControl.jsx          # Manual/smart pump toggle with live timer
│   │   ├── NotificationBell.jsx     # Dropdown bell with delete functionality
│   │   ├── VerifyEmail.jsx          # OTP verification component
│   │   ├── CurrentWeather.jsx       # Current conditions widget
│   │   ├── DailyForecast.jsx        # 7-day forecast cards
│   │   └── HourlyForecast.jsx       # 24-hour hourly breakdown
│   │
│   ├── App.jsx                      # Routes with UserGuard and AdminGuard
│   └── index.css                    # Global styles, sidebar, header, animations
│
├── 📂 backend/                      # Node.js + Express API
│   ├── index.js                     # Main server, schemas, all routes
│   ├── smartIrrigation.js           # 30-second AI irrigation loop
│   └── 📂 routes/
│       ├── sensorRoutes.js          # IoT sensor data CRUD (Cluster B)
│       └── dataRoutes.js            # Raw ESP32 data endpoint
│
├── 📂 ai-service/                   # Python Flask AI microservice
│   ├── main.py                      # Flask app with /predict endpoint
│   ├── irrigation_rf_model.pkl      # Trained Random Forest model
│   ├── requirements.txt             # Python dependencies
│   └── Procfile                     # gunicorn start command for Railway
│
├── 📂 hardware/                     # Arduino and ESP32 firmware
│   ├── Arduino_Uno.ino              # Sensor reading, relay control, command parsing
│   └── ESP32.ino                    # Wi-Fi, HTTP client, Serial2 bridge
│
├── vercel.json                      # SPA rewrite rule for React Router
├── package.json                     # Frontend dependencies
└── README.md                        # This file
```

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (two clusters)
- Arduino IDE with DHT and SoftwareSerial libraries
- Gmail account with App Password enabled for SMTP

### 1. Clone the Repository
```bash
git clone https://github.com/ZeeshanSajid03/smart-irrigation-system.git
cd smart-irrigation-system
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install AI Service Dependencies
```bash
cd ai-service
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create `backend/.env`:
```env
MONGO_URI=mongodb+srv://...your_main_cluster...
MONGO_URI_IOT=mongodb+srv://...your_iot_cluster...
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
AI_SERVICE_URL=http://localhost:5001
PORT=3001
```

Create `.env` in root (frontend):
```env
VITE_API_URL=http://localhost:3001
VITE_WEATHER_API_KEY=your_openweathermap_key
```

### 6. Run All Services

Terminal 1 — Backend:
```bash
cd backend && node index.js
```

Terminal 2 — AI Service:
```bash
cd ai-service && python main.py
```

Terminal 3 — Frontend:
```bash
npm run dev
```

### 7. Flash Hardware

Open `hardware/Arduino_Uno.ino` in Arduino IDE and upload to Arduino Uno.

Open `hardware/ESP32.ino`, update:
```cpp
const char* BASE_URL = "http://YOUR_PC_LOCAL_IP:3001";
const char* DEVICE_USER_EMAIL = "your_farmer@email.com";
```
Upload to ESP32.

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string for Cluster A (main data) |
| `MONGO_URI_IOT` | MongoDB Atlas connection string for Cluster B (IoT sensor data) |
| `EMAIL_USER` | Gmail address used for sending OTP and alert emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |
| `AI_SERVICE_URL` | URL of the Python Flask AI microservice |
| `PORT` | Port for Express server (default: 3001) |
| `NODE_ENV` | Set to `production` on Railway |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (localhost for dev, Railway URL for production) |
| `VITE_WEATHER_API_KEY` | OpenWeatherMap API key for weather page |

### ESP32 Firmware Constants

| Constant | Description |
|---|---|
| `WIFI_SSID` | Wi-Fi network name |
| `WIFI_PASSWORD` | Wi-Fi password |
| `DEVICE_USER_EMAIL` | Email of the farmer account this device belongs to |
| `BASE_URL` | Backend URL (local IP for dev, Railway HTTPS URL for production) |

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register new user with email OTP |
| POST | `/verify-email` | Verify OTP and activate account |
| POST | `/login` | Authenticate and return user object |
| POST | `/forgot-password` | Send password reset OTP |
| POST | `/reset-password` | Set new password after OTP verification |

### Sensor Data
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sensor-data` | ESP32 posts live readings |
| GET | `/api/sensor-data/:email` | Fetch latest 2000 readings for user |
| DELETE | `/api/sensor-data/clear?email=` | Clear all readings for user |
| GET | `/api/sensor-data/admin-stats` | Readings per day for last 7 days |

### Pump Control
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pump/status/:email` | Get pump state, runtime, flow rate, history |
| POST | `/api/pump/control` | Manual or smart mode pump control |
| GET | `/api/device/pump-command?email=` | ESP32 polls for pump command |

### Fields & Settings
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/fields/add` | Add new field configuration |
| PUT | `/api/fields/update/:id` | Update field details |
| DELETE | `/api/fields/delete/:id` | Remove a field |
| GET | `/api/fields/:email` | Get all fields for user |
| GET | `/api/user-settings/:email` | Fetch thresholds and flow rate |
| POST | `/api/user-settings` | Save thresholds and flow rate |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/:email` | Fetch all notifications for user |
| PUT | `/api/notifications/read/:id` | Mark notification as read |
| DELETE | `/api/notifications/delete/:id` | Delete single notification |
| DELETE | `/api/notifications/clear/:email` | Clear all notifications |
| POST | `/api/admin/notifications/send` | Send to one user or all users |

### AI Service
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/features` | List all 23 model feature names |
| POST | `/predict` | Run irrigation prediction |

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## ☁️ Deployment

### Frontend → Vercel
1. Push repository to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Vercel auto-deploys on every push to `main`

### Backend → Railway
1. Create new service on [railway.app](https://railway.app)
2. Connect GitHub repository, set root directory to `backend`
3. Add all environment variables in Railway Variables tab
4. Set start command: `node index.js`
5. Generate domain and note the URL

### AI Service → Railway
1. Add another service in the same Railway project
2. Set root directory to `ai-service`
3. Set start command: `gunicorn main:app`
4. Add `PORT=8080` environment variable
5. Generate domain and update `AI_SERVICE_URL` in backend variables

### MongoDB Atlas
Both clusters require **Network Access → Allow from anywhere (0.0.0.0/0)** since Railway uses dynamic IPs.

### Pausing Railway (to preserve free credits)
```
Railway → Service → Settings → Suspend Service
```
Resume before use. Vercel frontend remains live at no cost regardless.

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

## 👨‍💻 Team

<table>
  <tr>
    <td align="center">
      <b>Zeeshan Sajid</b><br/>
      <sub>Backend & AI Developer</sub><br/>
      <a href="https://github.com/ZeeshanSajid03">GitHub</a> ·
      <a href="https://linkedin.com/in/zeeshan-sajid">LinkedIn</a>
    </td>
    <td align="center">
      <b>Tallal Mahmood</b><br/>
      <sub>IoT & Hardware Engineer</sub><br/>
      <a href="https://github.com/tallalmirza04">GitHub</a> ·
      <a href="https://linkedin.com/in/tallal-mahmood">LinkedIn</a>
    </td>
    <td align="center">
      <b>Haysan Sajid</b><br/>
      <sub>Frontend Developer</sub><br/>
      <a href="https://github.com/Hayansajid">GitHub</a> ·
      <a href="https://linkedin.com/in/hayan-sajid-a60745355">LinkedIn</a>
    </td>
  </tr>
</table>

<br />

**Supervisor:** [Ms. Snober Naseer] — Capital University of Science and Technology

<br />

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" />

<br />

<div align="center">

**Capital University of Science and Technology · Department of Computer Science · 2026**

</div>
