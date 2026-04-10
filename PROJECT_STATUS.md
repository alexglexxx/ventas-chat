# Log de Estado del Proyecto: Ventas-Chat 🚀

Este documento detalla la arquitectura, el progreso actual y la hoja de ruta para el ecosistema de **Ventas-Chat**, una plataforma de comercio ágil optimizada para ventas por WhatsApp y entornos de bajo ancho de banda.

## 📋 Descripción del Proyecto
Ventas-Chat es una aplicación web moderna (Next.js 16 + React 19) que permite a negocios locales (Tenants) tener un menú digital interactivo y en tiempo real. Los clientes pueden seleccionar productos, armar un carrito y enviar el pedido directamente al WhatsApp del negocio, eliminando fricciones en la comunicación.

---

## 🛠️ Lo que está Creado (Estado Actual)

### 1. Frontend (Next.js 16 + Tailwind 4)
- **Páginas de Negocio Dinámicas (`/[businessId]`):** Sistema de rutas que carga automáticamente la configuración del negocio (colores, logo, nombre) y su menú desde Firestore.
- **Menú en Tiempo Real:** Los cambios en los productos (precios, stock, nombres) se reflejan instantáneamente en el cliente sin recargar la página gracias a `onSnapshot`.
- **Carrito de Compras:** Sistema persistente (en estado) para agregar/quitar productos con cálculo automático de totales.
- **Integración con WhatsApp:** Generador de mensajes con formato profesional (negritas, listas, emojis) que redirige al cliente al chat del vendedor con su pedido listo.
- **Panel de Administración (`/[businessId]/admin`):** Estructura base para que los dueños de negocios gestionen sus productos.
- **Diseño Minimalista:** Estética de alto contraste (Zinc/Negro/Blanco) optimizada para dispositivos móviles.

### 2. Backend y Base de Datos (Firebase Suite)
- **Firestore (NoSQL):**
    - Colección `tenants`: Almacena configuración del negocio y metadatos.
    - Subcolección `menu`: Almacena los productos específicos de cada negocio.
    - **Reglas de Seguridad:** Ya configuradas para permitir lectura pública del menú pero restringir la escritura.
- **Firebase Data Connect (SQL/PostgreSQL):**
    - Infraestructura creada: Servicio `ventas-chat` y base de datos `ventas-chat-fdc` en proceso de aprovisionamiento.
    - Esquema base (GQL) listo para ser personalizado para lógica de negocio relacional compleja.
- **Cloud Functions:**
    - Función `webhook` desplegada para integraciones externas.
    - Función `ssrventaschatd8518` configurada para el renderizado del lado del servidor (SSR) de Next.js.
- **Hosting:** Configurado con soporte nativo para frameworks web (Next.js).

---

## ⏳ Tareas Pendientes (Lo que hace falta)

1. **Finalizar Despliegue SSR:** Completar la creación del servicio de Cloud Run para Next.js (pendiente por timeout/errores temporales de Google Cloud).
2. **Definición de Esquema SQL Final:** Migrar el esquema de ejemplo de Data Connect (Movies) a uno real para `Users`, `Stores`, `Menus` y `Orders`.
3. **Autenticación (Firebase Auth):** Implementar el flujo de inicio de sesión para que solo los dueños de negocios puedan acceder a `/admin`.
4. **Carga de Imágenes:** Implementar Firebase Storage para permitir que los negocios suban fotos de sus platillos/productos.
5. **Dashboard de Administración Funcional:** Crear los formularios para añadir, editar y eliminar productos directamente desde la web.

---

## 💡 Sugerencias de Mejoras y Beneficios Extra

### 1. Beneficios de Negocio
- **Soporte PWA (Progressive Web App):** Hacer que el menú se pueda "instalar" en el celular del cliente como una app, permitiendo acceso offline y carga instantánea.
- **Códigos QR Generativos:** Un sistema que genere automáticamente el QR del menú para cada negocio listo para imprimir.
- **Métricas de Click:** Tracking de qué productos son los más vistos o agregados al carrito, incluso si la venta no se concreta en WhatsApp.

### 2. Mejoras Tecnológicas (IA)
- **Firebase AI Logic (Gemini):**
    - **Generador de Descripciones:** Ayudar al dueño del negocio a escribir descripciones apetitosas de sus productos a partir de solo el nombre.
    - **Categorización Automática:** Organizar el menú por categorías inteligentes analizando los nombres de los productos.
- **Optimización de Imágenes:** Compresión automática de fotos para que el menú cargue en milisegundos incluso en redes 3G.

### 3. Funcionalidades de Usuario
- **Historial de Pedidos Local:** Guardar en el `localStorage` del cliente sus pedidos anteriores para "repetir pedido" con un solo toque.
- **Estado del Negocio:** Un interruptor de "Abierto/Cerrado" en tiempo real que deshabilite el carrito cuando el negocio no esté operando.
- **Ubicación GPS:** Opción para que el cliente adjunte su ubicación de Google Maps al mensaje de WhatsApp de forma sencilla.

---
**Última actualización:** 9 de Abril, 2026.
**Estado del Deploy:** En progreso (Hosting/Functions pendientes de reintento final).
