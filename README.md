# CalorieWeb [![Build, Test, and Deploy](https://img.shields.io/github/actions/workflow/status/mingww64/calorieWeb/deploy.yml?branch=main&logo=githubactions&logoColor=white)](https://github.com/mingww64/calorieWeb/actions/workflows/deploy.yml)

A modern calorie-tracking web application with real-time USDA nutrition data integration, AI-powered suggestions, and comprehensive nutrition tracking.

![Dependabot](https://img.shields.io/badge/dependabot-025E8C?style=for-the-badge&logo=dependabot&logoColor=white)
![firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-%2340B5A4.svg?style=for-the-badge&logo=Puppeteer&logoColor=black)
![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)
![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)
## Features

- 🔐 **Firebase Authentication** - Secure user authentication with password reset
- 📊 **Nutrition Tracking** - Track calories, protein, fat, and carbs for each meal
- 🔍 **USDA Integration** - Search 200k+ foods from USDA FoodData Central database
- 🤖 **AI Suggestions** - Personalized nutrition recommendations powered by Google Gemini
- 📈 **Historical Trends** - Visualize nutrition patterns over time with interactive charts
- 💾 **Smart Autocomplete** - Food suggestions based on your history
- 🎯 **Daily Goals** - Set and track custom calorie goals
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

---

## Quick Start

**Prerequisites:** Node.js 18+, npm, Firebase project, USDA API key, and Google Gemini API key

### 1. Clone Repository

```bash
git clone https://github.com/mingww64/calorieWeb.git
cd calorieWeb
```

### 2. Choose Your Backend

Backend is being migrated from SQLite (validated) to Firestore (testing).
APIs are implemented identically.

```bash
cd backend # or backend.firebase
npm install
# Create .env file (see Configuration below)
npm run dev
```

Backend runs at: `http://localhost:4000`

### 3. Start Frontend

```bash
cd calorie-track
npm install
# Create src/config.js (see Configuration below)
npm run dev
```

Frontend opens at: `http://localhost:5173`

---

## Configuration

### Backend Configuration

Create `.env` in specific backend folder:

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin (get from Firebase Console → Project Settings → Service Accounts)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"..."}'

# USDA API (get free key from https://fdc.nal.usda.gov/api-key-signup.html)
USDA_API_KEY=your_usda_api_key

# Google Gemini API (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Configuration

Create `calorie-track/src/config.js`, or use `src/.env` with preconfigured config.js:

```javascript
export const API_URL = 'http://localhost:4000';

export const firebaseConfig = {
  apiKey: "your_firebase_web_api_key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

Get Firebase web config from: Firebase Console → Project Settings → General → Your apps


---


## Running Tests

### Frontend Tests

**Unit tests (Jest + React Testing Library):**
```bash
cd calorie-track
npm run test:unit
```

**E2E tests (Puppeteer):**
```bash
cd calorie-track
npm run test:e2e
```

### Backend Tests

**Firebase backend (Jest + Supertest):**
```bash
cd backend.firebase
npm test
```

---

## API Documentation

Complete API documentation is in `API.md` at the project root.

**Key Endpoints:**
- `POST /api/auth/register` - Register new user
- `GET /api/entries?date=YYYY-MM-DD` - Get food entries
- `POST /api/entries` - Create food entry
- `GET /api/foods/search/usda?q=query` - Search USDA database
- `GET /api/ai/aisuggestions` - Get AI nutrition suggestions
- `GET /api/summary?startDate=...&endDate=...` - Get nutrition summary

All protected endpoints require Firebase ID token in `Authorization: Bearer <token>` header.

---


## Public Instance
> Free Instance: backend might need time to spin up.

- [Github Pages](https://calorietrack.github.io/calorieWeb/)



## License

MIT License - see `LICENSE` file for details.
