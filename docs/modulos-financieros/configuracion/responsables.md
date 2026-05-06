# Módulo: Responsables

Gestión de las personas que pueden tener gastos asignados en la aplicación.

## Referencia al Código
- **Página:** [`src/pages/ResponsablesPage.tsx`](../../../src/pages/ResponsablesPage.tsx)
- **Store:** [`src/store/useExpenseStore.ts`](../../../src/store/useExpenseStore.ts) — acciones `fetchResponsables`, `addResponsable`, `updateResponsable`, `deleteResponsable`
- **Tipo:** [`src/types/index.ts`](../../../src/types/index.ts) — interfaz `Responsable`
- **Selector:** [`src/components/ResponsableSelect.tsx`](../../../src/components/ResponsableSelect.tsx)

## Descripción

Permite crear, editar y eliminar personas responsables de gastos. Cada responsable tiene:
- **Nombre** — identificador en el campo `responsable` del gasto
- **Emoji** — avatar visual

## Modelo de Datos

```typescript
interface Responsable {
  id: string;     // Ej: 'resp-patricio'
  name: string;   // Ej: 'Patricio'
  emoji: string;  // Ej: '🧔'
}
```

Persistencia: colección `responsables` en Firestore.

## Valores por Defecto

Si Firestore no tiene responsables guardados, el store inicia con:

| ID | Nombre | Emoji |
|---|---|---|
| `resp-patricio` | Patricio | 🧔 |
| `resp-maru` | Maru | 👩 |
| `resp-bren` | Bren | 👧 |
| `resp-mica` | Mica | 💁 |

## Funcionalidades de la Página

- ✅ Crear responsable (nombre + emoji)
- ✅ Editar nombre y emoji
- ✅ Eliminar (con aviso si tiene gastos asociados)
- ✅ Contador de gastos por responsable

## Auto-asignación desde Cardholder

Al importar gastos (Excel Santander / PDF Mercado Pago), el nombre del titular de la tarjeta se mapea automáticamente al responsable correspondiente:

| Cardholder contiene | Responsable asignado |
|---|---|
| `patricio` | `Patricio` |
| `mariana` / `maru` | `Maru` |
| `brenda` / `bren` | `Bren` |
| `micaela` / `mica` | `Mica` |

Ver detalles en [`santander-excel.md`](../registro/santander-excel.md) y [`subir-pdf.md`](../registro/subir-pdf.md).
