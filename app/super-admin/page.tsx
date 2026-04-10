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
  // ... (otros estados)

  useEffect(() => {
    // 🛡️ PROTECCIÓN SUPER-ADMIN
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || currentUser.email !== "alexglex@gmail.com") { 
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });

    // ... (restos de useEffects)
    return () => unsubAuth();
  }, [router]);
    const tenantsRef = collection(db, "tenants");
    const unsubscribeTenants = onSnapshot(tenantsRef, (snap) => {
      setTenants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tenant[]);
      setLoading(false);
    });

    // 2. Escuchar Citas Globales (Métrica de Éxito)
    const apptsQuery = query(collectionGroup(db, "appointments"));
    const unsubscribeAppts = onSnapshot(apptsQuery, (snap) => {
      setTotalAppts(snap.size);
    });

    // 3. Escuchar Pedidos (Simulamos pedidos mediante clics en checkout si no hay tabla de pedidos)
    // Por ahora usaremos el tamaño de la colección 'orders' si existe
    const ordersQuery = query(collectionGroup(db, "orders"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snap) => {
      setTotalOrders(snap.size);
    });

    return () => {
      unsubscribeTenants();
      unsubscribeAppts();
      unsubscribeOrders();
    };
    ,[]); 


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
      
      {/* HEADER: MÉTRICAS DE IMPACTO TITAN */}
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* COLUMNA 1: ALTA Y CONFIG (4 cols) */}
        <div className="xl:col-span-4 space-y-8">
          {/* Formulario Alta */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-zinc-100">
            <h2 className="text-xl font-black uppercase italic mb-6">Nuevo Cliente</h2>
            <form onSubmit={handleCreateBiz} className="space-y-4">
              <input type="text" placeholder="Slug (ej: barberia-titan)" className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-xs" value={newBiz.id} onChange={e => setNewBiz({...newBiz, id: e.target.value})} />
              <input type="text" placeholder="Nombre Comercial" className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-xs" value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} />
              <select className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-xs" value={newBiz.type} onChange={e => setNewBiz({...newBiz, type: e.target.value as any})}>
                <option value="TAQUERIA">TAQUERÍA</option>
                <option value="SERVICIOS">SERVICIOS/CITAS</option>
              </select>
              <button className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-widest text-xs">Registrar en Ecosistema</button>
            </form>
          </section>

          {/* EDITOR DE MENÚ RÁPIDO (Tu petición) */}
          <section className="bg-zinc-900 p-8 rounded-[40px] shadow-2xl text-white">
            <h2 className="text-xl font-black uppercase italic mb-6 text-zinc-100">Editor Maestro</h2>
            <div className="space-y-4">
              <select 
                className="w-full p-4 rounded-2xl bg-zinc-800 border-none font-bold text-xs text-white"
                onChange={e => setSelectedBiz(e.target.value)}
              >
                <option value="">Selecciona un Negocio...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>

              {selectedBiz && (
                <form onSubmit={handleAddProductToBiz} className="space-y-3 animate-in fade-in duration-500">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Añadir Item a {selectedBiz}</p>
                  <input type="text" placeholder="Nombre Item" className="w-full p-4 rounded-2xl bg-zinc-800 border-none font-bold text-xs text-white" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <input type="number" placeholder="Precio ($)" className="w-full p-4 rounded-2xl bg-zinc-800 border-none font-bold text-xs text-white" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  <input type="text" placeholder="Categoría (taco, bebida, servicio)" className="w-full p-4 rounded-2xl bg-zinc-800 border-none font-bold text-xs text-white" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                  <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px]">Inyectar al Menú</button>
                </form>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA 2: LISTADO Y CONTROL (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex justify-between items-center mb-2">
             <h2 className="text-xl font-black uppercase italic">Directorio de Tenants</h2>
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estado de Cobro</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {tenants.map(t => (
              <div key={t.id} className="bg-white p-6 rounded-[32px] border border-zinc-100 flex justify-between items-center hover:border-zinc-300 transition-all group">
                <div className="flex gap-5 items-center">
                   <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-2xl shadow-sm ${t.businessType === 'TAQUERIA' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                      {t.businessType === 'TAQUERIA' ? '🌮' : '💈'}
                   </div>
                   <div>
                      <h4 className="font-black text-xl tracking-tight leading-none">{t.name}</h4>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t.businessType}</span>
                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">ID: {t.id}</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="text-right">
                      <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {t.status === 'active' ? '● Al Corriente' : '○ Pendiente'}
                      </span>
                   </div>
                   <button 
                    onClick={() => updateDoc(doc(db, "tenants", t.id), { status: t.status === 'active' ? 'pending_payment' : 'active' })}
                    className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all font-black text-lg shadow-inner"
                   >
                     $
                   </button>
                   <button onClick={() => confirm('¿Eliminar del ecosistema?') && deleteDoc(doc(db, "tenants", t.id))} className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:text-red-500 transition-colors">
                     <span className="text-2xl font-bold">×</span>
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer className="mt-24 text-center">
        <div className="inline-block px-6 py-2 bg-zinc-100 rounded-full text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">
          Titan SaaS Framework v1.0 • Powering Commerce
        </div>
      </footer>
    </div>
  );
}
