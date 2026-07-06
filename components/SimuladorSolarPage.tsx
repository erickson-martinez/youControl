import React, { useState, useMemo, useRef } from 'react';
import { User } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-2xl min-w-[250px] z-[1000] relative opacity-100">
        <p className="text-gray-200 font-bold mb-3 border-b border-gray-700 pb-2">Mês {label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span style={{ color: entry.color }} className="mr-4">{entry.name}</span>
              <span className="font-semibold text-gray-200 whitespace-nowrap">
                {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface SimuladorSolarPageProps {
  user: User;
}

const ALL_COLUMNS = [
  { key: 'mes', label: 'Mês', description: 'Mês da simulação', group: 'Geral' },
  { key: 'saldoDevedor', label: 'Saldo devedor', description: 'Saldo restante do financiamento', group: 'Dívida' },
  { key: 'parcelaIndividual', label: 'Parcela', description: 'Valor individual pago na parcela', group: 'Dívida', highlight: true },
  { key: 'totalParcelas', label: 'Total de Parcelas', description: 'Soma de todas as parcelas pagas no mês', group: 'Dívida' },
  { key: 'parcela18x', label: 'Parcela 18x', description: 'Valor da parcela do financiamento (18 meses)', group: 'Dívida' },
  { key: 'consumoMensal', label: 'Consumo', description: 'Custo da conta de energia sem o sistema solar', group: 'Energia Solar' },
  { key: 'economia', label: 'Economia', description: 'Diferença entre o consumo mensal e a parcela', group: 'Energia Solar' },
  { key: 'economiaVs18x', label: 'Econ. Financiamento', description: 'Economia adicional em relação à parcela do financiamento', group: 'Energia Solar' },
  { key: 'valorAInvestir', label: 'Valor a Investir', description: 'Total economizado no mês que será reinvestido', group: 'Investimentos' },
  { key: 'investimentoAcumulado', label: 'Investimento Acumulado', description: 'Soma dos valores investidos acrescidos de juros', group: 'Investimentos' },
  { key: 'patrimonioParcelas', label: 'Patrimônio das Parcelas', description: 'Valor acumulado das parcelas rendendo a 100% do CDI', group: 'Investimentos' },
  { key: 'patrimonioInvestido', label: 'Patrimônio Investido', description: 'Evolução dos R$ 15.500 iniciais caso ficassem aplicados', group: 'Investimentos' },
  { key: 'patrimonioLiquido', label: 'Patrimônio Líquido', description: 'Soma do Patrimônio das Parcelas e Investimento Acumulado', group: 'Investimentos', highlight: true },
  { key: 'rendimentoMensal', label: 'Rend. Mensal', description: 'Juros ganhos no mês sobre o investimento acumulado', group: 'Investimentos' },
  { key: 'saldoFinal', label: 'Saldo Final', description: 'Investimento Acumulado descontando o Saldo Devedor', group: 'Investimentos' },
];

const COLUMN_GROUPS = [
  { id: 'divida', label: 'Situação da Dívida', keys: ['saldoDevedor', 'parcelaIndividual', 'totalParcelas', 'parcela18x'] },
  { id: 'energia', label: 'Energia Solar', keys: ['consumoMensal', 'economia', 'economiaVs18x'] },
  { id: 'investimento', label: 'Investimentos', keys: ['valorAInvestir', 'investimentoAcumulado', 'patrimonioParcelas', 'patrimonioInvestido', 'patrimonioLiquido'] }
];

const VIEW_OPTIONS = [
  { id: 'patrimonio', label: 'Mostrar patrimônio', keys: ['patrimonioInvestido', 'patrimonioParcelas', 'patrimonioLiquido'] },
  { id: 'investimentos', label: 'Mostrar investimentos', keys: ['investimentoAcumulado', 'valorAInvestir', 'rendimentoMensal'] },
  { id: 'economia', label: 'Mostrar economia', keys: ['consumoMensal', 'economia', 'economiaVs18x'] },
  { id: 'saldo', label: 'Mostrar saldo', keys: ['saldoDevedor', 'saldoFinal'] },
  { id: 'parcelas', label: 'Mostrar parcelas', keys: ['parcelaIndividual', 'parcela18x', 'totalParcelas'] },
];

const SimuladorSolarPage: React.FC<SimuladorSolarPageProps> = ({ user }) => {
  const [visibleViews, setVisibleViews] = useState<string[]>(['patrimonio', 'investimentos']);
  const exportRef = useRef<HTMLDivElement>(null);

  const toggleView = (id: string) => {
    setVisibleViews(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const visibleColumns = useMemo(() => {
    const keys = ['mes'];
    VIEW_OPTIONS.forEach(opt => {
      if (visibleViews.includes(opt.id)) {
        keys.push(...opt.keys);
      }
    });
    return keys;
  }, [visibleViews]);

  const br = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const { rows, summary } = useMemo(() => {
    const data = [];
    const taxa = 177 / 15500;
    let saldo = 15500;
    let rendimento = 0;
    let patrimonio = 15500;
    let invest = 0;
    let somaParcelasPagas = 0;
    let somaParcelas18x = 0;
    let patrimonioParcelas = 0;
    let economiaTotal = 0;
    let jurosEvitadosTotal = 0;

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
      somaParcelas18x += parcela18;
      const totalParcelas = parcela * 3;
      somaParcelasPagas += totalParcelas;
      
      const rendimentoParcelasMes = patrimonioParcelas * taxa;
      patrimonioParcelas += rendimentoParcelasMes + totalParcelas;

      const econ18 = mes <= 18 ? Math.max(0, parcela18 - (parcela * 3)) : 0;
      const investir = economia + econ18;
      invest = invest * (1 + taxa) + investir;
      
      const patrimonioLiquido = patrimonioParcelas + invest;
      
      economiaTotal += economia;
      jurosEvitadosTotal += econ18;

      data.push({
        mes,
        saldoDevedor: br(saldoIni),
        parcela18x: parcela18 ? br(parcela18) : '-',
        parcelaIndividual: br(parcela),
        totalParcelas: totalParcelas ? br(totalParcelas) : '-',
        patrimonioParcelas: br(patrimonioParcelas),
        consumoMensal: br(consumo),
        economia: br(economia),
        economiaVs18x: parcela18 ? br(econ18) : '-',
        valorAInvestir: br(investir),
        investimentoAcumulado: br(invest),
        patrimonioInvestido: br(patrimonio),
        patrimonioLiquido: br(patrimonioLiquido),
        rendimentoMensal: br(rendimento),
        saldoFinal: br(saldo),
        rawInvestimentoAcumulado: invest,
        rawPatrimonioInvestido: patrimonio,
        rawPatrimonioLiquido: patrimonioLiquido,
        rawSaldoDevedor: saldoIni,
        rawParcela18x: parcela18,
        rawParcelaIndividual: parcela,
        rawTotalParcelas: totalParcelas,
        rawPatrimonioParcelas: patrimonioParcelas,
        rawConsumoMensal: consumo,
        rawEconomia: economia,
        rawEconomiaVs18x: econ18,
        rawValorAInvestir: investir,
        rawRendimentoMensal: rendimento,
        rawSaldoFinal: saldo,
      });
    }
    return {
      rows: data,
      summary: {
        patrimonioInvestido: patrimonio,
        patrimonioParcelas: patrimonioParcelas,
        investimentoAcumulado: invest,
        patrimonioTotal: patrimonioParcelas + invest,
        economiaTotal: economiaTotal,
        jurosEvitados: jurosEvitadosTotal,
      }
    };
  }, []);

  const LINE_COLORS: Record<string, string> = {
    saldoDevedor: '#ef4444',
    parcela18x: '#10b981',
    parcelaIndividual: '#f59e0b',
    totalParcelas: '#3b82f6',
    patrimonioParcelas: '#fbbf24',
    consumoMensal: '#8b5cf6',
    economia: '#ec4899',
    economiaVs18x: '#14b8a6',
    valorAInvestir: '#f97316',
    investimentoAcumulado: '#84cc16',
    patrimonioInvestido: '#06b6d4',
    patrimonioLiquido: '#3b82f6', // blue-500
    rendimentoMensal: '#6366f1',
    saldoFinal: '#d946ef',
  };

  if (user.email !== 'ericksonprofissional@gmail.com') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
      </div>
    );
  }

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: '#1f2937' // bg-gray-800
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = 297; // mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Simulador_Energia_Solar.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg" ref={exportRef}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Simulador Energia Solar</h1>
        <button 
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Exportar PDF
        </button>
      </div>

      {/* Top Cards - Hierarchical */}
      <div className="mb-8 space-y-4">
        {/* Principal */}
        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 text-center flex flex-col items-center justify-center shadow-lg">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">💰 Patrimônio Total</p>
          <p className="text-4xl sm:text-5xl font-bold text-blue-400">{br(summary.patrimonioTotal)}</p>
        </div>

        {/* Secundários Patrimônio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center shadow">
            <p className="text-xs text-gray-400 mb-1">🏦 Patrimônio Investido</p>
            <p className="text-xl font-bold text-cyan-400">{br(summary.patrimonioInvestido)}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center shadow">
            <p className="text-xs text-gray-400 mb-1">🔄 Patrimônio das Parcelas</p>
            <p className="text-xl font-bold text-yellow-400">{br(summary.patrimonioParcelas)}</p>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 text-center shadow">
            <p className="text-xs text-gray-400 mb-1">📈 Investimento Acumulado</p>
            <p className="text-xl font-bold text-lime-400">{br(summary.investimentoAcumulado)}</p>
          </div>
        </div>

        {/* Benefícios e Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
          <div className="bg-gray-700 p-5 rounded-lg border border-gray-600 shadow">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider border-b border-gray-600 pb-2">Benefícios</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">⚡ Economia da Energia</span>
                <span className="text-lg font-bold text-pink-400">{br(summary.economiaTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">💳 Juros Evitados</span>
                <span className="text-lg font-bold text-teal-400">{br(summary.jurosEvitados)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 p-5 rounded-lg border border-gray-600 shadow flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider border-b border-gray-600 pb-2">Resumo da Estratégia</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Retorno sobre R$ 15.500</span>
                  <span className="text-lg font-bold text-emerald-400">{((summary.patrimonioTotal / 15500 - 1) * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-gray-400 text-sm">Investimento Recuperado</span>
                    <span className="text-sm font-bold text-blue-400">{br(summary.patrimonioParcelas)} / {br(15500)}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-600 overflow-hidden">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (summary.patrimonioParcelas / 15500) * 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">{((summary.patrimonioParcelas / 15500) * 100).toFixed(1)}% concluído</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-lg border border-emerald-500/30 shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900/50 pb-2">
                💡 Veredito: Vale a pena?
              </h3>
              <p className="text-gray-300 text-[13px] leading-relaxed mb-3 flex-grow">
                <strong className="text-white">Com certeza.</strong> Ao invés de manter os R$ 15.500 apenas investidos (que renderiam <span className="text-gray-100">{br(summary.patrimonioInvestido)}</span>), a compra da energia solar mais o reinvestimento das economias gera um patrimônio final de <strong className="text-emerald-400">{br(summary.patrimonioTotal)}</strong>.
              </p>
              <div className="bg-emerald-900/30 border border-emerald-700/50 rounded p-2 mt-auto">
                <p className="text-emerald-300 text-xs text-center font-medium">
                  Você ganha {br(summary.patrimonioTotal - summary.patrimonioInvestido)} a mais, além de energia grátis por +20 anos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Visualização (Gráfico e Tabela)</h3>
        <div className="flex flex-wrap gap-3">
          {VIEW_OPTIONS.map(view => (
            <label key={view.id} className="flex items-center space-x-2 cursor-pointer bg-gray-800 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors border border-gray-600">
              <input 
                type="checkbox" 
                className="form-checkbox text-blue-500 rounded bg-gray-900 border-gray-600 focus:ring-blue-500" 
                checked={visibleViews.includes(view.id)}
                onChange={() => toggleView(view.id)}
              />
              <span className="text-sm text-gray-200">{view.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
        <h2 className="text-lg font-bold text-white mb-4">Evolução do Investimento e Saldo</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `Mês ${value}`} />
              <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toFixed(1)}k` : `R$ ${value}`} width={80} />
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000, outline: 'none' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {ALL_COLUMNS.filter(col => col.key !== 'mes' && visibleColumns.includes(col.key)).map(col => (
                <Line
                  key={col.key}
                  name={col.label}
                  type="monotone"
                  dataKey={`raw${col.key.charAt(0).toUpperCase() + col.key.slice(1)}`}
                  stroke={LINE_COLORS[col.key] || '#10b981'}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-xl">
        <table className="min-w-full text-[11px] sm:text-xs text-center text-gray-300">
          <thead className="text-[10px] sm:text-xs text-gray-200 uppercase bg-gray-800">
            {/* Top Header Row for Groups */}
            <tr>
              <th className="px-2 py-2 border-b border-gray-600 border-r border-gray-600 align-middle" rowSpan={2}>
                Mês
              </th>
              {COLUMN_GROUPS.map(group => {
                const visibleCount = group.keys.filter(k => visibleColumns.includes(k)).length;
                if (visibleCount === 0) return null;
                return (
                  <th key={group.id} colSpan={visibleCount} className="px-2 py-2 border-b border-gray-600 border-r border-gray-600 bg-gray-700 text-center tracking-wider text-blue-200">
                    {group.label}
                  </th>
                );
              })}
            </tr>
            {/* Bottom Header Row for Column Labels */}
            <tr className="bg-gray-700/50">
              {ALL_COLUMNS.filter(col => col.key !== 'mes').map(col => {
                if (!visibleColumns.includes(col.key)) return null;
                let groupBorder = "";
                for (const group of COLUMN_GROUPS) {
                  const visibleKeys = group.keys.filter(k => visibleColumns.includes(k));
                  if (visibleKeys[visibleKeys.length - 1] === col.key) {
                    groupBorder = "border-r border-gray-600";
                  }
                }
                return (
                  <th key={col.key} title={col.description} className={`px-2 py-2 cursor-help border-b border-gray-600 ${groupBorder} ${col.highlight ? 'bg-gray-600/80 text-white font-bold' : ''}`}>
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-700 bg-gray-800 hover:bg-gray-700 transition-colors">
                <td className="px-2 py-2 whitespace-nowrap border-r border-gray-700 font-bold bg-gray-800/80">
                  {row.mes}
                </td>
                {ALL_COLUMNS.filter(col => col.key !== 'mes').map(col => {
                  if (!visibleColumns.includes(col.key)) return null;
                  let groupBorder = "";
                  for (const group of COLUMN_GROUPS) {
                    const visibleKeys = group.keys.filter(k => visibleColumns.includes(k));
                    if (visibleKeys[visibleKeys.length - 1] === col.key) {
                      groupBorder = "border-r border-gray-700";
                    }
                  }
                  return (
                    <td key={col.key} className={`px-2 py-2 whitespace-nowrap ${groupBorder} ${col.highlight ? 'font-semibold text-gray-100 bg-gray-700/30' : ''}`}>
                      {(row as any)[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimuladorSolarPage;
