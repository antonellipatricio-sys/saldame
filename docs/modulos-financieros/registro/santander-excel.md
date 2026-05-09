# Módulo: Santander Excel

Importación de gastos desde resúmenes de tarjeta de crédito de Santander en formato Excel (.xlsx).

## Referencia al Código
- **Archivo principal:** [`src/pages/UploadSantanderPage.tsx`](../../../src/pages/UploadSantanderPage.tsx)
- **Parser:** [`src/lib/santanderParser.ts`](../../../src/lib/santanderParser.ts)

## Descripción
Esta página permite importar resúmenes de tarjeta de crédito de Santander en formato Excel (.xlsx). El archivo contiene secciones por tarjeta (titular y adicionales), cada una con sus consumos del período.

## Funcionamiento

### Flujo Completo
```
Excel de Santander (.xlsx)
    │
    ▼
Selector Dropzone
    │
    ▼
xlsx.parse() extrae hojas
    │
    ▼
santanderParser.ts detecta secciones por tarjeta
y mapea columnas: Fecha | Descripción | Cuotas | Comprobante | Pesos | Dólares
    │
    ▼
Infiere responsable según titular de cada sección
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
addExpense() × N documentos → Firestore
    │
    ▼
Dashboard actualizado
```

### Paso a Paso para el Usuario

1. **Acceso**: Usuario abre "Santander Excel"
2. **Selección**: Arrastra o selecciona archivo `.xlsx` del resumen de TC
3. **Procesamiento**:
   - Parser detecta las secciones "Tarjeta de [Nombre] terminada en XXXX"
   - Lee columnas: Fecha, Descripción, Cuotas, Comprobante, Pesos, Dólares
   - Distingue tarjeta titular vs adicionales
4. **Clasificación**: Sistema clasifica automáticamente cada consumo
5. **Previsualización**: Tabla editable con responsable, monto y categoría
6. **Importación**: Usuario aprueba y se cargan los consumos
7. **Confirmación**: "X gastos importados"

## Estructura del Excel Esperada

### Formato Resumen TC Santander
```
Tarjeta de PATRICIO XXXX terminada en 1234
Fecha      | Descripción              | Cuotas | Comprobante | Pesos    | Dólares
01/05/2026 | CARREFOUR PALERMO        |        | 00123456    | 5.000,00 |
02/05/2026 | NETFLIX.COM              | 1/1    | 00234567    | 1.299,00 |
03/05/2026 | AMAZON.COM               |        | 00345678    |          | 12,99

Tarjeta de MARIANA XXXX terminada en 5678
Fecha      | Descripción              | Cuotas | Comprobante | Pesos    | Dólares
05/05/2026 | FARMACITY                |        | 00456789    | 2.500,00 |
```

### Columnas Reconocidas
| Columna | Uso |
|---------|-----|
| Fecha | Fecha del consumo |
| Descripción | Comercio / detalle del gasto |
| Cuotas | Número de cuota (e.g. `1/6`); vacío si pago contado |
| Comprobante | Número de comprobante (para auditoría) |
| Pesos | Monto en ARS |
| Dólares | Monto en USD |

## Parser de Excel (santanderParser.ts)

### Detección de Secciones por Tarjeta

El parser escanea el Excel buscando filas que coincidan con el patrón `"Tarjeta de [Nombre] terminada en XXXX"`. Cada sección encontrada se procesa como un bloque de consumos independiente, asociado al titular de esa tarjeta (titular o adicional).

### Auto-asignación de Responsable

El parser infiere el campo `responsable` del nombre del titular de cada sección de tarjeta:

| Cardholder contiene | Responsable asignado |
|---|---|
| `patricio` | `Patricio` |
| `mariana` / `maru` | `Maru` |
| `brenda` / `bren` | `Bren` |
| `micaela` / `mica` | `Mica` |
| Otro nombre | Primer nombre del titular |

Esto se resuelve en `resolveResponsable()` dentro de `santanderParser.ts`. El usuario puede reasignar manualmente desde la UI de revisión.

## Clasificación Automática

Cada consumo pasa por el pipeline estándar: reglas locales en `classifier.ts` (+500 keywords) y, si no hay coincidencia, Gemini 2.0 Flash como fallback. Ver [`src/lib/classifier.ts`](../../../src/lib/classifier.ts).

## Previsualización y Edición

El usuario ve una tabla con: Fecha | Descripción | Monto | Moneda | Responsable | Categoría | Acción.  
Desde ahí puede editar categoría, responsable o marcar filas como "Ignorar" antes de confirmar la importación.

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| "Archivo inválido" | No es .xlsx o formato no reconocido | Exportar nuevamente desde Santander Online |
| "No se encontraron secciones de tarjeta" | El Excel no tiene el encabezado esperado | Verificar que el archivo sea el resumen de TC |
| "Sin consumos en la sección X" | Sección vacía (tarjeta sin movimientos) | Normal — se ignora automáticamente |

## Roadmap Futuro
- [ ] Detección de cuotas pendientes y proyección de deuda
- [ ] Importación automática vía API de Santander
- [ ] Soporte para otros resúmenes bancarios
