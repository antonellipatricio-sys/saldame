# Módulo Financiero — Documentación Completa

> **Sistema de Control Financiero Personal**  
> Registro, análisis y clasificación de gastos mediante múltiples canales de importación e integración con IA.

---

## Estructura del Módulo Financiero

El módulo financiero se organiza en 4 sectores principales:

### 1. **Registro de Gastos** 
Captura y entrada de movimientos financieros desde diferentes fuentes.

- [Agregar Gasto Manual](././agregar-gasto.md) — Formulario para registrar gastos individuales
- [Importar desde PDF](././subir-pdf.md) — Parseo de resúmenes de tarjetas de crédito
- [Importar desde Santander Excel](././santander-excel.md) — Sincronización de movimientos bancarios

**Flujo**: Usuario → Captura Manual o Importación de Archivos → Clasificación → Almacenamiento

---

### 2. **Consultas y Análisis**
Visualización, búsqueda y análisis de gastos registrados.

- [Dashboard / Inicio](././inicio.md) — Resumen mensual y últimos movimientos
- [Mis Gastos](././mis-gastos.md) — Historial completo con filtros y búsqueda
- [Estadísticas](././estadisticas.md) — Análisis gráfico por categoría y período
- [Estado de Cuenta](././estado-de-cuenta.md) — Consultas en lenguaje natural con IA

**Flujo**: Datos → Query → Visualización → Insights Financieros

---

### 3. **Configuración Financiera**
Gestión de estructuras y parámetros que categorizan los gastos.

- [Categorías](././categorias.md) — CRUD de categorías personalizadas (ícono + color)
- [Etiquetas](././etiquetas.md) — CRUD de etiquetas para clasificación secundaria
- [Responsables](././responsables.md) — CRUD de responsables (personas con gastos asignados)

**Flujo**: Estructura → Categorización → Análisis Segmentado

---

### 4. **Gastos Compartidos** _(Módulo Público — Independiente)_
Sistema colaborativo para dividir gastos en grupo. **No requiere login** (rutas `/gastos/*` son públicas).

- [📖 Ver documentación completa](./gastos-compartidos-indice.md)

> Este módulo es independiente del módulo financiero personal de Cuack.

---

## Vista General de la Arquitectura

```
MÓDULO FINANCIERO — CUACK CUENTAS CLARAS
│
├── 📥 REGISTRO (Entry Points)
│   ├── Manual → AddExpensePage
│   ├── PDF → UploadPDFPage (pdfParser.ts / mercadoPagoParser.ts)
│   └── Excel → UploadSantanderPage (santanderParser.ts)
│
├── 📊 CONSULTAS (Query & Analysis)
│   ├── Dashboard → DashboardPage (Resumen)
│   ├── Lista/Historial → ExpensesListPage
│   ├── Gráficos → StatsPage
│   └── IA/Natural Language → QueryPage (Gemini API)
│
└── ⚙️ CONFIGURACIÓN (Master Data)
    ├── Categorías → CategoriesPage
    ├── Etiquetas → TagsPage
    ├── Responsables → ResponsablesPage
    └── Mapeos → classifier.ts (Auto-classification rules)

👥 GASTOS COMPARTIDOS → Módulo independiente (docs/gastos-compartidos/)
    ├── Dashboard Compartido → SharedExpensesDashboard
    └── Sala de Evento → SharedExpensesPage

ALMACENAMIENTO: Firebase Firestore (Cloud)
STATE MANAGEMENT: Zustand (useExpenseStore)
API DE IA: Gemini API (Clasificación + Consultas)
```

---

## Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRADA DE DATOS                         │
├─────────────────────────────────────────────────────────────┤
│  Manual    PDF (TC)    Excel (Santander)    Compartido     │
└──────┬──────┬──────────┬──────────────────┬───────────────┘
       │      │          │                  │
       └──────┴──────────┴──────────────────┴──────┐
                                                   ▼
                            ┌──────────────────────────┐
                            │  CLASIFICADOR (Gemini)   │
                            │  + Reglas Locales        │
                            └──────────────────────────┘
                                     │
                                     ▼
                            ┌──────────────────────────┐
                            │   VALIDACIÓN USUARIO     │
                            │   (Aprobar/Corregir)     │
                            └──────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │  ALMACENAMIENTO EN FIRESTORE   │
                    │  Colección: expenses           │
                    │  Colección: categories         │
                    │  Colección: tags               │
                    └────────────────────────────────┘
                                     │
         ┌───────────────┬───────────┴──────┬──────────────┐
         ▼               ▼                  ▼              ▼
    Dashboard      Estadísticas      Mis Gastos      Consultas IA
```

---

## Modelos de Datos Principales

### Expense (Gasto)
```typescript
{
  id: string                  // Firestore auto-generated
  description: string         // Ej: "CARREFOUR"
  amount: number             // Monto numérico
  currency: "ARS" | "USD"    // Moneda
  category: string           // ID de categoría
  date: Date                 // Fecha del gasto
  tags?: string[]            // IDs de etiquetas opcionales
  notes?: string             // Notas adicionales
  cardLast4?: string         // Últimos 4 dígitos de tarjeta
  cardholder?: string        // Titular de tarjeta
  source?: "manual" | "pdf" | "excel" | "shared"  // Origen
  createdAt: Date           // Timestamp de creación
  updatedAt: Date           // Timestamp de actualización
}
```

### Category (Categoría)
```typescript
{
  id: string          // UUID
  name: string        // Ej: "Comida y Restaurantes"
  icon: string        // Emoji: 🍔
  color: string       // Hex: #FF6B6B
}
```

### Responsable (Persona responsable)
```typescript
{
  id: string      // Ej: 'resp-patricio'
  name: string    // Ej: 'Patricio'
  emoji: string   // Ej: '🧔'
}
```

### Tag (Etiqueta)
```typescript
{
  id: string          // UUID
  name: string        // Ej: "Gastos Fijos"
  color: string       // CSS class: bg-blue-100 text-blue-700
}
```

---

## Flujos de Usuario Principales

### Flujo 1: Registrar Gasto Manual
```
1. Usuario abre "Agregar Gasto"
2. Completa formulario (monto, fecha, categoría, etc.)
3. Sistema valida
4. Se guarda en Firestore
5. Aparece en Dashboard y Mis Gastos
```

### Flujo 2: Importar Presupuesto de TC
```
1. Usuario abre "Subir PDF"
2. Selecciona PDF de Banco/Tarjeta
3. Sistema parsea líneas de transacciones
4. Gemini/Clasificador asigna categorías automáticas
5. Usuario revisa y aprueba
6. Se guardan N gastos en Firestore
```

### Flujo 3: Consulta "¿Cuánto gasté en comida este mes?"
```
1. Usuario abre "Consultas IA"
2. Escribe pregunta en lenguaje natural
3. Gemini interpreta y crea query
4. Sistema filtra gastos por categoría, período, etc.
5. Gemini formatea respuesta
6. Usuario ve resultado
```

### Flujo 4: Dividir Gasto en Grupo
> Ver [documentación de Gastos Compartidos](./gastos-compartidos-indice.md) — módulo independiente.

---

## Integraciones Externas

| Servicio | Uso | Archivo |
|----------|-----|---------|
| **Firebase Firestore** | Base de datos en la nube | `src/lib/firebase.ts` |
| **Gemini API** | Clasificación inteligente + consultas en lenguaje natural | `src/lib/gemini.ts` |
| **PDF.js** | Parseo de archivos PDF | `src/lib/pdfParser.ts` |
| **xlsx** | Parseo de Excel/CSV | `src/lib/santanderParser.ts` |
| **Chart.js / Recharts** | Visualización de gráficos | `src/pages/StatsPage.tsx` |

---

## Próximos Pasos y Roadmap

- [ ] Exportación de reportes a Excel/PDF
- [ ] Presupuesto y alertas automáticas
- [ ] Análisis predictivo de gastos
- [ ] Dashboard compartido público (read-only)
- [ ] Integración con APIs de bancos

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0  
**Autor**: Equipo de Desarrollo Cuack
