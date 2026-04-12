const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const https = require("https");

admin.initializeApp();
}
const db = getFirestore();

// --- FUNCIÓN UNIVERSAL PARA ENVIAR WHATSAPP ---
function enviarWA(to, texto, phoneId, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: texto }
    });
    const options = {
      hostname: "graph.facebook.com",
      path: `/v18.0/${phoneId}/messages`,
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      }
    };
    const reqWA = https.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => resolve());
    });
    reqWA.on("error", () => resolve());
    reqWA.write(data);
    reqWA.end();
  });
}

// --- WEBHOOK PRINCIPAL MULTI-TENANT ---
exports.webhook = onRequest({ cors: true }, async (req, res) => {
  // Verificación de Meta (Webhooks)
  if (req.method === "GET") {
    if (req.query["hub.verify_token"] === "Alex123") {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(400);
  }

  if (req.method === "POST") {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    const metadata = value?.metadata; // Contiene el PHONE_ID de destino

    if (!msg || !metadata) return res.sendStatus(200);

    const from = msg.from;
    const businessPhoneId = metadata.phone_number_id;
    let payload = "";

    if (msg.type === "text") {
      payload = msg.text.body.trim().toLowerCase();
    }

    try {
      // 1. BUSCAR AL NEGOCIO (TENANT) POR SU PHONE_ID
      const tenantsRef = db.collection("tenants");
      const snapshot = await tenantsRef.where("whatsapp.phoneId", "==", businessPhoneId).get();

      if (snapshot.empty) {
        console.log("❌ Negocio no registrado para PhoneID:", businessPhoneId);
        return res.sendStatus(200);
      }

      const tenantDoc = snapshot.docs[0];
      const tenant = tenantDoc.data();
      const tenantId = tenantDoc.id;

      // 2. LÓGICA DE FILTRO INTELIGENTE (ANTI-BASURA)
      const palabrasBasura = ["hola", "precio", "menu", "está abierto", "ubica", "donde estan", "buenas", "que tiene", "tacos"];
      const esBasura = palabrasBasura.some(p => payload.includes(p));

      if (esBasura || payload === "") {
        const mensajeRespuesta = `${tenant.whatsapp.welcomeMessage}\n\n👉 ${tenant.whatsapp.webUrl}`;
        await enviarWA(from, mensajeRespuesta, tenant.whatsapp.phoneId, tenant.whatsapp.token);
      } else {
        // Aquí podrías añadir lógica para detectar si es un comprobante de pago o algo más.
        console.log(`📩 Mensaje de ${from} para ${tenant.name}: ${payload}`);
      }

    } catch (error) {
      console.error("❌ Error en el Webhook SaaS:", error);
    }

    return res.sendStatus(200);
  }

  return res.sendStatus(404);
});
