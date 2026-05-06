# Módulo: Layouts y Navegación

Los layouts determinan la estructura externa fundamental y la navegación a través de cada vista de la aplicación.

## 1. ExpenseLayout (Layout de Gastos)
- **Archivo Fuente:** [`src/components/layout/ExpenseLayout.tsx`](../src/components/layout/ExpenseLayout.tsx)
- **Propósito:** Layout principal de la app privada de gastos.
- **Componentes Clave:**
  - **Sidebar de Escritorio (`<aside>`):** Muestra todas las opciones de navegación lateral. El ítem activo se resalta con fondo morado `brand-primary`.
  - **Bottom Nav Bar (Mobile):** Barra de navegación fija en la parte inferior, siempre visible. Muestra todos los ítems con icono + primera palabra del label. El ítem activo se marca con color `brand-primary` y un punto indicador.
  - **Logo del Pato:** Visible en ambos contextos. `w-28` en sidebar desktop, `w-10` en header mobile compacto.
- **Flujo:** Intercepta `onPageChange` para modificar el estado en `App.tsx` y renderizar los hijos.

### Orden de navegación

| # | Label | Page ID |
|---|---|---|
| 1 | Estado de Cuenta | `account` |
| 2 | Agregar Gasto | `add-expense` |
| 3 | Mis Gastos | `expenses` |
| 4 | Inicio | `dashboard` |
| 5 | Categorías | `categories` |
| 6 | Etiquetas | `tags` |
| 7 | Responsables | `responsables` |
| 8 | Consultas IA | `query` |
| 9 | Gastos Comp. | `shared-expenses` |

## 2. AppLayout (Layout Secundario / Herramientas)
- **Archivo Fuente:** [`src/components/layout/AppLayout.tsx`](../src/components/layout/AppLayout.tsx)
- **Propósito:** Un layout basado en Tabs superiores y Navbar, utilizado en partes accesorias del sistema (herramientas: calculadora, variaciones de dólar, Ninox).
- **Componentes Clave:**
  - **Header Superior (`<header>`):** Elemento fijo superior con logo del pato (`w-16`) y nombre de la app. Contiene navegación en pestañas alineadas a la derecha.

## 3. Coordinación Principal (Enrutador Simple)
- **Archivo Fuente:** [`src/App.tsx`](../src/App.tsx)
- **Propósito:** Punto de anclaje principal que determina el layout activo. Gestiona estado de autenticación (PIN) y el enrutamiento entre la app privada y la ruta pública `/gastos`.
- **Pantalla de Login:** Reemplaza el ícono genérico de candado por el logo del pato (`w-24`), con título en `brand-primary` y botón "Ingresar" en `brand-success`.

## 4. Identidad Visual (Design Tokens)
Los colores de marca están definidos en `src/index.css` mediante `@theme {}` de Tailwind v4:
- `bg-brand-primary` / `text-brand-primary` → `#7D52B5` (Morado Pato)
- `bg-brand-success` / `text-brand-success` → `#2D9354` (Verde Esmeralda)
- `bg-brand-bg` → `#F2F2F2` (Fondo general)
- `text-brand-text` → `#B2A4D4` (Subtítulos suaves)

