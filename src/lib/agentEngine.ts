import { FarmerListing, Driver, Trip, NegotiationMessage, AdvisoryArticle } from './types';
import { CROP_KNOWLEDGE_BASE, HUB_LOCATION } from './mockData';

// Simulated RAG Search
export function searchKnowledgeBase(query: string, cropFilter?: string): AdvisoryArticle[] {
  const normalizedQuery = query.toLowerCase();
  
  return CROP_KNOWLEDGE_BASE.filter(article => {
    // If crop filter is active, check crop
    if (cropFilter && article.crop.toLowerCase() !== cropFilter.toLowerCase()) {
      return false;
    }
    
    // Check if query matches title, crop, symptoms or recommendations
    return (
      article.title.toLowerCase().includes(normalizedQuery) ||
      article.crop.toLowerCase().includes(normalizedQuery) ||
      article.symptoms.some(sym => sym.toLowerCase().includes(normalizedQuery)) ||
      article.organicRemedy.toLowerCase().includes(normalizedQuery)
    );
  });
}

// 1. Farmer Liaison Agent (FLA)
// Parses freeform message or voice transcript to extract structured crop listings
export async function runFarmerLiaisonAgent(
  transcript: string, 
  farmerName: string, 
  apiKey?: string
): Promise<Partial<FarmerListing>> {
  // If API key is provided, we could hit Gemini. 
  // For the hackathon MVP, we do a high-fidelity local NLP regex parser, 
  // plus fallback simulated delays, ensuring it runs reliably.
  
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate thinking latency
  
  const text = transcript.toLowerCase();
  
  // Crop detection
  let cropName = 'Maize'; // Default fallback
  if (text.includes('tomato')) cropName = 'Tomatoes';
  else if (text.includes('potato')) cropName = 'Potatoes';
  else if (text.includes('mango')) cropName = 'Mangoes';

  // Quantity detection (look for numbers followed by kg, kgs, bags, tons, etc.)
  let quantityKg = 500; // Default fallback
  const qtyMatch = text.match(/(\d+)\s*(?:kg|kgs|kilo|kilos|kilogram|kilograms|bags|bag)/);
  if (qtyMatch && qtyMatch[1]) {
    quantityKg = parseInt(qtyMatch[1], 10);
  }

  // Price detection (look for numbers followed by shilling, shillings, ksh, rupees, rs, dollars, $, per kg)
  let reservePricePerKg = 20; // Default fallback
  const priceMatch = text.match(/(?:price|want|get|at|for|around)\s*(?:of|at|around)?\s*(?:rs\.?|ksh\.?|\$)?\s*(\d+)/i);
  if (priceMatch && priceMatch[1]) {
    reservePricePerKg = parseInt(priceMatch[1], 10);
  }

  // Date detection
  let harvestDate = new Date();
  harvestDate.setDate(harvestDate.getDate() + 2); // default 2 days out
  
  if (text.includes('tomorrow')) {
    harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + 1);
  } else if (text.includes('today')) {
    harvestDate = new Date();
  } else if (text.includes('monday')) {
    harvestDate = getNextDayOfWeek(1);
  } else if (text.includes('tuesday')) {
    harvestDate = getNextDayOfWeek(2);
  } else if (text.includes('wednesday')) {
    harvestDate = getNextDayOfWeek(3);
  } else if (text.includes('thursday')) {
    harvestDate = getNextDayOfWeek(4);
  } else if (text.includes('friday')) {
    harvestDate = getNextDayOfWeek(5);
  }

  const dateString = harvestDate.toISOString().split('T')[0];

  // Assign random coordinates in regional area
  const x = 50 + Math.floor(Math.random() * 300);
  const y = 50 + Math.floor(Math.random() * 300);

  return {
    id: `L-${Date.now().toString().slice(-3)}`,
    farmerName,
    cropName,
    quantityKg,
    harvestDate: dateString,
    reservePricePerKg,
    location: { x, y, name: `${farmerName}'s Farm` },
    status: 'PENDING',
  };
}

function getNextDayOfWeek(dayOfWeek: number): Date {
  const resultDate = new Date();
  resultDate.setDate(resultDate.getDate() + (7 + dayOfWeek - resultDate.getDay()) % 7);
  return resultDate;
}

// 2. Logistics Planner Agent (LPA)
// Takes active listings, clusters them by date/crop, assigns available drivers, and maps routing
export function runLogisticsPlannerAgent(
  listings: FarmerListing[],
  drivers: Driver[]
): { trips: Trip[]; updatedListings: FarmerListing[]; updatedDrivers: Driver[] } {
  
  const pendingListings = listings.filter(l => l.status === 'PENDING');
  if (pendingListings.length === 0) {
    return { trips: [], updatedListings: listings, updatedDrivers: drivers };
  }

  const activeTrips: Trip[] = [];
  const updatedListings = [...listings];
  const updatedDrivers = [...drivers];

  // Group listings by harvest date and crop
  const groups: { [key: string]: FarmerListing[] } = {};
  pendingListings.forEach(l => {
    const key = `${l.harvestDate}-${l.cropName}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  });

  let tripCounter = 1;
  
  for (const key in groups) {
    const groupListings = groups[key];
    const cropName = groupListings[0].cropName;
    const totalWeight = groupListings.reduce((sum, l) => sum + l.quantityKg, 0);

    // Find an available driver who has capacity
    const availableDriverIndex = updatedDrivers.findIndex(
      d => d.status === 'IDLE' && d.capacityKg >= totalWeight
    );

    if (availableDriverIndex !== -1) {
      const driver = updatedDrivers[availableDriverIndex];
      driver.status = 'ASSIGNED';

      // Mark the listings as POOLED
      groupListings.forEach(g => {
        const idx = updatedListings.findIndex(l => l.id === g.id);
        if (idx !== -1) {
          updatedListings[idx].status = 'POOLED';
        }
      });

      // Construct a route starting from driver, visiting each farm, then to Nakuru Hub
      const routePoints = [
        { x: driver.location.x, y: driver.location.y, name: `Driver Start (${driver.name})` },
        ...groupListings.map(l => ({ x: l.location.x, y: l.location.y, name: l.location.name })),
        HUB_LOCATION
      ];

      activeTrips.push({
        id: `TRIP-${200 + tripCounter++}`,
        driver: { ...driver },
        listings: groupListings.map(l => ({ ...l, status: 'POOLED' })),
        totalWeight,
        routePoints,
        status: 'SCHEDULED',
      });
    }
  }

  return {
    trips: activeTrips,
    updatedListings,
    updatedDrivers,
  };
}

// 3. B2B Market Negotiator Agent (MNA)
// Performs step-by-step mock negotiation with buyers. Can be queried incrementally.
export function simulateNegotiationStep(
  messages: NegotiationMessage[],
  cropName: string,
  totalWeight: number,
  reservePrice: number
): NegotiationMessage[] {
  const currentStep = messages.length;
  const newMessages = [...messages];
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // List of pre-approved buyers based on crops
  const buyers = {
    Tomatoes: 'Kariakor Veg Wholesale Ltd',
    Maize: 'East African Grain Millers',
    Potatoes: 'Crispy Foods Kenya',
    Mangoes: 'Frutti-Juice Processing Co.',
  };

  const buyerName = buyers[cropName as keyof typeof buyers] || 'General Foods Co.';

  if (currentStep === 0) {
    // Stage 1: System initializes negotiation
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-1`,
      sender: 'SYSTEM',
      senderName: 'Orchestrator',
      text: `Aggregated harvest identified: ${totalWeight}kg of ${cropName}. Reserve price set to Ksh ${reservePrice}/kg. Pitching to B2B buyers...`,
      timestamp,
    });
    
    // Stage 2: MNA initiates quote
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-2`,
      sender: 'AGENT',
      senderName: 'MNA Broker Agent',
      text: `Greetings. We represent Nakuru Agricultural Cooperative. We have a combined shipment of ${totalWeight}kg of premium grade ${cropName} ready for delivery on Friday. We are quoting Ksh ${Math.round(reservePrice * 1.3)}/kg based on current index pricing. Are you interested?`,
      timestamp,
    });
  } 
  
  else if (currentStep === 2) {
    // Stage 3: Buyer makes an initial low-ball offer
    const lowOffer = Math.round(reservePrice * 0.95);
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-3`,
      sender: 'BUYER',
      senderName: buyerName,
      text: `Thank you for reaching out. We can purchase the entire batch. However, due to recent market surplus, we can only offer Ksh ${lowOffer}/kg.`,
      timestamp,
      bidPricePerKg: lowOffer,
      isOffer: true,
    });
  } 
  
  else if (currentStep === 3) {
    // Stage 4: MNA rejects and counters
    const counterOffer = Math.round(reservePrice * 1.15);
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-4`,
      sender: 'AGENT',
      senderName: 'MNA Broker Agent',
      text: `Ksh ${newMessages[2].bidPricePerKg}/kg is too low and does not meet our production reserve floors. The quality is exceptional, and transportation is fully organized. We can settle at Ksh ${counterOffer}/kg for immediate locking.`,
      timestamp,
    });
  } 
  
  else if (currentStep === 4) {
    // Stage 5: Buyer increases bid but asks for discount
    const standardOffer = Math.round(reservePrice * 1.1);
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-5`,
      sender: 'BUYER',
      senderName: buyerName,
      text: `We appreciate the cooperative routing. Our final offer is Ksh ${standardOffer}/kg. If accepted, we can sign the invoice and execute digital lock-in immediately.`,
      timestamp,
      bidPricePerKg: standardOffer,
      isOffer: true,
    });
  } 
  
  else if (currentStep === 5) {
    // Stage 6: MNA accepts and locks transaction
    const finalPrice = newMessages[newMessages.length - 1].bidPricePerKg || reservePrice;
    
    newMessages.push({
      id: `NEG-MSG-${Date.now()}-6`,
      sender: 'AGENT',
      senderName: 'MNA Broker Agent',
      text: `Offer of Ksh ${finalPrice}/kg accepted. The shipment is locked. Contract generated. Payments will be escrowed and distributed to our farmers' mobile wallets upon delivery. Thank you.`,
      timestamp,
    });

    newMessages.push({
      id: `NEG-MSG-${Date.now()}-7`,
      sender: 'SYSTEM',
      senderName: 'Orchestrator',
      text: `🎉 TRANSACTION SETTLED: ${totalWeight}kg of ${cropName} sold to ${buyerName} at Ksh ${finalPrice}/kg. (Net revenue: Ksh ${(totalWeight * finalPrice).toLocaleString()}). Payouts scheduled.`,
      timestamp,
    });
  }

  return newMessages;
}
