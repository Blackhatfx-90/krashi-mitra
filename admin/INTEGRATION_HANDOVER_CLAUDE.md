# 🌾 Krishi Mitra (AgriAI) — Admin Dashboard to Mobile App Integration Guide for Claude Code

> **Target Audience:** Claude Code / Full-Stack AI Engineer  
> **Hackathon:** Smart India Hackathon (SIH 2026) | Problem Statement ID: **26131**  
> **Problem Statement Title:** Early detection and management of crop diseases and pest infestations  
> **Organization:** Ministry of Agriculture & Farmers Welfare / State Agriculture Departments  
> **Live Farmer Mobile App:** [https://krashi-mitrasih.vercel.app/](https://krashi-mitrasih.vercel.app/)  
> **Admin Dashboard Repository:** `mediconnect` (React 19 + Vite + Tailwind CSS v4 + React-Leaflet + Lucide + Recharts)

---

## 🎯 Executive Summary & Mission

This repository contains the **Official Government Regional Command Center (Admin Dashboard)** built to monitor, ground-truth, and contain crop epidemics reported by farmers using the **Krishi Mitra (AgriAI) Mobile Web App**.

### 🌟 Key Objectives for Claude Code:
1. **Live Scan Ingestion:** When a farmer scans a diseased leaf on the web app, stream the diagnostic payload (Farmer Name, Phone, GPS Coordinates, Khasra Plot No, Sown Crop, Detected Pathogen, Confidence Score, Image Base64/URL) into the Admin Cadastral Map (`OutbreakMap.jsx`) and Field Validation Queue (`FieldValidationQueue.jsx`).
2. **Dynamic Cadastral Geofencing:** Render the farmer's registered parcel (Polygon boundary) over high-resolution Sentinel-2 / Google Satellite imagery, color-coded by the exact 7 supported crops, with a pulsating red hazard outline if infested.
3. **Advisory & Logistics Feedback Loop:** When an admin agronomist verifies a scan or issues a CIBRC emergency advisory, push the notification (SMS/Push Notification/FCM) directly back to the farmer's mobile interface.

---

## 🏗️ Project Architecture & File Directory

```
mediconnect/
├── index.html                           # App entry point with Leaflet & Noto Sans Devanagari fonts
├── package.json                         # Dependencies (react 19, react-leaflet 5, lucide-react, recharts, tailwindcss 4)
├── vite.config.js                       # Vite build configuration
├── src/
│   ├── main.jsx                         # Main React bootstrap with local Leaflet CSS import
│   ├── App.jsx                          # Root Router & State-Wise Authentication controller
│   ├── index.css                        # Tailwind v4 theme, Leaflet 580px container rules, Devanagari typography
│   ├── pages/
│   │   ├── admin/
│   │   │   └── RegionalAdminDashboard.jsx  # Main orchestrator dashboard (Map, Radar, Validation, Demand, Advisory, Analytics)
│   │   └── auth/
│   │       └── StateOfficerLogin.jsx       # 1-Click State Government Login (UP, Uttarakhand, Maharashtra)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminNavbar.jsx          # State branding header, division switcher, live emergency ticker, profile/logout
│   │   │   └── AdminSidebar.jsx         # Module navigation, active state metrics, direct link to live farmer app
│   │   ├── dashboard/
│   │   │   ├── OutbreakMap.jsx          # Leaflet Geospatial Cadastral Map (Google Satellite / Esri / Street Map)
│   │   │   ├── PlotCadastralDrawer.jsx  # Inspector drawer for individual clicked farm parcels (Khasra #, NDVI, Sowing, Actions)
│   │   │   ├── ClusterDetailDrawer.jsx  # Diagnostic drawer for macro epidemic clusters with State University Lab contacts
│   │   │   ├── FieldValidationQueue.jsx # Ground-truthing inbox for farmer scans (Approve, Reject, Refer to Lab)
│   │   │   ├── EarlyWarningRadar.jsx    # 7-Day micro-climate disease prediction engine
│   │   │   ├── DemandForecasting.jsx    # Input warehouse deficit tracker (Trichoderma, Streptocycline, Sprayers)
│   │   │   ├── AdvisoryBroadcast.jsx    # CIBRC-compliant multilingual SMS/Push advisory dispatch center
│   │   │   └── RegionalAnalytics.jsx    # Recharts trend graphs & crop loss prevention impact KPIs
│   │   └── ui/
│   │       └── RequisitionModal.jsx     # Emergency buffer stock transfer order modal between state warehouses
│   └── data/
│       ├── multiStateAgriData.js        # Multi-tenant state datasets (UP, UK, MH) with 1-to-1 polygon coordinates
│       └── maharashtraAgriData.js       # Core agricultural protocols, CIBRC chemical dosages, and validation queues
```

---

## 🌾 EXACT 7 Crops & Diseases Supported

The system is strictly aligned with the exact 7 crops implemented on [https://krashi-mitrasih.vercel.app/](https://krashi-mitrasih.vercel.app/):

| Crop ID | Crop Name | Color Hex | Key Pathogens / Pests |
| :--- | :--- | :--- | :--- |
| `rice` | 🌾 Rice / Paddy (धान) | `#22c55e` | Bacterial Leaf Blight (BLB), Rice Blast, Brown Spot, Sheath Blight, Stem Borer |
| `sugarcane` | 🎋 Sugarcane (गन्ना) | `#16a34a` | Red Rot (*Colletotrichum falcatum*), Whip Smut, Grassy Shoot, Pokkah Boeng |
| `wheat` | 🌾 Wheat (गेहूं) | `#eab308` | Brown Rust, Yellow Rust, Spot Blotch, Powdery Mildew, Loose Smut |
| `mustard` | 🌼 Mustard (सरसों) | `#f59e0b` | White Rust (*Albugo candida*), Alternaria Blight, Downy Mildew |
| `potato` | 🥔 Potato (आलू) | `#d97706` | Black Scurf (*Rhizoctonia solani*), Blackleg, Late Blight, Common Scab |
| `maize` | 🌽 Maize / Corn (मक्का) | `#ea580c` | Fall Armyworm (*Spodoptera frugiperda*), Stem Borer, Gray Leaf Spot |
| `onion` | 🧅 Onion (प्याज) | `#9333ea` | Purple Blotch (*Alternaria porri*), Downy Mildew, Fusarium Basal Rot |

---

## 📡 API & Database Contract (Wiring Specs for Claude Code)

### 1. Farmer Scan Submission Payload (Farmer App ➡️ Backend ➡️ Admin Dashboard)
When a farmer scans a crop on `https://krashi-mitrasih.vercel.app/`, post this JSON payload:

```json
{
  "scanId": "SCAN-UP-2026-9812",
  "timestamp": "2026-09-01T10:30:00Z",
  "stateId": "uttar_pradesh",
  "divisionId": "rohilkhand",
  "district": "Bareilly",
  "village": "Mauza Rithora",
  "khasraNo": "खसरा संख्या 142/1",
  "farmer": {
    "name": "Virendra Singh Gangwar",
    "phone": "+91 94125 78210",
    "landAreaAcres": 2.4
  },
  "crop": "rice",
  "cropName": "Rice / धान (बासमती)",
  "aiDiagnosis": {
    "disease": "Bacterial Leaf Blight (जीवाणु झुलसा / BLB)",
    "confidence": 94.8,
    "severity": "critical",
    "imageUrl": "https://storage.googleapis.com/krishi-mitra/scans/rice_blb_01.jpg"
  },
  "gps": {
    "lat": 28.3243,
    "lng": 79.5180
  },
  "cadastralPolygon": [
    [28.3248, 79.5175],
    [28.3248, 79.5186],
    [28.3238, 79.5186],
    [28.3238, 79.5175]
  ],
  "verificationStatus": "pending"
}
```

### 2. Admin Verification & Advisory Dispatch (Admin Dashboard ➡️ Farmer App)
When an agronomist approves a scan or broadcasts an emergency IPM advisory:

```json
{
  "advisoryId": "ADV-CIBRC-4410",
  "timestamp": "2026-09-01T11:00:00Z",
  "targetZone": {
    "stateId": "uttar_pradesh",
    "district": "Bareilly",
    "crop": "rice"
  },
  "protocol": {
    "chemical": "Streptocycline (6g) + Copper Oxychloride (500g) in 200L water per acre",
    "safetyWaitingPeriodDays": 15,
    "cibrcApproved": true
  },
  "messageTextHi": "कृषि विभाग चेतावनी: बरेली क्षेत्र में धान में जीवाणु झुलसा (BLB) का प्रकोप देखा गया है। तुरंत स्ट्रेप्टोसाइक्लिन 6 ग्राम + कॉपर ऑक्सीक्लोराइड 500 ग्राम प्रति 200 लीटर पानी का छिड़काव करें।",
  "broadcastChannels": ["push", "sms"]
}
```

---

## 🚀 How to Run & Verify the Admin Dashboard Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite local development server
npm run dev

# 3. Open in browser
http://localhost:5173/

# 4. Build for production (outputs to /dist)
npm run build
```

---

## 💡 Quick Demo Tips for College Viva & SIH Hackathon Judges

1. **State Isolation:** Log in as **Uttar Pradesh (Dr. A. K. Gangwar)** — see Bareilly / Invertis farmlands and UP state university labs (ICAR-IVRI). Switch to **Uttarakhand** — see Udham Singh Nagar / Pantnagar farms (GBPUAT).
2. **Deep Zoom on Satellite:** Switch basemap to `🛰️ High-Res Satellite`. Zoom in to level 18-20 — observe that single 1-to-1 field parcels are precisely covered with zero *"No data available"* errors.
3. **On-Field Disease Warning:** Click any red-bordered infected field (e.g. Khasra 142/1) to open the Cadastral Inspector drawer showing farmer details, NDVI vegetation index, and 1-click advisory broadcast.

---
*Built with ❤️ for Invertis University, Bareilly & Smart India Hackathon 2026.*
