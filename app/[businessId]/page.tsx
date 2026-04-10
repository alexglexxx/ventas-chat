"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  price: number;
  category: "taco" | "bebida" | "extra" | "salsa";
  description?: string;
  active?: boolean;
}

interface Tenant {
  name: string;
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
  const [platters, setPlatters] = useState<Platter[]>([{ items: {} }]);
  const [extras, setExtras] = useState<{ [productId: string]: number }>({});
  const [selectedSalsas, setSelectedSalsas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const tenantRef = doc(db, "tenants", businessId as string);
    const unsubscribeTenant = onSnapshot(tenantRef, (tenantSnap) => {
      if (tenantSnap.exists()) {
        setTenant(tenantSnap.data() as Tenant);
      } else {
        setTenant(null);
      }
      setLoading(false);
    });

    const menuRef = collection(db, "tenants", businessId as string, "menu");
    const unsubscribeMenu = onSnapshot(menuRef, (menuSnap) => {
      const menuData = menuSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as unknown as Product[];
      setMenu(menuData);
    });

    return () => {
      unsubscribeTenant();
      unsubscribeMenu();
    };
  }, [businessId]);

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

  const addPlatter = () => {
    setPlatters(prev => [...prev, { items: {} }]);
  };

  const addToExtras = (productId: string) => {
    setExtras(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromExtras = (productId: string) => {
    setExtras(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) - 1) }));
  };

  const toggleSalsa = (name: string) => {
    setSelectedSalsas(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
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

  const handleCheckout = () => {
    if (!tenant) return;
    
    let message = `🛒 *NUEVO PEDIDO EN ${tenant.name.toUpperCase()}*\n\n`;
    
    platters.forEach((platter, idx) => {
      const platterItems = Object.entries(platter.items)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const product = menu.find(p => p.id === id);
          return `${qty} ${product?.name}`;
        });
      
      if (platterItems.length > 0) {
        message += `🍽️ *Plato ${idx + 1}:* ${platterItems.join(', ')}\n`;
      }
    });

    const extraItems = Object.entries(extras)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const product = menu.find(p => p.id === id);
        return `• ${qty}x ${product?.name}`;
      });

    if (extraItems.length > 0) {
      message += `\n🥤 *Extras y Bebidas:*\n${extraItems.join('\n')}\n`;
    }

    if (selectedSalsas.length > 0) {
      message += `\n🌶️ *Salsas:* ${selectedSalsas.join(', ')}\n`;
    }

    message += `\n💰 *TOTAL:* $${calculateTotal()} ${tenant.config.currency}\n\n📍 _Por favor, confirma si es para recoger o a domicilio._`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${tenant.whatsapp.phoneNumber}?text=${encodedMessage}`;
    window.location.href = whatsappUrl;
  };

  if (loading) return <div className="p-10 text-center">Cargando menú delicioso...</div>;
  if (!tenant) return <div className="p-10 text-center">Negocio no encontrado 🌮</div>;

  const tacos = menu.filter(p => p.category === 'taco' && p.active !== false);
  const bebidasExtras = menu.filter(p => (p.category === 'bebida' || p.category === 'extra') && p.active !== false);
  const salsas = menu.filter(p => p.category === 'salsa' && p.active !== false);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-32 font-sans text-zinc-900">
      {/* Uber Eats Style Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-zinc-100 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{tenant.name}</h1>
        <div className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold">15-25 min</div>
      </div>

      <div className="px-4 py-6 space-y-10">
        {/* SECCIÓN 1: TACOS Y PLATOS */}
        <section>
          <h2 className="text-2xl font-black mb-4 uppercase italic">1. Selecciona tus Tacos</h2>
          <div className="space-y-8">
            {platters.map((platter, idx) => (
              <div key={idx} className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-zinc-500 uppercase">🍽️ Plato {idx + 1}</h3>
                  {idx > 0 && (
                    <button 
                      onClick={() => setPlatters(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 text-xs font-bold"
                    >ELIMINAR</button>
                  )}
                </div>
                <div className="space-y-4">
                  {tacos.map(taco => (
                    <div key={taco.id} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                      <span className="font-bold">{taco.name}</span>
                      <div className="flex items-center gap-3 bg-zinc-100 rounded-full p-1">
                        <button onClick={() => removeFromPlatter(idx, taco.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold shadow-sm">-</button>
                        <span className="font-black w-5 text-center">{platter.items[taco.id] || 0}</span>
                        <button onClick={() => addToPlatter(idx, taco.id)} className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-full font-bold shadow-sm">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={addPlatter}
              className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-3xl text-zinc-500 font-bold hover:bg-zinc-50 transition-colors"
            >
              + AGREGAR OTRO PLATO
            </button>
          </div>
        </section>

        {/* SECCIÓN 2: BEBIDAS Y EXTRAS */}
        <section>
          <h2 className="text-2xl font-black mb-4 uppercase italic">2. Bebidas y Extras</h2>
          <div className="grid grid-cols-1 gap-4">
            {bebidasExtras.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 border border-zinc-100 rounded-2xl">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-zinc-500 text-xs">${item.price}</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-100 rounded-full p-1">
                  <button onClick={() => removeFromExtras(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold shadow-sm">-</button>
                  <span className="font-black w-5 text-center">{extras[item.id] || 0}</span>
                  <button onClick={() => addToExtras(item.id)} className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-full font-bold shadow-sm">+</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 3: SALSAS */}
        <section>
          <h2 className="text-2xl font-black mb-4 uppercase italic">3. Tus Salsas</h2>
          <div className="flex flex-wrap gap-2">
            {salsas.length > 0 ? salsas.map(salsa => (
              <button
                key={salsa.id}
                onClick={() => toggleSalsa(salsa.name)}
                className={`px-4 py-2 rounded-full font-bold border-2 transition-all ${
                  selectedSalsas.includes(salsa.name) 
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg scale-105' 
                  : 'bg-white border-zinc-200 text-zinc-400'
                }`}
              >
                {salsa.name}
              </button>
            )) : <p className="text-zinc-400 italic text-sm">Próximamente más salsas...</p>}
          </div>
        </section>
      </div>

      {/* Floating Checkout */}
      {calculateTotal() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <button 
            onClick={handleCheckout}
            className="w-full py-5 bg-zinc-900 text-white rounded-2xl shadow-2xl font-black text-lg flex justify-between px-10 items-center transform active:scale-95 transition-transform"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] opacity-60 uppercase tracking-widest">Enviar pedido</span>
              <span>TOTAL ${calculateTotal()}</span>
            </div>
            <span>ORDENAR POR WHATSAPP ➔</span>
          </button>
        </div>
      )}
    </div>
  );
}
