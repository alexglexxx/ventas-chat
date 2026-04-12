"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export default function Page() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = collection(db, "tenants");

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTenants(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <h1>Cargando...</h1>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard real 🔥</h1>
      <p>Negocios: {tenants.length}</p>
    </div>
  );
}