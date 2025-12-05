import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Expects FIREBASE_SERVICE_ACCOUNT_KEY env var with JSON string
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!serviceAccountKey) {
  console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not found. Firebase will fail.');
} else {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: serviceAccountKey.project_id,
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
