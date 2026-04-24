# Mis Gastos 💰

App de control de gastos personales con IA para clasificación automática.

## ✨ Características

- 📊 **Dashboard** con resumen mensual
- ➕ **Agregar gastos** manualmente con sugerencias de IA
- 📄 **Subir PDFs** de resúmenes de tarjeta (próximamente)
- 📋 **Lista completa** de gastos con filtros
- 📈 **Estadísticas** y análisis
- 💱 Soporte para **ARS y USD**
- 📱 **Diseño responsive** (mobile y desktop)

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

- **Frontend:** React + TypeScript + Vite
- **Estilos:** TailwindCSS
- **Base de datos:** Firebase Firestore
- **Storage:** Firebase Storage
- **IA:** Google Gemini
- **Estado:** Zustand
- **Íconos:** Lucide React

## 📦 Scripts

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar linter
```

## 🎨 Categorías Predefinidas

- 🍔 Comida y Restaurantes
- 🚗 Transporte
- 🛒 Supermercado
- 💊 Salud
- 🎬 Entretenimiento
- 👕 Ropa
- 🏠 Hogar y Servicios
- ✈️ Viajes
- 💼 Trabajo
- ❓ Otros

## 🤖 IA - Clasificación Automática

La app usa Google Gemini para sugerir automáticamente la categoría al escribir la descripción del gasto.

## 🔐 Configuración Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activar **Firestore Database**
3. Activar **Cloud Storage**
4. Registrar app web y copiar credenciales al `.env.local`

## 🧪 Estado del Proyecto

✅ Implementado:
- Layout responsive
- Dashboard con resumen
- Agregar gastos con IA
- Lista de gastos con filtros
- Estadísticas básicas
- Persistencia en Firebase

🚧 En desarrollo:
- Parseo de PDFs de tarjetas
- Gráficos avanzados
- Exportar a Excel
- Edición de gastos

