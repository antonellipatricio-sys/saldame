# Módulo: Estado de Cuenta (Consultas IA)

Preguntas en lenguaje natural sobre gastos con respuestas inteligentes vía Gemini API.

## Referencia al Código
- **Archivo principal:** [`src/pages/QueryPage.tsx`](../../../src/pages/QueryPage.tsx)
- **Integración IA**: [`src/lib/gemini.ts`](../../../src/lib/gemini.ts)

## Descripción
Interface para formular preguntas sobre gastos en **lenguaje natural** (español/inglés) y recibir respuestas automáticas procesadas por IA (Gemini API).

## Ejemplos de Preguntas

### Consultas Simples
```
Q: "¿Cuánto gasté en comida este mes?"
A: Gastaste $8.500 en la categoría Comida y Restaurantes.
   Incluye: CARREFOUR ($2.500), MOSTAZA ($1.200), etc.
```

### Consultas Complejas
```
Q: "¿Cuál fue mi gasto promedio en transporte el mes pasado vs este mes?"
A: 
  Mes pasado: $2.150 promedio (6 viajes)
  Este mes: $1.950 promedio (8 viajes)
  Variación: ↓ -9.3%
  
  Conclusión: Viajaste más económicamente este mes.
```

### Consultas Exploratorias
```
Q: "¿En qué gasté más dinero?"
A: Top 3:
  1. Supermercado: $15.500 (44% del total)
  2. Comida y Restaurantes: $8.200 (23%)
  3. Servicios: $5.600 (16%)
  
  El 67% de tus gastos están en estas 3 categorías.
```

### Consultas Condicionales
```
Q: "¿Cuántas veces pagué en efectivo?"
A: 12 transacciones en efectivo.
   Total: $3.850 ARS
   Promedio: $320 por transacción
```

## Arquitectura

### Flujo de Procesamiento
```
┌──────────────────────────┐
│ Usuario escribe pregunta │
└──────────────┬───────────┘
               │
               ▼
    ┌─────────────────────────┐
    │ QueryPage detecta intent│
    │ (precio, categoría,     │
    │  fecha, cantidad, etc)  │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ useExpenseStore filtra  │
    │ gastos según intent     │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │ Gemini API interpreta   │
    │ y formatea respuesta    │
    │ (markdown + emojis)     │
    └────────────┬────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │ Mostrar resultado en UI  │
    │ (Markdown renderer)      │
    └──────────────────────────┘
```

### Parsing de Intentos

Gemini determina:
- **Período**: este mes, mes pasado, últimos 3 meses, 2026, custom
- **Categoría**: si menciona "comida", "transporte", etc.
- **Métrica**: total, promedio, máximo, mínimo, contar
- **Comparación**: vs otro período, vs promedio
- **Filtros**: moneda, etiqueta, forma de pago

```typescript
// El prompt que se envía a Gemini:
const prompt = `
Eres un asistente financiero. Tienes acceso a estos datos de gastos del usuario:

${JSON.stringify(expenses, null, 2)}

Categorías disponibles:
${categoryList}

El usuario pregunta: "${userQuery}"

Responde en Markdown. Sé conciso, amigable y útil. 
Incluye emojis cuando sea apropiado.
Si no tienes suficiente información, di "No tengo datos para responder esto".
`;

const response = await model.generateContent(prompt);
```

## Tipos de Respuestas

### Tipo 1: Agregación
```
Q: "¿Cuánto es el total?"
R: ### Total de Gastos
   **Mes actual**: $35.200 ARS + $250 USD
```

### Tipo 2: Comparativa
```
Q: "Comparar abril vs mayo"
R: ### Comparativa April vs Mayo
   | Métrica | Abril | Mayo | Cambio |
   |---------|-------|------|--------|
   | Total   | $28k  | $35k | ↑ +25% |
```

### Tipo 3: Recomendación
```
Q: "¿Debo preocuparme por mis gastos?"
R: 📊 **Análisis**: 
   - Este mes gastan 15% más que el promedio.
   - TOP categoría (Supermercado) representa 45% del total.
   - Recomendación: Revisar compras de supermercado.
```

### Tipo 4: Búsqueda
```
Q: "Muestra mis gastos en Netflix"
R: 📹 **Netflix**:
   - 01/05: $299 ARS
   - 02/04: $299 ARS
   - 03/03: $299 ARS
   Total: $897 (suscripción regular)
```

## Características

### Guardado de Consultas
Cada consulta se almacena localmente:
```typescript
const [queryHistory, setQueryHistory] = useState<Query[]>([
  { id: 1, text: "¿Cuánto gasté en comida?", result: "...", date: ... },
  { id: 2, text: "¿Cuál es mi gasto promedio?", result: "...", date: ... },
]);
```

Usuario puede ver historial y recuperar consultas previas.

### Sugerencias Rápidas
Botones de template:
- "💰 ¿Cuánto gasté este mes?"
- "📊 ¿En qué categoría gasté más?"
- "🔄 Comparar este mes vs último"
- "⚠️ ¿Hay gastos anormales?"

### Modo Voz (Futuro)
Botón y micrófono para dictar preguntas.

## Limitaciones Actuales

- ❌ No puede acceder a datos en tiempo real si offline
- ❌ Respuesta depende de calidad de Gemini
- ❌ No puede ejecutar acciones (solo leer)
- ❌ Latencia de red (~2-3 segundos)
- ❌ Costo de API (Gemini usage)

## Ventajas
- ✅ Interfaz natural e intuitiva
- ✅ Responde preguntas complejas
- ✅ Sin necesidad de aprender filtros UI
- ✅ Análisis automático e insights
- ✅ Histórico de consultas

## Roadmap
- [ ] Ejecución de acciones ("Elimina gastos > $10k")
- [ ] Integración con alertas ("Avísame si gasto > $50k")
- [ ] Análisis predictivo ("¿Cuánto gastaré en mayo?")
- [ ] Exportar resultado a PDF
- [ ] Compartir consulta (gen link)
- [ ] Fine-tuning de modelo con datos históricos del usuario
