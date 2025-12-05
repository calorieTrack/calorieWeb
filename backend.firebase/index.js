import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { auth } from './firebase.js';
import * as firestoreDb from './firestore-db.js';
import { verifyIdToken, errorHandler } from './middleware.js';
import { searchUSDAFoods, adjustNutrients } from './usda.js';
import { pollSuggestions } from './ai.js';

const app = express();
const port = process.env.PORT || 4000;
const isTest = process.env.NODE_ENV === 'test';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Firestore',
    hasUSDAKey: !!process.env.USDA_API_KEY,
    hasFirebaseKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    port: process.env.PORT || 4000
  });
});

// ============================================
// AUTH ROUTES (no token required)
// ============================================

/**
 * POST /api/auth/register
 * Create a new user in Firestore after Firebase creates the account
 * Body: { email, password, displayName }
 */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || '',
    });

    // Create user document in Firestore
    await firestoreDb.createUser(userRecord.uid, email, displayName || '');

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: instructions for frontend to get ID token via Firebase SDK
 */
app.post('/api/auth/login', async (req, res) => {
  res.json({
    message: 'Use Firebase SDK on frontend to authenticate. Call signInWithEmailAndPassword() and get ID token.',
  });
});

// ============================================
// PROTECTED ROUTES (require valid ID token)
// ============================================

/**
 * GET /api/me
 * Get current user info
 */
app.get('/api/me', verifyIdToken, async (req, res, next) => {
  try {
    const user = await firestoreDb.getUser(req.user.uid);
    res.json(user || { uid: req.user.uid, email: req.user.email });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/entries?date=YYYY-MM-DD
 * Get entries for a specific date for logged-in user
 */
app.get('/api/entries', verifyIdToken, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const entries = await firestoreDb.getEntriesByDate(req.user.uid, date);
    
    console.log(`Retrieved ${entries.length} entries for ${date}:`, 
      entries.map(e => ({
        id: e.id, 
        name: e.name, 
        calories: e.calories, 
        protein: e.protein, 
        fat: e.fat, 
        carbs: e.carbs
      }))
    );
    
    res.json(entries);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get daily calorie totals for a date range
 */
app.get('/api/summary', verifyIdToken, async (req, res, next) => {
  try {
    const startDate = req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);

    const summary = await firestoreDb.getSummaryByDateRange(req.user.uid, startDate, endDate);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/entries
 * Create a new entry
 * Body: { name, quantity, calories, protein?, fat?, carbs?, date? }
 * Note: protein, fat, carbs are required
 */
app.post('/api/entries', verifyIdToken, async (req, res, next) => {
  try {
    const { name, quantity, calories, protein, fat, carbs, date } = req.body;

    if (!name || calories == null) {
      return res.status(400).json({ error: 'name and calories required' });
    }

    if (protein == null || fat == null || carbs == null) {
      return res.status(400).json({ 
        error: 'Macronutrient data required. Please use USDA search or enter manually.',
        missingFields: {
          protein: protein == null,
          fat: fat == null, 
          carbs: carbs == null
        }
      });
    }

    const now = new Date().toISOString();
    const entryDate = date || now.slice(0, 10);

    const entryId = await firestoreDb.createEntry(req.user.uid, {
      name,
      quantity: quantity || '',
      calories: Number(calories),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      date: entryDate,
    });

    // Track this food for autocomplete with nutrients
    try {
      await firestoreDb.upsertFood(req.user.uid, name, {
        calories: Number(calories),
        protein: Number(protein),
        fat: Number(fat),
        carbs: Number(carbs),
      });
    } catch (foodErr) {
      console.warn('Failed to track food:', foodErr.message);
    }

    const entry = await firestoreDb.getEntry(req.user.uid, entryId);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/entries/:id
 * Update an entry (must own it)
 */
app.put('/api/entries/:id', verifyIdToken, async (req, res, next) => {
  try {
    const entryId = req.params.id;
    const { name, quantity, calories, protein, fat, carbs, date } = req.body;

    // Verify ownership
    const entry = await firestoreDb.getEntry(req.user.uid, entryId);
    if (!entry) {
      return res.status(403).json({ error: 'Forbidden: you do not own this entry' });
    }

    // Validate required fields
    if (!name || calories == null) {
      return res.status(400).json({ error: 'name and calories required' });
    }

    // If nutrition data is provided, validate it
    if (protein != null || fat != null || carbs != null) {
      if (protein == null || fat == null || carbs == null) {
        return res.status(400).json({ 
          error: 'All macronutrients required (protein, fat, carbs) or none',
          missingFields: {
            protein: protein == null,
            fat: fat == null, 
            carbs: carbs == null
          }
        });
      }
    }

    // Update entry
    const updateData = { name, quantity, calories: Number(calories), date };
    if (protein != null && fat != null && carbs != null) {
      updateData.protein = Number(protein);
      updateData.fat = Number(fat);
      updateData.carbs = Number(carbs);
    }

    await firestoreDb.updateEntry(req.user.uid, entryId, updateData);
    const updated = await firestoreDb.getEntry(req.user.uid, entryId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry (must own it)
 */
app.delete('/api/entries/:id', verifyIdToken, async (req, res, next) => {
  try {
    const entryId = req.params.id;

    // Verify ownership
    const entry = await firestoreDb.getEntry(req.user.uid, entryId);
    if (!entry) {
      return res.status(403).json({ error: 'Forbidden: you do not own this entry' });
    }

    await firestoreDb.deleteEntry(req.user.uid, entryId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create/update a user document in Firestore
 * Body: { displayName? }
 */
app.post('/api/users', verifyIdToken, async (req, res, next) => {
  try {
    const { displayName } = req.body;
    const now = new Date().toISOString();

    await firestoreDb.updateUser(req.user.uid, {
      displayName: displayName || '',
      updatedAt: now,
    });

    const user = await firestoreDb.getUser(req.user.uid);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/foods/autocomplete?q=search&limit=5
 * Get food suggestions based on user's history
 */
app.get('/api/foods/autocomplete', verifyIdToken, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    let foods = [];
    if (q.length > 0) {
      foods = await firestoreDb.getFoodsByName(req.user.uid, q);
    } else {
      foods = await firestoreDb.getFoods(req.user.uid);
    }

    // Limit results
    foods = foods.slice(0, limit).map(f => ({
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      fat: f.fat,
      carbs: f.carbs
    }));

    res.json(foods);
  } catch (error) {
    console.error('Food autocomplete error:', error);
    res.json([]);
  }
});

/**
 * GET /api/foods
 * Get all foods for the current user
 */
app.get('/api/foods', verifyIdToken, async (req, res, next) => {
  try {
    const foods = await firestoreDb.getFoods(req.user.uid);
    
    // Remove duplicates by name and return unique foods
    const uniqueFoods = [];
    const seen = new Set();
    for (const food of foods) {
      if (!seen.has(food.name)) {
        seen.add(food.name);
        uniqueFoods.push({
          name: food.name,
          calories: food.calories
        });
      }
    }

    res.json(uniqueFoods);
  } catch (error) {
    console.error('Get foods error:', error);
    res.json([]);
  }
});

/**
 * GET /api/foods/search/usda?q=query&dataTypes=Foundation,Branded
 * Search USDA FoodData Central for foods
 */
app.get('/api/foods/search/usda', verifyIdToken, async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const dataTypesParam = req.query.dataTypes || '';
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    let dataTypes = ['Foundation', 'SR Legacy']; // Default
    if (dataTypesParam) {
      dataTypes = dataTypesParam.split(',').map(t => t.trim()).filter(Boolean);
    }

    const result = await searchUSDAFoods(q, 10, dataTypes);
    res.json(result);
  } catch (error) {
    console.error('USDA search error:', error);
    res.status(500).json({ error: 'Failed to search USDA database' });
  }
});

/**
 * GET /api/goal/calories
 * Get current user's calorie goal
 */
app.get('/api/goal/calories', verifyIdToken, async (req, res, next) => {
  try {
    const user = await firestoreDb.getUser(req.user.uid);
    res.json({ calorieGoal: user?.calorieGoal || 2000 });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/goal/updatecalories
 * Update current user's calorie goal
 * Body: { newCalorieGoal: number }
 */
app.put('/api/goal/updatecalories', verifyIdToken, async (req, res, next) => {
  try {
    const { newCalorieGoal } = req.body;
    
    if (newCalorieGoal === undefined || newCalorieGoal === null) {
      return res.status(400).json({ error: 'calorieGoal is required' });
    }
    
    const goalNumber = Number(newCalorieGoal);
    if (isNaN(goalNumber) || goalNumber < 0) {
      return res.status(400).json({ error: 'calorieGoal must be a positive number' });
    }

    const now = new Date().toISOString();
    await firestoreDb.updateUser(req.user.uid, {
      calorieGoal: goalNumber,
      updatedAt: now,
    });

    const updated = await firestoreDb.getUser(req.user.uid);
    res.json({ calorieGoal: updated.calorieGoal || goalNumber });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/aisuggestions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get AI nutrition suggestions based on nutrition data
 */
app.get('/api/ai/aisuggestions', verifyIdToken, async (req, res, next) => {
  try {
    const { startDate: qsStart, endDate: qsEnd } = req.query || {};
    const today = new Date().toISOString().slice(0, 10);
    let startDate = qsStart || qsEnd || today;
    let endDate = qsEnd || qsStart || today;

    // Validate dates
    const isValidISODate = (s) => {
      if (!s || typeof s !== 'string') return false;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      const parsed = new Date(s);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed.toISOString().slice(0, 10) === s;
    };

    if (qsStart && !isValidISODate(qsStart)) {
      return res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' });
    }
    if (qsEnd && !isValidISODate(qsEnd)) {
      return res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' });
    }

    // Ensure startDate <= endDate
    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    const nutritionSummary = await firestoreDb.getSummaryByDateRange(req.user.uid, startDate, endDate);

    const totals = nutritionSummary.reduce((acc, day) => {
      return {
        totalCalories: acc.totalCalories + (day.totalCalories || 0),
        totalProtein: acc.totalProtein + (day.totalProtein || 0),
        totalFat: acc.totalFat + (day.totalFat || 0),
        totalCarbs: acc.totalCarbs + (day.totalCarbs || 0),
        totalEntries: acc.totalEntries + (day.entryCount || 0)
      };
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarbs: 0,
      totalEntries: 0
    });

    totals.days = nutritionSummary.length;
    
    const user = await firestoreDb.getUser(req.user.uid);
    totals.calorieGoal = user?.calorieGoal || 2000;
    totals.startDate = startDate;
    totals.endDate = endDate;
    totals.today = today;

    const suggestions = await pollSuggestions(totals);
    console.log('Returning suggestions:', suggestions);
    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestions error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Global error handler
app.use(errorHandler);

// Start server unless running under tests
if (!isTest) {
  app.listen(port, () => {
    console.log(`🚀 Calorie Track API (Firebase) listening on http://localhost:${port}`);
    console.log(`   Health: GET http://localhost:${port}/health`);
  });
}

export default app;
