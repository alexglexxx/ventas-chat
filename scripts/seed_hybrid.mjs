import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "serviceAccountKey.json"), "utf8")
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedHybrid() {
  // 1. TAQUERÍA: Tacos El Güero
  const taqueriaId = "tacos-el-guero";
  await db.collection("tenants").doc(taqueriaId).set({
    name: "Tacos El Güero",
    businessType: "TAQUERIA",
    status: "active",
    whatsapp: {
      phoneNumber: "5213221070973",
      welcomeMessage: "¡Hola! 🌮 Bienvenido a Tacos El Güero."
    },
    config: {
      primaryColor: "#EAB308",
      currency: "MXN"
    }
  });

  const taqueriaMenu = [
    { name: "Taco al Pastor", price: 18, category: "taco", active: true },
    { name: "Taco de Suadero", price: 18, category: "taco", active: true },
    { name: "Coca-Cola 600ml", price: 25, category: "bebida", active: true }
  ];

  for (const item of taqueriaMenu) {
    await db.collection("tenants").doc(taqueriaId).collection("menu").add(item);
  }

  // 2. SERVICIOS: Barbería Titan
  const barberiaId = "barberia-titan";
  await db.collection("tenants").doc(barberiaId).set({
    name: "Barbería Titan",
    businessType: "SERVICIOS",
    address: "Av. Principal #123, Colonia Centro",
    status: "active",
    whatsapp: {
      phoneNumber: "5213221070973",
      welcomeMessage: "¡Hola! 💈 Bienvenido a Barbería Titan. ¿En qué podemos servirte?"
    },
    config: {
      primaryColor: "#000000",
      currency: "MXN"
    }
  });

  const barberiaServices = [
    { name: "Corte de Cabello (Degradado)", price: 250, description: "Corte profesional con terminación en navaja (45 min)", active: true },
    { name: "Perfilado de Barba", price: 150, description: "Diseño y recorte de barba con toalla caliente (30 min)", active: true },
    { name: "Combo Titan", price: 350, description: "Corte + Barba + Masaje capilar (75 min)", active: true }
  ];

  for (const service of barberiaServices) {
    await db.collection("tenants").doc(barberiaId).collection("menu").add(service);
  }

  console.log("✅ Seed Híbrido completado: Tacos El Güero (TAQUERIA) y Barbería Titan (SERVICIOS) listos.");
}

seedHybrid().catch(console.error);
