"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  doc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  active: boolean;
}

export default function AdminPage() {
  const { businessId } = useParams();
  const [menu, setMenu] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nuevo producto
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    active: true
  });

  useEffect(() => {
    if (!businessId) return;

    const menuRef = collection(db, "tenants", businessId as string, "menu");
    const unsubscribe = onSnapshot(menuRef, (snapshot) => {
      const menuData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Product[];
      setMenu(menuData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;

    try {
      const menuRef = collection(db, "tenants", businessId as string, "menu");
      await addDoc(menuRef, {
        ...newProduct,
        price: Number(newProduct.price)
      });
      setNewProduct({ name: "", price: "", category: "", description: "", active: true });
      setShowForm(false);
    } catch (error) {
      console.error("Error añadiendo producto:", error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const productRef = doc(db, "tenants", businessId as string, "menu", id);
    await updateDoc(productRef, { active: !currentStatus });
  };

  const deleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const productRef = doc(db, "tenants", businessId as string, "menu", id);
      await deleteDoc(productRef);
    }
  };

  if (loading) return <div className="p-10 text-center font-sans">Cargando panel de control...</div>;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white p-6 font-sans text-black">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Panel: {businessId}</h1>
          <p className="text-zinc-500 text-sm">Gestiona tu menú en tiempo real</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-black text-white px-4 py-2 rounded-full font-bold text-sm hover:opacity-80 transition-all"
        >
          {showForm ? "Cerrar" : "+ Nuevo"}
        </button>
      </header>

      {/* Formulario para Nuevo Producto */}
      {showForm && (
        <form onSubmit={handleAddProduct} className="mb-10 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-4">
          <h2 className="font-bold text-lg mb-2 italic">Añadir plato nuevo</h2>
          <div className="grid grid-cols-1 gap-4">
            <input 
              type="text" placeholder="Nombre (ej: Taco de Pastor)"
              className="w-full p-3 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-black"
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            />
            <div className="flex gap-4">
              <input 
                type="number" placeholder="Precio ($)"
                className="w-1/2 p-3 rounded-xl border border-zinc-200 outline-none"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
              />
              <input 
                type="text" placeholder="Categoría"
                className="w-1/2 p-3 rounded-xl border border-zinc-200 outline-none"
                value={newProduct.category}
                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="Descripción corta"
              className="w-full p-3 rounded-xl border border-zinc-200 outline-none h-24"
              value={newProduct.description}
              onChange={e => setNewProduct({...newProduct, description: e.target.value})}
            ></textarea>
            <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest">
              Guardar en el Menú
            </button>
          </div>
        </form>
      )}

      {/* Lista de Productos */}
      <div className="space-y-4">
        <h2 className="font-bold text-xl mb-4 italic">Tu Menú Actual</h2>
        {menu.length === 0 && <p className="text-zinc-400 italic">No hay productos. ¡Agrega el primero!</p>}
        {menu.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${product.active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <h3 className="font-bold text-lg">{product.name}</h3>
              </div>
              <p className="text-zinc-500 text-sm">{product.category} • ${product.price}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleStatus(product.id, product.active !== false)}
                className="p-2 text-xs font-bold uppercase border rounded-lg hover:bg-black hover:text-white transition-all"
              >
                {product.active !== false ? "Ocultar" : "Mostrar"}
              </button>
              <button 
                onClick={() => deleteProduct(product.id)}
                className="p-2 text-xs font-bold uppercase text-red-500 border border-red-100 rounded-lg hover:bg-red-50"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-12 pt-8 border-t text-center">
        <a 
          href={`/${businessId}`} 
          className="text-zinc-400 text-sm font-medium hover:text-black underline underline-offset-4"
        >
          ← Ver Menú Público
        </a>
      </footer>
    </div>
  );
}
