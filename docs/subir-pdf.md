# Módulo: Subir PDF

Automatización de carga masiva desde resúmenes de tarjetas de crédito en formato PDF.

## Referencia al Código
- **Archivo principal:** [`src/pages/UploadPDFPage.tsx`](../../../src/pages/UploadPDFPage.tsx)
- **Parser:** [`src/lib/pdfParser.ts`](../../../src/lib/pdfParser.ts)
- **Clasificador:** [`src/lib/gemini.ts`](../../../src/lib/gemini.ts)

## Descripción
Un módulo diseñado para automatizar las cargas de gastos que provienen de resúmenes mensuales que los bancos entregan como archivos Adobe PDF. Soporta:
- Tarjetas de crédito del Banco Nación
- Visa
- Mastercard
- Mercado Pago

## Funcionamiento

### Flujo Completo
```
PDF del banco
    │
    ▼
PDF.js extrae texto
    │
    ▼
pdfParser.ts identifica patrones:
  - Fechas (DD/MM, D/M)
  - Montos (1.234,56 o 1234.56)
  - Conceptos/descripciones
    │
    ▼
Para cada línea → Gemini clasifica automáticamente
    │
    ▼
Previsualización tabular (usuario revisa)
    │
    ▼
Usuario aprueba/corrige
    │
    ▼
addExpense() × N documentos
    │
    ▼
Firestore (sincronización real-time)
    │
    ▼
Dashboard actualizado
```

### Paso a Paso para el Usuario

1. **Acceso**: Usuario abre "Subir PDF"
2. **Selección**: Arrastra o selecciona archivo PDF
3. **Procesamiento**:
   - Sistema extrae texto de todas las páginas
   - Identifica líneas de transacciones
   - Busca patrones de fecha, monto, concepto
4. **Clasificación**:
   - Reglas locales (classifier.ts) asignan categoría
   - Si no coincide, Gemini API propone
5. **Previsualización**:
   - Tabla con: Fecha | Concepto | Monto | Categoría Sugerida
   - Usuario puede editar categorías directamente en la tabla
6. **Importación**:
   - Usuario presiona "Importar"
   - Sistema crea N Expenses en Firestore
7. **Confirmación**: "X gastos importados correctamente"

## Auto-asignación de Responsable (Mercado Pago)

Al importar un PDF de Mercado Pago, el sistema extrae el nombre del titular del saludo ("¡Hola, [Nombre]!") y lo mapea automáticamente al campo `responsable` de cada gasto:

| Cardholder contiene | Responsable asignado |
|---|---|
| `patricio` | `Patricio` |
| `mariana` / `maru` | `Maru` |
| `brenda` / `bren` | `Bren` |
| `micaela` / `mica` | `Mica` |
| Otro nombre | sin asignar |

Para PDFs de Banco Nación/VISA/Mastercard no aplica (no incluyen nombre del titular por transacción).

## Parser de PDF (pdfParser.ts)

### Patrones Soportados

#### Banco Nación (Tarjeta de Crédito)
```
 DD/MM CONCEPTO                                   999.99
 01/05 CARREFOUR SUP CIUDAD DE BUENOS AIRES       2.500,50
 02/05 VISA DEFERRED CUOTA 1 DE 12               10.050,00
```

#### Mercado Pago
```
dd/mm  descripción movimiento                    ±monto
01/05  PAGO REALIZADO                           -1.200,50
02/05  DEVOLUCIÓN COMPRA                        +500,00
```

### Algoritmo de Extracción

1. **Split por líneas**
2. **Regex para patrón de fecha** (DD/MM o D/M)
3. **Regex para monto** (números con . o , como separador)
4. **Concepto = resto de la línea entre fecha y monto**
5. **Filtrar líneas válidas** (excluir encabezados, totales, etc.)

```typescript
// Pseudocódigo
const parseTransactionLine = (line: string) => {
  const dateMatch = /(\d{1,2})\/(\d{1,2})/.exec(line);
  const amountMatch = /\d+[.,]\d{2}/.exec(line);
  const concept = line
    .replace(dateMatch[0], "")
    .replace(amountMatch[0], "")
    .trim();

  return {
    date: new Date(currentYear, dateMatch[2] - 1, dateMatch[1]),
    amount: parseFloat(amountMatch[0].replace(",", ".")),
    concept
  };
};
```

## Clasificación (Gemini API)

Para cada transacción parseada:

```typescript
const suggestCategory = async (concept: string) => {
  // Primero: reglas locales
  const localMatch = classifyLocal(concept);
  if (localMatch) return localMatch;

  // Segundo: Gemini
  const prompt = `
    Clasifica este concepto en una de estas categorías:
    ${CATEGORIES}

    Concepto: "${concept}"
    Responde SOLO con el nombre de la categoría.
  `;

  const response = await gemini.generateContent(prompt);
  return response.text().trim();
};
```

## Previsualización y Edición

Usuario ve tabla interactiva:

| Fecha | Concepto | Monto | Moneda | Categoría | Acción |
|-------|----------|-------|--------|-----------|--------|
| 01/05 | CARREFOUR | 2500 | ARS | Supermercado | [Editar dropdown] |
| 02/05 | NETFLIX | 299 | ARS | ¿? | [Editar dropdown] |

Puede:
- ✅ Cambiar categoría antes de importar
- ✅ Editar descripción del concepto
- ✅ Eliminar línea si es duplicada o interna
- ✅ Ver nota sobre clasificación

## Integración con Store

```typescript
const { addExpense } = useExpenseStore();

const handleImport = async (transactions) => {
  for (const txn of transactions) {
    await addExpense({
      description: txn.concept,
      amount: txn.amount,
      currency: txn.currency,
      category: txn.category,
      date: txn.date,
      source: "pdf"
    });
  }
  setSuccessMessage(`${transactions.length} gastos importados`);
};
```

## Soportes de Bancos

| Banco | Formato | Estado | Notas |
|-------|---------|--------|-------|
| Banco Nación | PDF resumen TC | ✅ Soportado | Patrones estándar |
| Santander | PDF resumen | ✅ Soportado | También via Excel |
| Hipotecario | PDF | ⚠️ Parcial | Algunos formatos |
| ICBC | PDF | ❌ No soportado | Por implementar |
| Mercado Pago | PDF | ✅ Soportado | Estados de cuenta |

## Validaciones Pre-Importación

- ✅ Archivo es PDF válido
- ✅ Monto >= 0 para todas las líneas
- ✅ Fechas dentro del período lógico (última factura)
- ✅ No hay duplicados recientes (comparar 3 últimos días)
- ⚠️ Si detecta duplicado, muestra advertencia

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| "Archivo inválido" | PDF corrupto o no es PDF | Reexportar de banco |
| "No se encontraron transacciones" | PDF sin formato reconocido | Contactar soporte |
| "Clasificación falló" | Gemini API no responde | Reintentar o manual |

## Ventajas
- ✅ Carga masiva de 20-100+ gastos en minutos
- ✅ Clasificación automática inteligente
- ✅ Trazabilidad bancaria
- ✅ Detecta cambios de moneda (ARS/USD)

## Limitaciones
- ❌ Requiere formato PDF específico (no todos los bancos iguales)
- ❌ Puede fallar con OCR de baja calidad
- ❌ No soporta todas las variaciones de extracto

## Roadmap Futuro
- [ ] Soporte para más bancos (BBVA, Santander, ICBC)
- [ ] OCR avanzado para PDFs escaneados
- [ ] Detección de cuotas automática
- [ ] Confirmación de duplicados con ML
- [ ] Importación programada mensual
