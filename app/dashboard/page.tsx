"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  businessType: "TAQUERIA" | "SERVICIOS";
  status?: "active" | "inactive" | "pending_payment";
  openStatus?: "OPEN" | "CLOSE";
  plan: "basic" | "pro";
}

export default function SuperAdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const [newBiz, setNewBiz] = useState({
    id: "",
    name: "",
    type: "TAQUERIA",
    phoneNumber: ""
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "taco"
  });

  const [selectedBiz, setSelectedBiz] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || currentUser.email !== "alexglex@gmail.com") {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // 📡 FIRESTORE (solo tenants para evitar errores)
  useEffect(() => {
    const tenantsRef = collection(db, "tenants");

    const unsubscribe = onSnapshot(tenantsRef, (snap) => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];

      setTenants(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ➕ Crear negocio
  const handleCreateBiz = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = newBiz.id.toLowerCase().replace(/\s+/g, "-");

    await setDoc(doc(db, "tenants", id), {
      ...newBiz,
      status: "active",
      plan: "basic",
      createdAt: new Date()
    });

    setNewBiz({
      id: "",
      name: "",
      type: "TAQUERIA",
      phoneNumber: ""
    });
  };

  // ➕ Agregar producto
  const handleAddProductToBiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBiz) return;

    const menuRef = collection(db, "tenants", selectedBiz, "menu");

    await addDoc(menuRef, {
      ...newProduct,
      price: Number(newProduct.price),
      active: true
    });

    setNewProduct({
      name: "",
      price: "",
      category: "taco"
    });

    alert(`Producto añadido a ${selectedBiz}`);
  };

  if (loading) {
    return (
      <div className="p-10 text-center font-black uppercase italic">
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#fafafa] p-8 font-sans text-zinc-900 pb-40">

      <h1 className="text-5xl font-black mb-10">Titan Central</h1>

      <div className="mb-10">
        <p className="text-lg">Negocios activos: <b>{tenants.length}</b></p>
      </div>

      {/* Crear negocio */}
      <form onSubmit={handleCreateBiz} className="mb-10 space-y-4">
        <h2 className="font-bold text-xl">Crear negocio</h2>

        <input
          placeholder="ID"
          value={newBiz.id}
          onChange={(e) => setNewBiz({ ...newBiz, id: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Nombre"
          value={newBiz.name}
          onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
          className="border p-2 w-full"
        />

        <button className="bg-black text-white px-4 py-2">
          Crear
        </button>
      </form>

      {/* Agregar producto */}
      <form onSubmit={handleAddProductToBiz} className="space-y-4">
        <h2 className="font-bold text-xl">Agregar producto</h2>

        <input
          placeholder="ID negocio"
          value={selectedBiz}
          onChange={(e) => setSelectedBiz(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          placeholder="Nombre producto"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Precio"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          className="border p-2 w-full"
        />

        <button className="bg-black text-white px-4 py-2">
          Agregar producto
        </button>
      </form>

    </div>
  );
}