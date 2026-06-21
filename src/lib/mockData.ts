import { FarmerListing, Driver, AdvisoryArticle, WeatherData } from './types';

export const INITIAL_LISTINGS: FarmerListing[] = [
  {
    id: 'L-101',
    farmerName: 'Abdi Hassan',
    cropName: 'Maize',
    quantityKg: 600,
    harvestDate: '2026-06-23',
    reservePricePerKg: 18,
    location: { x: 120, y: 150, name: 'Vumilia Farm' },
    status: 'PENDING',
  },
  {
    id: 'L-102',
    farmerName: 'Fatuma Mwangi',
    cropName: 'Tomatoes',
    quantityKg: 350,
    harvestDate: '2026-06-23',
    reservePricePerKg: 25,
    location: { x: 180, y: 80, name: 'Tana Fields' },
    status: 'PENDING',
  },
  {
    id: 'L-103',
    farmerName: 'Kiprotich Chepkwony',
    cropName: 'Maize',
    quantityKg: 800,
    harvestDate: '2026-06-24',
    reservePricePerKg: 18,
    location: { x: 90, y: 250, name: 'Hilltop Shamba' },
    status: 'PENDING',
  },
  {
    id: 'L-104',
    farmerName: 'Grace Achieng',
    cropName: 'Tomatoes',
    quantityKg: 450,
    harvestDate: '2026-06-23',
    reservePricePerKg: 24,
    location: { x: 260, y: 160, name: 'Green Valley' },
    status: 'PENDING',
  },
  {
    id: 'L-105',
    farmerName: 'Samuel Kamau',
    cropName: 'Potatoes',
    quantityKg: 1200,
    harvestDate: '2026-06-25',
    reservePricePerKg: 15,
    location: { x: 310, y: 220, name: 'Sotik Ridge' },
    status: 'PENDING',
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'D-201',
    name: 'John Githongo',
    vehicleType: '3-Ton Pickup Truck',
    capacityKg: 3000,
    location: { x: 50, y: 50 },
    status: 'IDLE',
  },
  {
    id: 'D-202',
    name: 'Mary Wambui',
    vehicleType: 'Tractor Trailer',
    capacityKg: 5000,
    location: { x: 350, y: 100 },
    status: 'IDLE',
  },
  {
    id: 'D-203',
    name: 'Peter Mwangi',
    vehicleType: 'Light Cargo Van',
    capacityKg: 1500,
    location: { x: 200, y: 350 },
    status: 'IDLE',
  },
];

export const HUB_LOCATION = { x: 200, y: 200, name: 'Nakuru Co-Op Distribution Hub' };

export const WEATHER_STATUS: WeatherData = {
  temp: 26,
  humidity: 82,
  condition: 'Humid & Overcast',
  pestRisk: 'HIGH',
};

export const CROP_KNOWLEDGE_BASE: AdvisoryArticle[] = [
  {
    id: 'KB-001',
    title: 'Tomato Late Blight Management (Phytophthora infestans)',
    crop: 'Tomatoes',
    symptoms: ['Dark, water-soaked spots on leaves', 'White fungal growth under leaves in humid conditions', 'Brown, leathery patches on fruit'],
    organicRemedy: 'Apply copper-based fungicides immediately. Remove infected leaves and destroy them (do not compost). Ensure 3-foot spacing between rows to promote rapid drying.',
    preventativeMeasures: 'Plant blight-resistant tomato varieties. Prune lower foliage to keep leaves off damp soil. Avoid overhead sprinkler irrigation; use drip lines.',
    source: 'UN Food and Agriculture Organization (FAO) - Plant Health Guidelines',
  },
  {
    id: 'KB-002',
    title: 'Maize Maize Lethal Necrosis Disease (MLND)',
    crop: 'Maize',
    symptoms: ['Yellow stripes starting on leaf margins', 'Mottled patterns on leaves', 'Premature drying and failure to set grain'],
    organicRemedy: 'No chemical cure exists. Immediately isolate infected plants, uproot and burn them. Apply organic neem oil to control thrips and leaf beetles which transmit the virus.',
    preventativeMeasures: 'Rotate crops with non-cereal crops (e.g., beans, groundnuts) for at least two seasons. Plant certified disease-free hybrid seeds. Avoid sequential maize planting.',
    source: 'Kenya Agricultural and Livestock Research Organization (KALRO) Handbook',
  },
  {
    id: 'KB-003',
    title: 'Potato Early Blight (Alternaria solani)',
    crop: 'Potatoes',
    symptoms: ['Small dark brown spots on older leaves', 'Concentric rings forming a "target board" pattern', 'Yellowing margins around spots'],
    organicRemedy: 'Spray with organic copper soap or Bacillus subtilis-based bio-fungicides. Mulch soil surface to prevent soil spores from splashing onto leaves.',
    preventativeMeasures: 'Maintain high soil fertility through organic compost. Rotate crops with brassicas. Harvest only when vines are dead to minimize tuber infection.',
    source: 'International Potato Center (CIP) Extension Bulletin',
  },
  {
    id: 'KB-004',
    title: 'Mango Anthracnose Prevention (Colletotrichum gloeosporioides)',
    crop: 'Mangoes',
    symptoms: ['Sunken dark spots on ripening mango fruits', 'Black spots on blossoms leading to drop', 'Leaf spots with small gray centers'],
    organicRemedy: 'Spray potassium bicarbonate solution or compost tea early in the morning. Prune internal branches to improve air circulation and sunlight penetration.',
    preventativeMeasures: 'Harvest mangoes carefully to avoid bruising. Wash fruits in warm water (52°C) for 5 minutes immediately post-harvest to kill latent spores.',
    source: 'African Organic Agriculture Training Manual',
  },
];
