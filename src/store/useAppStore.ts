import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
    id: string;
    codigo: string;
    descripcion: string;
    precioTiendaNube: number;
    costoHistorico: number; // The cost from the Excel (historical)

    fechaCompra: string; // ISO Date string (YYYY-MM-DD or DD/MM/YYYY)
    iva: number; // VAT percentage (e.g. 0.21 or 21)

    // New fields from Excel 2.0
    costoUSD?: number;
    dolarBase?: number; // The dollar value at the time of purchase/update

    // Calculated / Editable
    costoReposicion: number; // Calculated based on dollar variation
    margen: number;
    precioNuevo: number;
    diferencia: number;
    gananciaEstimada: number;
    resultadoNeto: number;
}

export interface DollarRecord {
    date: string; // YYYY-MM
    value: number;
}

interface AppState {
    products: Product[];
    dollar: number;
    dollarHistory: DollarRecord[];

    // Global Settings
    iibb: number; // Percentage (e.g. 0.03 for 3%)
    comisionTN: number; // Percentage (e.g. 0.10 for 10%)

    setProducts: (products: Product[]) => void;
    setDollar: (value: number) => void;
    setDollarHistory: (history: DollarRecord[]) => void;
    setIIBB: (value: number) => void;
    setComisionTN: (value: number) => void;
    updateProductMargin: (id: string, newMargin: number) => void;

    recalculateAllCosts: () => void;
    clearProducts: () => void;
    clearDollarHistory: () => void;
}

// Helper to find dollar value for a specific date (YYYY-MM)
export const getDollarForDate = (date: string, history: DollarRecord[]): number => {
    if (!date) return 0;
    // date is expected to be YYYY-MM-DD or similar. We need YYYY-MM
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 0;

    const key = dateObj.toISOString().slice(0, 7); // YYYY-MM
    const record = history.find(h => h.date === key);
    return record?.value || 0;
};

// Helper to calculate price with the user's specific formula:
// (CostoActualizado / (1 + IVA)) * (1 + Ganancia) * (1 + IVA) / (1 - (IIBB + Comisiones) * (1 + IVA))
// Helper to calculate price with the MASTER PROMPT formula:
// 1. Costo Pesificado ($CostoActualizado) = Costo_USD * Valor_Dolar_Reciente (Calculated outside)
// 2. Costo Neto (Sin IVA): Neto = CostoActualizado / (1 + IVA)
// 3. Margen Real: NetoConGanancia = Neto * (1 + Ganancia)
// 4. Subtotal con IVA: SubtotalIVA = NetoConGanancia * (1 + IVA)
// 5. Precio Venta Final: PrecioFinal = SubtotalIVA / (1 - ((IIBB + Comisiones) * (1 + IVA)))
const calculatePrice = (costoActualizado: number, margen: number, ivaPercent: number, iibbPercent: number, comisionPercent: number) => {
    const ivaDecimal = ivaPercent / 100;
    const iibbDecimal = iibbPercent / 100;
    const comisionDecimal = comisionPercent / 100;

    // 1. Costo Neto (Sin IVA)
    // "Neto = CostoActualizado / (1 + IVA)"
    const neto = costoActualizado / (1 + ivaDecimal);

    // 2. Margen Real
    // "NetoConGanancia = Neto * (1 + Ganancia)"
    const netoConGanancia = neto * (1 + margen);

    // 3. Subtotal con IVA
    // "SubtotalIVA = NetoConGanancia * (1 + IVA)"
    const subtotalIVA = netoConGanancia * (1 + ivaDecimal);

    // 4. Precio Venta Final (Groserado)
    // "PrecioFinal = SubtotalIVA / (1 - ((IIBB + Comisiones) * (1 + IVA)))"
    const denominator = 1 - ((iibbDecimal + comisionDecimal) * (1 + ivaDecimal));

    let precioFinal = 0;
    if (denominator > 0) {
        precioFinal = subtotalIVA / denominator;
    } else {
        precioFinal = subtotalIVA; // Safety fallback
    }

    // 5. Rounding Logic (Match Excel REDOND.MULT / MROUND)
    if (precioFinal < 50000) {
        // Round to nearest 500
        return Math.round(precioFinal / 500) * 500;
    } else {
        // Round to nearest 1000
        return Math.round(precioFinal / 1000) * 1000;
    }
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            products: [],
            dollar: 1200, // Default current dollar
            dollarHistory: [],
            iibb: 0,
            comisionTN: 0,

            setProducts: (newProducts) => {
                const { iibb, comisionTN } = get();

                const processed = newProducts.map(p => {
                    // RESET LOGIC: "Respect the CSV"
                    // We do NOT index by dollar history anymore.
                    // The 'costoReposicion' is exactly what came from the CSV (Cost or Costo Hoy).
                    const costoReposicion = p.costoReposicion > 0 ? p.costoReposicion : p.costoHistorico;

                    // Calculate Price using the standard formula + Taxes
                    const precioNuevo = calculatePrice(costoReposicion, p.margen, p.iva, iibb, comisionTN);

                    // Calc Diff & Profit
                    const ivaDecimal = p.iva / 100;
                    const iibbDecimal = iibb / 100;
                    const comisionDecimal = comisionTN / 100;
                    const taxFactor = (iibbDecimal + comisionDecimal) * (1 + ivaDecimal);

                    const diferencia = precioNuevo - p.precioTiendaNube;
                    const gananciaEstimada = precioNuevo - costoReposicion - (precioNuevo * taxFactor);
                    const resultadoNeto = p.precioTiendaNube - costoReposicion - (p.precioTiendaNube * taxFactor);

                    return { ...p, costoReposicion, precioNuevo, diferencia, gananciaEstimada, resultadoNeto };
                });

                set({ products: processed });
            },

            setDollar: (val) => {
                set({ dollar: val });
                // If we were using Dollar to update Costs (e.g. CostUSD * Dollar), we should trigger it.
                // But User said "Forget calculations".
                // However, likely they might upload Cost USD and want to see Peso result?
                // For now, let's keep 'recalculateAllCosts' strictly for Price (Margin/Taxes), NOT Cost Indexing.
                get().recalculateAllCosts();
            },

            setDollarHistory: (history) => {
                set({ dollarHistory: history });
                // No recalculation needed since we ignore history now.
            },

            setIIBB: (val) => {
                set({ iibb: val });
                get().recalculateAllCosts();
            },
            setComisionTN: (val) => {
                set({ comisionTN: val });
                get().recalculateAllCosts();
            },

            updateProductMargin: (id, newMargin) =>
                set((state) => ({
                    products: state.products.map((p) => {
                        if (p.id !== id) return p;

                        const { iibb, comisionTN } = get();
                        const precioNuevo = calculatePrice(p.costoReposicion, newMargin, p.iva, iibb, comisionTN);

                        const iibbDecimal = iibb / 100;
                        const comisionDecimal = comisionTN / 100;
                        const ivaDecimal = p.iva / 100;
                        const taxFactor = (iibbDecimal + comisionDecimal) * (1 + ivaDecimal);

                        const diferencia = precioNuevo - p.precioTiendaNube;
                        const gananciaEstimada = precioNuevo - p.costoReposicion - (precioNuevo * taxFactor);
                        const resultadoNeto = p.precioTiendaNube - p.costoReposicion - (p.precioTiendaNube * taxFactor);

                        return {
                            ...p,
                            margen: newMargin,
                            precioNuevo,
                            diferencia,
                            gananciaEstimada,
                            resultadoNeto
                        };
                    })
                })),

            recalculateAllCosts: () => {
                const { products, iibb, comisionTN } = get();

                const updated = products.map(p => {
                    // Logic: Price depends on Cost (Static) + Taxes (Dynamic)
                    const precioNuevo = calculatePrice(p.costoReposicion, p.margen, p.iva, iibb, comisionTN);

                    const iibbDecimal = iibb / 100;
                    const comisionDecimal = comisionTN / 100;
                    const ivaDecimal = p.iva / 100;
                    const taxFactor = (iibbDecimal + comisionDecimal) * (1 + ivaDecimal);

                    const diferencia = precioNuevo - p.precioTiendaNube;
                    const gananciaEstimada = precioNuevo - p.costoReposicion - (precioNuevo * taxFactor);
                    const resultadoNeto = p.precioTiendaNube - p.costoReposicion - (p.precioTiendaNube * taxFactor);

                    return { ...p, precioNuevo, diferencia, gananciaEstimada, resultadoNeto };
                });

                set({ products: updated });
            },

            clearProducts: () => set({ products: [] }),
            clearDollarHistory: () => set({ dollarHistory: [] })
        }),
        {
            name: 'saldame-app-storage',
        }
    )
);
