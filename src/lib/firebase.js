import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"

// Usamos las variables de entorno que acabamos de configurar
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Patrón Singleton: Si ya existe una app, la usamos. Si no, la creamos.
// Esto evita el error "Firebase App already exists" en Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportamos los servicios que vamos a usar
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app)

export { app, db, storage, auth };