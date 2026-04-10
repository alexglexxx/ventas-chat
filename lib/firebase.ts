import { initializeApp, getApps, getApp } from "firebase-admin/app"; // Solo si fuera server-side
import { initializeApp as initializeClientApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBtRMyzR9P61WcR2HwBJpuPvqz60H8q0CA",
  authDomain: "ventas-chat-d8518.firebaseapp.com",
  projectId: "ventas-chat-d8518",
  storageBucket: "ventas-chat-d8518.firebasestorage.app",
  messagingSenderId: "1056521588806",
  appId: "1:1056521588806:web:44754751416e789ec3951f"
};

const app = getApps().length > 0 ? getApps()[0] : initializeClientApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
