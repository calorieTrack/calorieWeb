import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import db from './db.js';
import { auth } from './firebase.js';
import { verifyIdToken, errorHandler } from './middleware.js';
import { searchUSDAFoods, adjustNutrients } from './usda.js';
import { pollSuggestions } from './ai.js';

const app = express();
const port = process.env.PORT || 4000;

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
    hasUSDAKey: !!process.env.USDA_API_KEY,
    hasFirebaseKey: !!process.env.FIREBASE_PRIVATE_KEY,
    port: process.env.PORT || 4000
  });
});

// ============================================
// AUTH ROUTES (no token required)
// ============================================

/**
 * POST /api/auth/register
 * Create a new user in DB after Firebase creates the account
 * Body: { email, password, displayName }
 */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || '',
    });

    // Create user in local DB
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, displayName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(userRecord.uid, email, displayName || '', now, now);

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
app.get('/api/me', verifyIdToken, (req, res) => {
  const user = db.prepare('SELECT id, email, displayName, createdAt FROM users WHERE id = ?').get(req.user.uid);
  res.json(user || { uid: req.user.uid, email: req.user.email });
});

/**
 * GET /api/me/calories
 * Get current user's calorie goal
 */
app.get('/api/me/calories', verifyIdToken, (req, res) => {
  const calorieGoal = db.prepare('SELECT calorieGoal FROM users WHERE id = ?').get(req.user.uid);
  res.json(calorieGoal || 1500);
});

/**
 * PUT /api/me/updatecalories
 * Update current user's calorie goal
 * Body: { calorieGoal: number }
 */
app.put('/api/me/updatecalories', verifyIdToken, (req, res, next) => {
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
    db.prepare(`
      UPDATE users SET calorieGoal = ?, updatedAt = ? WHERE id = ?
    `).run(goalNumber, now, req.user.uid);

    // Return updated calorie goal
    const updated = db.prepare('SELECT calorieGoal FROM users WHERE id = ?').get(req.user.uid);
    res.json(updated || { calorieGoal: goalNumber });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/entries?date=YYYY-MM-DD
 * Get today's entries for logged-in user
 */
app.get('/api/entries', verifyIdToken, (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const entries = db.prepare(`
    SELECT id, userId, name, quantity, calories, protein, fat, carbs, date, createdAt, updatedAt
    FROM entries
    WHERE userId = ? AND date = ?
    ORDER BY createdAt DESC
  `).all(req.user.uid, date);
  
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
});

/**
 * GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get daily calorie totals for a date range
 */
app.get('/api/summary', verifyIdToken, (req, res) => {
  const startDate = req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);

  const summary = db.prepare(`
    SELECT date, 
           SUM(calories) as totalCalories, 
           SUM(protein) as totalProtein,
           SUM(fat) as totalFat,
           SUM(carbs) as totalCarbs,
           COUNT(*) as entryCount
    FROM entries
    WHERE userId = ? AND date BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date DESC
  `).all(req.user.uid, startDate, endDate);

  res.json(summary);
});

/**
 * POST /api/entries
 * Create a new entry
 * Body: { name, quantity, calories, protein?, fat?, carbs?, date? }
 * Note: protein, fat, carbs are required - no estimation fallback
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

    const info = db.prepare(`
      INSERT INTO entries (userId, name, quantity, calories, protein, fat, carbs, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.uid, name, quantity || '', Number(calories), Number(protein), Number(fat), Number(carbs), entryDate, now, now);

    // Track this food for autocomplete with nutrients
    try {
      db.prepare(`
        INSERT INTO foods (userId, name, calories, protein, fat, carbs, usageCount, lastUsed, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        ON CONFLICT(userId, name) DO UPDATE SET usageCount = usageCount + 1, lastUsed = ?, protein = ?, fat = ?, carbs = ?
      `).run(
        req.user.uid, 
        name, 
        Number(calories), 
        Number(protein), 
        Number(fat), 
        Number(carbs), 
        now, 
        now,
        now,
        Number(protein),
        Number(fat),
        Number(carbs)
      );
    } catch (foodErr) {
      console.warn('Failed to track food:', foodErr.message);
    }

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/entries/:id
 * Update an entry (must own it)
 */
app.put('/api/entries/:id', verifyIdToken, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, quantity, calories, protein, fat, carbs, date } = req.body;

    // Verify ownership
    const entry = db.prepare('SELECT userId FROM entries WHERE id = ?').get(id);
    if (!entry || entry.userId !== req.user.uid) {
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

    const now = new Date().toISOString();
    
    // Update with or without nutrition data
    if (protein != null && fat != null && carbs != null) {
      db.prepare(`
        UPDATE entries
        SET name = ?, quantity = ?, calories = ?, protein = ?, fat = ?, carbs = ?, date = ?, updatedAt = ?
        WHERE id = ?
      `).run(name, quantity, Number(calories), Number(protein), Number(fat), Number(carbs), date, now, id);
    } else {
      db.prepare(`
        UPDATE entries
        SET name = ?, quantity = ?, calories = ?, date = ?, updatedAt = ?
        WHERE id = ?
      `).run(name, quantity, Number(calories), date, now, id);
    }

    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry (must own it)
 */
app.delete('/api/entries/:id', verifyIdToken, (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Verify ownership
    const entry = db.prepare('SELECT userId FROM entries WHERE id = ?').get(id);
    if (!entry || entry.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: you do not own this entry' });
    }

    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Register a user in the local DB (called after Firebase sign-up)
 * Body: { displayName? }
 */
app.post('/api/users', verifyIdToken, (req, res, next) => {
  try {
    const { displayName } = req.body;
    const now = new Date().toISOString();

    // User row is auto-created by middleware, but allow explicit updates
    db.prepare(`
      UPDATE users SET displayName = ?, updatedAt = ? WHERE id = ?
    `).run(displayName || '', now, req.user.uid);

    const user = db.prepare('SELECT id, email, displayName, createdAt, updatedAt FROM users WHERE id = ?').get(req.user.uid);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/foods/autocomplete?q=search&limit=5
 * Get food name, calorie, and macro suggestions based on user's history
 */
app.get('/api/foods/autocomplete', verifyIdToken, (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    let foods = [];
    if (q.length > 0) {
      // Search by name, sorted by usage and recency
      foods = db.prepare(`
        SELECT name, calories, protein, fat, carbs
        FROM foods
        WHERE userId = ? AND LOWER(name) LIKE ?
        GROUP BY name
        ORDER BY usageCount DESC, lastUsed DESC
        LIMIT ?
      `).all(req.user.uid, `%${q}%`, limit);
    } else {
      // Return top foods for the user if no query
      foods = db.prepare(`
        SELECT name, calories, protein, fat, carbs
        FROM foods
        WHERE userId = ?
        GROUP BY name
        ORDER BY usageCount DESC, lastUsed DESC
        LIMIT ?
      `).all(req.user.uid, limit);
    }

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
app.get('/api/foods', verifyIdToken, (req, res) => {
  try {
    const foods = db.prepare(`
      SELECT DISTINCT name, calories
      FROM foods
      WHERE userId = ?
      ORDER BY usageCount DESC, lastUsed DESC
    `).all(req.user.uid);

    res.json(foods);
  } catch (error) {
    console.error('Get foods error:', error);
    res.json([]);
  }
});

/**
 * GET /api/foods/search/usda?q=query&dataTypes=Foundation,Branded
 * Search USDA FoodData Central for foods
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - dataTypes: comma-separated list of data types (optional)
 *     Available: Foundation, SR Legacy, Branded, Survey (FNDDS)
 * Returns: { error?, suggestions: [{ fdcId, name, dataType, brandOwner }] }
 */
app.get('/api/foods/search/usda', verifyIdToken, async (req, res) => {
  try {
    const q = req.query.q || '';
    const dataTypesParam = req.query.dataTypes || '';
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    // Parse dataTypes from comma-separated string
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

app.get('/api/ai/aisuggestions', verifyIdToken, async (req, res) => {
  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const nutritionSummary = db.prepare(`
      SELECT date, 
             SUM(calories) as totalCalories, 
             SUM(protein) as totalProtein,
             SUM(fat) as totalFat,
             SUM(carbs) as totalCarbs,
             COUNT(*) as entryCount
      FROM entries
      WHERE userId = ? AND date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date DESC
    `).all(req.user.uid, startDate, endDate);

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
    const suggestions = await pollSuggestions(totals);
    console.log('Returning suggestions:', suggestions);
    res.json(suggestions);
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestions', message: error.message });
  }
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Calorie Track API listening on http://localhost:${port}`);
  console.log(`   Health: GET http://localhost:${port}/health`);
});
