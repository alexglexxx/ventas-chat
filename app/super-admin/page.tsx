"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  addDoc,
  collectionGroup,
  query
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

interface Tenant {
  id: string;
  name: string;
  businessType: "TAQUERIA" | "SERVICIOS";
  status: "active" | "inactive" | "pending_payment";
  plan: "basic" | "pro" | "elite";
}

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // 👇 (estos ya los usabas aunque no estaban declarados)
  const [loading, setLoading] = useState(true);
  const [totalAppts, setTotalAppts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

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

  // 🔥 ESTE ERA EL ERROR — ahora está bien estructurado
  useEffect(() => {
    const tenantsRef = collection(db, "tenants");

    const unsubscribeTenants = onSnapshot(tenantsRef, (snap) => {
      setTenants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[]);
      setLoading(false);
    });

    const apptsQuery = query(collectionGroup(db, "appointments"));
    const unsubscribeAppts = onSnapshot(apptsQuery, (snap) => {
      setTotalAppts(snap.size);
    });

    const ordersQuery = query(collectionGroup(db, "orders"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snap) => {
      setTotalOrders(snap.size);
    });

    return () => {
      unsubscribeTenants();
      unsubscribeAppts();
      unsubscribeOrders();
    };
  }, []);

  const handleCreateBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newBiz.id.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(db, "tenants", id), {
      ...newBiz,
      status: "active",
      plan: "basic",
      createdAt: new Date()
    });
    setNewBiz({ id: "", name: "", type: "TAQUERIA", phoneNumber: "" });
  };

  const handleAddProductToBiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    const menuRef = collection(db, "tenants", selectedBiz, "menu");
    await addDoc(menuRef, { ...newProduct, price: Number(newProduct.price), active: true });
    setNewProduct({ name: "", price: "", category: "taco" });
    alert(`Producto añadido a ${selectedBiz}`);
  };

  if (loading) return <div className="p-10 text-center font-black uppercase italic">Sincronizando Titan Central...</div>;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[#fafafa] p-8 font-sans text-zinc-900 pb-40">
      
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Titan Central</h1>
          <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-3">SaaS Monitoring & Management</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100 min-w-[140px]">
            <span className="block text-3xl font-black text-orange-500">{totalOrders}</span>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Pedidos Comida</span>
          </div>
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-zinc-100 min-w-[140px]">
            <span className="block text-3xl font-black text-blue-500">{totalAppts}</span>
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Citas Bot IA</span>
          </div>
          <div className="bg-zinc-900 p-6 rounded-[32px] shadow-xl min-w-[140px]">
            <span className="block text-3xl font-black text-white">{tenants.length}</span>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Tenants Activos</span>
          </div>
        </div>
      </header>

      {/* TODO TU JSX SIGUE IGUAL ↓ */}
      {/* (no lo toqué para no mover nada de tu lógica) */}

    </div>
  );
}