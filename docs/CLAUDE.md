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
- **Docs**: [`gastos-compartidos-indice.md`](./gastos-compartidos-indice.md)

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

Todos los docs están en `docs/` (mismo nivel que este archivo).

### Arquitectura general

| Doc | Contenido |
|---|---|
| [`index.md`](./index.md) | Arquitectura completa del proyecto, árbol de src/, rutas |
| [`navegacion.md`](./navegacion.md) | Layouts, AppLayout, sidebar, rutas protegidas |
| [`estado.md`](./estado.md) | Zustand stores: useExpenseStore, useAppStore |
| [`componentes.md`](./componentes.md) | Componentes reutilizables (CategorySelect, AmountInput, etc.) |

### Módulos Financieros

| Doc | Contenido |
|---|---|
| [`modulos-financieros-indice.md`](./modulos-financieros-indice.md) | Overview del módulo financiero completo |

#### Registro de gastos

| Doc | Contenido |
|---|---|
| [`registro-indice.md`](./registro-indice.md) | Índice: los 3 canales de carga |
| [`agregar-gasto.md`](./agregar-gasto.md) | Formulario manual (AddExpensePage) |
| [`subir-pdf.md`](./subir-pdf.md) | Importar PDF de TC Banco Nación / Mercado Pago |
| [`santander-excel.md`](./santander-excel.md) | Importar Excel Santander (resumen TC) |

#### Consultas

| Doc | Contenido |
|---|---|
| [`consultas-indice.md`](./consultas-indice.md) | Índice: las 4 vistas de consulta |
| [`inicio.md`](./inicio.md) | Dashboard (DashboardPage) — resumen del mes |
| [`mis-gastos.md`](./mis-gastos.md) | Historial con filtros (ExpensesListPage) |
| [`estadisticas.md`](./estadisticas.md) | Estadísticas y gráficos (StatsPage) |
| [`estado-de-cuenta.md`](./estado-de-cuenta.md) | Consultas IA en lenguaje natural (QueryPage / Gemini) |

#### Configuración

| Doc | Contenido |
|---|---|
| [`configuracion-indice.md`](./configuracion-indice.md) | Índice: categorías, etiquetas, responsables |
| [`categorias.md`](./categorias.md) | CRUD de categorías, 13 categorías por defecto |
| [`etiquetas.md`](./etiquetas.md) | CRUD de etiquetas, diferencia con categorías |
| [`responsables.md`](./responsables.md) | Gestión de responsables (titulares de tarjeta) |

### Gastos Compartidos

| Doc | Contenido |
|---|---|
| [`gastos-compartidos-indice.md`](./gastos-compartidos-indice.md) | Índice del módulo público |
| [`gastos-compartidos.md`](./gastos-compartidos.md) | Sala de evento, algoritmo greedy, export PDF/WhatsApp |

### Herramientas

| Doc | Contenido |
|---|---|
| [`herramientas-indice.md`](./herramientas-indice.md) | Índice: calculadora y configuración |
| [`calculadora.md`](./calculadora.md) | Calculadora de precios con costos históricos |
| [`configuracion.md`](./configuracion.md) | Página de configuración (SettingsPage) |

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
