import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
    onDataLoaded: (data: any[]) => void;
    title?: string;
    description?: string;
    accept?: string;
}

export function FileUploader({
    onDataLoaded,
    title = "Cargar Archivo Excel",
    description = "Arrastra y suelta tu archivo aquí, o haz clic para seleccionar",
    accept = ".xlsx, .xls, .csv"
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [fileName, setFileName] = React.useState<string | null>(null);

    const processFile = useCallback((file: File) => {
        const reader = new FileReader();
        const isCSV = file.name.toLowerCase().endsWith('.csv');

        reader.onload = (e) => {
            const content = e.target?.result;
            let workbook;

            if (isCSV && typeof content === 'string') {
                // CSV Handling: Attempt to detect delimiter if it's not standard
                // If semicolon delimited, SheetJS usually handles it if passed as string.
                // Note: XLSX.read with type 'string' should handle most CSVs.
                workbook = XLSX.read(content, { type: 'string' });
            } else {
                // Binary (Excel)
                const data = new Uint8Array(content as ArrayBuffer);
                workbook = XLSX.read(data, { type: 'array' });
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Defers to SheetJS for parsing. If it's still 1 column, the user might have a messy CSV.
            // But usually this fixes the "blob" issue.
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            setFileName(file.name);
            onDataLoaded(jsonData);
        };

        if (isCSV) {
            reader.readAsText(file, "ISO-8859-1"); // Try Latin1/ANSI first for CSVs (common in Argentina) usually
            // If UTF-8, it usually works too, but Excel CSVs in Spanish regions are often ANSI. 
            // Better to try reading as Text.
        } else {
            reader.readAsArrayBuffer(file);
        }
    }, [onDataLoaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    }, [processFile]);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer relative",
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept={accept}
                />

                {fileName ? (
                    <div className="flex flex-col items-center text-green-600">
                        <FileSpreadsheet size={48} className="mb-4" />
                        <p className="font-medium text-lg">{fileName}</p>
                        <p className="text-sm text-gray-500 mt-2">¡Archivo cargado correctamente!</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setFileName(null);
                                onDataLoaded([]);
                            }}
                            className="mt-4 px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold hover:bg-red-200 z-10 relative"
                        >
                            Quitar archivo
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-gray-500">
                        <Upload size={48} className="mb-4 text-gray-400" />
                        <p className="font-medium text-lg text-gray-900 mb-1">{title}</p>
                        <p className="text-sm">{description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
