# Módulo: Agregar Gasto

Página con **dos modos de registro**: formulario manual e importación de archivos.

## Referencia al Código
- **Archivo principal:** [`src/pages/AddExpensePage.tsx`](../../../src/pages/AddExpensePage.tsx)
- **Componente de importación:** [`src/components/upload/UploadFileSection.tsx`](../../../src/components/upload/UploadFileSection.tsx)

## Descripción
`AddExpensePage` presenta un **tab switcher** al tope de la pantalla con dos modos:

| Tab | Descripción |
|-----|-------------|
| 📝 **Manual** (default) | Formulario completo para registrar un gasto individual |
| 📁 **Importar archivo** | Uploader unificado que acepta PDF y Excel Santander |

---

## Tab: Manual

Formulario para registrar gastos en efectivo, gastos olvidados o registros rápidos.

### Campos del Formulario

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `description` | string | Sí |
| `amount` | number | Sí |
| `currency` | ARS \| USD | Sí |
| `category` | string | Sí |
| `date` | Date | Sí |
| `responsable` | string | No |
| `tags` | string[] | No |
| `notes` | string | No |

### Flujo
1. El clasificador local sugiere categoría mientras el usuario escribe
2. Si `confidence === 'high'`, se auto-aplica
3. Al guardar: `learnCategory()` actualiza el aprendizaje local → `addExpense()` persiste en Firestore

---

## Tab: Importar archivo (`UploadFileSection`)

Componente unificado en `src/components/upload/UploadFileSection.tsx` que acepta tanto **PDF como Excel en la misma drop zone**.

### Formatos soportados

| Extensión | Parser | Formato detectado |
|-----------|--------|-------------------|
| `.pdf` | `pdfParser.ts` / `mercadoPagoParser.ts` | Banco Nación/VISA o Mercado Pago (auto) |
| `.xlsx` / `.xls` | `santanderParser.ts` | Santander (columnas fijas) |

### Flujo de importación
1. Usuario arrastra o selecciona un archivo
2. Presiona "Procesar" → el componente detecta el formato por extensión
3. Se muestra tabla de revisión adaptada al formato:
   - **PDF**: columnas Descripción/Tags, Cuotas, Monto, Fecha, Categoría
   - **Excel**: columnas Descripción/Tags, Titular, Responsable, Monto, Cuotas, Fecha, Categoría
4. Usuario revisa, edita y guarda las transacciones seleccionadas

### Auto-asignación de Responsable
Al guardar, el responsable se infiere del `cardholder`:

| Cardholder contiene | Responsable |
|---------------------|-------------|
| `patricio` | Patricio |
| `mariana` / `maru` | Maru |
| `brenda` / `bren` | Bren |
| `micaela` / `mica` | Mica |

---

## UX/Diseño
- Tab activo usa `bg-white shadow-sm`, inactivo en gris
- En tab Manual: `max-w-2xl mx-auto` (formulario centrado)
- En tab Importar: ancho completo del layout para la tabla de revisión
- Feedback visual post-guardado: banner verde con cantidad de gastos guardados

