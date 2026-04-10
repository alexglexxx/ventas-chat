"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  doc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase-client";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  active: boolean;
}

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  startTime: any;
  status: string;
}

interface Tenant {
  name: string;
  businessType: "TAQUERIA" | "SERVICIOS";
  address?: string;
  googleCalendarId?: string;
  ownerEmail?: string;
  status: string;
  config: { primaryColor: string; currency: string };
}

export default function AdminPage() {
  const { businessId } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ITEMS" | "AGENDA" | "CONFIG">("ITEMS");
  
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", description: "", active: true });

  useEffect(() => {
    if (!businessId) return;

    // 🛡️ PROTECCIÓN DUEÑO DE NEGOCIO
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) return router.push("/login");
      
      const tenantRef = doc(db, "tenants", businessId as string);
      onSnapshot(tenantRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Tenant;
          // Solo permitimos si el email coincide o si eres tú (el superadmin)
          if (data.ownerEmail && data.ownerEmail !== currentUser.email && currentUser.email !== "alexglex@gmail.com") {
            router.push("/login");
          }
          setTenant(data);
        }
      });
    });

    const itemsRef = collection(db, "tenants", businessId as string, "menu");
    const unsubItems = onSnapshot(itemsRef, (snap) => {
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      setLoading(false);
    });

    const appointmentsRef = collection(db, "tenants", businessId as string, "appointments");
    const q = query(appointmentsRef, orderBy("startTime", "desc"));
    const unsubAppts = onSnapshot(q, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[]);
    });

    return () => unsubAuth();
  }, [businessId, router]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsRef = collection(db, "tenants", businessId as string, "menu");
    await addDoc(itemsRef, { ...newItem, price: Number(newItem.price) });
    setNewItem({ name: "", price: "", category: "", description: "", active: true });
    setShowForm(false);
  };

  const updateConfig = async (field: string, value: string) => {
    const tenantRef = doc(db, "tenants", businessId as string);
    await updateDoc(tenantRef, { [field]: value });
  };

  if (loading || !tenant) return <div className="p-10 text-center font-bold">Cargando Panel Titan...</div>;

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-white font-sans text-zinc-900 pb-20">
      <header className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{tenant.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Dashboard • {tenant.businessType}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowForm(!showForm)} className="bg-zinc-900 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl">+</button>
        </div>
      </header>

      <nav className="flex border-b border-zinc-100 px-6">
        <button onClick={() => setActiveTab("ITEMS")} className={`py-4 px-2 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === "ITEMS" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-300"}`}>
          {tenant.businessType === "TAQUERIA" ? "Menú" : "Servicios"}
        </button>
        {tenant.businessType === "SERVICIOS" && (
          <button onClick={() => setActiveTab("AGENDA")} className={`py-4 px-2 font-black text-xs uppercase tracking-widest border-b-2 transition-all ml-6 ${activeTab === "AGENDA" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-300"}`}>
            Agenda
          </button>
        )}
        <button onClick={() => setActiveTab("CONFIG")} className={`py-4 px-2 font-black text-xs uppercase tracking-widest border-b-2 transition-all ml-6 ${activeTab === "CONFIG" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-300"}`}>
          Config
        </button>
      </nav>

      <main className="p-6">
        {activeTab === "ITEMS" && (
          <div className="space-y-6">
            {showForm && (
              <form onSubmit={handleAddItem} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4 mb-8">
                <input type="text" placeholder="Nombre" className="w-full p-4 rounded-2xl border-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none text-sm font-bold" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                <div className="flex gap-4">
                  <input type="number" placeholder="Precio" className="w-1/2 p-4 rounded-2xl border-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none text-sm font-bold" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                  <input type="text" placeholder="Categoría" className="w-1/2 p-4 rounded-2xl border-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-zinc-900 outline-none text-sm font-bold" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
                </div>
                <button className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest">Guardar</button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="p-5 border border-zinc-100 rounded-3xl flex justify-between items-center group hover:bg-zinc-50 transition-all">
                  <div>
                    <h4 className="font-bold text-zinc-900">{item.name}</h4>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">${item.price} • {item.category}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => deleteDoc(doc(db, "tenants", businessId as string, "menu", item.id))} className="text-red-500 font-bold text-xs">ELIMINAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "AGENDA" && (
          <div className="space-y-4">
            <h3 className="text-xl font-black italic uppercase">Próximas Citas</h3>
            {appointments.length === 0 && <p className="text-zinc-400 italic text-sm">No hay citas agendadas aún.</p>}
            {appointments.map(appt => (
              <div key={appt.id} className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-zinc-900">{appt.customerName}</h4>
                  <p className="text-zinc-500 text-xs font-bold">{appt.serviceName} • {appt.startTime?.toDate().toLocaleString()}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' : 'bg-zinc-200 text-zinc-500'}`}>
                  {appt.status}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "CONFIG" && (
          <div className="space-y-8">
            {/* CONTROL DE APERTURA */}
            <section className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
              <h3 className="font-black text-sm uppercase text-zinc-400 tracking-widest">Estado del Negocio</h3>
              <div className="flex gap-2">
                {[
                  { id: 'OPEN', label: 'Abierto', color: 'bg-green-500' },
                  { id: 'CLOSED', label: 'Cerrado', color: 'bg-red-500' },
                  { id: 'AUTO', label: 'Horario Auto', color: 'bg-blue-500' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => updateConfig("status", opt.id)}
                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${tenant.status === opt.id ? 'border-zinc-900 bg-white shadow-md' : 'border-transparent text-zinc-400 opacity-50'}`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opt.color}`}></span>
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-zinc-400 italic leading-none ml-2">Controla si el carrito y citas están activos en la web y WhatsApp.</p>
            </section>

            <section className="space-y-4">
              <h3 className="font-black text-sm uppercase text-zinc-400 tracking-widest">Datos del Negocio</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 block ml-2">Dirección Física</label>
                <input type="text" defaultValue={tenant.address} onBlur={(e) => updateConfig("address", e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 block ml-2">ID Calendario Google</label>
                <input type="text" placeholder="ej: tu-correo@gmail.com" defaultValue={tenant.googleCalendarId} onBlur={(e) => updateConfig("googleCalendarId", e.target.value)} className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-sm" />
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-zinc-100 text-center">
         <a href={`/${businessId}`} className="text-zinc-400 text-xs font-black uppercase tracking-widest hover:text-black">Ver Vista Pública ➔</a>
      </footer>
    </div>
  );
}
