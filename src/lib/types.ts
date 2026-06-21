export interface FarmerListing {
  id: string;
  farmerName: string;
  cropName: string;
  quantityKg: number;
  harvestDate: string;
  reservePricePerKg: number;
  location: { x: number; y: number; name: string };
  status: 'PENDING' | 'POOLED' | 'SOLD' | 'DELIVERED';
  agreedPricePerKg?: number;
}

export interface Driver {
  id: string;
  name: string;
  vehicleType: string;
  capacityKg: number;
  location: { x: number; y: number };
  status: 'IDLE' | 'ASSIGNED' | 'IN_TRANSIT';
}

export interface Trip {
  id: string;
  driver: Driver;
  listings: FarmerListing[];
  totalWeight: number;
  routePoints: { x: number; y: number; name: string }[];
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED';
}

export interface NegotiationMessage {
  id: string;
  sender: 'AGENT' | 'BUYER' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
  bidPricePerKg?: number;
  isOffer?: boolean;
}

export interface AdvisoryArticle {
  id: string;
  title: string;
  crop: string;
  symptoms: string[];
  organicRemedy: string;
  preventativeMeasures: string;
  source: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  pestRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}
