import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../constants';
import { PaymentStatus, TransactionType } from '../types';

export const exportYearlyPDF = async (userPhone: string, year: number) => {
    try {
        const promises = [];
        for (let month = 1; month <= 12; month++) {
            promises.push(
                fetch(`${API_BASE_URL}/transactions?phone=${userPhone}&includeShared=true&month=${month}&year=${year}`, {
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store'
                }).then(res => res.json()).catch(() => ({ transactions: [] }))
            );
        }

        const results = await Promise.all(promises);
        
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Relatório Financeiro - Ano ${year}`, 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

        let finalY = 40;

        results.forEach((monthData, index) => {
            const month = index + 1;
            const txs = monthData.transactions || [];
            
            if (txs.length === 0) return; // Skip empty months

            const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'long' });
            
            doc.setFontSize(14);
            doc.text(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`, 14, finalY);
            finalY += 6;

            const tableData = txs.map((tx: any) => {
                const dateRaw = new Date(tx.date);
                // Adjust timezone safely
                dateRaw.setMinutes(dateRaw.getMinutes() + dateRaw.getTimezoneOffset());
                const dateFormatted = dateRaw.toLocaleDateString('pt-BR');
                
                const type = tx.type === TransactionType.REVENUE ? 'Receita' : 'Despesa';
                const status = tx.status === PaymentStatus.PAID ? 'Pago' : 'Pendente';
                const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount || 0);
                
                return [dateFormatted, tx.name, type, amount, status];
            });

            autoTable(doc, {
                startY: finalY,
                head: [['Data', 'Descrição', 'Tipo', 'Valor', 'Status']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 9 },
                margin: { left: 14, right: 14 },
                didDrawPage: function(data) {
                    // This creates space at the top of subsequent pages if wrapped
                }
            });

            finalY = (doc as any).lastAutoTable.finalY + 15;

            // If close to bottom, add a new page
            if (finalY > 270) {
                doc.addPage();
                finalY = 20;
            }
        });

        // If no transactions found at all for the year
        if (finalY === 40) {
            doc.setFontSize(12);
            doc.text('Nenhuma transação encontrada neste ano.', 14, 40);
        }

        doc.save(`Relatorio_Financeiro_${year}.pdf`);
        return true;
    } catch (error) {
        console.error('Failed to export PDF:', error);
        throw error;
    }
};
