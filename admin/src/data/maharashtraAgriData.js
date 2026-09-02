// Uttar Pradesh Agricultural Regional & Outbreak Dataset (SIH Problem Statement 26131)
// Organization: Department of Agriculture, Government of Uttar Pradesh / UP State Agriculture Grid

export const UP_DIVISIONS = [
  { id: 'all', nameEn: 'All Uttar Pradesh Grid', nameHi: 'समस्त उत्तर प्रदेश ग्रिड', nameUr: 'تمام اتر پردیش', center: [27.1303, 80.8597], zoom: 7 },
  { id: 'rohilkhand', nameEn: 'Bareilly / Rohilkhand Division', nameHi: 'बरेली / रुहेलखंड संभाग (Invertis Zone)', nameUr: 'بریلی ڈویژن', center: [28.3670, 79.4304], zoom: 8, districts: ['Bareilly', 'Shahjahanpur', 'Pilibhit', 'Badaun'] },
  { id: 'lucknow', nameEn: 'Lucknow Division (Central UP)', nameHi: 'लखनऊ संभाग (मध्य उत्तर प्रदेश)', nameUr: 'لکھنؤ ڈویژن', center: [26.8467, 80.9462], zoom: 8, districts: ['Lucknow', 'Lakhimpur Kheri', 'Sitapur', 'Hardoi', 'Unnao', 'Rae Bareli'] },
  { id: 'meerut', nameEn: 'Meerut / Western UP Division', nameHi: 'मेरठ संभाग (पश्चिम उत्तर प्रदेश)', nameUr: 'میرٹھ ڈویژن', center: [28.9845, 77.7064], zoom: 8, districts: ['Meerut', 'Muzaffarnagar', 'Saharanpur', 'Bulandshahr', 'Baghpat', 'Hapur'] },
  { id: 'agra', nameEn: 'Agra Division (Braj Region)', nameHi: 'आगरा संभाग (ब्रज क्षेत्र)', nameUr: 'آگرہ ڈویژن', center: [27.1767, 78.0081], zoom: 8, districts: ['Agra', 'Mathura', 'Firozabad', 'Mainpuri', 'Aligarh'] },
  { id: 'kanpur', nameEn: 'Kanpur Division', nameHi: 'कानपुर संभाग', nameUr: 'کانپور ڈویژن', center: [26.4499, 80.3319], zoom: 8, districts: ['Kanpur Nagar', 'Kanpur Dehat', 'Farrukhabad', 'Kannauj', 'Etawah', 'Auraiya'] },
  { id: 'varanasi', nameEn: 'Varanasi / Purvanchal Division', nameHi: 'वाराणसी संभाग (पूर्वांचल)', nameUr: 'وارانسی ڈویژن', center: [25.3176, 82.9739], zoom: 8, districts: ['Varanasi', 'Jaunpur', 'Ghazipur', 'Chandauli', 'Mirzapur', 'Sonbhadra'] },
  { id: 'gorakhpur', nameEn: 'Gorakhpur Division (Tarai Belt)', nameHi: 'गोरखपुर संभाग (तराई बेल्ट)', nameUr: 'گورکھپور ڈویژن', center: [26.7606, 83.3732], zoom: 8, districts: ['Gorakhpur', 'Deoria', 'Kushinagar', 'Maharajganj', 'Basti'] }
];

// Alias for compatibility
export const MAHARASHTRA_DIVISIONS = UP_DIVISIONS;

// EXACT crops available on website https://krashi-mitrasih.vercel.app/
export const CROPS_CONFIG = [
  { id: 'all', nameEn: 'All Crops', nameHi: 'सभी फसलें', icon: '🌾' },
  { id: 'rice', nameEn: 'Rice / Paddy', nameHi: 'धान', icon: '🌾', majorDistricts: ['Bareilly', 'Pilibhit', 'Lakhimpur Kheri', 'Gorakhpur', 'Varanasi', 'Shahjahanpur'] },
  { id: 'wheat', nameEn: 'Wheat', nameHi: 'गेहूं', icon: '🌾', majorDistricts: ['Meerut', 'Bareilly', 'Aligarh', 'Agra', 'Kanpur', 'Hardoi'] },
  { id: 'sugarcane', nameEn: 'Sugarcane', nameHi: 'गन्ना', icon: '🎋', majorDistricts: ['Lakhimpur Kheri', 'Muzaffarnagar', 'Bareilly', 'Pilibhit', 'Meerut', 'Bijnor'] },
  { id: 'mustard', nameEn: 'Mustard', nameHi: 'सरसों (राई/लाही)', icon: '🌼', majorDistricts: ['Agra', 'Mathura', 'Bareilly', 'Aligarh', 'Badaun', 'Etawah'] },
  { id: 'potato', nameEn: 'Potato', nameHi: 'आलू', icon: '🥔', majorDistricts: ['Agra', 'Farrukhabad', 'Kannauj', 'Aligarh', 'Bareilly', 'Firozabad'] },
  { id: 'onion', nameEn: 'Onion', nameHi: 'प्याज', icon: '🧅', majorDistricts: ['Varanasi', 'Ghazipur', 'Jaunpur', 'Kanpur', 'Bareilly'] },
  { id: 'maize', nameEn: 'Maize / Corn', nameHi: 'मक्का', icon: '🌽', majorDistricts: ['Farrukhabad', 'Kannauj', 'Bahraich', 'Gonda', 'Bulandshahr'] }
];

// Active Geospatial Outbreak Hotspots Across Uttar Pradesh Agricultural Grid
// Filtered ONLY to exact diseases available in website models!
export const OUTBREAK_HOTSPOTS = [
  {
    id: 'UP-2026-001',
    district: 'Bareilly (Invertis Zone)',
    taluka: 'Nawabganj & Baheri',
    division: 'rohilkhand',
    crop: 'rice',
    cropName: 'Rice (धान)',
    disease: 'Bacterial Leaf Blight / जीवाणु झुलसा (BLB)',
    pathogenType: 'bacterial',
    severity: 'critical',
    coordinates: [28.3670, 79.4304],
    affectedAreaHa: 1350,
    farmersAffected: 620,
    confidenceScore: 94.2,
    spreadVelocity: 'Rapid (+16% weekly)',
    weatherTrigger: 'Tarai region stagnant warm water + RH 92% after heavy monsoon spell',
    reportedDate: '2026-08-29',
    lastSync: '5 mins ago',
    images: ['https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Drain field water immediately + Streptocycline 0.15g + Copper Oxychloride 2.5g/L spray',
    requisitionDeficit: 'Requires 3,200 Litres Copper bactericide buffer dispatch',
    status: 'Emergency Alert Issued'
  },
  {
    id: 'UP-2026-002',
    district: 'Lakhimpur Kheri',
    taluka: 'Palia & Nighasan',
    division: 'lucknow',
    crop: 'sugarcane',
    cropName: 'Sugarcane (गन्ना)',
    disease: 'Red Rot / लाल सड़न (Colletotrichum falcatum)',
    pathogenType: 'fungal',
    severity: 'critical',
    coordinates: [27.9462, 80.7777],
    affectedAreaHa: 1820,
    farmersAffected: 790,
    confidenceScore: 95.8,
    spreadVelocity: 'High (+18% weekly)',
    weatherTrigger: 'Sharda river basin waterlogging + high humidity inside dense cane canopy',
    reportedDate: '2026-08-30',
    lastSync: '12 mins ago',
    images: ['https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Uproot infected stools + Trichoderma viride drenching + strict seed quarantine',
    requisitionDeficit: 'Severe shortage: Need 14,000 Kg Trichoderma bio-fungicide',
    status: 'Action Underway'
  },
  {
    id: 'UP-2026-003',
    district: 'Agra',
    taluka: 'Khandauli & Fatehabad',
    division: 'agra',
    crop: 'potato',
    cropName: 'Potato (आलू)',
    disease: 'Black Scurf & Blackleg / काली पपड़ी व काली टाँग',
    pathogenType: 'fungal',
    severity: 'critical',
    coordinates: [27.1767, 78.0081],
    affectedAreaHa: 1120,
    farmersAffected: 480,
    confidenceScore: 92.4,
    spreadVelocity: 'Moderate (+10% weekly)',
    weatherTrigger: 'Cold damp soil + infected seed tubers during early planting',
    reportedDate: '2026-08-28',
    lastSync: '25 mins ago',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Mancozeb 75 WP tuber treatment + Copper Oxychloride drenching',
    requisitionDeficit: 'Tuber seed treatment kits requested by 6 Cold Storage Hubs',
    status: 'KVK Teams Active'
  },
  {
    id: 'UP-2026-004',
    district: 'Meerut',
    taluka: 'Sardhana & Mawana',
    division: 'meerut',
    crop: 'sugarcane',
    cropName: 'Sugarcane (गन्ना)',
    disease: 'Whip Smut / कंडुआ (कोड़ा रोग)',
    pathogenType: 'fungal',
    severity: 'high',
    coordinates: [28.9845, 77.7064],
    affectedAreaHa: 870,
    farmersAffected: 360,
    confidenceScore: 91.0,
    spreadVelocity: 'Moderate (+8% weekly)',
    weatherTrigger: 'Warm breeze dispersing black teliospores from un-bagged whips',
    reportedDate: '2026-08-30',
    lastSync: '40 mins ago',
    images: ['https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Bag whips in polythene before roguing + Carbendazim sett treatment for ratoon',
    requisitionDeficit: 'Local stock adequate; extension advisories issued',
    status: 'Under Containment'
  },
  {
    id: 'UP-2026-005',
    district: 'Mathura & Aligarh',
    taluka: 'Chhata & Iglas',
    division: 'agra',
    crop: 'mustard',
    cropName: 'Mustard (सरसों)',
    disease: 'White Rust / सफेद रोली (Albugo candida) & Staghead',
    pathogenType: 'fungal',
    severity: 'high',
    coordinates: [27.4924, 77.6737],
    affectedAreaHa: 940,
    farmersAffected: 410,
    confidenceScore: 93.1,
    spreadVelocity: 'High (+12% weekly)',
    weatherTrigger: 'Heavy morning dew + 88% humidity in early flowering crop',
    reportedDate: '2026-08-31',
    lastSync: '1 hr ago',
    images: ['https://images.unsplash.com/photo-1599827552599-ee2c1b82e2cb?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Spray Metalaxyl + Mancozeb @ 2.5g/L; prune and burn staghead shoots',
    requisitionDeficit: 'Deficit of 2,400 Kg Ridomil MZ formulation',
    status: 'Advisory Broadcast Sent'
  },
  {
    id: 'UP-2026-006',
    district: 'Farrukhabad & Kannauj',
    taluka: 'Kaimganj & Chhibramau',
    division: 'kanpur',
    crop: 'maize',
    cropName: 'Maize (मक्का)',
    disease: 'Fall Armyworm / फॉल आर्मीवर्म (Spodoptera frugiperda)',
    pathogenType: 'pest',
    severity: 'critical',
    coordinates: [27.3826, 79.5847],
    affectedAreaHa: 1280,
    farmersAffected: 560,
    confidenceScore: 96.0,
    spreadVelocity: 'Rapid (+22% weekly)',
    weatherTrigger: 'Warm dry spell favoring moth oviposition in young whorls',
    reportedDate: '2026-08-31',
    lastSync: '15 mins ago',
    images: ['https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Directed whorl application of Emamectin Benzoate 5% SG @ 0.4g/L + Pheromone lures',
    requisitionDeficit: 'Urgent need for 5,000 FAW Pheromone traps and 18 Drone Squads',
    status: 'State Rapid Response Notified'
  },
  {
    id: 'UP-2026-007',
    district: 'Gorakhpur & Deoria',
    taluka: 'Sahjanwa & Salempur',
    division: 'gorakhpur',
    crop: 'rice',
    cropName: 'Rice (धान)',
    disease: 'Rice Blast / झोंका रोग (Magnaporthe oryzae)',
    pathogenType: 'fungal',
    severity: 'high',
    coordinates: [26.7606, 83.3732],
    affectedAreaHa: 890,
    farmersAffected: 430,
    confidenceScore: 90.7,
    spreadVelocity: 'Moderate (+9% weekly)',
    weatherTrigger: 'Overcast skies + excessive urea top-dressing in paddy beds',
    reportedDate: '2026-08-30',
    lastSync: '2 hrs ago',
    images: ['https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Stop Nitrogen top-dressing + spray Tricyclazole 75 WP @ 0.6g/L',
    requisitionDeficit: 'Buffer stock adequate at Gorakhpur Agro Depot',
    status: 'Field Teams Dispatched'
  },
  {
    id: 'UP-2026-008',
    district: 'Varanasi & Jaunpur',
    taluka: 'Pindra & Shahganj',
    division: 'varanasi',
    crop: 'onion',
    cropName: 'Onion (प्याज)',
    disease: 'Purple Blotch / बैंगनी धब्बा (Alternaria porri)',
    pathogenType: 'fungal',
    severity: 'moderate',
    coordinates: [25.3176, 82.9739],
    affectedAreaHa: 580,
    farmersAffected: 270,
    confidenceScore: 88.5,
    spreadVelocity: 'Stable',
    weatherTrigger: 'High humidity and cloudy overcast spells',
    reportedDate: '2026-08-31',
    lastSync: '3 hrs ago',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60'],
    primaryAction: 'Spray Mancozeb 75 WP @ 2.5g/L with adhesive sticker adjuvant',
    requisitionDeficit: 'Sticker adjuvant stock shortage in Jaunpur depot',
    status: 'Monitoring'
  }
];

// Exact Resource Demand & Supply Matrix for UP Crops & Diseases
export const DEMAND_SUPPLY_INVENTORY = [
  {
    id: 'DEM-UP-01',
    category: 'bio_control',
    categoryName: 'Bio-Pesticides & Pheromone Traps',
    name: 'Fall Armyworm & Borer Pheromone Lures & Traps (मक्का व तना छेदक)',
    targetCrop: 'Maize (मक्का) & Sugarcane (गन्ना)',
    targetPest: 'Fall Armyworm (Spodoptera frugiperda)',
    unit: 'Units / Traps',
    totalDemand: 38000,
    availableStock: 21500,
    deficit: 16500,
    deficitPercentage: 43.4,
    severity: 'critical',
    priorityDistricts: ['Farrukhabad', 'Kannauj', 'Bareilly', 'Bulandshahr'],
    allocatedWarehouse: 'Bareilly Regional Agro Hub (CB Ganj)',
    estCostPerUnit: '₹45 / trap',
    recommendedSupplier: 'UP State Seeds Development Corp & ICAR-KVK Labs'
  },
  {
    id: 'DEM-UP-02',
    category: 'bio_control',
    categoryName: 'Bio-Pesticides & Traps',
    name: 'Trichoderma viride 1% WP (Bio-Fungicide for Red Rot & Wilt)',
    targetCrop: 'Sugarcane (गन्ना), Potato (आलू), Wheat',
    targetPest: 'Red Rot (लाल सड़न) & Seedling Blight',
    unit: 'Kilograms (Kg)',
    totalDemand: 42000,
    availableStock: 24800,
    deficit: 17200,
    deficitPercentage: 40.9,
    severity: 'critical',
    priorityDistricts: ['Lakhimpur Kheri', 'Bareilly', 'Pilibhit', 'Shahjahanpur'],
    allocatedWarehouse: 'Sugarcane Research Council, Shahjahanpur (UP)',
    estCostPerUnit: '₹135 / kg',
    recommendedSupplier: 'UP Council of Sugarcane Research (UPCSR) Bio-Lab'
  },
  {
    id: 'DEM-UP-03',
    category: 'chemical_inputs',
    categoryName: 'Targeted Chemical Inputs',
    name: 'Streptocycline 90:10 + Copper Oxychloride 50% WP (BLB / झुलसा)',
    targetCrop: 'Rice (धान) & Potato (आलू)',
    targetPest: 'Bacterial Leaf Blight & Blackleg',
    unit: 'Kilograms (Kg)',
    totalDemand: 16500,
    availableStock: 10200,
    deficit: 6300,
    deficitPercentage: 38.2,
    severity: 'critical',
    priorityDistricts: ['Bareilly (Nawabganj)', 'Pilibhit', 'Gorakhpur'],
    allocatedWarehouse: 'Lucknow Central Agrochemical Reserve',
    estCostPerUnit: '₹420 / kg',
    recommendedSupplier: 'Certified CIBRC Agrochemical Manufacturers'
  },
  {
    id: 'DEM-UP-04',
    category: 'chemical_inputs',
    categoryName: 'Targeted Chemical Inputs',
    name: 'Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ / White Rust & Late Blight)',
    targetCrop: 'Mustard (सरसों), Potato (आलू), Onion (प्याज)',
    targetPest: 'White Rust (सफेद रोली) & Downy Mildew',
    unit: 'Kilograms (Kg)',
    totalDemand: 22000,
    availableStock: 15400,
    deficit: 6600,
    deficitPercentage: 30.0,
    severity: 'critical',
    priorityDistricts: ['Agra', 'Mathura', 'Aligarh', 'Farrukhabad'],
    allocatedWarehouse: 'Agra Regional Krishi Bhavan Logistics Depot',
    estCostPerUnit: '₹850 / kg',
    recommendedSupplier: 'UP State Agrochemical Distribution Depot'
  },
  {
    id: 'DEM-UP-05',
    category: 'chemical_inputs',
    categoryName: 'Targeted Chemical Inputs',
    name: 'Propiconazole 25% EC (Wheat Rust & Rice Sheath Rot)',
    targetCrop: 'Wheat (गेहूं) & Rice (धान)',
    targetPest: 'Brown/Yellow Rust & Spot Blotch',
    unit: 'Litres (L)',
    totalDemand: 14500,
    availableStock: 13200,
    deficit: 1300,
    deficitPercentage: 8.9,
    severity: 'healthy',
    priorityDistricts: ['Meerut', 'Bareilly', 'Varanasi'],
    allocatedWarehouse: 'Meerut Mandi Agro Reserve',
    estCostPerUnit: '₹490 / Litre',
    recommendedSupplier: 'IFFCO / KRIBHCO State Supply Grid'
  },
  {
    id: 'DEM-UP-06',
    category: 'mechanization',
    categoryName: 'Spraying Fleets & Machinery',
    name: 'DGCA Certified Agricultural Drone Spraying Squads (10L / 16L payload)',
    targetCrop: 'Sugarcane (Tall cane canopy), Paddy & Maize',
    targetPest: 'Rapid epidemic containment across 600+ Ha/day',
    unit: 'Active Drone Squads',
    totalDemand: 45,
    availableStock: 19,
    deficit: 26,
    deficitPercentage: 57.7,
    severity: 'critical',
    priorityDistricts: ['Lakhimpur Kheri', 'Bareilly (Baheri)', 'Farrukhabad', 'Meerut'],
    allocatedWarehouse: 'UP Drone Coordination Hub, Lucknow',
    estCostPerUnit: '₹400 / acre deployment subsidy',
    recommendedSupplier: 'Govt. Subsidized Custom Hiring Centers (CHCs) & Agri FPOs'
  },
  {
    id: 'DEM-UP-07',
    category: 'expert_staff',
    categoryName: 'Field Officers & Diagnostic Kits',
    name: 'KVK Agronomists & Field Plant Protection Verification Teams',
    targetCrop: 'All Red-Alert Outbreak Talukas in UP',
    targetPest: 'On-ground ground truthing & sample collection',
    unit: 'Field Plant Pathologists',
    totalDemand: 65,
    availableStock: 38,
    deficit: 27,
    deficitPercentage: 41.5,
    severity: 'critical',
    priorityDistricts: ['Bareilly', 'Lakhimpur Kheri', 'Agra', 'Farrukhabad'],
    allocatedWarehouse: 'ICAR-KVKs & Agriculture Universities (SVPUAT Meerut, CSA Kanpur, ANDUAT Ayodhya)',
    estCostPerUnit: 'Official Duty Allocation',
    recommendedSupplier: 'Directorate of Agriculture, Government of Uttar Pradesh'
  }
];

// Live Field Verification Queue (Farmer Detections from Krishi Mitra App in UP)
export const FIELD_VERIFICATION_QUEUE = [
  {
    id: 'VER-UP-801',
    farmerName: 'Virendra Singh Gangwar (वीरेंद्र सिंह गंगवार)',
    phone: '+91 94125 XXXXX',
    village: 'Rampur Kalan, Tal. Nawabganj',
    district: 'Bareilly (Near Invertis)',
    division: 'rohilkhand',
    crop: 'rice',
    cropName: 'Rice (धान)',
    aiDetectedDisease: 'Bacterial Leaf Blight (जीवाणु झुलसा / BLB)',
    aiConfidence: 94.8,
    submittedAt: 'Today, 09:20 AM',
    gpsCoordinates: [28.3750, 79.4420],
    image: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=600&auto=format&fit=crop&q=60',
    leafSymptoms: 'Wavy yellow streaks along leaf margins turning straw-coloured with milky bacterial ooze.',
    status: 'pending',
    priority: 'urgent',
    suggestedAction: 'Drain field water immediately + Streptocycline 0.15g + Copper Oxychloride 2.5g/L spray'
  },
  {
    id: 'VER-UP-802',
    farmerName: 'Gurdeep Singh Sandhu (गुरदीप सिंह संधू)',
    phone: '+91 98390 XXXXX',
    village: 'Majhgain, Tal. Palia Kalan',
    district: 'Lakhimpur Kheri',
    division: 'lucknow',
    crop: 'sugarcane',
    cropName: 'Sugarcane (गन्ना)',
    aiDetectedDisease: 'Red Rot (लाल सड़न - Colletotrichum falcatum)',
    aiConfidence: 96.2,
    submittedAt: 'Today, 08:40 AM',
    gpsCoordinates: [27.9520, 80.7890],
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=600&auto=format&fit=crop&q=60',
    leafSymptoms: 'Midrib turning dark blood red with longitudinal white cross-patches inside split cane.',
    status: 'pending',
    priority: 'urgent',
    suggestedAction: 'Uproot infected clumps + drench with Trichoderma viride @ 10g/L'
  },
  {
    id: 'VER-UP-803',
    farmerName: 'Rakesh Kushwaha (राकेश कुशवाहा)',
    phone: '+91 97190 XXXXX',
    village: 'Khandauli, Tal. Etmadpur',
    district: 'Agra',
    division: 'agra',
    crop: 'potato',
    cropName: 'Potato (आलू)',
    aiDetectedDisease: 'Black Scurf (काली पपड़ी - Rhizoctonia solani)',
    aiConfidence: 91.5,
    submittedAt: 'Today, 07:15 AM',
    gpsCoordinates: [27.1850, 78.0120],
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=60',
    leafSymptoms: 'Hard soil-like black encrustations on tuber skin easily scraping off with fingernail.',
    status: 'verified',
    verifiedBy: 'Dr. P. K. Sharma (Deputy Director Agri, Agra)',
    priority: 'normal',
    suggestedAction: 'Treat seed tubers with Mancozeb 75 WP @ 2.5g/L before cold storage'
  },
  {
    id: 'VER-UP-804',
    farmerName: 'Sanjay Katiyar (संजय कटियार)',
    phone: '+91 94500 XXXXX',
    village: 'Kaimganj, Tal. Kaimganj',
    district: 'Farrukhabad',
    division: 'kanpur',
    crop: 'maize',
    cropName: 'Maize (मक्का)',
    aiDetectedDisease: 'Fall Armyworm (फॉल आर्मीवर्म)',
    aiConfidence: 95.1,
    submittedAt: 'Yesterday, 04:30 PM',
    gpsCoordinates: [27.3910, 79.5920],
    image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop&q=60',
    leafSymptoms: 'Ragged circular feeding holes in central whorls packed with moist sawdust-like frass.',
    status: 'lab_referred',
    labName: 'Chandra Shekhar Azad (CSA) University of Agriculture & Tech, Kanpur',
    priority: 'urgent',
    suggestedAction: 'Deploy Spodoptera pheromone traps + Emamectin Benzoate 5% SG @ 0.4g/L in whorl'
  },
  {
    id: 'VER-UP-805',
    farmerName: 'Chaudhary Satpal Singh (चौधरी सतपाल सिंह)',
    phone: '+91 98370 XXXXX',
    village: 'Sardhana, Tal. Sardhana',
    district: 'Meerut',
    division: 'meerut',
    crop: 'wheat',
    cropName: 'Wheat (गेहूं)',
    aiDetectedDisease: 'Brown Rust / Leaf Rust (भूरा रतुआ / पत्ती गेरुई)',
    aiConfidence: 92.0,
    submittedAt: 'Yesterday, 02:10 PM',
    gpsCoordinates: [28.9910, 77.7120],
    image: 'https://images.unsplash.com/photo-1599827552599-ee2c1b82e2cb?w=600&auto=format&fit=crop&q=60',
    leafSymptoms: 'Scattered orange-brown pustules on upper leaf surface rubbing off orange dust on fingers.',
    status: 'verified',
    verifiedBy: 'Agronomist Dr. R. K. Malik (KVK Meerut / SVPUAT)',
    priority: 'normal',
    suggestedAction: 'Spray Propiconazole 25 EC @ 1ml/L immediately on both leaf surfaces'
  }
];

// 7-Day Weather Epidemic Risk Forecast for Uttar Pradesh Agro-Climatic Zones
export const EPIDEMIC_RISK_FORECAST = [
  {
    id: 'RISK-UP-01',
    district: 'Bareilly, Pilibhit & Shahjahanpur (Rohilkhand)',
    division: 'rohilkhand',
    targetCrop: 'Rice & Sugarcane',
    primaryThreat: 'Bacterial Leaf Blight & Red Rot Spore Multiplication',
    riskScore: 94,
    riskLevel: 'critical',
    forecastTrigger: 'RH > 90%, 3 consecutive overcast days with rain, Temp 26-31°C (Tarai belt moisture)',
    pestLifeCyclePhase: 'Bacterial hydathode penetration and rapid vascular clogging',
    recommendedWindow: 'Immediate 36-hour prophylactic copper-bactericide spray window',
    alertMessageEn: 'Critical 36h window: Stop Urea application; apply Streptocycline + Copper Oxychloride.',
    alertMessageHi: 'अति-महत्वपूर्ण ३६ घंटे की पूर्वसूचना: यूरिया का छिड़काव तुरंत रोकें; स्ट्रेप्टोसाइक्लिन + कॉपर ऑक्सीक्लोराइड फवारें।'
  },
  {
    id: 'RISK-UP-02',
    district: 'Lakhimpur Kheri & Sitapur',
    division: 'lucknow',
    targetCrop: 'Sugarcane',
    primaryThreat: 'Red Rot & Pokkah Boeng Fungal Flare-up',
    riskScore: 91,
    riskLevel: 'critical',
    forecastTrigger: 'Water accumulation in heavy Tarai clay soils + continuous high canopy humidity',
    pestLifeCyclePhase: 'Conidial sporulation in leaf whorls & root-collar ingress',
    recommendedWindow: 'Field drainage clearance + Trichoderma root-zone drenching',
    alertMessageEn: 'Heavy root-zone moisture alert: Clear drainage channels and initiate bio-fungicide drenching.',
    alertMessageHi: 'जलभराव का अलर्ट: खेतों से जल निकासी सुनिश्चित करें और ट्राइकोडर्मा की आळवणी (drenching) करें।'
  },
  {
    id: 'RISK-UP-03',
    district: 'Agra, Mathura & Aligarh',
    division: 'agra',
    targetCrop: 'Mustard & Potato',
    primaryThreat: 'White Rust (सफेद रोली) & Black Scurf in Seed Tubers',
    riskScore: 84,
    riskLevel: 'high',
    forecastTrigger: 'Heavy morning dew condensation + fog onset (RH > 86%)',
    pestLifeCyclePhase: 'Oospore germination and staghead gall deformation',
    recommendedWindow: 'Preventive Ridomil MZ spray on mustard; treat potato tubers before sowing',
    alertMessageEn: 'Dew-triggered spore alert: Apply Metalaxyl + Mancozeb on mustard before afternoon showers.',
    alertMessageHi: 'ओस व नमी चेतावनी: सरसों पर दोपहर से पूर्व मेटालैक्सिल + मैंकोजेब का छिड़काव पूरा करें।'
  },
  {
    id: 'RISK-UP-04',
    district: 'Farrukhabad & Kannauj',
    division: 'kanpur',
    targetCrop: 'Maize & Potato',
    primaryThreat: 'Fall Armyworm (FAW) & Early Blight',
    riskScore: 89,
    riskLevel: 'critical',
    forecastTrigger: 'Warm dry interval (32°C) following brief rain favoring moth flight',
    pestLifeCyclePhase: 'Peak 2nd & 3rd instar larva feeding inside young maize whorls',
    recommendedWindow: 'Whorl-directed Emamectin Benzoate spray within 48 hours',
    alertMessageEn: 'Fall Armyworm emergence surge: Apply recommended larvicide directly into central whorls.',
    alertMessageHi: 'फॉल आर्मीवर्म चेतावनी: कीटनाशक का घोल सीधे मक्के की गोफ (whorl) के अंदर डालें।'
  }
];

// Multilingual IPM Advisory Templates for UP Crops (CIBRC Approved)
export const ADVISORY_TEMPLATES = [
  {
    id: 'ADV-BLB-UP-01',
    titleHi: 'धान में जीवाणु झुलसा (बी.एल.बी.) का एकीकृत प्रबंधन',
    titleEn: 'Bacterial Leaf Blight (BLB) Integrated Management Protocol in Rice',
    titleUr: 'دھان میں بیکٹیریل پتی جھلسہ کا کنٹرول',
    crop: 'rice',
    cropName: 'Rice (धान)',
    severity: 'critical',
    bodyHi: `• पत्तियों के किनारे से पीली लहरदार धारी दिखने पर तुरंत खेत से पानी बाहर निकालें और 2-3 दिन खेत को सूखने दें।
• यूरिया (नाइट्रोजन) की अतिरिक्त खाद तुरंत बंद करें — अधिक यूरिया इस रोग को तेज़ी से भड़काता है।
• रासायनिक उपचार: स्ट्रेप्टोसाइक्लिन @ 0.15 ग्राम + कॉपर ऑक्सीक्लोराइड 50 WP @ 2.5 ग्राम प्रति लीटर पानी में मिलाकर छिड़कें।
• ध्यान दें: साधारण फफूंदनाशक (मैंकोजेब आदि) जीवाणु रोग पर काम नहीं करते, पैसा बर्बाद न करें।
• सुरक्षा नियम: छिड़काव के समय मास्क व दस्ताने पहनें और 15 दिन की प्रतीक्षा अवधि (PHI) रखें।`,
    bodyEn: `• On spotting wavy yellow streaks on leaf margins, drain standing water for 2-3 days immediately.
• Stop Nitrogen/Urea top dressing at once — excess nitrogen accelerates bacterial multiplication.
• Chemical Treatment: Spray Streptocycline @ 0.15g + Copper Oxychloride 50 WP @ 2.5g per Litre of water.
• Note: Ordinary fungicides do not work on bacterial diseases — avoid unnecessary expenditure.
• Safety Protocol: Wear rubber gloves and face mask during spraying; observe 15-day Pre-Harvest Interval (PHI).`,
    cibrcDose: '0.15g Streptocycline + 2.5g COC / Litre',
    phiDays: 15,
    targetTalukas: ['Nawabganj (Bareilly)', 'Baheri', 'Puranpur (Pilibhit)', 'Sahjanwa (Gorakhpur)']
  },
  {
    id: 'ADV-REDROT-UP-02',
    titleHi: 'गन्ने में लाल सड़न (रेड रॉट) रोग की आपातकालीन रोकथाम',
    titleEn: 'Sugarcane Red Rot Emergency Containment Protocol',
    titleUr: 'گنے میں ریڈ روٹ (لال سڑن) کی روک تھام',
    crop: 'sugarcane',
    cropName: 'Sugarcane (गन्ना)',
    severity: 'critical',
    bodyHi: `• तीसरी व चौथी पत्ती पीली पड़ने व तने के अंदर लाल रंग की धारियां दिखने पर रोगी झुंड को जड़ सहित उखाड़कर जला दें।
• खेत में जलभराव न होने दें; मेड़ों की नालियां खोलकर पानी का उचित निकास सुनिश्चित करें।
• जैविक उपचार: ट्राइकोडर्मा विरिडी @ 5 किलो प्रति एकड़ सड़ी गोबर खाद में मिलाकर जड़ क्षेत्र में डालें।
• रोगी खेत का बीज गन्ना अगली बुवाई के लिए बिल्कुल न रखें और न ही इसकी पेड़ी (ratoon) छोड़ें।
• अगली बुवाई से पूर्व सेट्स को कार्बेन्डाजिम 50 WP @ 1 ग्राम प्रति लीटर पानी के घोल में 15 मिनट डुबोकर बोएं।`,
    bodyEn: `• On noticing yellowing of 3rd/4th leaves and internal red discoloration with white cross bands, rogue out infected stools.
• Ensure proper field drainage to prevent fungal zoospore dispersal through standing water.
• Biological Action: Apply Trichoderma viride @ 5 kg/acre mixed with well-rotted FYM in root zone.
• Strict Directive: Do not retain ratoon crop or use seed cane from infected plots.
• Sett Treatment: Soak seed setts in Carbendazim 50 WP @ 1g/L water for 15 minutes before planting.`,
    cibrcDose: 'Trichoderma 5kg/acre | Carbendazim 1g/L sett soak',
    phiDays: 30,
    targetTalukas: ['Palia Kalan (Kheri)', 'Nighasan', 'Baheri (Bareilly)', 'Puwayan (Shahjahanpur)']
  },
  {
    id: 'ADV-MUSTARD-UP-03',
    titleHi: 'सरसों में सफेद रोली (व्हाइट रस्ट) व झुलसा रोग प्रबंधन',
    titleEn: 'Mustard White Rust & Alternaria Blight Management Protocol',
    titleUr: 'سرسوں میں سفید رولی اور جھلسہ کا علاج',
    crop: 'mustard',
    cropName: 'Mustard (सरसों)',
    severity: 'high',
    bodyHi: `• पत्तियों के नीचे सफेद उभरे फफोले दिखने पर मेटालैक्सिल 8% + मैंकोजेब 64% WP (रिडोमिल) @ 2.5 ग्राम/लीटर छिड़कें।
• विकृत व टेढ़ी-मेढ़ी "स्टैगहेड" टहनियों को काटकर खेत से बाहर जला दें — इनमें दाना नहीं बनता।
• छिड़काव करते समय पत्ती की निचली सतह का भीगना अनिवार्य है, क्योंकि सफेद रोली नीचे से ही शुरू होती है।
• 15 दिन के अंतराल पर आवश्यकतानुसार दूसरा छिड़काव दोहराएं।`,
    bodyEn: `• Spray Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L on noticing white shiny pustules on leaf undersides.
• Prune and destroy deformed "staghead" floral shoots where no siliqua/seeds will set.
• Ensure thorough spray coverage on the underside of foliage where fungal zoospores germinate.
• Repeat second spray after 15 days if cloudy dewy weather persists.`,
    cibrcDose: '2.5g Metalaxyl+Mancozeb / Litre',
    phiDays: 21,
    targetTalukas: ['Khandauli (Agra)', 'Chhata (Mathura)', 'Iglas (Aligarh)', 'Bisauli (Badaun)']
  }
];

// Executive Key Metrics for Uttar Pradesh Agriculture Department
export const EXECUTIVE_METRICS = {
  activeOutbreakClusters: 16,
  criticalRedAlerts: 5,
  totalHectaresUnderSurveillance: 520000, // 5.2 Lakh Hectares
  activeAffectedAreaHa: 8970,
  farmersMonitored: 68400,
  fieldScansToday: 2410,
  cropLossPreventedCrores: 64.8, // ₹ 64.8 Crores saved in UP
  yieldProtectedMetricTonnes: 54200, // 54,200 MT
  targetedPesticideReductionPercent: 34.2, // 34.2% reduction in synthetic chemical overuse
  averageResponseTimeHours: 2.4, // 2.4 hours response SLA
  pendingLabVerifications: 28,
  demandShortageAlertsCount: 9
};

// Trend Data for Graphs in UP (Rice, Wheat, Sugarcane, Potato, Mustard, Maize)
export const MONTHLY_OUTBREAK_TREND = [
  { month: 'Apr', wheatRust: 380, sugarcaneRot: 140, potatoBlight: 90, riceBLB: 40, weatherRisk: 30 },
  { month: 'May', wheatRust: 120, sugarcaneRot: 210, potatoBlight: 45, riceBLB: 60, weatherRisk: 38 },
  { month: 'Jun', wheatRust: 20, sugarcaneRot: 480, potatoBlight: 20, riceBLB: 190, weatherRisk: 62 },
  { month: 'Jul', wheatRust: 0, sugarcaneRot: 980, potatoBlight: 30, riceBLB: 680, weatherRisk: 86 },
  { month: 'Aug', wheatRust: 0, sugarcaneRot: 1820, potatoBlight: 110, riceBLB: 1350, weatherRisk: 94 },
  { month: 'Sep (Proj)', wheatRust: 0, sugarcaneRot: 1400, potatoBlight: 850, riceBLB: 920, weatherRisk: 78 }
];

export const CROP_DISTRIBUTION_STATS = [
  { name: 'Sugarcane (गन्ना)', hectares: 2690, percentage: 30, color: '#16a34a' },
  { name: 'Rice (धान)', hectares: 2240, percentage: 25, color: '#22c55e' },
  { name: 'Potato (आलू)', hectares: 1120, percentage: 13, color: '#eab308' },
  { name: 'Maize (मक्का)', hectares: 1280, percentage: 14, color: '#f59e0b' },
  { name: 'Mustard (सरसों)', hectares: 940, percentage: 11, color: '#84cc16' },
  { name: 'Onion & Wheat', hectares: 700, percentage: 7, color: '#ef4444' }
];
