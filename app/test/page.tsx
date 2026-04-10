"use client";

import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TestPage() {
  const testWrite = async () => {
    try {
      await addDoc(collection(db, "test"), {
        message: "Hola Alex 🔥",
        createdAt: new Date(),
      });
      alert("Dato guardado 🔥");
    } catch (error) {
      console.error(error);
      alert("Error 💀");
    }
  };

  return (
    <div className="p-10">
      <button
        onClick={testWrite}
        className="bg-black text-white px-4 py-2"
      >
        Probar Firebase
      </button>
    </div>
  );
}