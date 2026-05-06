# Módulo: Santander Excel

Importación de movimientos bancarios desde archivos Excel exportados de la banca en línea de Santander.

## Referencia al Código
- **Archivo principal:** [`src/pages/UploadSantanderPage.tsx`](../../../src/pages/UploadSantanderPage.tsx)
- **Parser:** [`src/lib/santanderParser.ts`](../../../src/lib/santanderParser.ts)

## Descripción
Esta página permite importar extractos de cuenta bancaria de Santander en formato Excel (.xlsx). Ideal para:
- Cuenta corriente/caja de ahorros
- Estados de movimientos bancarios completos
- Registros con múltiples movimientos en un solo archivo

## Funcionamiento

### Flujo Completo
```
Excel de Santander
    │
    ▼
Selector Dropzone
    │
    ▼
xlsx.parse() extrae hojas
    │
    ▼
santanderParser.ts mapea columnas:
  - Fecha
  - Concepto/Descripción
  - Monto
  - Saldo
    │
    ▼
Para cada fila → Clasificación automática
    │
    ▼
Previsualización tabular
    │
    ▼
Usuario valida y aprueba
    │
    ▼
addExpense() × N documentos
    │
    ▼
Firestore sync
    │
    ▼
Dashboard actualizado
```

### Paso a Paso para el Usuario

1. **Acceso**: Usuario abre "Santander Excel"
2. **Selección**: Arrastra o selecciona archivo `.xlsx`
3. **Procesamiento**:
   - Sistema detecta hoja de "Movimientos" o "Transacciones"
   - Lee encabezados (Fecha, Detalle, Debe, Haber, Saldo)
   - Procesa todas las filas
4. **Clasificación**:
   - Sistema clasifica automáticamente cada movimiento
   - Detecta si es ingreso o egreso
5. **Previsualización**: Tabla editable con mejoras de metadata
6. **Importación**: Usuario aprueba y se cargan los movimientos
7. **Confirmación**: "X movimientos importados"

## Estructura de Excel Esperada

### Formato Estándar de Santander
```
Banco Santander - Estado de Cuenta
Fecha         | Concepto                  | Debe      | Haber     | Saldo
01/05/2026    | TRANSFERENCIA RECIBIDA    |           | 5.000,00  | 25.000,00
02/05/2026    | PAGO TARJETA CREDITO      | 10.000,00 |           | 15.000,00
03/05/2026    | DEPÓSITO EN EFECTIVO      |           | 2.000,00  | 17.000,00
```

### Columnas Reconocidas
| Columna | Variantes | Uso |
|---------|-----------|-----|
| Fecha | Fecha, Date, Transacción | Fecha del movimiento |
| Concepto | Detalle, Descripción, Concepto | Qué fue el movimiento |
| Debe | Egreso, Salida, Débito | Dinero que sale |
| Haber | Ingreso, Entrada, Crédito | Dinero que entra |
| Saldo | Balance, Saldo Final | Saldo después del movimiento |

## Parser de Excel (santanderParser.ts)

### Algoritmo de Lectura

```typescript
// Pseudocódigo
const parseSantanderExcel = (firstBytes: ArrayBuffer) => {
  const workbook = xlsx.read(firstBytes, { type: 'array' });
  
  // Buscar hoja con nombre que contenga "Movimiento" o "Estado"
  const sheet = workbook.Sheets[
    Object.keys(workbook.Sheets).find(name => 
      name.toLowerCase().includes('movimiento') || 
      name.toLowerCase().includes('estado')
    )
  ];

  const rows = xlsx.utils.sheet_to_json(sheet);
  
  // Detectar columnas dinámicamente
  const headerRow = Object.keys(rows[0]);
  const dateCol = headerRow.find(h => h.toLowerCase().includes('fecha'));
  const conceptCol = headerRow.find(h => h.toLowerCase().includes('concepto'));
  const debeCol = headerRow.find(h => h.toLowerCase().includes('debe'));
  const haberCol = headerRow.find(h => h.toLowerCase().includes('haber'));
  
  // Mapear filas
  return rows.map(row => ({
    date: parseDate(row[dateCol]),
    concept: row[conceptCol]?.trim(),
    amount: row[debeCol] ? -parseFloat(row[debeCol]) : parseFloat(row[haberCol]),
    currency: "ARS", // Santander por defecto es ARS
    source: "excel",
    saldo: parseFloat(row['Saldo']) // Para auditoría
  }));
};
```

## Clasificación Inteligente

Para cada movimiento:

```typescript
const classifyMovement = async (concept: string, amount: number) => {
  // Detectar si es ingreso o egreso
  const isExpense = amount < 0;
  
  // Reglas locales para concepto
  const localCategory = classifyLocal(concept);
  if (localCategory) return localCategory;
  
  // Si es transferencia interna, excluir
  if (concept.includes("TRANSFERENCIA") && concept.includes("PROPIA")) {
    return "IGNORAR"; // No contar como gasto/ingreso
  }
  
  // Gemini para casos complejos
  const category = await classifyViaGemini(concept);
  return category;
};
```

## Previsualización y Edición

Usuario ve tabla completa con opciones:

| Fecha | Concepto | Monto | Moneda | Categoría | Acción |
|-------|----------|-------|--------|-----------|--------|
| 01/05 | TRANSF. RECIBIDA | +5000 | ARS | Ingreso | [Ignorar] |
| 02/05 | PAGO TJ CREDIT | -10000 | ARS | Gastos Fijos | [Editar] |
| 03/05 | DEPOSITO EFECTIVO | +2000 | ARS | Ingreso | [Ignorar] |

### Opciones Disponibles
- ✅ Editar categoría (dropdown)
- ✅ Marcar como "Ignorar" (transferencias propias, etc.)
- ✅ Cambiar monto si hay error tipográfico
- ✅ Editar descripción del concepto
- ✅ Selector de moneda (por si hay USD)

## Manejo de Ingresos

Distinción entre ingresos y gastos:

```typescript
// Si es positivo (Haber) = Ingreso
if (amount > 0) {
  // Opción 1: Ignorar (no es gasto personal)
  // Opción 2: Categorizar como "Ingreso" 
  // Opción 3: Crear categoría "Ingresos" separada
  return "INGRESO"; // Depende de preferencia del usuario
}
```

## Integración con Store

```typescript
const { addExpense } = useExpenseStore();

const handleImportExcel = async (movements) => {
  let imported = 0;
  for (const mov of movements) {
    if (mov.category === "IGNORAR") continue; // Skip
    
    await addExpense({
      description: mov.concept,
      amount: Math.abs(mov.amount), // Siempre positivo en store
      currency: mov.currency,
      category: mov.category,
      date: mov.date,
      source: "excel",
      notes: `Saldo: ${mov.saldo}` // Para auditoría
    });
    imported++;
  }
  setSuccessMessage(`${imported} movimientos importados`);
};
```

## Validaciones Pre-Importación

- ✅ Archivo es Excel válido (.xlsx o .xls)
- ✅ Encabezados reconocibles
- ✅ Mínimo 1 fila de datos
- ✅ Fechas en rango lógico (últimas 3 meses típicamente)
- ✅ Sin duplicados recientes
- ⚠️ Alerta si múltiples monedas detectadas

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| "Archivo inválido" | No es Excel o formato no reconocido | Exporte nuevamente de Santander |
| "Encabezados no reconocidos" | Estructura diferente a esperada | Envíe muestra al desarrollador |
| "{N} filas tienen montos inválidos" | Formato de número no estándar | Revise en Excel y reexporte |
| "Columna de Fecha no encontrada" | Nombre de columna personalizado | Use nombres estándar de Santander |

## Ventajas
- ✅ Importación de estado de cuenta completo
- ✅ Detecta ingresos y egresos automáticamente
- ✅ Incluye saldo para auditoría
- ✅ Interfaz familiar (Excel/Calc)
- ✅ Rápido: 100+ movimientos en segundos

## Limitaciones
- ❌ Requiere exportación manual desde Santander Online (no API)
- ❌ Puede fallar si estructura es customizada
- ❌ No distingue automáticamente entre transacciones propias y externas
- ❌ No soporta otras monedas que no sean ARS (requiere detección manual)

## Roadmap Futuro
- [ ] API directo con Santander (importación automática)
- [ ] Soporte para otros bancos (BBVA, Hipotecario, etc.)
- [ ] Detección inteligente de transferencias propias (ignorar automáticamente)
- [ ] Sincronización programada (importación mensal automática)
- [ ] Detección de cuotas y análisis de deuda
- [ ] Reconciliación bancaria con Firestore

## Ejemplo Real: Importación de Mayo 2026

**Archivo**: `estado_mayo_2026.xlsx`

```
Fecha      | Concepto                    | Debe    | Haber    | Saldo
01/05      | SALDO INICIAL               |         |          | 20.000,00
01/05      | TRANSF. A CAJA AHORROS      | 5.000   |          | 15.000,00 [IGNORAR]
02/05      | CARREFOUR SUPERMERCADO      | 2.500   |          | 12.500,00 [Supermercado]
03/05      | NETFLIX CCPROD PAYMENT      | 299     |          | 12.201,00 [Entretenimiento]
04/05      | DEPOSITO DE EFECTIVO        |         | 3.000    | 15.201,00 [IGNORAR]
05/05      | PAGO TARJETA CREDITO        | 10.000  |          | 5.201,00  [Gastos Fijos]
```

**Resultado**: 3 gastos importados (CARREFOUR, NETFLIX, PAGO TJ)
