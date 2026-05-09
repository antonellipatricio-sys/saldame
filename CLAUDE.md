# Cuack — Contexto para IA

> Archivo de contexto rápido. Léelo antes de trabajar en este repositorio.

---

## Qué es este proyecto

Este repositorio contiene **dos productos independientes** que comparten la misma base de código:

### 1. 🦆 Cuack Cuentas Claras (app principal — privada)
App de **control financiero personal** con PIN de acceso.

- **URL**: `https://cuack.com.ar` (o `saldame.web.app`)
- **Rutas**: todo excepto `/gastos/*`
- **Acceso**: requiere autenticación Google (solo `antonellipatricio@gmail.com`)
- **Stack**: React 18 + TypeScript + Vite + Firebase Firestore + Zustand + TailwindCSS v4

Funcionalidades:
- Registrar gastos (manual, PDF de TC, Excel Santander)
- Clasificación automática con IA (Gemini 2.0 Flash + clasificador local con 500+ palabras clave)
- Dashboard, historial, estadísticas, consultas en lenguaje natural
- Estado de cuenta por tarjeta

### 2. 👥 Gastos Compartidos (módulo público — independiente)
Herramienta para dividir gastos en grupo **sin login**.

- **URL**: `/gastos` y `/gastos/[id]`
- **Acceso**: público (sin PIN)
- **Equivalente a**: Splitwise sin autenticación
- **Docs**: [`docs/gastos-compartidos/`](./docs/gastos-compartidos/INDICE.md)

Funcionalidades:
- Crear eventos colaborativos con URL única
- Registrar quién pagó qué y quién participó
- Algoritmo greedy para minimizar transferencias
- Exportar a PDF y WhatsApp
- Sincronización en tiempo real (Firebase)

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Estado Global | Zustand + persist middleware |
| Base de Datos | Firebase Firestore (BD: `saldame`) |
| IA | Gemini 2.0 Flash |
| Parseo PDF | pdfjs-dist |
| Parseo Excel | xlsx (SheetJS) |
| Estilos | TailwindCSS v4 + `@theme` (Design System "Pato Contador") |
| Íconos | Lucide React |
| Fechas | date-fns (locale `es`) |

---

## Archivos Clave

```
src/
├── App.tsx                    # Enrutador principal + auth Google (email whitelist via VITE_ALLOWED_EMAIL)
├── types/index.ts             # Tipos globales: Expense, Category, Tag
├── store/
│   ├── useExpenseStore.ts     # Store Zustand: gastos, categorías, etiquetas
│   └── useAppStore.ts         # Store: calculadora, productos
├── lib/
│   ├── firebase.ts            # Inicialización Firebase
│   ├── classifier.ts          # Clasificador local (500+ keywords, aprendizaje)
│   ├── gemini.ts              # Gemini API: clasificación + consultas naturales
│   ├── pdfParser.ts           # Parser PDFs Banco Nación/VISA/MC
│   ├── mercadoPagoParser.ts   # Parser PDFs Mercado Pago
│   ├── santanderParser.ts     # Parser Excel Santander (.xlsx)
│   └── pdfGenerator.ts        # Generador PDF (Gastos Compartidos)
└── pages/
    ├── DashboardPage.tsx       # Inicio / resumen del mes
    ├── AddExpensePage.tsx      # Agregar gasto manual (solo formulario completo; incluye ResponsableSelect)
    ├── ExpensesListPage.tsx    # Mis gastos (historial + filtros)
    ├── UploadPDFPage.tsx       # Importar PDF de TC
    ├── UploadSantanderPage.tsx # Importar Excel Santander
    ├── StatsPage.tsx           # Estadísticas y gráficos
    ├── CategoriesPage.tsx      # CRUD categorías
    ├── TagsPage.tsx            # CRUD etiquetas
    ├── QueryPage.tsx           # Consultas IA en lenguaje natural
    ├── SharedExpensesDashboard.tsx  # Dashboard Gastos Compartidos (/gastos)
    └── SharedExpensesPage.tsx       # Sala de evento (/gastos/[id])
```

---

## Modelo de Datos Principal (`Expense`)

```typescript
{
  id: string
  description: string        // Ej: "CARREFOUR"
  amount: number
  currency: "ARS" | "USD"
  category: string           // Nombre de la categoría
  date: Date
  tags?: string[]            // Etiquetas opcionales
  notes?: string
  cardLast4?: string         // Últimos 4 dígitos de tarjeta
  cardholder?: string        // Titular de tarjeta
  source?: "manual" | "pdf" | "excel" | "shared"
  createdAt: Date
  updatedAt: Date
}
```

---

## Persistencia

| Dato | Dónde |
|---|---|
| Gastos | Firestore — colección `expenses` |
| Eventos compartidos | Firestore — colección `sharedGroups` |
| Categorías y Etiquetas | `localStorage` (Zustand persist — `expense-storage`) |
| Aprendizaje del clasificador | `localStorage` (`expense-learned-categories`) |
| Aprendizaje de etiquetas | `localStorage` (`expense-learned-tags`) |

---

## Design System — Pato Contador

| Token | Color | Uso |
|---|---|---|
| `brand-primary` | `#7D52B5` | Morado: sidebar activa, títulos |
| `brand-success` | `#2D9354` | Verde: CTAs, montos positivos |
| `brand-alert` | `#E5709B` | Rosa: errores, borrar |
| `brand-bg` | `#F2F2F2` | Fondo general |

Definidos en `src/index.css` dentro de `@theme {}` (Tailwind v4).

---

## Documentación Completa

| Doc | Contenido |
|---|---|
| [`docs/index.md`](./docs/index.md) | Arquitectura completa de Cuack |
| [`docs/modulos-financieros/INDICE.md`](./docs/modulos-financieros/INDICE.md) | Overview del módulo financiero |
| [`docs/gastos-compartidos/INDICE.md`](./docs/gastos-compartidos/INDICE.md) | Módulo Gastos Compartidos |
| [`docs/herramientas/INDICE.md`](./docs/herramientas/INDICE.md) | Calculadora, Configuración |
| [`docs/navegacion.md`](./docs/navegacion.md) | Layouts y navegación |
| [`docs/estado.md`](./docs/estado.md) | Zustand stores |
| [`docs/componentes.md`](./docs/componentes.md) | Componentes reutilizables |

---

## Variables de Entorno (`.env.local`)

| Variable | Descripción |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_GEMINI_API_KEY` | Gemini API Key |
| `VITE_ALLOWED_EMAIL` | Email único con acceso a la app privada (ej: `antonellipatricio@gmail.com`) |

---

## Autenticación

La app usa **Firebase Auth con Google**. El acceso está restringido en `App.tsx`: si el email del usuario autenticado no coincide con `VITE_ALLOWED_EMAIL`, se hace `signOut` automáticamente y se muestra un error. Si la variable está vacía, cualquier cuenta puede acceder.

---

## Comandos

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run lint     # Linter
```
