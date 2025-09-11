// src/app/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

// Always reuse the same app instance (Next HMR safe)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth with explicit local persistence (stays logged in across tabs/reloads)
export const auth =
  // If initializeAuth is called twice it throws, so only call once per app.
  ((): ReturnType<typeof getAuth> => {
    try {
      const _auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
      return _auth;
    } catch {
      return getAuth(app);
    }
  })();

export const db = getFirestore(app);
