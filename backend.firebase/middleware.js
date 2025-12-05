import { auth } from './firebase.js';
import * as firestoreDb from './firestore-db.js';

/**
 * Middleware to verify Firebase ID token
 * Extracts userId from token and attaches to req.user
 */
export const verifyIdToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };

    // Ensure user document exists in Firestore
    try {
      await firestoreDb.ensureUserExists(
        decodedToken.uid,
        decodedToken.email || '',
        decodedToken.name || ''
      );
    } catch (dbErr) {
      console.error('Failed to ensure user exists in Firestore:', dbErr);
      // Don't block authentication; let requests proceed
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};

/**
 * Middleware to handle errors globally
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
};
