import React, { useState, useMemo } from 'react';
import { User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SimuladorSolarPageProps {
  user: User;
}

const ALL_COLUMNS = [
  { key: 'mes', label: 'Mês' },
  { key: 'saldoDevedor', label: 'Saldo devedor' },
  { key: 'parcela18x', label: 'Parcela 18x' },
  { key: 'parcelaIndividual', label: 'Parcela Individual' },
  { key: 'totalParcelas', label: 'Total de Parcelas' },
  { key: 'consumoMensal', label: 'Consumo Mensal' },
  { key: 'economia', label: 'Economia' },
  { key: 'economiaVs18x', label: 'Economia vs 18x' },
  { key: 'valorAInvestir', label: 'Valor a Investir' },
  { key: 'investimentoAcumulado', label: 'Investimento Acumulado' },
  { key: 'patrimonioInvestido', label: 'Patrimônio Investido' },
  { key: 'rendimentoMensal', label: 'Rendimento mensal' },
  { key: 'saldoFinal', label: 'Saldo Final' },
];

const SimuladorSolarPage: React.FC<SimuladorSolarPageProps> = ({ user }) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map(c => c.key));

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  const br = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const rows = useMemo(() => {
    const data = [];
    const taxa = 177 / 15500;
    let saldo = 15500;
    let rendimento = 0;
    let patrimonio = 15500;
    let invest = 0;

    for (let mes = 1; mes <= 36; mes++) {
      let saldoIni = saldo;
      patrimonio *= 1 + taxa;
      let parcela = 0;
      if (mes <= 24) {
        let mesesRest = 25 - mes;
        let rend = saldoIni * taxa;
        rendimento = patrimonio * taxa;
        let principal = (saldoIni / 3) / mesesRest;
        parcela = principal + rend / 3;
        saldo = Math.max(0, saldo - principal * 3);
      }
      const consumo = 300;
      const economia = Math.max(0, consumo - parcela);
      const parcela18 = mes <= 18 ? 1051 : 0;
      const totalParcelas = parcela * 3;
      const econ18 = mes <= 18 ? Math.max(0, parcela18 - (parcela * 3)) : 0;
      const investir = economia + econ18;
      invest = invest * (1 + taxa) + investir;

      data.push({
        mes,
        saldoDevedor: br(saldoIni),
        parcela18x: parcela18 ? br(parcela18) : '-',
        parcelaIndividual: br(parcela),
        totalParcelas: totalParcelas ? br(totalParcelas) : '-',
        consumoMensal: br(consumo),
        economia: br(economia),
        economiaVs18x: parcela18 ? br(econ18) : '-',
        valorAInvestir: br(investir),
        investimentoAcumulado: br(invest),
        patrimonioInvestido: br(patrimonio),
        rendimentoMensal: br(rendimento),
        saldoFinal: br(saldo),
      });
    }
    return data;
  }, []);

  if (user.email !== 'ericksonprofissional@gmail.com') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
      </div>
    );
  }

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Simulador Energia Solar', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    const tableCols = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(c => c.label);
    const tableRows = rows.map(row => 
      ALL_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(c => (row as any)[c.key])
    );

    autoTable(doc, {
      startY: 40,
      head: [tableCols],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [25, 118, 210] }, // #1976d2
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    doc.save('Simulador_Energia_Solar.pdf');
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Simulador Energia Solar</h1>
        <button 
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Exportar PDF
        </button>
      </div>
      
      <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Colunas Visíveis</h3>
        <div className="flex flex-wrap gap-3">
          {ALL_COLUMNS.map(col => (
            <label key={col.key} className="flex items-center space-x-2 cursor-pointer bg-gray-800 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors border border-gray-600">
              <input 
                type="checkbox" 
                className="form-checkbox text-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500" 
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
              />
              <span className="text-sm text-gray-200">{col.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-[11px] sm:text-xs text-center text-gray-300">
          <thead className="text-[10px] sm:text-xs text-gray-200 uppercase bg-gray-700">
            <tr>
              {ALL_COLUMNS.map(col => (
                visibleColumns.includes(col.key) && (
                  <th key={col.key} className="px-2 py-2">
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-700 bg-gray-800 hover:bg-gray-750 transition-colors">
                {ALL_COLUMNS.map(col => (
                  visibleColumns.includes(col.key) && (
                    <td key={col.key} className="px-2 py-2 whitespace-nowrap">
                      {(row as any)[col.key]}
                    </td>
                  )
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimuladorSolarPage;
