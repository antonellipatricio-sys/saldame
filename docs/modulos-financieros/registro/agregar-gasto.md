# Módulo: Agregar Gasto

Formulario interactivo para la carga manual de un gasto individual.

## Referencia al Código
- **Archivo principal:** [`src/pages/AddExpensePage.tsx`](../../../src/pages/AddExpensePage.tsx)

## Descripción
Esta página provee un formulario completo para registrar manualmente un gasto individual a la aplicación. Es útil para:
- Gastos en efectivo
- Gastos olvidados durante el mes
- Registros rápidos sin necesidad de documentación

## Funcionamiento

### Flujo Básico
1. Usuario abre "Agregar Gasto"
2. Completa los siguientes campos:
   - **Descripción**: Concepto del gasto (ej: "CARREFOUR")
   - **Monto**: Cantidad numérica
   - **Moneda**: ARS o USD
   - **Fecha**: Fecha del gasto
   - **Categoría**: Selecciona de lista desplegable
   - **Etiquetas** (opcional): Múltiples etiquetas
   - **Notas** (opcional): Detalles adicionales
   - **Forma de Pago**: Efectivo, Tarjeta, Transferencia, etc.
3. Sistema valida que todos los campos obligatorios estén completos
4. Usuario presiona "Guardar"
5. Acción se despacha al `useExpenseStore`
6. Documento se persiste en Firestore
7. Usuario es redireccionado a "Mis Gastos" o Dashboard

### Validaciones
- ✅ Monto debe ser mayor a 0
- ✅ Fecha debe ser válida
- ✅ Categoría debe ser seleccionada
- ✅ Descripción no puede estar vacía
- ✅ Moneda debe ser ARS o USD

## Campos del Formulario

| Campo | Tipo | Obligatorio | Rango/Restricción |
|-------|------|-------------|-------------------|
| `description` | string | Sí | 1-200 caracteres |
| `amount` | number | Sí | > 0 |
| `currency` | enum | Sí | ARS \| USD |
| `category` | string (UUID) | Sí | Debe existir en store |
| `date` | Date | Sí | Fecha válida |
| `tags` | string[] | No | Array de UUIDs |
| `notes` | string | No | Máx 500 caracteres |
| `source` | enum | No | manual \| pdf \| excel |

## Integración con Store

```typescript
const { addExpense } = useExpenseStore();

const handleSubmit = async (formData) => {
  await addExpense({
    description: formData.description,
    amount: parseFloat(formData.amount),
    currency: formData.currency,
    category: formData.category,
    date: formData.date,
    tags: formData.tags || [],
    notes: formData.notes,
    source: "manual"
  });
  // Redirect o confirmación visual
};
```

## UX/Diseño
- Formulario limpio y responsivo
- Elementos resaltados en `brand-primary`
- Botón submit en `bg-brand-success`
- Feedback visual de validación
- Auto-guardado en tiempo real (borrador local)

## Casos de Uso

### Caso 1: Gasto en Efectivo
```
Usuario entra a una tienda, gasta $500 en efectivo
- Abre la app
- "Agregar Gasto"
- Ingresa: desc="Tienda XYZ", monto=500, moneda=ARS, categoría=Compras
- Guarda
- Aparece inmediatamente en Dashboard
```

### Caso 2: Gasto Olvidado
```
Usuario recuerda que hace 3 días gastó en cine
- "Agregar Gasto"
- Cambia fecha a hace 3 días
- Ingresa: desc="CINE SHOWCASE", monto=250, categoría=Entretenimiento
- Sistema automáticamente ordena Dashboard por fecha
```

### Caso 3: Gasto con Etiquetas
```
Usuario gasta en supermercado pero quiere marcar como "Gastos Fijos"
- Al agregar, selecciona etiqueta "Gastos Fijos"
- Cuando filtre por esa etiqueta, aparecerá este gasto
```

## Ventajas
- ✅ Registro rápido sin documentación física
- ✅ Control total sobre categorización
- ✅ Ideal para gastos en efectivo
- ✅ Sin latencia (immediato vs. importación)

## Limitaciones
- ❌ Entrada manual (propenso a errores tipográficos)
- ❌ Más lento que PDF/Excel para múltiples registros
- ❌ Sin trazabilidad bancaria

## Roadmap Futuro
- [ ] Voice input (dictado de gastos)
- [ ] Botón "repetir" para gastos recurrentes
- [ ] Template de gastos frecuentes
- [ ] Sincronización entre dispositivos
