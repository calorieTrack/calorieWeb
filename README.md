# CalorieWeb

A modern calorie tracking web application with real-time USDA nutrition data integration, built with React and Node.js.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication and authorization
# CalorieWeb

A modern calorie-tracking web application with USDA nutrition integration.

This README focuses on getting the project running locally, testing, and where to look for key pieces of the codebase.

--

## Quick Start

Prerequisites: Node.js 18+, npm (or yarn), Firebase project, and USDA API key.

1) Clone and install

```bash
git clone https://github.com/yourusername/calorieWeb.git
cd calorieWeb
```

2) Start backend

```bash
cd backend
npm install
# create .env following backend/README or API.md (see notes below)
npm run dev
```

3) Start frontend

```bash
cd calorie-track
npm install
# create src/config.js with API_BASE_URL and firebaseConfig, or refer to src/.env
npm run dev
```

Open: `http://localhost:5173`

--

## Configuration notes

- Backend expects environment variables in `backend/.env` (PORT, FIREBASE_* keys, USDA_API_KEY). See `backend/API.md` for details.
- Frontend requires `src/config.js` with `API_BASE_URL` and `firebaseConfig` (Firebase web app settings). 
  - Alternatively, provide them as environmental variables as in `src/.env`

--

## Running Tests

- Unit tests (frontend):

```bash
cd calorie-track
npm run test:unit
```

- End-to-end tests (puppeteer):

```bash
cd calorie-track
npm run test:e2e
```

--

## Key Files

- Frontend: `calorie-track/src/components/` — UI components (Analysis, EntryForm, EntryList, etc.)
- Backend: `backend/index.js`, `backend/db.js`, `backend/usda.js` — API and DB logic
- API docs: `backend/API.md`

--

## Development tips

- Use the browser devtools responsive view for tablet/phone layout checks.
- Charts use `recharts` — hover handlers exist to link chart slices to UI elements in `Analysis.jsx`.
- CSS Modules keep styles local; edit `*.module.css` files next to components.

--

## Contributing

Fork, create a branch, and open a PR. Keep changes scoped and add tests for behavior where possible.

--

## License

MIT — see `LICENSE`.
