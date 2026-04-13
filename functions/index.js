const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const https = require("https");
const fetch = require("node-fetch");

admin.initializeApp();
const db = getFirestore();

// --- FUNCIÓN PARA ENVIAR WHATSAPP ---
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

// --- WEBHOOK PRINCIPAL ---
exports.webhook = onRequest({ cors: true }, async (req, res) => {

  // 🔐 VERIFICACIÓN DE META
  if (req.method === "GET") {
    if (req.query["hub.verify_token"] === "Alex123") {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(400);
  }

  // 📩 MENSAJES ENTRANTES
  if (req.method === "POST") {

    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    const metadata = value?.metadata;

    if (!msg || !metadata) return res.sendStatus(200);

    const from = msg.from;
    const businessPhoneId = metadata.phone_number_id;

    let payload = "";
    if (msg.type === "text") {
      payload = msg.text.body.trim().toLowerCase();
    }

    try {
      // 🔍 BUSCAR TENANT
      const tenantsRef = db.collection("tenants");
      const snapshot = await tenantsRef
        .where("whatsapp.phoneId", "==", businessPhoneId)
        .get();

      if (snapshot.empty) {
        console.log("❌ Negocio no encontrado:", businessPhoneId);
        return res.sendStatus(200);
      }

      const tenantDoc = snapshot.docs[0];
      const tenant = tenantDoc.data();
      const tenantId = tenantDoc.id;

      console.log(`📩 Mensaje de ${from} para ${tenant.name}: ${payload}`);

      // 🔥 LÓGICA POR TIPO DE NEGOCIO

      // 🌮 TAQUERÍA → SOLO LINK
      if (tenant.businessType === "TAQUERIA") {

        const mensajeRespuesta = `${tenant.whatsapp.welcomeMessage}\n\n👉 ${tenant.whatsapp.webUrl}`;

        await enviarWA(
          from,
          mensajeRespuesta,
          tenant.whatsapp.phoneId,
          tenant.whatsapp.token
        );

      } 
      
      // 🧠 SERVICIOS → IA
      else {

        try {
          const respuestaIA = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `Eres un asistente del negocio ${tenant.name}. Responde como humano, ayuda a agendar citas o resolver dudas de clientes.`
                },
                {
                  role: "user",
                  content: payload
                }
              ]
            })
          });

          const data = await respuestaIA.json();
          const textoIA =
            data.choices?.[0]?.message?.content ||
            "No entendí tu mensaje.";

          await enviarWA(
            from,
            textoIA,
            tenant.whatsapp.phoneId,
            tenant.whatsapp.token
          );

        } catch (error) {
          console.error("❌ Error IA:", error);
        }

      }

    } catch (error) {
      console.error("❌ Error general webhook:", error);
    }

    return res.sendStatus(200);
  }

  return res.sendStatus(404);
});