import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Participant {
    id: string;
    name: string;
}

interface SharedExpense {
    id: string;
    description: string;
    amount: number;
    payerId: string;
    involvedIds: string[];
}

interface SharedPayment {
    id: string;
    fromId: string;
    toId: string;
    amount: number;
    method?: string;
    date: number;
}

export const generateSharedExpensesPDF = (
    eventName: string,
    participants: Participant[],
    expenses: SharedExpense[],
    payments: SharedPayment[],
    transfers: { from: string, to: string, amount: number }[]
) => {
    const doc = new jsPDF();
    const getName = (id: string) => participants.find(p => p.id === id)?.name || 'Desconocido';

    // Header
    doc.setFontSize(20);
    doc.setTextColor(43, 108, 176); // Brand primary color
    doc.text('Resumen de Gastos: ' + eventName, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

    // Section 1: Quién debe a quién
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Liquidación de Deudas', 14, 40);

    if (transfers.length > 0) {
        const transfersData = transfers.map(t => [
            getName(t.from),
            getName(t.to),
            `$${t.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Debe', 'Le paga a', 'Monto']],
            body: transfersData,
            theme: 'striped',
            headStyles: { fillColor: [34, 197, 94] } // Brand success color (green)
        });
    } else {
        doc.setFontSize(10);
        doc.text('No hay deudas pendientes. ¡Están todos saldados!', 14, 48);
    }

    // Section 2: Detalle de Consumos
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(14);
    doc.text('Detalle de Gastos Registrados', 14, finalY + 15);

    const expensesData = expenses.map(e => [
        e.description,
        getName(e.payerId),
        `$${e.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        e.involvedIds.map(id => getName(id)).join(', ')
    ]);

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Gasto', 'Pagó', 'Monto', 'Participantes']],
        body: expensesData,
        theme: 'grid',
        headStyles: { fillColor: [43, 108, 176] }
    });

    // Section 3: Pagos Realizados
    if (payments.length > 0) {
        const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 40;
        doc.setFontSize(14);
        doc.text('Pagos Realizados', 14, finalY2 + 15);

        const paymentsData = payments.map(p => [
            getName(p.fromId),
            getName(p.toId),
            `$${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            p.method || '-',
            new Date(p.date).toLocaleDateString()
        ]);

        autoTable(doc, {
            startY: finalY2 + 20,
            head: [['De', 'A', 'Monto', 'Medio', 'Fecha']],
            body: paymentsData,
            theme: 'striped',
            headStyles: { fillColor: [148, 163, 184] }
        });
    }

    // Footer simple
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Saldame App - Cuentas Claras', 14, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`Resumen-${eventName.replace(/\s+/g, '-')}.pdf`);
};
