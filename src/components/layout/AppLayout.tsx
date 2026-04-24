import React from 'react';
import { Calculator, Upload, DollarSign, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

// We'll use a simple state for tab switching for now
type Tab = 'calculator' | 'upload-ninox' | 'upload-dollar' | 'settings';

interface AppLayoutProps {
    children: React.ReactNode;
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Navigation */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <Calculator className="h-8 w-8 text-blue-600" />
                            <span className="font-bold text-xl text-gray-900">Saldame Calculator</span>
                        </div>

                        <nav className="flex space-x-4">
                            <button
                                onClick={() => onTabChange('calculator')}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    activeTab === 'calculator'
                                        ? "bg-blue-100 text-blue-700"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Calculator size={18} />
                                Calculadora
                            </button>

                            <button
                                onClick={() => onTabChange('upload-ninox')}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    activeTab === 'upload-ninox'
                                        ? "bg-green-100 text-green-700"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Upload size={18} />
                                Carga Costos Ninox
                            </button>

                            <button
                                onClick={() => onTabChange('upload-dollar')}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    activeTab === 'upload-dollar'
                                        ? "bg-amber-100 text-amber-700"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <DollarSign size={18} />
                                Variación Dólar
                            </button>

                            <button
                                onClick={() => onTabChange('settings')}
                                className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                                    activeTab === 'settings'
                                        ? "bg-gray-200 text-gray-800"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                )}
                            >
                                <Settings size={18} />
                                Configuración
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
        </div>
    );
}
