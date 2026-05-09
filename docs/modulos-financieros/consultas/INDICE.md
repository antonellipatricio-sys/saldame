# Sector: Consultas y Análisis

> **Visualización, búsqueda y análisis de gastos registrados**

---

## Módulos de Consultas

Este sector gestiona toda la **visualización y análisis** de datos. Ofrece cuatro formas de interrogar los datos:

| Módulo | Archivo fuente | Propósito |
|--------|---------------|-----------|
| [Dashboard / Inicio](./inicio.md) | `src/pages/DashboardPage.tsx` | Resumen ejecutivo del mes: totales ARS/USD, últimos gastos, top categorías |
| [Mis Gastos](./mis-gastos.md) | `src/pages/ExpensesListPage.tsx` | Listado tabular con filtros por categoría, mes, moneda y búsqueda de texto |
| [Estadísticas](./estadisticas.md) | `src/pages/StatsPage.tsx` | Gráficos por categoría (pie), evolución mensual (bar), top etiquetas |
| [Consultas en IA](./estado-de-cuenta.md) | `src/pages/QueryPage.tsx` | Preguntas en lenguaje natural: "¿Cuánto gasté en comida el mes pasado?" |

---

## Arquitectura

```
┌──────────┬──────────────┬─────────────┬─────────────┐
│ VISUAL   │ TABULAR      │ GRÁFICO     │ NATURAL     │
│(Dashboard)│ (Mis Gastos) │ (Stats)     │ (IA)        │
└────┬─────┴──────┬───────┴──────┬──────┴──────┬──────┘
     │            │              │             │
     └────────────┴──────────────┴─────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  useExpenseStore      │
                  │  (Zustand)            │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  Firebase Firestore   │
                  │  collection: expenses/│
                  └───────────────────────┘
```
