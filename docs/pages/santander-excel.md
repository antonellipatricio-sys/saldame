# Módulo: Santander Excel

## Referencia al Código
- **Archivo principal:** [`src/pages/UploadSantanderPage.tsx`](../../src/pages/UploadSantanderPage.tsx)

## Descripción
Esta página permite al usuario importar sus movimientos y compras directamente a través de una hoja de cálculo un archivo Excel (o CSV) exportado de la banca en línea de Santander. 

## Funcionamiento
1. **Selección del Archivo:** Se proporciona un área de Dropzone (probablemente utilizando el componente `FileUploader`) donde el usuario hace drop o selecciona su `.xlsx` o `.xls`.
2. **Procesamiento:** La página parsa el archivo (con utilidades como `xlsx`), lee las filas de transacciones, identifica fechas, montos, la moneda y el concepto de Santander.
3. **Mapeo / Categorización:** Permite mapear los resultados y categorizarlos antes de impactarlos al estado de la aplicación (`Store`).
4. **Guardado:** La información de gastos validada se sube a base de datos / store y a partir de ese momento aparecerá en el "Dashboard" y en "Mis Gastos".
