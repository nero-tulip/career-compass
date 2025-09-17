// src/app/lib/firebaseAdmin.ts
import admin from "firebase-admin";

/**
 * In Next dev, modules can be reloaded multiple times.
 * Use globalThis to keep a single Admin app instance.
 */
declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN_APP__: admin.app.App | undefined;
}

export function getAdminApp(): admin.app.App {
  // 1) Reuse if Next has already created one in this process
  if (globalThis.__FIREBASE_ADMIN_APP__) return globalThis.__FIREBASE_ADMIN_APP__;

  // 2) Reuse if Admin SDK itself already has an app
  if (admin.apps.length > 0) {
    globalThis.__FIREBASE_ADMIN_APP__ = admin.app();
    return globalThis.__FIREBASE_ADMIN_APP__;
  }

  // 3) First-time init
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  globalThis.__FIREBASE_ADMIN_APP__ = app;
  return app;
}

export function adminDb() {
  return getAdminApp().firestore();
}

export function adminAuth() {
  return getAdminApp().auth();
}

export const AdminFieldValue = admin.firestore.FieldValue;
