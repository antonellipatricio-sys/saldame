import { Upload, Trash2 } from 'lucide-react';
import { FileUploader } from '../components/upload/FileUploader';
import { useAppStore } from '../store/useAppStore';
import type { Product } from '../store/useAppStore';
import * as XLSX from 'xlsx';

export function NinoxUploadPage() {
    const { setProducts, products, clearProducts, setDollar, iibb, comisionTN, setIIBB, setComisionTN } = useAppStore();

    const handleDataLoaded = (data: any[]) => {
        console.log("Datos Productos Cargados:", data);

        if (data.length === 0) return;

        if (data.length === 0) return;

        // 1. Detect Header Row
        // We look for a row that contains "codigo" AND ("descripcion" OR "articulo") values.
        let headerRowIndex = -1;
        let headerMap: Record<string, string> = {}; // Standardized Key -> Original JSON Key

        const normalize = (str: any) => String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        // Scan first 10 rows
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            const values = Object.values(row).map(v => normalize(v));

            const hasCode = values.some(v => v.includes('codigo') || v.includes('code'));
            const hasDesc = values.some(v => v.includes('descripcion') || v.includes('articulo') || v.includes('producto'));

            if (hasCode && hasDesc) {
                headerRowIndex = i;
                // Build Header Map: Val -> Key
                Object.entries(row).forEach(([k, v]) => {
                    headerMap[normalize(v)] = k;
                });
                break;
            }
        }

        // If no header row found in data values, maybe the KEYS themselves are the headers (standard case)
        if (headerRowIndex === -1) {
            // Check keys of first row
            const keys = Object.keys(data[0]);
            const values = keys.map(k => normalize(k));
            const hasCode = values.some(v => v.includes('codigo') || v.includes('code'));
            const hasDesc = values.some(v => v.includes('descripcion') || v.includes('articulo') || v.includes('producto'));

            if (hasCode && hasDesc) {
                // The keys are the headers
                headerRowIndex = -1; // Flag that we start from 0 and keys are map
                keys.forEach(k => {
                    headerMap[normalize(k)] = k;
                });
            }
        }

        console.log("Header detected at row/mode:", headerRowIndex, headerMap);

        // Helper to get value from a row using fuzzy column name
        const getValue = (row: any, map: Record<string, string>, searchKeys: string[]) => {
            // Find the JSON key that corresponds to one of our searchKeys
            const foundHeaderVal = Object.keys(map).find(hVal => searchKeys.some(sk => hVal.includes(sk)));
            if (!foundHeaderVal) return null;
            const jsonKey = map[foundHeaderVal];
            return row[jsonKey];
        };

        // Data starts after header row
        const dataRows = headerRowIndex === -1 ? data : data.slice(headerRowIndex + 1);

        const mappedProducts: Product[] = dataRows.map((row: any, index: number) => {
            // Define Search Keys
            const codigoVal = getValue(row, headerMap, ['codigo', 'code', 'sku']) || `gen-${index}`;
            const descVal = getValue(row, headerMap, ['descripcion', 'articulo', 'producto', 'nombre']) || 'Sin Descripción';

            // Numerical Values
            const precioTnKey = getValue(row, headerMap, ['precio venta', 'tienda nube', 'precio tn']);
            const costoNinoxKey = getValue(row, headerMap, ['costo en pesos', 'costo ninox', 'costo compra', 'costo historico']);
            const costoUsdKey = getValue(row, headerMap, ['costo en dolares', 'costo usd', 'usd']);
            const dolarBaseKey = getValue(row, headerMap, ['valor del dolar', 'dolar oficial', 'dolar bna']);
            const costoHoyKey = getValue(row, headerMap, ['costos en pesos (hoy)', 'costo hoy', 'peso hoy']);

            const ivaKey = getValue(row, headerMap, ['iva', 'alicuota']);
            const fechaKey = getValue(row, headerMap, ['fecha de actualizacion', 'fecha costo', 'fecha compra']);
            const margenKey = getValue(row, headerMap, ['ganancia', 'margen', 'profit']); // New

            // Parsing
            const precioTiendaNube = typeof precioTnKey === 'number' ? precioTnKey : parseFloat(String(precioTnKey).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
            const costoHistorico = typeof costoNinoxKey === 'number' ? costoNinoxKey : parseFloat(String(costoNinoxKey).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
            const costoUSD = typeof costoUsdKey === 'number' ? costoUsdKey : parseFloat(String(costoUsdKey).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
            const dolarBase = typeof dolarBaseKey === 'number' ? dolarBaseKey : parseFloat(String(dolarBaseKey).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;
            const costoHoy = typeof costoHoyKey === 'number' ? costoHoyKey : parseFloat(String(costoHoyKey).replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0;

            // IVA
            let iva = 0;
            if (ivaKey) {
                if (typeof ivaKey === 'number') iva = ivaKey < 1 ? ivaKey * 100 : ivaKey;
                else {
                    let clean = String(ivaKey).replace('%', '').replace(',', '.');
                    iva = parseFloat(clean) || 0;
                }
            }

            // Margen (Ganancia)
            let margen = 0.30; // Default fallback
            if (margenKey) {
                if (typeof margenKey === 'number') {
                    // Start assuming > 1 is percent (e.g. 35 -> 0.35), < 1 is decimal (0.35 -> 0.35)
                    margen = margenKey > 1 ? margenKey / 100 : margenKey;
                } else {
                    let clean = String(margenKey).replace('%', '').replace(',', '.').trim();
                    let parsed = parseFloat(clean);
                    if (!isNaN(parsed)) {
                        margen = parsed > 1 ? parsed / 100 : parsed;
                    }
                }
            }

            // Date Parsing
            let fechaCompra = new Date().toISOString().slice(0, 10);
            if (fechaKey) {
                try {
                    if (typeof fechaKey === 'number') {
                        const d = XLSX.SSF.parse_date_code(fechaKey);
                        let y = d.y < 100 ? d.y + 2000 : d.y;
                        fechaCompra = `${y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
                    } else {
                        const str = String(fechaKey).trim();
                        // Try parsing DD/MM/YYYY
                        if (str.includes('/')) {
                            const parts = str.split('/');
                            if (parts.length === 3) {
                                let y = parseInt(parts[2]);
                                if (y < 100) y += 2000;
                                fechaCompra = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                        }
                    }
                } catch (e) { }
            }

            return {
                id: String(codigoVal),
                codigo: String(codigoVal),
                descripcion: String(descVal),
                precioTiendaNube,
                costoHistorico,
                costoUSD,
                dolarBase,
                fechaCompra,
                iva,
                // If the Excel provides "Costos en pesos (hoy)", we use that as our starting CostoReposicion
                costoReposicion: costoHoy > 0 ? costoHoy : costoHistorico,
                margen: margen > 0 ? margen : 0.30, // Extracted or default 0.30
                precioNuevo: 0,
                diferencia: 0,
                gananciaEstimada: 0,
                resultadoNeto: 0
            };
        });

        // 5. Global Dollar Detection (metadata scan)
        // Scan original RAW data for "valor dolar... hoy"
        // We look for a cell containing "hoy" and "dolar" and take the value next to it or in it
        if (setDollar) {
            // Naive scan of first 5 rows' values
            for (let i = 0; i < Math.min(5, data.length); i++) {
                const vals = Object.values(data[i]);
                // Look for number around 1000-2000
                const potentialDollar = vals.find(v => typeof v === 'number' && v > 500 && v < 2000);
                if (potentialDollar) {
                    // Check keys or context
                    // This is risky. Let's look for known labels in keys or values
                    const gridStr = JSON.stringify(data[i]).toLowerCase();
                    if (gridStr.includes('hoy') && gridStr.includes('dolar')) {
                        setDollar(Number(potentialDollar));
                        break;
                    }
                }
            }
        }


        setProducts(mappedProducts);
        alert(`Se han cargado ${mappedProducts.length} productos correctamente.`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Upload className="text-green-600" />
                    Carga Costos Ninox
                </h2>

                {/* GLOBAL SETTINGS CARD */}
                <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-blue-800 uppercase mb-1">
                            IIBB (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={iibb}
                            onChange={(e) => setIIBB(Number(e.target.value))}
                            className="w-full border-blue-200 rounded text-sm p-2 focus:ring-blue-500"
                            placeholder="ej. 3.5"
                        />
                        <p className="text-xs text-blue-600 mt-1">Impuesto a los Ingresos Brutos.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-blue-800 uppercase mb-1">
                            Comisión TN (%)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={comisionTN}
                            onChange={(e) => setComisionTN(Number(e.target.value))}
                            className="w-full border-blue-200 rounded text-sm p-2 focus:ring-blue-500"
                            placeholder="ej. 10"
                        />
                        <p className="text-xs text-blue-600 mt-1">Costo por venta en Tienda Nube + Gateway.</p>
                    </div>
                </div>

                <p className="text-gray-600 mb-6">
                    Sube los archivos CSV de productos. Asegúrate de incluir la columna <strong>Fecha</strong> y <strong>Ganancia</strong> para el cálculo correcto.
                </p>

                <FileUploader
                    onDataLoaded={handleDataLoaded}
                    title="Sube el Excel de Productos"
                    description="Arrastra el archivo Ninox aquí"
                />

                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Previsualización de Datos Cargados ({products.length}):</h3>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Precio TN</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Costo Hist.</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 text-blue-600">Dólar Base</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 text-green-600">Costo USD</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 font-bold">Costo Hoy</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Fecha</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">IVA (%)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-sm text-gray-400">
                                            No hay datos cargados.
                                        </td>
                                    </tr>
                                ) : (
                                    products.slice(0, 100).map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{p.codigo}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs" title={p.descripcion}>{p.descripcion}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(p.precioTiendaNube)}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(p.costoHistorico)}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-blue-600 text-right">
                                                {p.dolarBase ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(p.dolarBase) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-green-600 text-right font-medium">
                                                {p.costoUSD ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.costoUSD) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900 text-right font-bold bg-gray-50">
                                                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(p.costoReposicion)}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500 text-center">{p.fechaCompra}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600 text-right">{p.iva}%</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {products.length > 100 && (
                        <p className="text-xs text-gray-400 mt-2 text-right">Mostrando primeros 100 registros de {products.length}</p>
                    )}

                    {products.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    if (confirm('¿Estás seguro de ELIMINAR TODOS los productos? Esta acción no se puede deshacer.')) {
                                        clearProducts();
                                    }
                                }}
                                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-semibold"
                            >
                                <Trash2 size={18} />
                                Eliminar Todo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

