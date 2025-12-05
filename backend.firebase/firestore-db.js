import admin from 'firebase-admin';
import { db } from './firebase.js';

/**
 * Firestore database operations module
 * Replaces SQLite db.js with async Firestore methods
 */

// ============================================
// USER OPERATIONS
// ============================================

export const createUser = async (uid, email, displayName) => {
  const now = new Date().toISOString();
  await db.collection('users').doc(uid).set({
    email,
    displayName,
    calorieGoal: 2000,
    createdAt: now,
    updatedAt: now,
  });
};

export const getUser = async (uid) => {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const updateUser = async (uid, data) => {
  await db.collection('users').doc(uid).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const ensureUserExists = async (uid, email, displayName) => {
  const userRef = db.collection('users').doc(uid);
  const doc = await userRef.get();
  
  if (!doc.exists) {
    await createUser(uid, email, displayName);
  } else {
    // Update profile if changed
    const now = new Date().toISOString();
    await userRef.update({
      email,
      displayName,
      updatedAt: now,
    });
  }
};

// ============================================
// ENTRY OPERATIONS (Food log entries)
// ============================================

export const createEntry = async (uid, entryData) => {
  const now = new Date().toISOString();
  const docRef = db.collection('entries').doc(uid).collection('user_entries').doc();
  await docRef.set({
    ...entryData,
    userId: uid,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getEntriesByDate = async (uid, date) => {
  const snapshot = await db
    .collection('entries')
    .doc(uid)
    .collection('user_entries')
    .where('date', '==', date)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEntriesByDateRange = async (uid, startDate, endDate) => {
  const snapshot = await db
    .collection('entries')
    .doc(uid)
    .collection('user_entries')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'desc')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEntry = async (uid, entryId) => {
  const doc = await db
    .collection('entries')
    .doc(uid)
    .collection('user_entries')
    .doc(entryId)
    .get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const updateEntry = async (uid, entryId, data) => {
  await db
    .collection('entries')
    .doc(uid)
    .collection('user_entries')
    .doc(entryId)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
};

export const deleteEntry = async (uid, entryId) => {
  await db
    .collection('entries')
    .doc(uid)
    .collection('user_entries')
    .doc(entryId)
    .delete();
};

// ============================================
// SUMMARY/ANALYTICS OPERATIONS
// ============================================

export const getSummaryByDateRange = async (uid, startDate, endDate) => {
  const entries = await getEntriesByDateRange(uid, startDate, endDate);
  
  // Group by date and calculate totals
  const summary = {};
  for (const entry of entries) {
    const date = entry.date;
    if (!summary[date]) {
      summary[date] = {
        date,
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalCarbs: 0,
        entryCount: 0,
      };
    }
    summary[date].totalCalories += entry.calories || 0;
    summary[date].totalProtein += entry.protein || 0;
    summary[date].totalFat += entry.fat || 0;
    summary[date].totalCarbs += entry.carbs || 0;
    summary[date].entryCount += 1;
  }
  
  // Sort by date descending
  return Object.values(summary).sort((a, b) => b.date.localeCompare(a.date));
};

// ============================================
// FOOD OPERATIONS (Autocomplete/history)
// ============================================

export const addFood = async (uid, foodData) => {
  const docRef = db.collection('foods').doc(uid).collection('user_foods').doc();
  await docRef.set({
    ...foodData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
};

export const getFood = async (uid, foodId) => {
  const doc = await db
    .collection('foods')
    .doc(uid)
    .collection('user_foods')
    .doc(foodId)
    .get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const getFoods = async (uid) => {
  const snapshot = await db
    .collection('foods')
    .doc(uid)
    .collection('user_foods')
    .orderBy('usageCount', 'desc')
    .orderBy('lastUsed', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getFoodsByName = async (uid, query) => {
  const lowerQuery = query.toLowerCase();
  const snapshot = await db
    .collection('foods')
    .doc(uid)
    .collection('user_foods')
    .get();
  
  // Filter by name (Firestore doesn't support case-insensitive search)
  const filtered = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(food => food.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => {
      // Sort by usage count and lastUsed
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return new Date(b.lastUsed) - new Date(a.lastUsed);
    });
  
  return filtered;
};

export const updateFoodUsage = async (uid, foodId) => {
  const docRef = db.collection('foods').doc(uid).collection('user_foods').doc(foodId);
  await docRef.update({
    usageCount: admin.firestore.FieldValue.increment(1),
    lastUsed: new Date().toISOString(),
  });
};

export const upsertFood = async (uid, foodName, foodData) => {
  // Firestore doesn't have built-in upsert with unique constraints like SQLite
  // Try to find existing food by name
  const snapshot = await db
    .collection('foods')
    .doc(uid)
    .collection('user_foods')
    .where('name', '==', foodName)
    .get();
  
  if (snapshot.docs.length > 0) {
    // Update existing
    const docId = snapshot.docs[0].id;
    await db
      .collection('foods')
      .doc(uid)
      .collection('user_foods')
      .doc(docId)
      .update({
        ...foodData,
        usageCount: admin.firestore.FieldValue.increment(1),
        lastUsed: new Date().toISOString(),
      });
    return docId;
  } else {
    // Create new
    return await addFood(uid, {
      ...foodData,
      name: foodName,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
    });
  }
};

export default db;
