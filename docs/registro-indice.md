# Sector: Registro de Gastos

> **Captura y entrada de movimientos financieros desde diferentes fuentes**

---

## Módulos de Registro

Este sector gestiona toda la **entrada de datos** al sistema. Ofrece tres canales:

| Canal | Archivo fuente | Propósito | Flujo |
|-------|---------------|-----------|-------|
| [Agregar Gasto Manual](./agregar-gasto.md) | `src/pages/AddExpensePage.tsx` | Registro rápido de un gasto individual | Formulario → Validación → Firestore |
| [Importar desde PDF](./subir-pdf.md) | `src/pages/UploadPDFPage.tsx` | Carga masiva de resúmenes TC (Nación, Visa, MC, Mercado Pago) | PDF → Parser → Previsualización → Clasificación → Firestore |
| [Santander Excel](./santander-excel.md) | `src/pages/UploadSantanderPage.tsx` | Importación de resúmenes TC Santander (.xlsx) por sección de tarjeta | Excel → Secciones por titular → Clasificación → Firestore |

---

## Arquitectura

```
┌──────────────┬──────────────────┬──────────────────────┐
│   MANUAL     │   PDF (TC)       │   EXCEL (Santander)  │
│ (un gasto)   │ (masivo)         │ (masivo, multi-card) │
└──────┬───────┴────────┬─────────┴──────────┬───────────┘
       │                │                    │
       └────────────────┼────────────────────┘
                        │
                        ▼
             ┌──────────────────┐
             │  CLASIFICADOR    │
             │  classifier.ts   │
             │  + Gemini Flash  │
             └────────┬─────────┘
                      │
                      ▼
             ┌──────────────────┐
             │    FIRESTORE     │
             │  expenses/       │
             └──────────────────┘
```
