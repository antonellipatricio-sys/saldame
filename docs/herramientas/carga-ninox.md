# Herramienta: Carga Costos Ninox

Sincronización de datos con plataforma Ninox para workflows empresariales.

## Referencia al Código
- **Archivo principal:** [`src/pages/NinoxUploadPage.tsx`](../../src/pages/NinoxUploadPage.tsx)
- **Integración**: API REST Ninox

## Descripción

Página encargada de realizar sincronización bidireccional con la plataforma Ninox, conectando el store local con bases de datos en la nube de Ninox.

## Funcionamiento

### Flujo de Sincronización

```
┌─────────────────────────────┐
│ useExpenseStore (Local)     │
│ expenses[]                  │
└────────────┬────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Ninox API (REST)       │
    │ POST /records          │
    └────────────────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Ninox Cloud DB         │
    │ (Enterprise Database)  │
    └────────────────────────┘
```

### Configuración

Usuario debe proporcionar:
1. **API Key**: Credencial de Ninox
2. **Workspace ID**: Identificador del workspace
3. **Table Name**: Nombre de la tabla destino (ej: "Gastos")

```
┌──────────────────────────────────┐
│ Configuración Ninox              │
├──────────────────────────────────┤
│ API Key: [•••••••••••••••]        │
│ Workspace: [Select dropdown ▼]   │
│ Tabla: [Select dropdown ▼]       │
│                                  │
│         [Guardar Config]         │
└──────────────────────────────────┘
```

### Proceso de Carga

1. **Conectar**: Valida credenciales
2. **Mapeo**: Define qué campos locales → campos Ninox

```
Local Field          Ninox Field
─────────────────────────────────
description    →     Concepto
amount         →     Monto
currency       →     Moneda
category       →     Categoría
date           →     Fecha
```

3. **Preview**: Muestra gastos que se cargarán
4. **Upload**: Sincroniza a Ninox
5. **Confirmación**: "X registros cargados"

### Mapeo de Datos

Permite customizar mapeo de campos:
```
┌────────────────────────────────────┐
│ Mapeo de Campos                    │
├────────────────────────────────────┤
│ description → [Concepto ▼]         │
│ amount → [Monto ▼]                 │
│ currency → [Moneda ▼]              │
│ category → [Categoría ▼]           │
│ date → [Fecha ▼]                   │
│ tags → [Etiquetas ▼]               │
│ notes → [Notas ▼]                  │
│                                    │
│         [Aplicar Mapeo]            │
└────────────────────────────────────┘
```

## Sincronización Bidireccional (Futuro)

Actualmente: Solo **upload** (local → Ninox)

Futuro podría soportar:
- download (Ninox → local)
- Two-way sync (bidireccional)

```
useExpenseStore  ←→  Ninox DB
  (local)            (cloud)
```

## Casos de Uso

### Caso 1: Empresa rastreando gastos
```
Usuario: Contador que usa Saldame para gastos personales
Necesidad: Transferir datos a Ninox para reportes fiscales

Flujo:
  1. Configura credenciales Ninox
  2. Selecciona período (ej: "Mayo 2026")
  3. Filtra por etiqueta (ej: "Gastos Deducibles")
  4. Carga a tabla "Gastos_Fiscales" en Ninox
  5. En Ninox: Genera reportes, PDFs, integraciones
```

### Caso 2: Team dashboard
```
Usuario: Gerente de proyecto
Necesidad: Resumen de gastos de equipo en Ninox

Flujo:
  1. Cada miembro carga sus gastos en Saldame
  2. Coordinador sincroniza a Ninox
  3. Dashboard en Ninox muestra totales por persona
```

## API de Ninox

### Autenticación
```http
POST https://api.ninox.com/v1/records
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "fields": {
    "Concepto": "CARREFOUR",
    "Monto": 2500,
    "Moneda": "ARS",
    "Categoría": "Supermercado",
    "Fecha": "2026-05-05"
  }
}
```

### Endpoints
- `GET /tables` - Listar tablas del workspace
- `GET /fields` - Listar campos de tabla
- `POST /record` - Crear registro
- `PUT /records/{id}` - Actualizar registro
- `DELETE /records/{id}` - Eliminar registro

## Manejo de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| "API Key inválida" | Credencial expirada/incorrecta | Regenerar en Ninox settings |
| "Workspace no encontrado" | ID incorrecto | Verificar Workspace ID |
| "Tabla no existe" | Table Name typo | Usar nombre exacto de Ninox |
| "Campo no coincide" | Mapeo erróneo | Re-mapear campos |
| "Timeout" | Red lenta | Reintentar con menos registros |

## Ventajas
- ✅ Integración con herramienta profesional
- ✅ Exportación masiva
- ✅ Customizable (mapeo de campos)
- ✅ Auditoría en cloud

## Limitaciones
- ❌ Requiere credenciales Ninox (pago)
- ❌ Solo upload (no sync bidireccional)
- ❌ Sin verificación de duplicados
- ❌ Limite de API rate

## Roadmap
- [ ] Sincronización bidireccional
- [ ] Descarga desde Ninox
- [ ] Sincronización automática (scheduled)
- [ ] Integración de múltiples workspaces
- [ ] Webhook para cambios en tiempo real
