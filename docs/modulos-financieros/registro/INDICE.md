# Sector: Registro de Gastos

> **Captura y entrada de movimientos financieros desde diferentes fuentes**

---

## Módulos de Registro

Este sector es responsable de toda la **entrada de datos** al sistema. Ofrece tres canales principales:

### 1️⃣ Agregar Gasto Manual
- [Referencia completa](./agregar-gasto.md)
- **Archivo**: [`src/pages/AddExpensePage.tsx`](../../../src/pages/AddExpensePage.tsx)
- **Propósito**: Registro rápido de gastos individuales
- **Flujo**: Formulario → Validación → Almacenamiento

### 2️⃣ Importar desde PDF
- [Referencia completa](./subir-pdf.md)
- **Archivo**: [`src/pages/UploadPDFPage.tsx`](../../../src/pages/UploadPDFPage.tsx)
- **Propósito**: Automatizar carga de resúmenes de tarjetas de crédito
- **Flujo**: PDF → Parseo → Previsualización → Clasificación → Aprobación

### 3️⃣ Importar desde Santander Excel
- [Referencia completa](./santander-excel.md)
- **Archivo**: [`src/pages/UploadSantanderPage.tsx`](../../../src/pages/UploadSantanderPage.tsx)
- **Propósito**: Importar movimientos bancarios desde extractos Excel
- **Flujo**: Excel → Lectura → Mapeo → Clasificación → Almacenamiento

---

## Arquitectura de Registro

```
┌──────────────────────────────────────────────────────┐
│           CANALES DE ENTRADA                         │
├────────────┬──────────────────┬─────────────────────┤
│  MANUAL    │   PDF (TC)       │   EXCEL (BANCO)    │
│ (Directa)  │ (Automática)     │  (Automática)      │
└────────────┴──────────────────┴─────────────────────┘
      │            │                    │
      └────────────┼────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  CLASIFICADOR       │
         │  - Reglas locales   │
         │  - Gemini API       │
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  PREVISUALIZACIÓN   │
         │  (Revisar usuario)  │
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  FIRESTORE          │
         │  Colección:         │
         │  expenses/          │
         └─────────────────────┘
```

---

## Flujos por Canal

### Flujo Manual (AddExpensePage)
```
1. Usuario accede a "Agregar Gasto"
2. Completa campos: descripción, monto, fecha, moneda, categoría, forma de pago
3. Sistema valida completitud y coherencia
4. Usuario presiona "Guardar"
5. Acción se despacha al Store (useExpenseStore)
6. Documento se persiste en Firestore
7. Usuario es redireccionado a "Mis Gastos" o Dashboard
```

**Ventaja**: Rápido para gastos aislados, control total del usuario.

---

### Flujo PDF (UploadPDFPage)
```
1. Usuario accede a "Subir PDF"
2. Arrastra/selecciona archivo PDF (resumen de TC)
3. Sistema utiliza PDF.js para extraer texto
4. Parser local (pdfParser.ts) identifica:
   - Patrones de fecha
   - Montos (separadores . y ,)
   - Conceptos/descripción
5. Para cada línea, Gemini API propone clasificación
6. Previsualización muestra tabla con sugerencias
7. Usuario revisa e imprime correcciones (si las hay)
8. Usuario presiona "Importar"
9. Sistema crea N documentos en Firestore (uno por línea)
10. Dashboard se actualiza automáticamente (onSnapshot)
```

**Ventaja**: Automatización masiva, reduce entrada manual, aprendizaje continuo.

---

### Flujo Excel (UploadSantanderPage)
```
1. Usuario accede a "Santander Excel"
2. Arrastra/selecciona archivo .xlsx exportado de Santander online
3. Sistema utiliza librería xlsx para parsear:
   - Encabezados de columnas
   - Filas de transacciones
   - Fechas, montos, conceptos
4. Mapea columnas del Excel a campos internos
5. Para cada movimiento:
   - Clasifica automáticamente (Gemini + reglas locales)
   - Genera objeto Expense con todos los campos
6. Previsualización tabular
7. Usuario verifica y aprueba
8. Sistema inserta batch de N documentos en Firestore
9. Dashboard se sincroniza
```

**Ventaja**: Carga masiva de movimientos bancarios, trazabilidad bancaria.

---

## Validaciones Comunes

Todos los canales implementan validaciones:

| Validación | Mensaje |
|-----------|---------|
| Monto > 0 | "El monto debe ser mayor a 0" |
| Fecha válida | "La fecha debe ser válida" |
| Categoría seleccionada | "Debes seleccionar una categoría" |
| Descripción no vacía | "La descripción no puede estar vacía" |
| Moneda soportada | "Moneda debe ser ARS o USD" |

---

## Clasificación Automática

La clasificación de gastos ocurre en dos etapas:

### Etapa 1: Reglas Locales (pocalificador)
Archivo: [`src/lib/classifier.ts`](../../../src/lib/classifier.ts)

```javascript
// Ejemplo: Si la descripción contiene "CARREFOUR"...
rules: [
  { keywords: ["carrefour", "walmart", "disco", "coto"], category: "Supermercado" },
  { keywords: ["mostaza", "bk", "mcdonalds", "starbucks"], category: "Comida y Restaurantes" },
  { keywords: ["uber", "cabify", "taxi"], category: "Transporte" },
]
```

**Ventaja**: Rápido, sin latencia de red.

### Etapa 2: Gemini API (Inteligencia Artificial)
Archivo: [`src/lib/gemini.ts`](../../../src/lib/gemini.ts)

Para concepto que no coincida con reglas locales, se envía a Gemini:
```
Prompt: "Clasifica este gasto en una de estas categorías: ["Comida", "Transporte"...]
Concepto: 'NETFLIX CCPROD PAYMENT'"

Respuesta: "Entretenimiento"
```

**Ventaja**: Flexibilidad, aprende de contextos nuevos.

---

## Integración con Store

Todos los canales utilizan `useExpenseStore`:

```typescript
// Desde AddExpensePage
const { addExpense } = useExpenseStore();

await addExpense({
  description: "CARREFOUR",
  amount: 2500,
  currency: "ARS",
  category: "Supermercado",
  date: new Date(),
  notes: "Compra semanal",
  tags: ["gastos-fijos"],
});
```

---

## Sincronización con Firebase

Cada `addExpense()` en el Store dispara:

1. **Write to Firestore**: Documento nuevo en colección `expenses/`
2. **onSnapshot listener**: Otros clientes (otros navegadores/apps) reciben actualización en tiempo real
3. **Local state update**: UI se re-renderiza automáticamente

```
┌─────────────────┐
│  AddExpensePage │
│   (Form)        │
└────────┬────────┘
         │ onClick:
         │ await addExpense()
         ▼
    ┌─────────────────────┐
    │ useExpenseStore     │
    │ .addExpense()       │
    └────────┬────────────┘
             │ Firebase SDK:
             │ addDoc(collection...)
             ▼
         ┌────────────────────┐
         │  Firestore Cloud   │
         │  collection:       │
         │  expenses/[newId]  │
         └────────────────────┘
```

---

## Piezas Reutilizables

### FileUploader Component
Ubicación: [`src/components/upload/FileUploader.tsx`](../../../src/components/upload/FileUploader.tsx)

Componente genérico para dropzone y selección de archivos:
```tsx
<FileUploader
  accept=".pdf"
  onFileSelect={handlePDFUpload}
  label="Arrastra tu PDF aquí"
/>
```

---

## Próximos Pasos

- [ ] Validación de OCR para PDFs de baja calidad
- [ ] Importación automática desde API de bancos
- [ ] Historial de importaciones con rollback
- [ ] Duplicación automática de registros similares
- [ ] Batch import con progreso visual

---

**Última actualización**: Mayo 2026  
**Estructura**: Modular, escalable  
**Base de Datos**: Firestore (Cloud)
