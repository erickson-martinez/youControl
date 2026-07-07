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
  { key: 'patrimonioInvestido', label: 'Patrimônio Investido', description: 'Evolução do valor inicial caso ficasse aplicado', group: 'Investimentos' },
  { key: 'patrimonioLiquido', label: 'Patrimônio Total', description: 'Soma do Patrimônio das Parcelas e Investimento Acumulado', group: 'Investimentos', highlight: true },
  { key: 'rendimentoMensal', label: 'Rendimento (100% CDI)', description: 'Juros ganhos no mês sobre o investimento acumulado', group: 'Investimentos' },
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
  const [periodoMeses, setPeriodoMeses] = useState<number>(36);
  const [visibleViews, setVisibleViews] = useState<string[]>(['patrimonio', 'investimentos']);
  const [config, setConfig] = useState({
    investimentoInicial: 15500,
    taxaMensalCDI: 1.14,
    consumoMensal: 300,
    reajusteAnualEnergia: 7.34,
    parcela18x: 1051,
  });
  const [showConfig, setShowConfig] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

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
    const taxa = config.taxaMensalCDI / 100;
    let saldo = config.investimentoInicial;
    let rendimento = 0;
    let patrimonio = config.investimentoInicial;
    let invest = 0;
    let somaParcelasPagas = 0;
    let somaParcelas18x = 0;
    let patrimonioParcelas = 0;
    let economiaTotal = 0;
    let jurosEvitadosTotal = 0;

    for (let mes = 1; mes <= periodoMeses; mes++) {
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
      const anosPassados = Math.floor((mes - 1) / 12);
      const fatorReajuste = Math.pow(1 + config.reajusteAnualEnergia / 100, anosPassados);
      const consumo = config.consumoMensal * fatorReajuste;
      const economia = Math.max(0, consumo - parcela);
      const parcela18 = mes <= 18 ? config.parcela18x : 0;
      somaParcelas18x += parcela18;
      const totalParcelas = parcela * 3;
      somaParcelasPagas += totalParcelas;
      let patrimonioLiquido = 0;
      
      let rendimentoParcelasMes = 0;
      if (mes <= 24) {
        rendimentoParcelasMes = patrimonioParcelas * taxa;
        patrimonioParcelas += rendimentoParcelasMes + totalParcelas;
      }



      const econ18 = mes <= 18 ? Math.max(0, parcela18 - (parcela * 3)) : 0;
      const investir = economia + econ18;
      invest = invest * (1 + taxa) + investir;
      
      const taxaPatrimonioLiquido = (patrimonioParcelas + invest) * taxa
      patrimonioLiquido = (patrimonioParcelas + invest + taxaPatrimonioLiquido);
      
      
      economiaTotal += economia;
      jurosEvitadosTotal += econ18;

      data.push({
        mes,
        saldoDevedor: br(saldoIni),
        parcela18x: parcela18 ? br(parcela18) : '-',
        parcelaIndividual: br(parcela),
        totalParcelas: totalParcelas ? br(totalParcelas) : '-',
        patrimonioParcelas: mes <= 24 ? br(patrimonioParcelas) : '-',
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
  }, [periodoMeses, config]);

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

  const handleExportTablePDF = () => {
    if (!tableRef.current) return;

    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a3",
    });

    autoTable(pdf, {
        html: tableRef.current,
        theme: "grid",
        styles: {
            fontSize: 6,
            cellPadding: 1.5,
        },
        headStyles: {
            fillColor: [45, 45, 45],
            textColor: 255,
            fontStyle: "bold",
        },
        margin: {
            top: 10,
        },
    });

    pdf.save("Tabela_Simulador_Energia_Solar.pdf");
};

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg shadow-lg" ref={exportRef}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">Simulador Energia Solar</h1>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center space-x-1 bg-gray-700 p-1 rounded-lg border border-gray-600">
            {[24, 36, 60, 120].map(p => (
              <button
                key={p}
                onClick={() => setPeriodoMeses(p)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${periodoMeses === p ? 'bg-blue-600 text-white font-bold shadow' : 'text-gray-300 hover:bg-gray-600'}`}
              >
                {p === 60 ? '5 anos' : p === 120 ? '10 anos' : `${p} meses`}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowConfig(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors border border-gray-600"
          >
            ⚙️ Configurar Valores
          </button>
          
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            📄 Exportar Tela
          </button>

          <button
            onClick={handleExportTablePDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
          >
            📊 Exportar Tabela
          </button>
        </div>
      </div>

      {/* Top Cards - Hierarchical */}
      <div className="mb-8 space-y-4">
        {/* Principal */}
        <div className="bg-gray-700 p-6 rounded-lg border border-gray-600 text-center flex flex-col items-center justify-center shadow-lg">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">💰 Patrimônio Total</p>
          <p className="text-4xl sm:text-5xl font-bold text-blue-400 mb-4">{br(summary.patrimonioTotal)}</p>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400 bg-gray-800 px-4 py-2 rounded-full border border-gray-600">
            <span>Investimento Inicial <strong className="text-gray-200">{br(config.investimentoInicial)}</strong></span>
            <span className="text-gray-500">→</span>
            <span>Patrimônio Final <strong className="text-gray-200">{br(summary.patrimonioTotal)}</strong></span>
            <span className="text-emerald-400 font-bold ml-1 border-l border-gray-600 pl-3">+{((summary.patrimonioTotal / config.investimentoInicial - 1) * 100).toFixed(1)}%</span>
          </div>
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

        {/* Resumo e Benefícios */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
          <div className="bg-gray-700 p-5 rounded-lg border border-gray-600 shadow flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider border-b border-gray-600 pb-2">Resumo da Estratégia</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Retorno sobre {br(config.investimentoInicial)}</span>
                  <span className="text-lg font-bold text-emerald-400">{((summary.patrimonioTotal / config.investimentoInicial - 1) * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-gray-400 text-sm">Investimento Recuperado</span>
                    <span className="text-sm font-bold text-blue-400">{((summary.patrimonioParcelas / config.investimentoInicial) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-600 overflow-hidden">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (summary.patrimonioParcelas / config.investimentoInicial) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500"></span>
                    <span className="text-xs text-gray-400">{br(summary.patrimonioParcelas)} / {br(config.investimentoInicial)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-lg border border-emerald-500/30 shadow flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-900/50 pb-2">
                ✅ Vale a pena?
              </h3>
              <div className="flex-grow flex flex-col justify-center space-y-2 mb-2 mt-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs">Patrimônio mantendo investimento:</span>
                  <span className="text-gray-100 text-sm font-medium">{br(summary.patrimonioInvestido)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs">Estratégia Energia Solar:</span>
                  <span className="text-emerald-400 text-sm font-bold">{br(summary.patrimonioTotal)}</span>
                </div>
                <div className="border-t border-gray-600/50 pt-2 mt-1 flex justify-between items-center">
                  <span className="text-gray-300 text-xs font-semibold">Diferença:</span>
                  <span className="text-emerald-400 text-base font-bold">+{br(summary.patrimonioTotal - summary.patrimonioInvestido)}</span>
                </div>
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
              {ALL_COLUMNS.filter(col => col.key !== 'mes' && visibleColumns.includes(col.key)).map(col => {
                let strokeWidth = 1;
                if (col.key === 'patrimonioLiquido') strokeWidth = 4;
                else if (col.key === 'patrimonioInvestido' || col.key === 'investimentoAcumulado') strokeWidth = 2;
                
                return (
                  <Line
                    key={col.key}
                    name={col.label}
                    type="monotone"
                    dataKey={`raw${col.key.charAt(0).toUpperCase() + col.key.slice(1)}`}
                    stroke={LINE_COLORS[col.key] || '#10b981'}
                    strokeWidth={strokeWidth}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-xl">
        <table
         ref={tableRef}
         className="min-w-full text-[11px] sm:text-xs text-center text-gray-300">
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
                  <th key={group.id} colSpan={visibleCount} className="px-2 py-2 border-b border-gray-600 border-r-2 border-gray-500 bg-gray-700 text-center tracking-wider text-blue-200">
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
                    groupBorder = "border-r-2 border-gray-500";
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
                      groupBorder = "border-r-2 border-gray-600";
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

      {showConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Configurar Valores</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Investimento Inicial (R$)</label>
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={config.investimentoInicial}
                  onChange={(e) => setConfig({ ...config, investimentoInicial: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rendimento Mensal (100% CDI em %)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={config.taxaMensalCDI}
                  onChange={(e) => setConfig({ ...config, taxaMensalCDI: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Consumo Mensal (R$)</label>
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={config.consumoMensal}
                  onChange={(e) => setConfig({ ...config, consumoMensal: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Reajuste Anual Energia (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={config.reajusteAnualEnergia}
                  onChange={(e) => setConfig({ ...config, reajusteAnualEnergia: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Parcela 18x (R$)</label>
                <input
                  type="number"
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={config.parcela18x}
                  onChange={(e) => setConfig({ ...config, parcela18x: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfig(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimuladorSolarPage;
