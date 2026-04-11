"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

interface Product {
  id: string;
  name: string;
  price: number;
  category: "taco" | "bebida" | "extra" | "salsa";
  description?: string;
  active?: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

interface Tenant {
  name: string;
  businessType: "TAQUERIA" | "SERVICIOS";
  address?: string;
  config: { primaryColor: string; currency: string };
  whatsapp: { phoneNumber: string; welcomeMessage: string };
}

interface Platter {
  items: { [productId: string]: number };
}

export default function BusinessPage() {
  const { businessId } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [menu, setMenu] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [platters, setPlatters] = useState<Platter[]>([{ items: {} }]);
  const [extras, setExtras] = useState<{ [productId: string]: number }>({});
  const [selectedSalsas, setSelectedSalsas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const tenantRef = doc(db, "tenants", businessId as string);
    const unsubscribeTenant = onSnapshot(tenantRef, (tenantSnap) => {
      if (tenantSnap.exists()) {
        const data = tenantSnap.data();
        setTenant({
          ...data,
          businessType: data.businessType || (data.type === "food" ? "TAQUERIA" : "SERVICIOS")
        } as Tenant);
      } else {
        setTenant(null);
      }
      setLoading(false);
    });

    const menuRef = collection(db, "tenants", businessId as string, "menu");
    const unsubscribeMenu = onSnapshot(menuRef, (menuSnap) => {
      const data = menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (tenant?.businessType === "TAQUERIA") {
        setMenu(data as Product[]);
      } else {
        setServices(data as Service[]);
      }
    });

    return () => {
      unsubscribeTenant();
      unsubscribeMenu();
    };
  }, [businessId, tenant?.businessType]);

  // LÓGICA TAQUERÍA
  const addToPlatter = (platterIndex: number, productId: string) => {
    setPlatters(prev => {
      const newPlatters = [...prev];
      newPlatters[platterIndex].items[productId] = (newPlatters[platterIndex].items[productId] || 0) + 1;
      return newPlatters;
    });
  };

  const removeFromPlatter = (platterIndex: number, productId: string) => {
    setPlatters(prev => {
      const newPlatters = [...prev];
      if (newPlatters[platterIndex].items[productId] > 0) {
        newPlatters[platterIndex].items[productId] -= 1;
      }
      return newPlatters;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    platters.forEach(platter => {
      Object.entries(platter.items).forEach(([id, qty]) => {
        const product = menu.find(p => p.id === id);
        if (product) total += product.price * qty;
      });
    });
    Object.entries(extras).forEach(([id, qty]) => {
      const product = menu.find(p => p.id === id);
      if (product) total += product.price * qty;
    });
    return total;
  };

  const isBusinessOpen = () => {
    if (!tenant) return false;
    // 1. Override Manual
    if (tenant.openStatus === "CLOSED") return false;
    if (tenant.openStatus === "OPEN") return true;

    // 2. Lógica Automática (Horarios)
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) - 6 (Sab)
    const time = now.getHours() * 100 + now.getMinutes(); // ej: 14:30 -> 1430

    // Por ahora simulamos una verificación básica (puedes expandir con la tabla BusinessHours)
    if (day === 0) return false; // Cerrado Domingos por defecto
    if (time < 900 || time > 2200) return false; // 9am a 10pm
    
    return true;
  };

  const handleFoodCheckout = async () => {
    if (!tenant || !isBusinessOpen()) return alert("El negocio está cerrado en este momento.");
    
    // 📊 REGISTRO DE PEDIDO (Para tus métricas de Super-Admin)
    try {
      await addDoc(collection(db, "tenants", businessId as string, "orders"), {
        total: calculateTotal(),
        status: "COMPLETED",
        createdAt: new Date()
      });
    } catch (e) { console.error("Error guardando métrica:", e); }

    let message = `🛒 *NUEVO PEDIDO EN ${tenant.name.toUpperCase()}*\n\n`;
    // ... resto del mensaje
    window.location.href = `https://wa.me/${tenant.whatsapp.phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  // LÓGICA SERVICIOS
  const handleAppointmentRequest = (serviceName?: string) => {
    if (!tenant) return;
    const message = `👋 Hola *${tenant.name}*, me gustaría agendar una cita${serviceName ? ` para *${serviceName}*` : ""}. ¿Qué horarios tienen disponibles?`;
    window.location.href = `https://wa.me/${tenant.whatsapp.phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  if (loading) return <div className="p-10 text-center font-bold">Cargando...</div>;
  if (!tenant) return <div className="p-10 text-center font-bold">Negocio no encontrado 📍</div>;

  // --- VISTA: TAQUERÍA ---
  if (tenant.businessType === "TAQUERIA") {
    const tacos = menu.filter(p => p.category === 'taco');
    const bebidasExtras = menu.filter(p => p.category === 'bebida' || p.category === 'extra');
    
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white pb-32 font-sans text-zinc-900">
        <div className="sticky top-0 bg-white z-10 border-b border-zinc-100 p-4 flex items-center justify-between">
          <h1 className="text-xl font-black uppercase italic tracking-tighter">{tenant.name}</h1>
          <div className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-black uppercase">Abierto</div>
        </div>

        <div className="p-4 space-y-10">
          <section>
            <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">1. Arma tu Plato</h2>
            {platters.map((platter, idx) => (
              <div key={idx} className="bg-zinc-50 rounded-3xl p-5 mb-4 border border-zinc-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-zinc-400 text-sm uppercase">Plato {idx + 1}</h3>
                  {idx > 0 && <button onClick={() => setPlatters(p => p.filter((_, i) => i !== idx))} className="text-red-500 text-[10px] font-bold">QUITAR</button>}
                </div>
                {tacos.map(taco => (
                  <div key={taco.id} className="flex justify-between items-center bg-white p-3 rounded-2xl mb-2 shadow-sm">
                    <span className="font-bold text-sm">{taco.name}</span>
                    <div className="flex items-center gap-3 bg-zinc-100 rounded-full p-1">
                      <button onClick={() => removeFromPlatter(idx, taco.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold shadow-sm">-</button>
                      <span className="font-black w-4 text-center text-xs">{platter.items[taco.id] || 0}</span>
                      <button onClick={() => addToPlatter(idx, taco.id)} className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-full font-bold shadow-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => setPlatters(p => [...p, { items: {} }])} className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 font-bold text-sm">+ AGREGAR OTRO PLATO</button>
          </section>
        </div>

        {calculateTotal() > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white to-transparent">
            <button onClick={handleFoodCheckout} className="w-full py-5 bg-zinc-900 text-white rounded-2xl shadow-2xl font-black text-lg flex justify-between px-8 items-center">
              <span>ORDENAR ${calculateTotal()}</span>
              <span className="text-sm">ENVIAR ➔</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- VISTA: SERVICIOS (Barberías, Clínicas) ---
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white font-sans text-zinc-900">
      {/* Hero Informartivo */}
      <div className="p-8 bg-zinc-900 text-white space-y-4">
        <div className="w-16 h-1 bg-zinc-700 rounded-full mb-4"></div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">{tenant.name}</h1>
        <p className="text-zinc-400 text-sm font-medium tracking-tight leading-relaxed">
          {tenant.address || "Ubicación disponible por WhatsApp"}
        </p>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-300">Servicios Profesionales</div>
          <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/20">Citas Disponibles</div>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Lista de Precios e Información */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Nuestros Servicios</h2>
            <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Precios en {tenant.config.currency}</span>
          </div>
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.id} className="group flex justify-between items-center p-5 border border-zinc-100 rounded-3xl hover:bg-zinc-50 transition-colors">
                <div>
                  <h4 className="font-bold text-zinc-900">{service.name}</h4>
                  <p className="text-zinc-400 text-xs mt-1">{service.description || "Consulta duración por WhatsApp"}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-zinc-900 block">${service.price}</span>
                  <button 
                    onClick={() => handleAppointmentRequest(service.name)}
                    className="mt-2 text-[10px] font-black uppercase text-zinc-400 group-hover:text-zinc-900 transition-colors"
                  >Agendar</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Información de Horarios */}
        <section className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100">
          <h3 className="font-black text-sm uppercase text-zinc-400 mb-4">Horarios y Atención</h3>
          <div className="space-y-2">
            {["Lunes a Viernes", "Sábados"].map(day => (
              <div key={day} className="flex justify-between text-sm">
                <span className="font-bold text-zinc-600">{day}</span>
                <span className="font-black text-zinc-900">09:00 - 19:00</span>
              </div>
            ))}
            <div className="flex justify-between text-sm opacity-50">
              <span className="font-bold text-zinc-600">Domingos</span>
              <span className="font-black text-zinc-900">Cerrado</span>
            </div>
          </div>
        </section>
      </div>

      {/* Botón de Acción Principal (Agendar) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <button 
          onClick={() => handleAppointmentRequest()}
          className="w-full py-5 bg-zinc-900 text-white rounded-2xl shadow-2xl font-black text-lg flex items-center justify-center gap-3 transform active:scale-95 transition-transform"
        >
          <span>AGENDAR CITA POR WHATSAPP</span>
          <span className="text-xl">➔</span>
        </button>
      </div>
    </div>
  );
}