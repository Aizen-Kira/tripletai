# TripletAI — AI Micro-Trip Planner

An intelligent, hyper-local outing planner that converts a vibe and budget constraints into a mapped, explainable timeline.

### Problem It Solves
Planning outings or short weekend trips in a city often involves jumping between chat-based assistants, search engines, map pins, and spreadsheets. Chatbots provide basic text lists with no concept of travel feasibility, budget allocations, or rejection logic. 

**TripletAI** solves this by converting outing planning into an interactive, multi-agent workspace. It doesn't just present a single suggestion; it acts as a structured planner that explains its decisions, tracks budgets, monitors local weather conditions, ranks alternatives deterministically, and saves your outing history to DynamoDB to build a personalized user memory profile.

---

### Key Features
- **Multi-Agent Decision Pipeline**: Uses specialized sequential agents (Intent, Weather, Budget, Places, Ranking, Reasoning, and Timeline Builder) to process outing inputs.
- **Explainable Recommendation Engine**: Displays transparent reasons for why each stop was chosen and alternative recommendations for each spot.
- **"Why Not" Panel**: Shows rejected candidate locations with explicit, AI-generated reasons for why they didn't make the cut.
- **Budget Tracker**: Calculates costs dynamically and reserves buffers to keep your plans strictly within your budget limit.
- **Interactive Map Dashboard**: Renders real-time route mappings and stop markers.
- **Saved Trip Memory**: Persists saved itineraries and user preference signals (favored categories, travel pace, budget tolerance) to personalize future planning runs.

---

### Tech Stack
- **Frontend & Server Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS & shadcn/ui components
- **AI Engine / LLMs**: Vercel AI SDK with Anthropic (Claude 3.5 Sonnet), OpenAI (gpt-4o), or NVIDIA (llama-3.3-nemotron-super-49b-v1)
- **Database**: AWS DynamoDB (Single-Table Design)
- **Location APIs**: Google Places API (New) & Foursquare API
- **Map Provider**: Mapbox GL JS
- **Deployment Platform**: Vercel

---

### Architecture Overview

```text
       ┌────────────────────────┐
       │   User Web Interface   │
       └───────────┬────────────┘
                   │ User Input / Saved Trips
                   ▼
       ┌────────────────────────┐
       │ Next.js API Middleware │
       └───────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐ ┌───────────────────┐
│ Multi-Agent Or- │ │    AWS DynamoDB   │
│  chestrator     │ │ (Primary DB:      │
└────────┬────────┘ │  Trip Memory &    │
         │          │  Preferences)     │
         │          └───────────────────┘
         ├───────────────────┬───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌───────────────────┐ ┌─────────────────┐
│     AI Model    │ │  Mapbox GL & POI  │ │ Weather Service │
│ (Anthropic/     │ │   APIs (Google/   │ │ (Configurable)  │
│ OpenAI/NVIDIA)  │ │    Foursquare)    │ │                 │
└─────────────────┘ └───────────────────┘ └─────────────────┘
```

---

### How to Run Locally (Step-by-Step)

#### 1. Clone the repository
```bash
git clone https://github.com/Aizen-Kira/tripletai.git
cd tripletai
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Set up environment variables
Copy the `.env.example` template to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```

#### 4. Configure database table in AWS
Ensure you have your AWS CLI configured or environment variables set, and run the DynamoDB database creation script:
```bash
npm run ddb:setup
```

#### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

---

### Environment Variables Needed
See `.env.example` for details:
```env
# AI Models (Define one to use)
ANTHROPIC_API_KEY=               # API key for Anthropic Claude
ANTHROPIC_MODEL=                 # Defaults to claude-sonnet-4-20250514
OPENAI_API_KEY=                  # API key for OpenAI
OPENAI_MODEL=                    # Defaults to gpt-4o
NVIDIA_API_KEY=                  # API key for NVIDIA API Catalog
NVIDIA_MODEL=                    # Defaults to nvidia/llama-3.3-nemotron-super-49b-v1

# Places APIs (At least one recommended)
GOOGLE_PLACES_API_KEY=           # API key for Google Cloud Places API
FOURSQUARE_API_KEY=              # API key for Foursquare Places API

# Map Rendering
NEXT_PUBLIC_MAPBOX_TOKEN=        # Public token for Mapbox GL map tiles

# AWS DynamoDB Backend Configuration
AWS_REGION=                      # Target region (e.g., us-east-1)
AWS_ACCESS_KEY_ID=               # AWS Access Key
AWS_SECRET_ACCESS_KEY=           # AWS Secret Access Key
DYNAMODB_TABLE=                  # Name of DynamoDB table (defaults to TripletAI)
```

---

### Hackathon Info
- **Event**: **H0: Hack the Zero Stack**
- **Track**: **Track 1: Monetizable B2C App**

---

### Screenshots
*(Screenshots showing the streaming multi-agent orchestrator, timeline cards, map panel, and the 'Why Not' rejected places dashboard will be presented here)*
