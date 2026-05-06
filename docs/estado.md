# Módulo: Gestión de Estado (Store)

Para el estado global de la interfaz o el almacenamiento de listados en memoria a lo largo del uso de la aplicación, el sistema utiliza un store en `src/store/`.

## 1. Store Principal (useExpenseStore)
- **Archivo Fuente:** [`src/store/useExpenseStore.ts`](../src/store/useExpenseStore.ts)
- **Tecnología:** Zustand con `persist` middleware
- **Propósito:** Estado central de la app financiera. Persiste en Firestore (gastos, categorías, etiquetas, responsables).

### Estado

| Propiedad | Tipo | Descripción |
|---|---|---|
| `expenses` | `Expense[]` | Gastos (Firestore) |
| `categories` | `Category[]` | Categorías (Firestore) |
| `tags` | `Tag[]` | Etiquetas (Firestore) |
| `responsables` | `Responsable[]` | Responsables (Firestore) |
| `loading` | `boolean` | Estado de carga |
| `error` | `string \| null` | Último error |

### Acciones

**Gastos**: `fetchExpenses`, `addExpense`, `updateExpense`, `deleteExpense`, `deleteExpensesByCard`, `getMonthSummary`

**Categorías**: `fetchCategories`, `addCategory`, `updateCategory`, `deleteCategory`

**Etiquetas**: `fetchTags`, `addTag`, `updateTag`, `deleteTag`

**Responsables**: `fetchResponsables`, `addResponsable`, `updateResponsable`, `deleteResponsable`

### Responsables — valores por defecto
Si la colección `responsables` en Firestore está vacía, el store trae estos valores iniciales en memoria:

| ID | Nombre | Emoji |
|---|---|---|
| `resp-patricio` | Patricio | 🧔 |
| `resp-maru` | Maru | 👩 |
| `resp-bren` | Bren | 👧 |
| `resp-mica` | Mica | 💁 |

La lista se carga desde Firestore en `App.tsx` junto con `fetchExpenses/Categories/Tags`.

## 2. Store Secundario (useAppStore)
- **Archivo Fuente:** [`src/store/useAppStore.ts`](../src/store/useAppStore.ts)
- **Propósito:** Estado de la calculadora y productos (herramientas secundarias de la app).
