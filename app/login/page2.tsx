"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Por defecto los mandamos al home para que el middleware/lógica de ruta decida a dónde ir
      router.push("/"); 
    } catch (err: any) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Titan Auth</h1>
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mt-2">Acceso a Dashboards</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold text-center border border-red-100 italic">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Email</label>
            <input 
              type="email" placeholder="tu@negocio.com"
              className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-400 ml-2">Contraseña</label>
            <input 
              type="password" placeholder="••••••••"
              className="w-full p-4 rounded-2xl bg-zinc-50 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          
          <button className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-lg transform active:scale-95 transition-all mt-6">
            ENTRAR ➔
          </button>
        </form>

        <p className="text-center text-zinc-400 text-[9px] font-bold uppercase tracking-[0.2em] pt-4">
          SaaS Ecosystem Titan v1.0
        </p>
      </div>
    </div>
  );
}