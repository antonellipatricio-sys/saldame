# Módulo: Layouts y Navegación

Los layouts determinan la estructura externa fundamental y la navegación a través de cada vista de la aplicación.

## 1. ExpenseLayout (Layout de Gastos)
- **Archivo Fuente:** [`src/components/layout/ExpenseLayout.tsx`](../src/components/layout/ExpenseLayout.tsx)
- **Propósito:** Actúa como el layout principal de cara al usuario para la app iterativa de gastos.
- **Componentes Clave:**
  - **Sidebar de Escritorio (`<aside>`):** Muestra todas las opciones de navegación lateral (Dashboard, Agregar Gastos, PDF, Santander, etc.).
  - **Bottom Navigation (Mobile):** El menú inferior que agrupa los iconos de visualización adaptado a dispositivos móviles para un acceso rápido con tab-bar.
- **Flujo:** Intercepta el evento `onPageChange` para modificar el estado en `App.tsx` y renderizar los distintos hijos (`children`) de páginas.

## 2. AppLayout (Layout Secundario / Herramientas)
- **Archivo Fuente:** [`src/components/layout/AppLayout.tsx`](../src/components/layout/AppLayout.tsx)
- **Propósito:** Un layout basado en Tabs superiores y Navbar, utilizado en partes accesorias o configurables del sistema (ej: herramientas como calculadora, variaciones de dólar y subidas directas a Ninox).
- **Componentes Clave:**
  - **Header Superior (`<header>`):** Elemento fijo superior con navegación alineada a la derecha. Consiste en enlaces de navegación principales que definen pestañas.

## 3. Coordinación Principal (Enrutador Simple)
- **Archivo Fuente:** [`src/App.tsx`](../src/App.tsx)
- **Propósito:** Actúa como el punto de anclaje principal para dictaminar qué layout está en uso, manteniendo un enrutador simple basado en estado local (`useState<Page>`) o global.
