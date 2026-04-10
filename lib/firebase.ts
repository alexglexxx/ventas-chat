import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtRMyzR9P61WcR2HwBJpuPvqz60H8q0CA",
  authDomain: "ventas-chat-d8518.firebaseapp.com",
  projectId: "ventas-chat-d8518",
  storageBucket: "ventas-chat-d8518.firebasestorage.app",
  messagingSenderId: "773413362468",
  appId: "1:773413362468:web:2b3de033be32cbf7ce71b1"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
