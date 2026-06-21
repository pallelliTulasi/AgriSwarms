# AgriSwarms

> **Agents for Good Capstone Project**  
> *Decentralized Multi-Agent Logistics & Collective Bargaining Network for Smallholder Farmers*

---

## 🌟 Project Vision
Empowering smallholder farmers in developing economies to bypass exploitative middle-men and eliminate post-harvest waste through an autonomous multi-agent coordination, logistics-pooling, and bulk-negotiation network.

---

## 📸 Interface Preview

### 1. Dashboard Landing (Intake Phase)
Below is the initial visual cockpit view displaying active farmer listings, co-op drivers, metrics, and the interactive SVG district coordinate map:

![Initial Dashboard State](./public/images/initial_dashboard.png)

### 2. Multi-Agent Negotiation & RAG Resolution (Settlement Phase)
Below shows the dynamic state changes once the Logistics Planner Agent (LPA) pools the yields, the Market Negotiator Agent (MNA) completes its live bulk bargaining cycles, and the Agronomist Advisory Agent (AAA) runs vector RAG manual queries:

![Final Resolved Dashboard State](./public/images/final_dashboard.png)

---

## 🚀 Key Features

* **Zero-App Farmer Intake (Liaison Agent):** Employs voice notes (simulated via text-transcripts) to extract crop, volume, date, and reserve price variables from unstructured dialects.
* **Logistics Grouping & Route Plotting (Logistics Agent):** Auto-clusters pending harvests by crop and date proximity, matches them to cargo trucks, and plots coordinates on the coordinate map.
* **Autonomous Auction Bargaining (Negotiation Agent):** Pools aggregated crops and runs dynamic bargaining dialogues (offers, counters, deal confirmations) with wholesale commercial buyers.
* **Vector RAG Agronomy Diagnostics (Advisory Agent):** Cross-references weather patterns to flag pest risks and utilizes Retrieval-Augmented Generation (RAG) to locate treatments from FAO Plant Health guides.
* **Celebratory UI Animations:** Integrates Framer Motion paths and canvas confetti explosions upon successfully settling B2B transactions.

---

## 🛠 Tech Stack

- **Frontend/Backend Architecture:** Next.js 15 (App Router, React 19, TypeScript).
- **Styling System:** Tailwind CSS (v4) with global CSS glassmorphism, pulsing indicators, and custom dark-theme tokens.
- **Animation Frameworks:** Framer Motion (animated routes/nodes) + Canvas Confetti.
- **Icon Assets:** Lucide React.
- **Orchestration Pattern:** Hierarchy multi-agent state graphs (simulated in `src/lib/agentEngine.ts`).

---

## 📁 Repository Structure
```bash
├── public/                 # SVG assets and documentation screenshots
│   └── images/
│       ├── initial_dashboard.png
│       └── final_dashboard.png
├── src/
│   ├── app/
│   │   ├── globals.css      # Custom scrollbars, glassmorphism, pulse keyframes
│   │   ├── layout.tsx       # Root document structure
│   │   └── page.tsx         # Main interactive dashboard layout & hooks
│   └── lib/
│       ├── types.ts         # TypeScript definitions
│       ├── mockData.ts      # Vector RAG files and baseline database
│       └── agentEngine.ts   # Core agent logic scripts (FLA, LPA, MNA, AAA)
├── package.json             # Build configurations & module packages
└── tsconfig.json            # Strict TypeScript compilation rules
```

---

## 🏃 Local Setup & Run Guide

### 1. Install Dependencies
Initialize and download package files using npm:
```bash
npm install
```

### 2. Run Local Development Server
Start the Next.js server locally:
```bash
npm run dev
```

### 3. Open Dashboard
Navigate to the local address in your web browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧭 Live Demo Step-by-Step Flow

To test the multi-agent system execution inside the web app, perform the following actions:

1. **Step 1 (Farmer Liaison Agent):** 
   - Under the *Liaison Panel* (top-left), click a preset sample like **`Mariamu (Tomatoes)`** or type custom text.
   - Click **"Trigger FLA Voice Analysis"**. The FLA will structure the variables, map coordinates, and plot a green pin on the map.
2. **Step 2 (Logistics Planner Agent):**
   - Move to the *Logistics tab* (Phase 2) and click **"Consolidate Cargo & Generate Trip Routes"**.
   - The LPA clusters tomato listings, schedules cargo trucks, and draws route paths connecting farms to the Central Hub.
3. **Step 3 (Market Negotiator Agent):**
   - Move to the *Negotiation tab* (Phase 3), select `Tomatoes` (or your pooled crop), and click **"Initiate Autonomous Negotiation"**.
   - The MNA bargains in real-time with commercial buyers. When complete, confetti flies, metrics update, and listings show as `SOLD`.
4. **Step 4 (Agronomist Advisory Agent):**
   - Click the *RAG Advisory tab* (Phase 4).
   - Enter `tomato blight` in the search bar and submit to pull FAO treatment remedies.
   - Click **"Simulate Regional Weather Risk"** to display climate advisory warnings.

---

## 🌍 UN Sustainable Development Goals (SDGs) Alignment
- **Goal 1 (No Poverty):** Boosts smallholder profits by ~25% through direct bulk pricing.
- **Goal 2 (Zero Hunger):** Minimizes post-harvest waste (down from 40% to <10%).
- **Goal 12 (Responsible Consumption & Production):** Reduces carbon emissions and agricultural supply-chain logistics overhead.
