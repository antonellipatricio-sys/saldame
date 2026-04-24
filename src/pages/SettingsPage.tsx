import { Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function SettingsPage() {
    const { iibb, comisionTN, setIIBB, setComisionTN } = useAppStore();

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Settings className="text-gray-600" />
                    Configuración de Impuestos y Comisiones
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* IIBB Card */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ingresos Brutos (IIBB)
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm max-w-xs">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={iibb}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) setIIBB(val);
                                }}
                                className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-lg h-12"
                                placeholder="0.0"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 sm:text-lg">%</span>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Porcentaje de Ingresos Brutos a aplicar.
                        </p>
                    </div>

                    {/* Tienda Nube Comision Card */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comisión Tienda Nube
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm max-w-xs">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={comisionTN}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) setComisionTN(val);
                                }}
                                className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-lg h-12"
                                placeholder="0.0"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 sm:text-lg">%</span>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            Porcentaje de comisión cobrado por la plataforma.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
