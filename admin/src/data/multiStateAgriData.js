// Multi-State Agricultural & Geospatial Cadastral Dataset (SIH Problem Statement 26131)
// Organization: Department of Agriculture (State-Wise Isolated Portals)

// EXACT crops available on website https://krashi-mitrasih.vercel.app/
export const WEBSITE_CROPS = [
  { id: 'rice', nameEn: 'Rice / Paddy', nameHi: 'धान', icon: '🌾', color: '#22c55e' },
  { id: 'sugarcane', nameEn: 'Sugarcane', nameHi: 'गन्ना', icon: '🎋', color: '#16a34a' },
  { id: 'wheat', nameEn: 'Wheat', nameHi: 'गेहूं', icon: '🌾', color: '#eab308' },
  { id: 'cotton', nameEn: 'Cotton', nameHi: 'कपास', icon: '🪴', color: '#f59e0b' },
  { id: 'potato', nameEn: 'Potato', nameHi: 'आलू', icon: '🥔', color: '#d97706' },
  { id: 'maize', nameEn: 'Maize / Corn', nameHi: 'मक्का', icon: '🌽', color: '#ea580c' },
  { id: 'onion', nameEn: 'Onion', nameHi: 'प्याज', icon: '🧅', color: '#9333ea' }
];

export const STATES_CONFIG = {
  // =========================================================================
  // 1. UTTAR PRADESH (UP) - Precise Cadastral Farm Plots (Mauza Rithora / Invertis Farmlands)
  // =========================================================================
  uttar_pradesh: {
    id: 'uttar_pradesh',
    code: 'UP',
    nameEn: 'Uttar Pradesh',
    nameHi: 'उत्तर प्रदेश शासन — कृषि विभाग',
    departmentName: 'Department of Agriculture, Govt. of Uttar Pradesh',
    tagline: 'प्रादेशिक कृषी अधिकारी नियंत्रण कक्ष (Invertis Zone - Bareilly)',
    helpline: '1800-180-1551',
    center: [28.3242, 79.5190], // Center of village farmland chak (Bareilly / Rithora)
    defaultZoom: 16, // High default zoom right on the farm parcels
    officer: {
      name: 'Dr. A. K. Gangwar',
      designation: 'Joint Director (Agri) — Bareilly Division',
      id: 'UP-AGRI-0881',
      zone: 'Rohilkhand / Central UP Zone',
      universityLab: 'ICAR - IVRI Bareilly / CSA Kanpur'
    },
    divisions: [
      { id: 'all', nameEn: 'All UP Grid', nameHi: 'समस्त उत्तर प्रदेश ग्रिड', center: [27.1303, 80.8597], zoom: 7 },
      { id: 'rohilkhand', nameEn: 'Bareilly (Invertis Farmlands)', nameHi: 'बरेली / रुहेलखंड कृषि प्रक्षेत्र', center: [28.3242, 79.5190], zoom: 16, districts: ['Bareilly', 'Pilibhit', 'Shahjahanpur', 'Badaun'] },
      { id: 'lucknow', nameEn: 'Lakhimpur Kheri (Sugarcane Belt)', nameHi: 'लखीमपुर खीरी (गन्ना प्रक्षेत्र)', center: [28.4350, 80.5780], zoom: 15, districts: ['Lakhimpur Kheri', 'Sitapur', 'Hardoi', 'Lucknow'] },
      { id: 'meerut', nameEn: 'Meerut / Sardhana (Wheat & Cane)', nameHi: 'मेरठ / सरधना प्रक्षेत्र', center: [29.1450, 77.6180], zoom: 15, districts: ['Meerut', 'Muzaffarnagar', 'Bulandshahr', 'Saharanpur'] },
      { id: 'agra', nameEn: 'Agra / Khandauli (Potato Belt)', nameHi: 'आगरा / खंदौली (आलू प्रक्षेत्र)', center: [27.3020, 78.0850], zoom: 15, districts: ['Agra', 'Mathura', 'Aligarh', 'Firozabad'] },
      { id: 'kanpur', nameEn: 'Farrukhabad / Kaimganj (Maize Belt)', nameHi: 'फर्रुखाबाद / कायमगंज प्रक्षेत्र', center: [27.5380, 79.3450], zoom: 15, districts: ['Farrukhabad', 'Kannauj', 'Kanpur', 'Etawah'] },
      { id: 'varanasi', nameEn: 'Varanasi / Pindra (Onion Belt)', nameHi: 'वाराणसी / पिंडरा प्रक्षेत्र', center: [25.4820, 82.8420], zoom: 15, districts: ['Varanasi', 'Jaunpur', 'Ghazipur', 'Mirzapur'] },
      { id: 'gorakhpur', nameEn: 'Gorakhpur / Sahjanwa (Paddy Belt)', nameHi: 'गोरखपुर / सहजनवा प्रक्षेत्र', center: [26.7720, 83.1850], zoom: 15, districts: ['Gorakhpur', 'Deoria', 'Kushinagar', 'Basti'] }
    ],
    // Individual, realistic 1.5 - 2.5 acre farm strip plots placed neatly side-by-side in Village Chak
    farmPlots: [
      {
        id: 'PLOT-UP-001',
        khasraNo: 'खसरा संख्या 142/1',
        farmerName: 'Virendra Singh Gangwar (वीरेंद्र सिंह गंगवार)',
        phone: '+91 94125 78210',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly (Near Invertis Farmlands)',
        division: 'rohilkhand',
        areaAcres: 2.4,
        areaHa: 0.97,
        crop: 'rice',
        cropName: 'Rice / धान (बासमती)',
        sowingDate: '2026-07-10',
        healthScore: 0.44, // Low NDVI
        satelliteVerified: true,
        satelliteVisual: 'Yellowing Hydathode Margins Detected in Sentinel-2',
        diseaseStatus: 'infected',
        detectedDisease: 'Bacterial Leaf Blight (जीवाणु झुलसा / BLB)',
        aiConfidence: 94.8,
        centerPoint: [28.3243, 79.5180],
        polygonCoordinates: [
          [28.3248, 79.5175],
          [28.3248, 79.5186],
          [28.3238, 79.5186],
          [28.3238, 79.5175]
        ]
      },
      {
        id: 'PLOT-UP-002',
        khasraNo: 'खसरा संख्या 142/2',
        farmerName: 'Rameshwar Dayal (रामेश्वर दयाल)',
        phone: '+91 94120 44192',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 2.2,
        areaHa: 0.89,
        crop: 'sugarcane',
        cropName: 'Sugarcane / गन्ना (Co-0238)',
        sowingDate: '2026-03-15',
        healthScore: 0.88,
        satelliteVerified: true,
        satelliteVisual: 'Healthy High-Biomass Spectral Signature',
        diseaseStatus: 'healthy',
        detectedDisease: 'Healthy Stand (स्वस्थ गन्ना - कोई रोग नहीं)',
        aiConfidence: 98.1,
        centerPoint: [28.3243, 79.5193],
        polygonCoordinates: [
          [28.3248, 79.5188],
          [28.3248, 79.5199],
          [28.3238, 79.5199],
          [28.3238, 79.5188]
        ]
      },
      {
        id: 'PLOT-UP-003',
        khasraNo: 'खसरा संख्या 142/3',
        farmerName: 'Mahendra Pal (महेंद्र पाल)',
        phone: '+91 94112 55901',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 1.8,
        areaHa: 0.73,
        crop: 'cotton',
        cropName: 'Mustard / सरसों (वरुणा)',
        sowingDate: '2026-08-12',
        healthScore: 0.41,
        satelliteVerified: true,
        satelliteVisual: 'Staghead Malformation Floral Deformation',
        diseaseStatus: 'infected',
        detectedDisease: 'White Rust (सफेद रोली - Albugo candida)',
        aiConfidence: 93.4,
        centerPoint: [28.3243, 79.5206],
        polygonCoordinates: [
          [28.3248, 79.5201],
          [28.3248, 79.5211],
          [28.3238, 79.5211],
          [28.3238, 79.5201]
        ]
      },
      {
        id: 'PLOT-UP-004',
        khasraNo: 'खसरा संख्या 143/1',
        farmerName: 'Suresh Chandra Verma (सुरेश चंद्र वर्मा)',
        phone: '+91 94121 33091',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 2.5,
        areaHa: 1.01,
        crop: 'wheat',
        cropName: 'Wheat / गेहूं (HD-2967)',
        sowingDate: '2026-11-10',
        healthScore: 0.92,
        satelliteVerified: true,
        satelliteVisual: 'Uniform Emergence & Vigorous Tillering',
        diseaseStatus: 'healthy',
        detectedDisease: 'Healthy Wheat Stand (स्वस्थ गेहूं)',
        aiConfidence: 98.6,
        centerPoint: [28.3231, 79.5180],
        polygonCoordinates: [
          [28.3236, 79.5175],
          [28.3236, 79.5186],
          [28.3226, 79.5186],
          [28.3226, 79.5175]
        ]
      },
      {
        id: 'PLOT-UP-005',
        khasraNo: 'खसरा संख्या 143/2',
        farmerName: 'Dinesh Kumar Gangwar (दिनेश कुमार गंगवार)',
        phone: '+91 97190 44219',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 2.0,
        areaHa: 0.81,
        crop: 'potato',
        cropName: 'Potato / आलू (कुफरी बहार)',
        sowingDate: '2026-08-05',
        healthScore: 0.46,
        satelliteVerified: true,
        satelliteVisual: 'Black Scurf Hard Sclerotial Patches',
        diseaseStatus: 'infected',
        detectedDisease: 'Black Scurf (काली पपड़ी - Rhizoctonia solani)',
        aiConfidence: 91.5,
        centerPoint: [28.3231, 79.5193],
        polygonCoordinates: [
          [28.3236, 79.5188],
          [28.3236, 79.5199],
          [28.3226, 79.5199],
          [28.3226, 79.5188]
        ]
      },
      {
        id: 'PLOT-UP-006',
        khasraNo: 'खसरा संख्या 143/3',
        farmerName: 'Jagdish Prasad (जगदीश प्रसाद)',
        phone: '+91 98390 12891',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 2.3,
        areaHa: 0.93,
        crop: 'sugarcane',
        cropName: 'Sugarcane / गन्ना (Co-0238)',
        sowingDate: '2026-02-28',
        healthScore: 0.38,
        satelliteVerified: true,
        satelliteVisual: 'Severe Stool Wilt with Red Midribs',
        diseaseStatus: 'infected',
        detectedDisease: 'Red Rot (लाल सड़न - Colletotrichum falcatum)',
        aiConfidence: 96.2,
        centerPoint: [28.3231, 79.5206],
        polygonCoordinates: [
          [28.3236, 79.5201],
          [28.3236, 79.5211],
          [28.3226, 79.5211],
          [28.3226, 79.5201]
        ]
      },
      {
        id: 'PLOT-UP-007',
        khasraNo: 'खसरा संख्या 144/1',
        farmerName: 'Ram Charan Lodhi (राम चरन लोधी)',
        phone: '+91 94500 88129',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 1.9,
        areaHa: 0.77,
        crop: 'maize',
        cropName: 'Maize / मक्का',
        sowingDate: '2026-07-22',
        healthScore: 0.42,
        satelliteVerified: true,
        satelliteVisual: 'Whorl Defoliation & Frass Pattern',
        diseaseStatus: 'infected',
        detectedDisease: 'Fall Armyworm (फॉल आर्मीवर्म)',
        aiConfidence: 95.1,
        centerPoint: [28.3255, 79.5180],
        polygonCoordinates: [
          [28.3260, 79.5175],
          [28.3260, 79.5186],
          [28.3250, 79.5186],
          [28.3250, 79.5175]
        ]
      },
      {
        id: 'PLOT-UP-008',
        khasraNo: 'खसरा संख्या 144/2',
        farmerName: 'Om Prakash Sharma (ओम प्रकाश शर्मा)',
        phone: '+91 98220 55192',
        village: 'Mauza Rithora, Nawabganj Block',
        district: 'Bareilly',
        division: 'rohilkhand',
        areaAcres: 2.1,
        areaHa: 0.85,
        crop: 'onion',
        cropName: 'Onion / प्याज (लाल प्याज)',
        sowingDate: '2026-08-01',
        healthScore: 0.45,
        satelliteVerified: true,
        satelliteVisual: 'Purple Blotch Leaf Margin Lesions',
        diseaseStatus: 'infected',
        detectedDisease: 'Purple Blotch (बैंगनी धब्बा - Alternaria porri)',
        aiConfidence: 93.8,
        centerPoint: [28.3255, 79.5193],
        polygonCoordinates: [
          [28.3260, 79.5188],
          [28.3260, 79.5199],
          [28.3250, 79.5199],
          [28.3250, 79.5188]
        ]
      }
    ],
    hotspots: [
      {
        id: 'UP-HOT-01',
        district: 'Bareilly (Invertis Farmlands)',
        taluka: 'Rithora & Nawabganj',
        division: 'rohilkhand',
        crop: 'rice',
        cropName: 'Rice (धान)',
        disease: 'Bacterial Leaf Blight / जीवाणु झुलसा (BLB)',
        severity: 'critical',
        coordinates: [28.3242, 79.5190],
        affectedAreaHa: 1350,
        farmersAffected: 620,
        confidenceScore: 94.2,
        weatherTrigger: 'Tarai standing water + RH 92% after heavy monsoon'
      }
    ],
    metrics: {
      activeOutbreakClusters: 16,
      criticalRedAlerts: 5,
      totalHectaresUnderSurveillance: 520000,
      activeAffectedAreaHa: 8970,
      farmersMonitored: 68400,
      cropLossPreventedCrores: 64.8,
      targetedPesticideReductionPercent: 34.2,
      averageResponseTimeHours: 2.4,
      pendingLabVerifications: 28,
      demandShortageAlertsCount: 9
    }
  },

  // =========================================================================
  // 2. UTTARAKHAND (UK) - Pantnagar / Kichha Research Farmland Grid
  // =========================================================================
  uttarakhand: {
    id: 'uttarakhand',
    code: 'UK',
    nameEn: 'Uttarakhand',
    nameHi: 'उत्तराखंड शासन — कृषि निदेशालय',
    departmentName: 'Directorate of Agriculture, Govt. of Uttarakhand',
    tagline: 'राज्य कृषी नियंत्रण कक्ष (Pantnagar Agriculture Zone)',
    helpline: '1800-180-1551 / 0135-2710188',
    center: [28.9720, 79.4980],
    defaultZoom: 16,
    officer: {
      name: 'Dr. Harish Chandra Joshi',
      designation: 'Chief Agriculture Officer — Udham Singh Nagar',
      id: 'UK-AGRI-0419',
      zone: 'Tarai & Bhabhar Agro-Climatic Zone',
      universityLab: 'GB Pant University of Agriculture & Technology, Pantnagar'
    },
    divisions: [
      { id: 'all', nameEn: 'All Uttarakhand Grid', nameHi: 'समस्त उत्तराखंड ग्रिड', center: [29.5892, 79.6467], zoom: 8 },
      { id: 'us_nagar', nameEn: 'Pantnagar University Farmlands', nameHi: 'पंतनगर / ऊधम सिंह नगर प्रक्षेत्र', center: [28.9720, 79.4980], zoom: 16, districts: ['Pantnagar', 'Kichha', 'Rudrapur', 'Kashipur', 'Sitarganj'] },
      { id: 'haridwar', nameEn: 'Haridwar / Laksar (Cane Belt)', nameHi: 'हरिद्वार / लक्सर प्रक्षेत्र', center: [29.7540, 78.0210], zoom: 15, districts: ['Laksar', 'Roorkee', 'Bhagwanpur'] }
    ],
    farmPlots: [
      {
        id: 'PLOT-UK-001',
        khasraNo: 'खसरा संख्या 211/1',
        farmerName: 'Balvinder Singh Cheema (बलविंदर सिंह चीमा)',
        phone: '+91 94120 91823',
        village: 'Pantnagar Research Farm Chak',
        district: 'Udham Singh Nagar',
        division: 'us_nagar',
        areaAcres: 2.5,
        areaHa: 1.01,
        crop: 'rice',
        cropName: 'Rice / धान (पंत बासमती)',
        sowingDate: '2026-07-05',
        healthScore: 0.40,
        satelliteVerified: true,
        satelliteVisual: 'Tarai Blast Lesions on Foliar Canopy',
        diseaseStatus: 'infected',
        detectedDisease: 'Rice Blast (झोंका रोग - Magnaporthe oryzae)',
        aiConfidence: 95.5,
        centerPoint: [28.9725, 79.4975],
        polygonCoordinates: [
          [28.9730, 79.4970],
          [28.9730, 79.4981],
          [28.9720, 79.4981],
          [28.9720, 79.4970]
        ]
      },
      {
        id: 'PLOT-UK-002',
        khasraNo: 'खसरा संख्या 211/2',
        farmerName: 'Kailash Chandra Pant (कैलाश चंद्र पंत)',
        phone: '+91 98371 44091',
        village: 'Pantnagar Research Farm Chak',
        district: 'Udham Singh Nagar',
        division: 'us_nagar',
        areaAcres: 2.8,
        areaHa: 1.13,
        crop: 'sugarcane',
        cropName: 'Sugarcane / गन्ना (Co-0238)',
        sowingDate: '2026-03-01',
        healthScore: 0.35,
        satelliteVerified: true,
        satelliteVisual: 'Severe Stool Wilt in Tarai Loam',
        diseaseStatus: 'infected',
        detectedDisease: 'Red Rot (लाल सड़न - Colletotrichum falcatum)',
        aiConfidence: 96.8,
        centerPoint: [28.9725, 79.4988],
        polygonCoordinates: [
          [28.9730, 79.4983],
          [28.9730, 79.4994],
          [28.9720, 79.4994],
          [28.9720, 79.4983]
        ]
      },
      {
        id: 'PLOT-UK-003',
        khasraNo: 'खसरा संख्या 211/3',
        farmerName: 'Mohan Singh Rawat (मोहन सिंह रावत)',
        phone: '+91 97198 33120',
        village: 'Pantnagar Research Farm Chak',
        district: 'Udham Singh Nagar',
        division: 'us_nagar',
        areaAcres: 2.1,
        areaHa: 0.85,
        crop: 'wheat',
        cropName: 'Wheat / गेहूं (HD-2967)',
        sowingDate: '2026-11-15',
        healthScore: 0.91,
        satelliteVerified: true,
        satelliteVisual: 'Healthy Uniform Crop Stand',
        diseaseStatus: 'healthy',
        detectedDisease: 'Healthy Wheat (स्वस्थ गेहूं)',
        aiConfidence: 98.4,
        centerPoint: [28.9725, 79.5001],
        polygonCoordinates: [
          [28.9730, 79.4996],
          [28.9730, 79.5007],
          [28.9720, 79.5007],
          [28.9720, 79.4996]
        ]
      }
    ],
    hotspots: [
      {
        id: 'UK-HOT-01',
        district: 'Udham Singh Nagar',
        taluka: 'Pantnagar & Kichha',
        division: 'us_nagar',
        crop: 'sugarcane',
        cropName: 'Sugarcane (गन्ना)',
        disease: 'Red Rot / लाल सड़न',
        severity: 'critical',
        coordinates: [28.9720, 79.4980],
        affectedAreaHa: 980,
        farmersAffected: 420,
        confidenceScore: 96.4,
        weatherTrigger: 'Tarai moisture retention + RH > 94%'
      }
    ],
    metrics: {
      activeOutbreakClusters: 8,
      criticalRedAlerts: 3,
      totalHectaresUnderSurveillance: 185000,
      activeAffectedAreaHa: 3420,
      farmersMonitored: 24600,
      cropLossPreventedCrores: 28.4,
      targetedPesticideReductionPercent: 38.1,
      averageResponseTimeHours: 1.9,
      pendingLabVerifications: 14,
      demandShortageAlertsCount: 4
    }
  },

  // =========================================================================
  // 3. MAHARASHTRA (MH) - Lasalgaon Rural Onion Farmland Grid
  // =========================================================================
  maharashtra: {
    id: 'maharashtra',
    code: 'MH',
    nameEn: 'Maharashtra',
    nameHi: 'महाराष्ट्र शासन — कृषी आयुक्तालय',
    departmentName: 'Commissionerate of Agriculture, Govt. of Maharashtra',
    tagline: 'प्रादेशिक कृषी अधिकारी नियंत्रण कक्ष (Pune / Western Maharashtra)',
    helpline: '1800-233-4000 / 020-25537558',
    center: [20.1425, 74.2255],
    defaultZoom: 16,
    officer: {
      name: 'Dr. Suresh V. Patil',
      designation: 'Divisional Joint Director (Agri) — Pune Division',
      id: 'MH-AGRI-0211',
      zone: 'Western Ghats & Marathwada Grid',
      universityLab: 'MPKV Rahuri / Dr. PDKV Akola'
    },
    divisions: [
      { id: 'all', nameEn: 'All Maharashtra Grid', nameHi: 'समस्त महाराष्ट्र ग्रिड', center: [19.7515, 75.7139], zoom: 7 },
      { id: 'nashik', nameEn: 'Lasalgaon Onion Fields', nameHi: 'नाशिक / लासलगाव कांदा प्रक्षेत्र', center: [20.1425, 74.2255], zoom: 16, districts: ['Nashik', 'Niphad', 'Yeola', 'Jalgaon'] }
    ],
    farmPlots: [
      {
        id: 'PLOT-MH-001',
        khasraNo: 'गट नंबर 118/1',
        farmerName: 'Popat Govind Shinde (पोपट गोविंद शिंदे)',
        phone: '+91 98220 11920',
        village: 'Lasalgaon Onion Fields',
        district: 'Nashik',
        division: 'nashik',
        areaAcres: 2.2,
        areaHa: 0.89,
        crop: 'onion',
        cropName: 'Onion / कांदा (प्याज)',
        sowingDate: '2026-07-18',
        healthScore: 0.41,
        satelliteVerified: true,
        satelliteVisual: 'Purple Blotch Leaf Margin Necrosis',
        diseaseStatus: 'infected',
        detectedDisease: 'Purple Blotch (जांभळा करपा - Alternaria porri)',
        aiConfidence: 94.2,
        centerPoint: [20.1425, 74.2250],
        polygonCoordinates: [
          [20.1430, 74.2245],
          [20.1430, 74.2256],
          [20.1420, 74.2256],
          [20.1420, 74.2245]
        ]
      },
      {
        id: 'PLOT-MH-002',
        khasraNo: 'गट नंबर 118/2',
        farmerName: 'Anandrao Babar (आनंदराव बाबर)',
        phone: '+91 94230 77182',
        village: 'Lasalgaon Onion Fields',
        district: 'Nashik',
        division: 'nashik',
        areaAcres: 2.5,
        areaHa: 1.01,
        crop: 'sugarcane',
        cropName: 'Sugarcane / ऊस (गन्ना)',
        sowingDate: '2026-01-20',
        healthScore: 0.92,
        satelliteVerified: true,
        satelliteVisual: 'Healthy Stand',
        diseaseStatus: 'healthy',
        detectedDisease: 'Healthy Stand (निरोगी ऊस)',
        aiConfidence: 98.6,
        centerPoint: [20.1425, 74.2263],
        polygonCoordinates: [
          [20.1430, 74.2258],
          [20.1430, 74.2269],
          [20.1420, 74.2269],
          [20.1420, 74.2258]
        ]
      }
    ],
    hotspots: [
      {
        id: 'MH-HOT-01',
        district: 'Nashik (Lasalgaon)',
        taluka: 'Niphad & Yeola',
        division: 'nashik',
        crop: 'onion',
        cropName: 'Onion (कांदा)',
        disease: 'Purple Blotch / जांभळा करपा',
        severity: 'critical',
        coordinates: [20.1425, 74.2255],
        affectedAreaHa: 1420,
        farmersAffected: 680,
        confidenceScore: 94.6,
        weatherTrigger: 'Continuous overcast sky + 92% RH'
      }
    ],
    metrics: {
      activeOutbreakClusters: 12,
      criticalRedAlerts: 4,
      totalHectaresUnderSurveillance: 410000,
      activeAffectedAreaHa: 6840,
      farmersMonitored: 52100,
      cropLossPreventedCrores: 51.2,
      targetedPesticideReductionPercent: 32.5,
      averageResponseTimeHours: 2.2,
      pendingLabVerifications: 21,
      demandShortageAlertsCount: 6
    }
  }
};

// Quick helper to get state by ID
export const getStateData = (stateId) => {
  return STATES_CONFIG[stateId] || STATES_CONFIG.uttar_pradesh;
};
