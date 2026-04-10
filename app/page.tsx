import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black font-sans p-6 text-center">
      <main className="max-w-2xl">
        <h1 className="text-5xl font-black tracking-tighter mb-4 text-black dark:text-white">
          ventas-chat <span className="text-zinc-400">SaaS</span>
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 leading-relaxed">
          La plataforma que conecta tus ventas de WhatsApp con un menú digital inteligente para vendedores de comida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/tacos-el-guero"
            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:opacity-80 transition-all"
          >
            Ver Demo: Tacos El Güero
          </Link>
          <a 
            href="https://wa.me/5213221070973" 
            target="_blank"
            className="px-8 py-4 border border-zinc-200 dark:border-zinc-800 font-bold rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Hablar con Soporte
          </a>
        </div>
      </main>
      
      <footer className="mt-24 text-zinc-400 text-sm">
        <p>© 2026 Ventas-Chat - Soluciones para el comercio callejero.</p>
      </footer>
    </div>
  );
}
