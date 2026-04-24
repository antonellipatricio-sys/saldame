import { useAppStore } from '../../store/useAppStore';

export function CalculatorTable() {
    const { products, updateProductMargin } = useAppStore();

    if (products.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-lg">No hay productos cargados.</p>
                <p className="text-gray-400 text-sm mt-2">Ve a la pestaña "Carga Costos Ninox" para comenzar.</p>
            </div>
        );
    }

    // Formatting helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead>
                        <tr>
                            {/* Standard Headers - Dark Green Background */}
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                CÓDIGO
                            </th>
                            <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                DESCRIPCIÓN (NX)
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                Precio NUEVO<br />Tienda Nube
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                Precio actual<br />Ninox Tienda Nube
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                DIF Tienda Nube<br />(calc - actual)
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                COSTO
                            </th>
                            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                FECHA ACT.
                            </th>
                            <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                % Ganancia
                            </th>
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#1e4620]">
                                Ganancia
                            </th>
                            {/* Last Header - Blue Background */}
                            <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-white uppercase tracking-wider bg-[#2563eb]">
                                Ganancia<br />Precio p/ act TN
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors text-sm">
                                <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 border-r border-gray-200">
                                    {product.codigo}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-500 max-w-xs truncate border-r border-gray-200" title={product.descripcion}>
                                    {product.descripcion}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right font-bold text-gray-900 border-r border-gray-200">
                                    {formatCurrency(product.precioNuevo)}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700 border-r border-gray-200">
                                    {formatCurrency(product.precioTiendaNube)}
                                </td>

                                {/* Difference Column - Red bg if negative */}
                                <td className={`px-3 py-2 whitespace-nowrap text-right border-r border-gray-200 ${product.diferencia < 0 ? 'bg-red-600 text-white font-bold' : 'text-gray-900'}`}>
                                    {formatCurrency(product.diferencia)}
                                </td>

                                {/* Cost Column - Pink bg */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900 border-r border-gray-200 bg-pink-100">
                                    {formatCurrency(product.costoReposicion)}
                                </td>

                                {/* Date Column - New */}
                                <td className="px-3 py-2 whitespace-nowrap text-center text-gray-500 border-r border-gray-200 text-xs font-mono">
                                    {product.fechaCompra ? product.fechaCompra.split('-').reverse().join('/') : '-'}
                                </td>

                                {/* Margin Column - Yellow bg */}
                                <td className="px-3 py-2 whitespace-nowrap text-center border-r border-gray-200 bg-yellow-100">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="number"
                                            step="1"
                                            value={Math.round(product.margen * 100)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) {
                                                    updateProductMargin(product.id, val / 100);
                                                }
                                            }}
                                            className="w-12 text-center bg-transparent border-b border-gray-400 focus:border-blue-500 focus:outline-none text-sm font-semibold"
                                        />
                                        <span className="ml-0.5 text-gray-700 font-bold">%</span>
                                    </div>
                                </td>

                                {/* Profit Column */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900 border-r border-gray-200">
                                    {formatCurrency(product.gananciaEstimada || 0)}
                                </td>

                                {/* Net Result Column (Mystery Column) */}
                                <td className="px-3 py-2 whitespace-nowrap text-right text-gray-900 bg-white">
                                    {formatCurrency(product.resultadoNeto || 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {
                products.length > 0 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 text-right">
                        Mostrando {products.length} productos
                    </div>
                )
            }
        </div>
    );
}
