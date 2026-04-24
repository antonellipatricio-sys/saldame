# Módulo: Subir PDF

## Referencia al Código
- **Archivo principal:** [`src/pages/UploadPDFPage.tsx`](../../src/pages/UploadPDFPage.tsx)

## Descripción
Un módulo diseñado para automatizar las cargas de gastos que provienen de resúmenes mensuales que los bancos entregan como archivos Adobe PDF.

## Funcionamiento
1. **Dropzone:** Permite arrastrar un archivo PDF que suele contener el resumen de tarjetas de crédito.
2. **Parsing Local:** Se encarga de procesar el texto usando librerías de parseo PDF e interpretar patrones, o bien envía el archivo para análisis via OCR/API si estuviese implementado.
3. **Listado de Previsualización:** Se le devuelve al usuario todos los ítems parseados listos para revisar, asignar categorías si el sistema no los infirió y, finalmente, aprobar la carga al store.
