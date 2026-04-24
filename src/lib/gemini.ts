import { GoogleGenAI } from '@google/genai';
import { defaultCategories } from './categories';
import type { Expense } from '@/types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function classifyExpense(description: string): Promise<string> {
  try {
    const categories = defaultCategories.map(c => c.name).join(', ');

    const prompt = `Clasifica el siguiente gasto en una de estas categorías: ${categories}.
    
Gasto: "${description}"

Responde SOLO con el nombre exacto de la categoría, sin puntos ni explicaciones.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const category = response.text?.trim() ?? '';

    const validCategory = defaultCategories.find(
      c => c.name.toLowerCase() === category.toLowerCase()
    );

    return validCategory ? validCategory.name : 'Otros';
  } catch (error) {
    console.error('Error al clasificar gasto:', error);
    return 'Otros';
  }
}

// ── Consultas en Lenguaje Natural ──────────────────────────────────────────────

interface ExpenseFilter {
  category?: string;
  cardLast4?: string;
  currency?: 'ARS' | 'USD';
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  descriptionContains?: string;
  tags?: string[];
}

/**
 * Interpreta una pregunta en lenguaje natural, filtra los gastos
 * y genera una respuesta usando Gemini.
 */
export async function queryExpenses(
  question: string,
  expenses: Expense[],
  categories: string[],
  tags: string[]
): Promise<string> {
  try {
    // Paso 1: Pedir a Gemini que interprete la pregunta como un filtro JSON
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const filterPrompt = `Sos un asistente financiero que ayuda a interpretar consultas sobre gastos personales.

Fecha de hoy: ${today}
Categorías disponibles: ${categories.join(', ')}
Etiquetas disponibles: ${tags.join(', ')}

El usuario pregunta: "${question}"

Respondé SOLO con un JSON válido (sin markdown, sin backticks, sin texto extra) con estos campos opcionales:
{
  "category": "nombre exacto de la categoría si aplica",
  "cardLast4": "últimos 4 dígitos si preguntan por tarjeta",
  "currency": "ARS o USD si especifican moneda",
  "dateFrom": "YYYY-MM-DD inicio del período",
  "dateTo": "YYYY-MM-DD fin del período",
  "descriptionContains": "texto a buscar en la descripción",
  "tags": ["etiqueta1"]
}

Reglas:
- "este mes" = ${currentYear}-${String(currentMonth).padStart(2, '0')}-01 a ${today}
- "mes pasado" = ${currentYear}-${String(currentMonth - 1 > 0 ? currentMonth - 1 : 12).padStart(2, '0')}-01 a ${currentYear}-${String(currentMonth - 1 > 0 ? currentMonth - 1 : 12).padStart(2, '0')}-${currentMonth - 1 === 2 ? '28' : '30'}
- Si no se especifica período, no pongas dateFrom/dateTo
- Solo incluí campos que apliquen a la pregunta
- Responde SOLO el JSON, nada más`;

    const filterResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: filterPrompt,
    });

    let filterText = filterResponse.text?.trim() ?? '{}';
    // Limpiar posibles backticks de markdown
    filterText = filterText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let filter: ExpenseFilter;
    try {
      filter = JSON.parse(filterText);
    } catch {
      filter = {};
    }

    // Paso 2: Aplicar el filtro sobre los gastos
    let filtered = [...expenses];

    if (filter.category) {
      const cat = filter.category.toLowerCase();
      filtered = filtered.filter(e => e.category.toLowerCase().includes(cat));
    }
    if (filter.cardLast4) {
      filtered = filtered.filter(e => e.cardLast4 === filter.cardLast4);
    }
    if (filter.currency) {
      filtered = filtered.filter(e => e.currency === filter.currency);
    }
    if (filter.dateFrom) {
      const from = new Date(filter.dateFrom);
      filtered = filtered.filter(e => new Date(e.date) >= from);
    }
    if (filter.dateTo) {
      const to = new Date(filter.dateTo + 'T23:59:59');
      filtered = filtered.filter(e => new Date(e.date) <= to);
    }
    if (filter.descriptionContains) {
      const search = filter.descriptionContains.toLowerCase();
      filtered = filtered.filter(e => e.description.toLowerCase().includes(search));
    }
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(e =>
        e.tags && filter.tags!.some(t => e.tags!.includes(t))
      );
    }

    // Paso 3: Calcular estadísticas del resultado
    const totalARS = filtered.filter(e => e.currency === 'ARS').reduce((s, e) => s + e.amount, 0);
    const totalUSD = filtered.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0);
    const count = filtered.length;

    const topCategories: Record<string, number> = {};
    filtered.forEach(e => {
      topCategories[e.category] = (topCategories[e.category] || 0) + e.amount;
    });
    const topCatsSorted = Object.entries(topCategories).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const topDescriptions = filtered
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => `${e.description}: ${e.currency === 'ARS' ? '$' : 'US$'}${e.amount.toLocaleString('es-AR')}`);

    // Paso 4: Generar respuesta natural con Gemini
    const answerPrompt = `Sos un asistente financiero amigable. Respondé en español argentino de forma clara y concisa.

Pregunta del usuario: "${question}"

Filtro aplicado: ${JSON.stringify(filter)}

Resultados:
- Total gastos encontrados: ${count}
- Total en ARS: $${totalARS.toLocaleString('es-AR')}
- Total en USD: US$${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Top categorías por monto: ${topCatsSorted.map(([c, a]) => `${c}: $${a.toLocaleString('es-AR')}`).join(', ') || 'N/A'}
- Top gastoss individuales: ${topDescriptions.join(' | ') || 'N/A'}

Respondé al usuario de forma directa y amigable. Usá formato markdown para que se lea lindo.
Si no hay datos, decilo amablemente. No inventes datos.`;

    const answerResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: answerPrompt,
    });

    return answerResponse.text?.trim() ?? 'No pude generar una respuesta. Intentá con otra pregunta.';
  } catch (error) {
    console.error('Error en queryExpenses:', error);
    return '❌ Hubo un error al procesar tu consulta. Verificá que la API Key de Gemini esté configurada correctamente.';
  }
}

