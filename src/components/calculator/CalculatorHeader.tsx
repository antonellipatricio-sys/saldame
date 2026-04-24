import { DollarSign } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function CalculatorHeader() {
    const { dollar, setDollar, products } = useAppStore();

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap items-center justify-between gap-4">

            {/* Dollar Input */}
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <DollarSign className="text-blue-600" size={20} />
                <span className="font-semibold text-blue-900">Precio Dólar Hoy:</span>
                <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                        type="number"
                        value={dollar}
                        onChange={(e) => setDollar(Number(e.target.value))}
                        className="pl-6 w-28 py-1 px-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
                    />
                </div>
            </div>

            {/* KPI Stats */}
            <div className="flex gap-6">
                <div className="text-center">
                    <span className="block text-xs text-gray-500 uppercase font-semibold">Productos</span>
                    <span className="text-xl font-bold text-gray-800">{products.length}</span>
                </div>
                {/* We can add more stats here later like "Avg Margin" */}
            </div>

        </div>
    );
}
