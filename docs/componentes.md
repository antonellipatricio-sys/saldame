# Módulo: Componentes Reusables (Components)

Para organizar el código UI se generan agrupaciones de distintos recursos dentro de la carpeta `src/components/`.

## 1. Calculadora (`src/components/calculator/`)
- Módulo encargado del diseño interactivo de una calculadora y sus tablas de datos asociadas.
- **Archivos de Referencia:**
  - [`CalculatorTable.tsx`](../src/components/calculator/CalculatorTable.tsx): Instancia principal de la representación en forma de tabla.
  - [`CalculatorHeader.tsx`](../src/components/calculator/CalculatorHeader.tsx): Encabezado superior interactivo de la herramienta.

## 2. Componentes de Sistema de Carga (`src/components/upload/`)
- Componentes especializados o unificados que manejan Drag and Drop y subida de archivos (e.g., CSV, XLSX, PDF). Utilizados típicamente de forma transversal por las vistas (`UploadPDFPage`, `UploadSantanderPage`).
- **Archivo de Referencia (Ejemplo):**
  - [`FileUploader.tsx`](../src/components/upload/FileUploader.tsx): Control agnóstico que soporta la subida del input file local.

## 3. Elementos Extras / UI (`src/components/tags/`)
- Se presume la agrupación de recursos atómicos (Tags, Badges, etc.) para el dibujado visual y tipificación de estados y datos estéticos con `lucide-react` y variables de Tailwind.
