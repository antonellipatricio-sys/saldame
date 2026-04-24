# Módulo: Gestión de Estado (Store)

Para el estado global de la interfaz o el almacenamiento de listados en memoria a lo largo del uso de la aplicación, el sistema utiliza un store que está en el directorio `src/store/`. Normalmente implementado vía `Zustand` u `Context`.

## 1. Store Principal (useAppStore)
- **Archivo Fuente:** [`src/store/useAppStore.ts`](../src/store/useAppStore.ts)
- **Propósito:** Consolidar lógica como:
  - Guardado temporal/permanente de gastos.
  - Configuración persistente del usuario.
  - Variables de entorno/entorno de red y estado UI cross-app.
- **Relaciones:** Se importa en páginas de carga y componentes de layout con el objetivo de alterar la vista simultáneamente (o viceversa, para escribir valores producto de una subida de PDF).
