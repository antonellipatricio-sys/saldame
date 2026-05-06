# 🦆 Cuack Cuentas Claras

App de **control financiero personal** con clasificación automática por IA. Registrá, importá y analizá tus gastos desde múltiples fuentes.

> **Módulo adicional**: [Gastos Compartidos](./docs/gastos-compartidos/INDICE.md) — dividí gastos en grupo sin login (tipo Splitwise).

## ✨ Características

- 📊 **Dashboard** con resumen mensual y comparativa mes a mes
- ➕ **Agregar gastos** manualmente con auto-clasificación por IA
- 📄 **Importar PDFs** de resúmenes de TC (Banco Nación, Mercado Pago)
- 📊 **Importar Excel** de Santander (.xlsx)
- 📋 **Historial completo** con filtros por categoría, etiqueta, mes y moneda
- 📈 **Estadísticas** con gráficos por categoría
- 💬 **Consultas en lenguaje natural** vía Gemini ("¿Cuánto gasté en comida este mes?")
- 💳 **Estado de cuenta** agrupado por tarjeta
- 👥 **Gastos Compartidos** — módulo público sin login
- 💱 Soporte para **ARS y USD**
- 📱 **Diseño responsive** (mobile y desktop) — PWA instalable

## 🚀 Instalación

1. Instalar dependencias
```bash
npm install
```

2. Configurar variables de entorno

Crear archivo `.env.local` en la raíz con:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id

VITE_GEMINI_API_KEY=tu_gemini_api_key
```

3. Iniciar en desarrollo
```bash
npm run dev
```

## 🔧 Tecnologías

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** TailwindCSS v4 (Design System "Pato Contador")
- **Base de datos:** Firebase Firestore
- **IA:** Google Gemini 2.0 Flash
- **Estado:** Zustand
- **Parseo:** pdfjs-dist (PDF) + xlsx/SheetJS (Excel)
- **Íconos:** Lucide React

## 📦 Scripts

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar linter
```

## 🎨 Categorías Predefinidas (13)

🍔 Comida · 🚗 Transporte · 🛒 Supermercado · 💊 Salud · 🎬 Entretenimiento · 👕 Ropa · 🏠 Hogar · ✈️ Viajes · 💼 Trabajo · 🎓 Educación · 🐾 Mascotas · 📱 Tecnología · ❓ Otros

## 🤖 IA — Clasificación Automática

- **Clasificador local**: +500 palabras clave argentinas con aprendizaje continuo en `localStorage`
- **Gemini 2.0 Flash**: fallback para descripciones ambiguas + consultas en lenguaje natural

## 📚 Documentación

- [`CLAUDE.md`](./CLAUDE.md) — contexto rápido para IA
- [`docs/index.md`](./docs/index.md) — arquitectura completa
- [`docs/gastos-compartidos/`](./docs/gastos-compartidos/INDICE.md) — módulo Gastos Compartidos

## 🔐 Configuración Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activar **Firestore Database**
3. Activar **Cloud Storage**
4. Registrar app web y copiar credenciales al `.env.local`

## 🧪 Estado del Proyecto

✅ Implementado:
- Layout responsive + PWA instalable
- Dashboard con comparativa mes a mes
- Agregar gastos con auto-clasificación IA
- Importar PDF (Banco Nación, Mercado Pago) y Excel (Santander)
- Historial de gastos con filtros
- Estadísticas y gráficos por categoría
- Estado de cuenta por tarjeta
- Consultas en lenguaje natural (Gemini)
- Gastos Compartidos (módulo público, tiempo real)
- Exportar a Excel y PDF
- Design System "Pato Contador" (morado/verde)
