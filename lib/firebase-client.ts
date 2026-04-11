import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-that-looks-correct-AIzaSyA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ventas-chat-d8518.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ventas-chat-d8518",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ventas-chat-d8518.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "773413362468",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:773413362468:web:0000000000"
};

// 🛡️ Inicialización perezosa para evitar errores en el build (SSR)
const getFirebaseApp = () => {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

// 🔒 Proxy para Auth (Evita error de 'invalid-api-key' en build time)
export const auth: Auth = typeof window !== "undefined" 
  ? getAuth(getFirebaseApp()) 
  : { app: null as any } as Auth;

// 🔒 Proxy para Firestore
export const db: Firestore = typeof window !== "undefined"
  ? getFirestore(getFirebaseApp())
  : { app: null as any } as Firestore;
