import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseInitialized = false;

// Initialize Firebase Admin SDK once
const initializeFirebase = () => {
  if (firebaseInitialized || admin.apps.length > 0) return;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_JSON is not set — push notifications disabled');
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('[FCM] Firebase Admin SDK initialized');
  } catch (error) {
    console.error(`[FCM] Failed to initialize Firebase Admin: ${error.message}`);
  }
};

initializeFirebase();

/**
 * Send a push notification to a single device.
 * @param {{ token: string, title: string, body: string, data?: object }} opts
 */
export const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token) {
    console.warn('[FCM] sendPushNotification: no FCM token provided, skipping');
    return null;
  }

  if (!firebaseInitialized && admin.apps.length === 0) {
    console.warn('[FCM] Firebase not initialized, skipping push notification');
    return null;
  }

  // All data values must be strings for FCM
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    token,
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
    apns: {
      payload: {
        aps: { sound: 'default', badge: 1 },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`[FCM] Notification sent: ${response}`);
    return response;
  } catch (error) {
    // FCM errors (invalid token, etc.) should not crash the app
    console.error(`[FCM] Failed to send push notification: ${error.message}`);
    return null;
  }
};

/**
 * Send a push notification to multiple devices (multicast).
 * @param {{ tokens: string[], title: string, body: string, data?: object }} opts
 */
export const sendMulticastNotification = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) {
    console.warn('[FCM] sendMulticastNotification: no tokens provided, skipping');
    return null;
  }

  if (!firebaseInitialized && admin.apps.length === 0) {
    console.warn('[FCM] Firebase not initialized, skipping multicast notification');
    return null;
  }

  // Filter out empty/null tokens
  const validTokens = tokens.filter(Boolean);
  if (validTokens.length === 0) return null;

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  const message = {
    tokens: validTokens,
    notification: { title, body },
    data: stringData,
    android: {
      priority: 'high',
      notification: { sound: 'default' },
    },
    apns: {
      payload: {
        aps: { sound: 'default', badge: 1 },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `[FCM] Multicast sent: ${response.successCount} success, ${response.failureCount} failure`
    );
    return response;
  } catch (error) {
    console.error(`[FCM] Failed to send multicast notification: ${error.message}`);
    return null;
  }
};

export default admin;
