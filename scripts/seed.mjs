import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");
const { readFileSync } = require('fs');
const { join, dirname } = require('path');
const { fileURLToPath } = require('url');

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

// Fix common formatting issues in the private key
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const __dirname = dirname(fileURLToPath(import.meta.url));
const menuData = JSON.parse(readFileSync(join(__dirname, '../data/menu.json'), 'utf8'));

async function seed() {
  const businessId = 'tacos-el-guero';
  console.log(`🚀 Iniciando carga para: ${menuData.business.name}...`);

  const businessRef = db.collection('tenants').doc(businessId);
  
  await businessRef.set({
    name: menuData.business.name,
    whatsapp: {
      phoneNumber: menuData.business.whatsapp,
      welcomeMessage: menuData.business.description
    },
    config: { primaryColor: '#000000', currency: 'MXN' }
  });

  const menuRef = businessRef.collection('menu');
  
  // Limpiar antes de cargar
  const snapshot = await menuRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  for (const category of menuData.categories) {
    for (const item of category.items) {
      await menuRef.add({
        name: item.name,
        price: item.price,
        description: item.description,
        category: category.name,
        active: true
      });
    }
  }
  console.log('✅ ¡MENÚ CARGADO EXITOSAMENTE! Ya puedes verlo en tu iPhone.');
}

seed().catch(console.error);
