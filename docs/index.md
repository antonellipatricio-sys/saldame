# Cuack Cuentas Claras — Documentación Completa

> **Aplicación de control financiero personal** construida con React + Vite + TypeScript + Firebase (Firestore) + Zustand.  
> Permite registrar, clasificar, importar y analizar gastos personales desde múltiples fuentes (manual, PDFs de tarjetas, Excel de Santander).

---

## Visión del Proyecto

El objetivo final es una app que **aprenda automáticamente** a clasificar cada gasto y permita hacer **consultas de estado de cuenta** de forma natural:

1. **Auto-clasificación inteligente**: Al subir un PDF o Excel, el sistema ya debe saber a qué categoría y etiqueta asignar cada gasto. El usuario solo revisa y aprueba.
2. **Consultas de cuenta**: Poder preguntar "¿Cuánto debo de la Visa terminada en 1204?" o "¿Cuánto gasté en Supermercado este mes?" y obtener respuesta inmediata.
3. **Aprendizaje continuo**: Cada corrección manual que el usuario hace retroalimenta al clasificador para que la próxima vez acierte solo.

---

## Arquitectura General

```
src/
├── App.tsx                         # Enrutador principal (estado local de página activa)
├── main.tsx                        # Entry point de Vite + React
├── types/index.ts                  # Tipos globales: Expense, Category, Tag, Currency
├── store/
│   ├── useExpenseStore.ts          # Store Zustand para gastos, categorías y etiquetas (Firebase)
│   └── useAppStore.ts              # Store Zustand para productos/calculadora (persistido local)
├── lib/
│   ├── firebase.ts                 # Inicialización Firebase (Firestore 'saldame', Storage)
│   ├── classifier.ts               # Clasificador local por palabras clave + aprendizaje (categorías + etiquetas)
│   ├── gemini.ts                   # Clasificación vía Gemini API + Consultas en lenguaje natural
│   ├── pdfParser.ts                # Parser de resúmenes de TC en PDF (Banco Nación/VISA/MC)
│   ├── mercadoPagoParser.ts        # Parser de resúmenes de Mercado Pago en PDF
│   ├── santanderParser.ts          # Parser de Excel de Santander (.xlsx)
│   ├── categories.ts               # Categorías por defecto (13 categorías)
│   ├── exportExcel.ts              # Exportar gastos filtrados a .xlsx
│   └── utils.ts                    # Utilidades (cn para clases)
├── components/
│   ├── layout/
│   │   ├── ExpenseLayout.tsx       # Layout principal: Sidebar (desktop) + Hamburger Menu (mobile)
│   │   └── AppLayout.tsx           # Layout secundario: Tabs superiores (Calculadora/Ninox)
│   ├── tags/
│   │   └── TagSelector.tsx         # Componente picker de etiquetas (chips + dropdown)
│   ├── calculator/
│   │   ├── CalculatorTable.tsx     # Tabla de cálculo de productos
│   │   └── CalculatorHeader.tsx    # Header de la calculadora
│   └── upload/
│       └── FileUploader.tsx        # Componente reutilizable de carga de archivos
└── pages/
    ├── DashboardPage.tsx           # Vista resumen del mes: totales ARS/USD, últimos gastos
    ├── AddExpensePage.tsx           # Formulario de carga manual (rápido + completo)
    ├── ExpensesListPage.tsx         # Lista histórica con filtros por categoría/etiqueta/mes/moneda
    ├── UploadPDFPage.tsx           # Importar desde PDF de resumen de TC
    ├── UploadSantanderPage.tsx     # Importar desde Excel de Santander
    ├── StatsPage.tsx               # Estadísticas: Top categorías + Top etiquetas
    ├── CategoriesPage.tsx          # CRUD de categorías (ícono + color)
    ├── TagsPage.tsx                # CRUD de etiquetas (nombre + color)
    ├── CalculatorPage.tsx          # Wrapper de la herramienta calculadora
    ├── NinoxUploadPage.tsx         # Sincronización con Ninox
    ├── DollarUploadPage.tsx        # Variación de dólar para re-costeo
    ├── SettingsPage.tsx            # Configuraciones generales
    └── QueryPage.tsx               # Consultas en lenguaje natural con Gemini
```

---

## Módulos y Guías Detalladas

### Navegación y Layout
- [Layouts y Navegación](./navegacion.md) — Sidebar, Header, Bottom Nav, enrutamiento

### Páginas (una guía por módulo)
- [Dashboard (Inicio)](./pages/inicio.md)
- [Agregar Gasto](./pages/agregar-gasto.md)
- [Mis Gastos (Lista)](./pages/mis-gastos.md)
- [Subir PDF](./pages/subir-pdf.md)
- [Santander Excel](./pages/santander-excel.md)
- [Estadísticas](./pages/estadisticas.md)
- [Categorías](./pages/categorias.md)
- [Etiquetas](./pages/etiquetas.md)
- [Gastos Compartidos](./pages/gastos-compartidos.md)
- [Calculadora](./pages/calculadora.md)
- [Carga Costos Ninox](./pages/carga-ninox.md)
- [Variación Dólar](./pages/variacion-dolar.md)
- [Configuración](./pages/configuracion.md)

### Infraestructura
- [Componentes Reusables](./componentes.md) — TagSelector, FileUploader, Calculator
- [Gestión de Estado (Store)](./estado.md) — useExpenseStore, useAppStore

---

## Modelo de Datos

### `Expense` (Gasto)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | ID auto-generado (Firestore) |
| `description` | `string` | Descripción del gasto (ej: "CARREFOUR") |
| `amount` | `number` | Monto numérico |
| `currency` | `'ARS' \| 'USD'` | Moneda |
| `category` | `string` | Nombre de la categoría asignada |
| `tags` | `string[]` | Nombres de etiquetas asignadas (opcional) |
| `date` | `Date` | Fecha del gasto |
| `notes` | `string` | Notas adicionales (opcional) |
| `createdAt` | `Date` | Fecha de creación del registro |
| `updatedAt` | `Date` | Última modificación |

### `Category` (Categoría)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | ID único |
| `name` | `string` | Nombre (ej: "Supermercado") |
| `icon` | `string` | Emoji (ej: "🛒") |
| `color` | `string` | Color hex (ej: "#45B7D1") |

### `Tag` (Etiqueta)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | ID único |
| `name` | `string` | Nombre (ej: "Gastos Fijos") |
| `color` | `string` | Clases Tailwind (ej: "bg-blue-100 text-blue-700") |

### Categorías por Defecto (13)
🍔 Comida y Restaurantes · 🚗 Transporte · 🛒 Supermercado · 💊 Salud · 🎬 Entretenimiento · 👕 Ropa · 🏠 Hogar y Servicios · ✈️ Viajes · 💼 Trabajo · 🎓 Educación · 🐾 Mascotas · 📱 Tecnología · ❓ Otros

---

## Sistema de Clasificación Automática

### `classifier.ts` — Motor Local (instantáneo, sin API)
- **+500 palabras clave** organizadas en 12 categorías argentinas
- **Aprendizaje persistente** en `localStorage` (`expense-learned-categories`)
- Cuando el usuario corrige una categoría, se guarda la asociación `descripción → categoría` y la próxima vez se aplica automáticamente con confianza `high`
- Flujo: `classifyLocal(descripción)` → `{ category, confidence: 'high'|'medium'|'low', matchedKeyword }`

### `gemini.ts` — Clasificación con IA (fallback)
- Usa Gemini 2.0 Flash para clasificar descripciones ambiguas
- Valida que la respuesta sea una categoría existente

### Flujo de Clasificación en `AddExpensePage`
1. El usuario escribe la descripción del gasto
2. `classifyLocal()` evalúa en tiempo real
3. Si confianza es `high` → se asigna automáticamente
4. Si es `medium/low` → se muestra como sugerencia visual
5. Al guardar, `learnCategory()` y `learnTags()` persisten la corrección

---

## Parsers de Importación

### `pdfParser.ts` — Resúmenes de Tarjeta de Crédito (PDF)
- Soporta formato Banco Nación / VISA / Mastercard
- Extrae texto con `pdfjs-dist`, reconstruyendo líneas por coordenada Y+X
- Parsea fechas argentinas ("26 Marzo", "DD/MM/YY")
- Parsea montos argentinos ("1.234,56" → 1234.56)
- Detecta moneda ARS vs USD
- Filtra líneas de cabecera, totales y datos no transaccionales
- Deduplica resultados

### `mercadoPagoParser.ts` — Resúmenes de Mercado Pago (PDF)
- Auto-detección: si el texto contiene "mercado pago" + "resumen de [mes]"
- Parsea la sección "Consumos" (ignora "Composición del saldo", pagos, impuestos, etc.)
- Fechas cortas: "DD/mes" (ene, feb, mar...) con inferencia automática del año
- Parsea montos en formato "$ 71.075,33" y "US$ 3,19"
- Extrae cuotas: "5 de 6", "1 de 9"
- Ignora: pagos de tarjeta, saldos anteriores, devoluciones (montos negativos)

> **Detección automática:** `UploadPDFPage` detecta el formato del PDF al procesarlo y usa el parser correcto sin intervención del usuario.

### `santanderParser.ts` — Excel de Santander (.xlsx)
- Lee con `xlsx` librería
- Detecta secciones por tarjeta: "Tarjeta de [Nombre] terminada en XXXX"
- Distingue titular vs adicionales
- Parsea columnas: Fecha | Descripción | Cuotas | Comprobante | Pesos | Dólares
- Detecta devoluciones (montos negativos)
- Guarda: `cardholder`, `cardLast4`, `isAdditional`, `isRefund`

---

## Persistencia

| Dato | Dónde | Clave |
|---|---|---|
| Gastos (expenses) | Firebase Firestore | Colección `expenses` en BD `saldame` |
| Categorías y Etiquetas | `localStorage` (Zustand persist) | `expense-storage` |
| Productos / Calculadora | `localStorage` (Zustand persist) | `saldame-app-storage` |
| Aprendizaje del clasificador | `localStorage` | `expense-learned-categories` |
| Aprendizaje de etiquetas | `localStorage` | `expense-learned-tags` |

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Estado Global | Zustand + persist middleware |
| Base de Datos | Firebase Firestore (BD: `saldame`) |
| Storage | Firebase Storage |
| IA | Gemini 2.0 Flash (API Key) |
| Parseo PDF | pdfjs-dist |
| Generación PDF | jspdf + jspdf-autotable |
| Parseo Excel | xlsx (SheetJS) |
| Estilos | TailwindCSS v4 + `@theme` (Design System custom) |
| Íconos | Lucide React |
| Fechas | date-fns (locale `es`) |
| Exportación | xlsx (SheetJS) |
| Logo | `public/logopato.png` (PNG transparente, generado con `@imgly/background-removal-node`) |

---

## Design System — Pato Contador Theme

La identidad visual de la app se basa en el personaje **"Pato Contador"** (morado con visera verde, billetes y calculadora).

### Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `brand-primary` | `#7D52B5` | Morado principal: títulos, sidebar activa, iconos |
| `brand-success` | `#2D9354` | Verde: CTAs, montos, valores positivos |
| `brand-secondary` | `#9082C9` | Lila: botones secundarios, soporte |
| `brand-alert` | `#E5709B` | Rosa: alertas, categorías en $0, ícono de borrar |
| `brand-bg` | `#F2F2F2` | Fondo neutro general |
| `brand-text` | `#B2A4D4` | Texto suave de apoyo, subtítulos |
| `brand-light` | `#D1D5B8` | Detalles de leyenda beige |

Definidos en `src/index.css` dentro del bloque `@theme {}` (Tailwind v4).

### Logo y Banners
- **Logo Principal:** `public/logopato.png` (PNG transparente). Aparece en sidebar, login y headers.
- **Banner Gastos:** `public/banner-gastos.png`. Cabecera responsiva para el módulo de Juntadas.
  - *Optimización:* Usa `object-contain` en móviles y cache-busting con `?v=2` para asegurar que los cambios se vean instantáneamente.
- **Principios de UX:**
  - **Alta Legibilidad:** Uso de `font-bold` en etiquetas, contrastes altos (`slate-700` sobre `slate-50`) e inputs resaltados para campos clave.
  - **Feedback Visual:** Micro-interacciones (hover, scale, traslación) en botones y elementos interactivos para una sensación premium.
  - **Identidad:** Uso de píldoras y badges con los colores de la marca para destacar roles (ej: pagadores en gastos compartidos).

---


## Roadmap

### Fase 1: Consultas de Estado de Cuenta ✅
- [x] Campo `cardLast4` en `Expense` para filtrar por tarjeta
- [x] Vista "Estado de Cuenta" que agrupa gastos por tarjeta
- [x] Saldo/deuda por tarjeta y por período

### Fase 2: Mejora de Auto-clasificación ✅
- [x] Auto-clasificación de categorías y etiquetas al importar PDF/Santander
- [x] Sistema de aprendizaje de etiquetas (`learnTags` / `classifyTags`)
- [x] TagSelector en revisión de importación PDF y Santander

### Fase 3: Consultas en Lenguaje Natural ✅
- [x] `queryExpenses()` en `gemini.ts` — Gemini interpreta preguntas → filtra → responde
- [x] `QueryPage.tsx` — interfaz de chat con preguntas de ejemplo

### Fase 4: Gestión de Resúmenes ✅
- [x] `deleteExpensesByCard(cardLast4, month?)` en store — eliminación batch de Firestore
- [x] Botón 🗑️ en cada tarjeta de Estado de Cuenta + modal de confirmación

### Fase 5: Dashboard Mejorado ✅
- [x] Gráfico de barras CSS por categoría (con colores y emojis)
- [x] Comparativa mes a mes (delta % + flechas ↑↓ por categoría)

### Fase 6: Gastos Compartidos (Real-time) ✅
- [x] Nueva vista `/gastos` para gestión de eventos colaborativos.
- [x] Persistencia en Firebase Firestore (colección `sharedGroups`).
- [x] Algoritmo de minimización de deudas (Greedy logic).
- [x] Banner corporativo responsivo Pato Contador.
- [x] Exportación a PDF y Resumen para WhatsApp.
- [x] Registro de pagos con histórico y medio de pago.

### Fase 7: Exportación por Tarjeta ✅
- [x] Columnas Etiquetas, Tarjeta, Titular en Excel exportado
- [x] Botón "Exportar Excel" en detalle de tarjeta (filtra por tarjeta/período)

### Fase MercadoPago ✅
- [x] Parser `mercadoPagoParser.ts` para resúmenes PDF de Mercado Pago
- [x] Auto-detección de formato (Banco Nación vs Mercado Pago) en `UploadPDFPage`
- [x] Estilo visual diferenciado para tarjetas MP en Estado de Cuenta

### Pendientes (ideas futuras)
- [x] ✅ Rediseño UI tema "Pato Contador" (morado/verde/rosa) con Tailwind v4
- [x] ✅ Logo del pato con fondo transparente + Banners decorativos
- [ ] Optimizar el diseño UI/UX del nuevo Menú Hamburguesa en versión mobile
- [ ] Presupuestos por categoría con barra de progreso
- [ ] Cotización dólar automática + totales unificados ARS
- [ ] Reporte mensual PDF generado automáticamente
- [x] ✅ PWA Manifest e iconos para "Agregar a Inicio" (iOS/Android)
- [ ] Service Worker para soporte Offline básico
- [ ] Dark mode
- [ ] Gastos recurrentes (auto-proyección mensual)
