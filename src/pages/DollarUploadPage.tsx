import { Upload } from 'lucide-react';
import { FileUploader } from '../components/upload/FileUploader';
import { useAppStore } from '../store/useAppStore';
import type { DollarRecord } from '../store/useAppStore';
import * as XLSX from 'xlsx';

export function DollarUploadPage() {
    const { setDollar, setDollarHistory, dollarHistory, clearDollarHistory } = useAppStore();

    const handleDataLoaded = (data: any[]) => {
        console.log("Datos Dólar Cargados:", data);

        if (data.length === 0) return;

        const history: DollarRecord[] = [];

        data.forEach((row: any) => {
            // Normalize keys to lowercase for searching
            const keys = Object.keys(row);
            const dateKey = keys.find(k => k.toLowerCase().includes('fecha') || k.toLowerCase().includes('date'));
            const valueKey = keys.find(k => k.toLowerCase().includes('venta') || k.toLowerCase().includes('valor') || k.toLowerCase().includes('precio'));

            if (dateKey && valueKey) {
                let dateStr = "";
                const dateVal = row[dateKey];
                let valueNum = 0;
                const valueRaw = row[valueKey];

                // 1. Parse Date (YYYY-MM)
                if (typeof dateVal === 'number') {
                    const date = XLSX.SSF.parse_date_code(dateVal);
                    dateStr = `${date.y}-${String(date.m).padStart(2, '0')}`;
                } else if (typeof dateVal === 'string') {
                    // Try DD/MM/YYYY
                    if (dateVal.includes('/')) {
                        const parts = dateVal.split('/');
                        if (parts.length === 3) {
                            // Asumimos DD/MM/YYYY
                            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}`;
                        }
                    } else {
                        try {
                            const d = new Date(dateVal);
                            if (!isNaN(d.getTime())) dateStr = d.toISOString().slice(0, 7);
                        } catch (e) { }
                    }
                }

                // 2. Parse Value (Standard or Comma Decimal)
                if (typeof valueRaw === 'number') {
                    valueNum = valueRaw;
                } else if (typeof valueRaw === 'string') {
                    // Handle "923,85" -> "923.85"
                    const normalized = valueRaw.replace(/\./g, '').replace(',', '.').trim();
                    const parsed = parseFloat(normalized);
                    if (!isNaN(parsed)) valueNum = parsed;
                }

                // 3. Validation: Value must be reasonable (e.g., > 0)
                if (dateStr && valueNum > 0 && valueNum < 20000) {
                    history.push({ date: dateStr, value: valueNum });
                }
            }
        });

        if (history.length > 0) {
            // Filter empty or invalid parsing
            const sortedHistory = history.sort((a, b) => a.date.localeCompare(b.date));
            setDollarHistory(sortedHistory);

            // Update current dollar to the latest one found
            const latest = sortedHistory[sortedHistory.length - 1];
            setDollar(latest.value);

            alert(`Historial cargado con ${sortedHistory.length} registros. Dólar actual: $${latest.value} (del mes ${latest.date})`);
        } else {
            alert("No se pudieron encontrar columnas válidas. Verifica que tengas 'Fecha' y 'Venta'.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Upload className="text-amber-500" />
                    Carga Variación Dólar Mensual
                </h2>
                <p className="text-gray-600 mb-6">
                    Sube el archivo Excel con el historial del dólar. Debe tener columnas <strong>Fecha</strong> y <strong>Venta</strong> (o Valor).
                </p>

                <FileUploader
                    onDataLoaded={handleDataLoaded}
                    title="Sube el Historial del Dólar"
                    description="Arrastra el Excel aquí"
                />

                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Previsualización de Datos Cargados:</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mes (YYYY-MM)</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {dollarHistory.slice().reverse().map((h, i) => (
                                    <tr key={h.date + i}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{h.date}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 text-right">${h.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {dollarHistory.length === 0 && <p className="p-4 text-center text-sm text-gray-400">Sin datos</p>}
                    </div>
                    {dollarHistory.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    if (confirm('¿Estás seguro de borrar todo el historial?')) {
                                        clearDollarHistory();
                                        alert('Historial eliminado.');
                                    }
                                }}
                                className="text-red-600 text-sm hover:underline font-medium"
                            >
                                Borrar Todo el Historial
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
