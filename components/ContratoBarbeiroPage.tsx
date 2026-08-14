import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants';
import { CheckCircleIcon, DocumentTextIcon, ShieldCheckIcon, PrinterIcon, ClockIcon, UsersIcon } from './icons';

interface ContratoBarbeiroPageProps {
  barbeiroId?: string;
  linkId?: string;
  initialBarbeiro?: any;
  onClose?: () => void;
}

export const ContratoBarbeiroPage: React.FC<ContratoBarbeiroPageProps> = ({
  barbeiroId,
  linkId,
  initialBarbeiro,
  onClose
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const resolvedBarbeiroId = barbeiroId || urlParams.get('barbeiroId') || urlParams.get('id') || '';
  const resolvedLinkId = linkId || urlParams.get('linkId') || urlParams.get('empresaId') || 'barbearia-default';

  const [barbeiro, setBarbeiro] = useState<any>(initialBarbeiro || null);
  const [loading, setLoading] = useState(!initialBarbeiro);
  const [error, setError] = useState<string | null>(null);
  const [aceitou, setAceitou] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialBarbeiro) {
      setBarbeiro(initialBarbeiro);
      setLoading(false);
      return;
    }

    const fetchBarbeiro = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL}/barbers?linkId=${resolvedLinkId}`;
        let res = await fetch(url).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`/api/v1/barbers?linkId=${resolvedLinkId}`).catch(() => null);
        }

        if (res && res.ok) {
          const list = await res.json();
          const mapped = Array.isArray(list) ? list : [];
          const found = mapped.find((b: any) => (b.id || b._id) === resolvedBarbeiroId) || mapped[0];
          if (found) {
            setBarbeiro(found);
          } else {
            setError('Dados do barbeiro não encontrados.');
          }
        } else {
          setError('Não foi possível carregar as informações do profissional.');
        }
      } catch (err) {
        console.error('Erro ao buscar barbeiro:', err);
        setError('Erro de conexão ao carregar o contrato.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbeiro();
  }, [resolvedBarbeiroId, resolvedLinkId, initialBarbeiro]);

  const copyLink = () => {
    const link = `${window.location.origin}/?contratoBarbeiro=1&barbeiroId=${barbeiro?.id || barbeiro?._id || resolvedBarbeiroId}&linkId=${resolvedLinkId}`;
    navigator.clipboard.writeText(link);
    alert('✓ Link do contrato do barbeiro copiado para a área de transferência!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmarTermos = async () => {
    setSubmitting(true);
    try {
      const updates = {
        aceitarContrato: true,
        contratoAceito: true,
        contratoAceitoAt: new Date().toISOString()
      };

      const targetId = barbeiro?.id || barbeiro?._id || resolvedBarbeiroId;
      if (targetId) {
        await fetch(`${API_BASE_URL}/barbers/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(() => null);
      }

      setAceitou(true);
    } catch (err) {
      console.error('Erro ao salvar aceite:', err);
      setAceitou(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Carregando Contrato Terceirizado do Profissional...</p>
      </div>
    );
  }

  if (error || !barbeiro) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <DocumentTextIcon className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Contrato Indisponível</h1>
        <p className="text-gray-400 text-sm mb-6">{error || 'O barbeiro solicitado não foi localizado.'}</p>
        {onClose ? (
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold">
            Voltar
          </button>
        ) : (
          <a href="/" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold">
            Ir para Início
          </a>
        )}
      </div>
    );
  }

  const comissaoCorte = Number(barbeiro.corte || 0);
  const comissaoProdutos = Number(barbeiro.comissao || 0);
  const comissaoAssinatura = barbeiro.comissaoAssinatura !== undefined ? Number(barbeiro.comissaoAssinatura) : 35;
  const valorBaseAssinatura = barbeiro.valorBaseComissaoAssinatura !== undefined && Number(barbeiro.valorBaseComissaoAssinatura) > 0 
    ? Number(barbeiro.valorBaseComissaoAssinatura) 
    : 30;
  const ganhoAssinaturaPorCorte = valorBaseAssinatura * (comissaoAssinatura / 100);

  const dias = Array.isArray(barbeiro.diasTrabalhados) && barbeiro.diasTrabalhados.length > 0 
    ? barbeiro.diasTrabalhados.join(', ') 
    : 'Conforme escala autônoma / flexível';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center print:bg-white print:text-black">
      <div className="w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 border-b border-gray-800 relative print:bg-none print:p-0 print:border-b-2 print:border-black">
          <div className="flex items-center justify-between gap-4 mb-3 print:hidden">
            <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <DocumentTextIcon className="w-4 h-4 text-yellow-400" />
              Prestação de Serviço Terceirizado
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition-colors flex items-center gap-1.5"
              >
                📋 Copiar Link
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="text-xs bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-700/50 transition-colors flex items-center gap-1.5"
              >
                <PrinterIcon className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase print:text-black">
            Contrato de Prestação de Serviços Terceirizados
          </h1>
          <p className="text-gray-400 text-xs mt-1 print:text-gray-700">
            Termo de Parceria Autônoma sem Vínculo Empregatício (Lei nº 13.352/2016 e Art. 442-B da CLT)
          </p>
        </div>

        {/* Corpo do Contrato */}
        <div className="p-6 sm:p-8 space-y-6 text-sm text-gray-300 print:text-black leading-relaxed">
          
          {/* Identificação das Partes */}
          <div className="bg-gray-950/60 p-4 sm:p-5 rounded-xl border border-gray-800 space-y-3 print:bg-gray-100 print:border-gray-300">
            <h2 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-2 print:text-gray-800">
              Identificação do Profissional Parceiro (Contratado)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs block print:text-gray-600">Nome Completo:</span>
                <strong className="text-white print:text-black font-bold text-base">{barbeiro.nome}</strong>
              </div>
              <div>
                <span className="text-gray-500 text-xs block print:text-gray-600">E-mail / Registro:</span>
                <span className="text-gray-300 print:text-black font-medium">{barbeiro.email || barbeiro.idEmail || barbeiro.telefone || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Cláusulas */}
          <div className="space-y-5 text-xs sm:text-sm">
            
            <div className="space-y-1">
              <h3 className="font-bold text-white print:text-black flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 border border-blue-500/30 print:bg-gray-200 print:text-black">1</span>
                Cláusula Primeira: Inexistência de Vínculo Empregatício
              </h3>
              <p className="text-gray-400 print:text-gray-800 pl-8">
                O CONTRATADO atuará como prestador de serviço autônomo e parceiro terceirizado. O presente contrato não gera, sob qualquer hipótese, vínculo empregatício, subordinação hierárquica, habitualidade compulsória ou exclusividade entre as partes, conforme legislação vigente (Lei do Salão Parceiro nº 13.352/2016 e Art. 442-B da CLT).
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white print:text-black flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 border border-blue-500/30 print:bg-gray-200 print:text-black">2</span>
                Cláusula Segunda: Autonomia e Ausência de Horário Fixo
              </h3>
              <p className="text-gray-400 print:text-gray-800 pl-8">
                O CONTRATADO possui total autonomia sobre sua rotina, gestão de horários e atendimento aos clientes, sem obrigação de cumprimento de jornada ou horário fixo de trabalho imposto pela CONTRATANTE.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white print:text-black flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 border border-blue-500/30 print:bg-gray-200 print:text-black">3</span>
                Cláusula Terceira: Dias de Prestação de Serviços Confirmados
              </h3>
              <div className="pl-8 pt-1">
                <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex items-center gap-2 text-xs text-white font-bold print:bg-gray-100 print:text-black print:border-gray-300">
                  <ClockIcon className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Dias confirmados pelo barbeiro: {dias}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white print:text-black flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 border border-blue-500/30 print:bg-gray-200 print:text-black">4</span>
                Cláusula Quarta: Remuneração e Comissões por Produção
              </h3>
              <p className="text-gray-400 print:text-gray-800 pl-8 mb-2">
                A remuneração do CONTRATADO será calculada estritamente por comissão sobre a produção efetivamente realizada nos atendimentos aos clientes:
              </p>

              <div className="pl-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-1 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block print:text-gray-700">Serviços / Cortes Geral</span>
                  <span className="text-emerald-400 font-extrabold text-lg block print:text-black">{comissaoCorte}%</span>
                  <span className="text-[10px] text-gray-400 print:text-gray-600 block">da receita bruta por corte avulso</span>
                </div>

                <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-1 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block print:text-gray-700">Clientes de Assinatura</span>
                  <span className="text-blue-400 font-extrabold text-lg block print:text-black">{comissaoAssinatura}%</span>
                  <span className="text-[10px] text-gray-400 print:text-gray-600 block">
                    sobre base de R$ {valorBaseAssinatura.toFixed(2)} (= <strong className="text-emerald-400 print:text-black">R$ {ganhoAssinaturaPorCorte.toFixed(2)}</strong>/corte)
                  </span>
                </div>

                <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-1 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block print:text-gray-700">Venda de Produtos</span>
                  <span className="text-purple-400 font-extrabold text-lg block print:text-black">{comissaoProdutos}%</span>
                  <span className="text-[10px] text-gray-400 print:text-gray-600 block">sobre o valor final dos produtos</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white print:text-black flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center font-black text-xs shrink-0 border border-blue-500/30 print:bg-gray-200 print:text-black">5</span>
                Cláusula Quinta: Repasse de Comissões e Apuração
              </h3>
              <p className="text-gray-400 print:text-gray-800 pl-8">
                Os valores apurados serão consolidados no módulo do caixa/financeiro e pagos periodicamente de acordo com o fechamento acordado com a administração da barbearia.
              </p>
            </div>

          </div>

          {/* Status de Aceite / Ações */}
          <div className="pt-6 border-t border-gray-800 print:border-black space-y-4">
            {aceitou || barbeiro.contratoAceitoAt ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-emerald-300">
                <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-sm font-bold text-white">Contrato Termo Aceito e Confirmado!</strong>
                  <span>
                    Aceito digitalmente pelo profissional em {barbeiro.contratoAceitoAt ? new Date(barbeiro.contratoAceitoAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 print:hidden">
                <div className="text-xs text-gray-400">
                  <strong className="text-white block font-semibold mb-0.5">Confirmação Digital do Barbeiro:</strong>
                  <span>Ao clicar em aceitar, você confirma que leu e concorda com as regras de comissões e trabalho autônomo.</span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmarTermos}
                  disabled={submitting}
                  className="w-full sm:w-auto shrink-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {submitting ? 'Confirmando...' : 'Li e Aceito o Contrato'}
                </button>
              </div>
            )}

            {onClose && (
              <div className="flex justify-end print:hidden">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
