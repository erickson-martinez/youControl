import React, { useState } from 'react';
import type { Transaction, WorkRecord, OrdemServico } from '../types';
import { TransactionType, PaymentStatus, PontoStatus, OSStatus } from '../types';
import TransactionList from './TransactionList';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  OfficeBuildingIcon,
  UsersIcon,
  ClipboardListIcon,
  CashIcon,
  CogIcon,
  ShoppingCartIcon,
  DocumentTextIcon
} from './icons';
import { API_BASE_URL } from '../constants';

// --- Mock Data ---

const mockTransactions: Transaction[] = [
    {
        id: '1',
        ownerEmail: '123',
        type: TransactionType.EXPENSE,
        name: 'Aluguel Barbearia',
        amount: 1500.00,
        date: '2026-02-10',
        isControlled: false,
        status: PaymentStatus.UNPAID,
    },
    {
        id: '2',
        ownerEmail: '123',
        type: TransactionType.REVENUE,
        name: 'Faturamento de Cortes + Barba',
        amount: 8550.00,
        date: '2026-02-12',
        isControlled: false,
        status: PaymentStatus.PAID,
    },
    {
        id: '3',
        ownerEmail: '123',
        type: TransactionType.REVENUE,
        name: 'Mensalidades Clube VIP Assinantes',
        amount: 2400.00,
        date: '2026-02-13',
        isControlled: false,
        status: PaymentStatus.PAID,
    },
    {
        id: '4',
        ownerEmail: '456',
        sharerEmail: '123',
        type: TransactionType.EXPENSE,
        name: 'Repasse Comissão Barbeiro Lucas',
        amount: 1850.00,
        date: '2026-02-15',
        isControlled: false,
        status: PaymentStatus.PAID,
    },
];

const mockWorkRecords: WorkRecord[] = [
    {
        id: 'rec1',
        employeeEmail: 'barbeiro.lucas@barbearia.com',
        companyId: 'comp1',
        entryTime: '2026-02-16T09:00:00Z',
        exitTime: '2026-02-16T18:00:00Z',
        durationMinutes: 540,
        status: PontoStatus.APROVADO,
    },
    {
        id: 'rec2',
        employeeEmail: 'barbeiro.mario@barbearia.com',
        companyId: 'comp1',
        entryTime: '2026-02-16T10:00:00Z',
        exitTime: '2026-02-16T19:00:00Z',
        durationMinutes: 540,
        status: PontoStatus.PENDENTE,
    }
];

const mockChamados: OrdemServico[] = [
    {
        id: 'os1',
        openerEmail: 'barbeiro.lucas@barbearia.com',
        empresaId: 'comp-owner-123',
        title: 'Manutenção na Cadeira de Barbeiro #2',
        description: 'O reclinador hidráulico da cadeira 2 está travando ao subir.',
        status: OSStatus.ABERTO,
        createdAt: '2026-02-15T14:00:00Z',
    }
];

// --- Helper Functions ---

const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const formatDuration = (minutes: number) => {
    if (minutes < 0) return '00:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const PontoStatusBadge: React.FC<{ status: PontoStatus }> = ({ status }) => {
    const statusMap = {
        [PontoStatus.PENDENTE]: { text: 'Pendente', icon: <ClockIcon className="w-4 h-4" />, color: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' },
        [PontoStatus.APROVADO]: { text: 'Aprovado', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' },
        [PontoStatus.REJEITADO]: { text: 'Rejeitado', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-300 bg-red-500/20 border-red-500/30' },
        [PontoStatus.CANCELADO]: { text: 'Cancelado', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-gray-400 bg-gray-700/50 border-gray-600' },
    };
    const statusInfo = statusMap[status] || statusMap[PontoStatus.PENDENTE];
    return (
        <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
        </div>
    );
};

const osStatusDisplayMap: Record<OSStatus, string> = {
    [OSStatus.ABERTO]: 'Aberto',
    [OSStatus.EM_ANDAMENTO]: 'Em Andamento',
    [OSStatus.FECHADO]: 'Resolvido',
    [OSStatus.CANCELADO]: 'Cancelado',
};

const OSStatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
    const statusStyles: Record<OSStatus, string> = {
        [OSStatus.ABERTO]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        [OSStatus.EM_ANDAMENTO]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        [OSStatus.FECHADO]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        [OSStatus.CANCELADO]: 'bg-gray-700 text-gray-400 border-gray-600'
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusStyles[status] || 'bg-gray-700 text-gray-300'}`}>
            {osStatusDisplayMap[status] || 'Desconhecido'}
        </span>
    );
};

interface EndpointExampleProps {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    endpoint: string;
    description: string;
    body?: object;
}

const EndpointExample: React.FC<EndpointExampleProps> = ({ method, endpoint, description, body }) => {
    const [copyText, setCopyText] = React.useState('Copiar cURL');

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    let curlCommand = `curl -X ${method} "${fullUrl}" \\\n  -H "Content-Type: application/json"`;
    if (body) {
        curlCommand += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(curlCommand.replace(/\\\n\s*/g, ' '));
        setCopyText('Copiado!');
        setTimeout(() => setCopyText('Copiar cURL'), 2000);
    };

    const methodColors = {
        GET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        POST: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        PATCH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    return (
        <div className="p-3.5 bg-gray-900/90 rounded-xl border border-gray-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="font-mono text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                    <span className={`font-bold px-2 py-0.5 rounded border ${methodColors[method]}`}>{method}</span>
                    <span className="text-gray-200 font-semibold">{endpoint}</span>
                </div>
                <button 
                    onClick={handleCopy} 
                    className="self-start sm:self-auto px-3 py-1 text-xs font-semibold text-blue-300 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-colors"
                >
                    {copyText}
                </button>
            </div>
            <p className="text-xs text-gray-400">{description}</p>
            {body && (
                <div className="mt-2">
                    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Exemplo de Payload / Body:</h4>
                    <pre className="p-2.5 text-[11px] text-gray-300 bg-gray-950 rounded-lg border border-gray-800 font-mono overflow-x-auto">
                        <code>{JSON.stringify(body, null, 2)}</code>
                    </pre>
                </div>
            )}
        </div>
    );
};

// --- Accordion Container Component ---

interface AccordionItemProps {
    id: string;
    isOpen: boolean;
    onToggle: () => void;
    title: string;
    subtitle: string;
    icon: string;
    badgeText: string;
    badgeColor?: string;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
    isOpen,
    onToggle,
    title,
    subtitle,
    icon,
    badgeText,
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    children
}) => {
    return (
        <div className="bg-gray-800/90 rounded-2xl border border-gray-700/80 overflow-hidden shadow-lg transition-all">
            <button
                onClick={onToggle}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-gray-700/40 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${badgeColor}`}>
                                {badgeText}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                    </div>
                </div>
                <div className="ml-3 p-1.5 rounded-lg bg-gray-900/60 text-gray-400 border border-gray-700/60 shrink-0">
                    {isOpen ? <ChevronDownIcon className="w-5 h-5 text-blue-400" /> : <ChevronRightIcon className="w-5 h-5" />}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 sm:p-6 border-t border-gray-700/80 space-y-6 bg-gray-900/50 animate-fadeIn">
                    {children}
                </div>
            )}
        </div>
    );
};

// --- Main ExemploPage Component ---

const ExemploPage: React.FC = () => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        empresa: true,
        rh: false,
        minhaAgenda: false,
        agendamentoCliente: false,
        barbeariaAdmin: false,
        caixaBarbearia: false,
        financeiroBarbearia: false,
        apiGeral: false,
    });

    const [searchQuery, setSearchQuery] = useState('');

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        setOpenSections({
            empresa: true,
            rh: true,
            minhaAgenda: true,
            agendamentoCliente: true,
            barbeariaAdmin: true,
            caixaBarbearia: true,
            financeiroBarbearia: true,
            apiGeral: true,
        });
    };

    const collapseAll = () => {
        setOpenSections({
            empresa: false,
            rh: false,
            minhaAgenda: false,
            agendamentoCliente: false,
            barbeariaAdmin: false,
            caixaBarbearia: false,
            financeiroBarbearia: false,
            apiGeral: false,
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 rounded-2xl border border-gray-700/80 shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                                💈 Manual de Regras & Arquitetura
                            </span>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                                Módulos da Barbearia
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white">Regras de Negócio & Exemplos por Módulo</h1>
                        <p className="text-sm text-gray-300 mt-1 max-w-3xl">
                            Consulte as diretrizes operacionais, fluxos de trabalho, permissões de acesso e exemplos de endpoints da API para cada módulo do sistema de barbearias.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={expandAll}
                            className="px-3.5 py-2 text-xs font-bold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all shadow-md"
                        >
                            Expandir Todos
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-3.5 py-2 text-xs font-bold text-gray-300 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all"
                        >
                            Recolher Todos
                        </button>
                    </div>
                </div>
            </div>

            {/* Accordion 1: Empresa */}
            <AccordionItem
                id="empresa"
                isOpen={!!openSections.empresa}
                onToggle={() => toggleSection('empresa')}
                title="1. Empresa & Configurações da Barbearia"
                subtitle="Cadastro do estabelecimento, endereço, chave PIX, horários e Link Único público"
                icon="🏢"
                badgeText="Gestão da Empresa"
                badgeColor="bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                            <span>📌 Propósito do Módulo</span>
                        </h4>
                        <p className="text-gray-300">
                            Gerencia as informações institucionais e financeiras do estabelecimento. Define os dados exibidos no agendamento do cliente, chave PIX para pagamentos automáticos no caixa e parâmetros globais.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-blue-300 text-xs uppercase tracking-wider">Regras de Negócio</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Link Único de Agendamento (linkId):</strong> Código exclusivo gerado automaticamente para compartilhamento externo com clientes.</li>
                                <li><strong>Chave PIX Oficial:</strong> Utilizada no recebimento online e no PDV presencial.</li>
                                <li><strong>Horário de Funcionamento:</strong> Define a grade semanal em que os horários de corte ficam disponíveis no portal.</li>
                                <li><strong>Multilojas/Filiais:</strong> Permite administrar mais de uma unidade sob a mesma conta do proprietário.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Permissões de Acesso</h5>
                            <p className="text-xs text-gray-300">
                                Restrito ao <strong>Proprietário (Dono)</strong> e <strong>Administrador Geral</strong> da Barbearia (<code className="text-blue-300">empresa: true</code>).
                            </p>
                            <div className="pt-2 text-xs text-gray-400">
                                🔒 <em>Barbeiros e colaboradores não possuem permissão para alterar os dados cadastrais da empresa.</em>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="GET" 
                                endpoint="/companies?linkId={id}" 
                                description="Obtém os dados públicos da barbearia para renderizar a página de agendamento." 
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/companies" 
                                description="Cadastra uma nova empresa/barbearia vinculada ao e-mail do proprietário." 
                                body={{
                                    name: "Barbearia Dom Pedro",
                                    owner: "dono.barbearia@gmail.com",
                                    cnpj: "12345678000190",
                                    phone: "11999998888",
                                    pixKey: "12345678000190"
                                }}
                            />
                            <EndpointExample 
                                method="PUT" 
                                endpoint="/companies/{id}" 
                                description="Atualiza dados da barbearia (endereço, telefone, chave PIX, horários)." 
                                body={{
                                    name: "Barbearia Dom Pedro - Centro",
                                    pixKey: "financeiro@barbeariadompedro.com.br"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 2: RH */}
            <AccordionItem
                id="rh"
                isOpen={!!openSections.rh}
                onToggle={() => toggleSection('rh')}
                title="2. RH (Recursos Humanos & Barbeiros)"
                subtitle="Vínculo de barbeiros, parametrização de comissões, perfis e folha/ponto"
                icon="👥"
                badgeText="Equipe & Vínculos"
                badgeColor="bg-purple-500/20 text-purple-300 border-purple-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Centraliza a equipe de barbeiros, recepcionistas e gerentes. Permite vincular profissionais à barbearia pelo e-mail, atribuir comissões diferenciadas e gerenciar baterias de ponto.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-purple-300 text-xs uppercase tracking-wider">Regras de Negócio</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Convite/Vínculo por E-mail:</strong> O profissional se cadastra no aplicativo e a empresa o vincula ao ID da barbearia.</li>
                                <li><strong>Status do Vínculo:</strong> <span className="text-emerald-400 font-bold">Ativo</span> (pode atender e receber agendamentos) ou <span className="text-red-400 font-bold">Inativo</span>.</li>
                                <li><strong>Regra de Comissão Individual:</strong> Pode herdar a comissão padrão da casa ou possuir percentual específico (ex: 50% Corte, 15% Produtos).</li>
                                <li><strong>Aprovação de Registro de Ponto:</strong> O gestor valida batidas de ponto e justificativas de faltas/atrasos.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Permissões de Acesso</h5>
                            <p className="text-xs text-gray-300">
                                Acesso exclusivo para o <strong>Dono</strong> e <strong>Gerente de RH</strong> (<code className="text-purple-300">rh: true</code>).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="GET" 
                                endpoint="/rh/company/{userEmail}" 
                                description="Verifica se o e-mail do barbeiro possui vínculo com alguma barbearia cadastrada." 
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/rh/link-user" 
                                description="Associa o e-mail do barbeiro à barbearia com o status ativo." 
                                body={{
                                    idEmail: "barbeiro.lucas@gmail.com",
                                    empresaId: "696972f3447c500cfe3e05a2",
                                    status: "ativo"
                                }}
                            />
                            <EndpointExample 
                                method="GET" 
                                endpoint="/work-records?companyId={id}&month={m}&year={y}" 
                                description="Lista o relatório mensal de ponto dos barbeiros da barbearia." 
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 3: Minha Agenda */}
            <AccordionItem
                id="minhaAgenda"
                isOpen={!!openSections.minhaAgenda}
                onToggle={() => toggleSection('minhaAgenda')}
                title="3. Minha Agenda (Visão do Barbeiro)"
                subtitle="Fila de atendimento individual, status dos cortes e bloqueio de horários"
                icon="📅"
                badgeText="Agenda Profissional"
                badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Tela de trabalho diária do barbeiro. Exibe em ordem cronológica os clientes agendados, permitindo iniciar o atendimento, lançar produtos consumidos e bloquear horários de almoço/folga.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">Regras de Negócio</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Fluxo de Atendimento:</strong> <span className="text-blue-300">Confirmado</span> ➔ <span className="text-yellow-300">Em Atendimento</span> ➔ <span className="text-emerald-300">Concluído</span> (encaminha para cobrança no caixa).</li>
                                <li><strong>Lançamento na Cadeira:</strong> Barbeiro pode adicionar itens consumidos (pomadas, cervejas) diretamente na comanda do agendamento.</li>
                                <li><strong>Bloqueio de Agenda:</strong> Permite bloquear horários específicos (ex: almoço das 12h às 13h) para que não apareçam no agendamento público.</li>
                                <li><strong>Contador de Comissões do Dia:</strong> Exibe a estimativa acumulada de comissão gerada pelos atendimentos concluídos no dia.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Permissões de Acesso</h5>
                            <p className="text-xs text-gray-300">
                                Barbeiros ativos e administradores (<code className="text-amber-300">barbeiroAgenda: true</code>). Cada barbeiro visualiza prioritariamente seus próprios compromissos.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="GET" 
                                endpoint="/agendamentos?barbeiroId={id}&data={YYYY-MM-DD}" 
                                description="Lista os agendamentos marcados para o barbeiro na data selecionada." 
                            />
                            <EndpointExample 
                                method="PATCH" 
                                endpoint="/agendamentos/{id}/status" 
                                description="Atualiza o status do agendamento (ex: de 'confirmado' para 'em_andamento' ou 'concluido')." 
                                body={{
                                    status: "em_andamento"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 4: Tela de Agendamentos */}
            <AccordionItem
                id="agendamentoCliente"
                isOpen={!!openSections.agendamentoCliente}
                onToggle={() => toggleSection('agendamentoCliente')}
                title="4. Tela de Agendamentos (Portal do Cliente)"
                subtitle="Agendamento online e responsivo de autoatendimento para o cliente final"
                icon="📲"
                badgeText="Portal Público"
                badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Página web pública e leve, otimizada para celulares. O cliente acessa via link ou QR Code da barbearia e realiza o agendamento em menos de 1 minuto sem criar contas complexas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Regras de Agendamento</h5>
                            <ol className="space-y-1.5 text-xs list-decimal list-inside text-gray-300">
                                <li><strong>Escolha do Profissional:</strong> Seleção do barbeiro favorito ou "Qualquer Disponível".</li>
                                <li><strong>Seleção de Serviços:</strong> Escolha de um ou múltiplos serviços (ex: Corte + Barba + Sobrancelha). Duração e valores são somados automaticamente.</li>
                                <li><strong>Cálculo Inteligente de Slots:</strong> O sistema só exibe horários onde haja tempo contínuo suficiente na agenda do barbeiro para todos os serviços selecionados.</li>
                                <li><strong>Confirmação via WhatsApp:</strong> Geração de botão direto para avisar o barbeiro ou confirmar no WhatsApp.</li>
                                <li><strong>Prevenção de Overbooking:</strong> Validação em tempo real para impedir dois agendamentos no mesmo horário.</li>
                            </ol>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-blue-300 text-xs uppercase tracking-wider">Acesso sem Login</h5>
                            <p className="text-xs text-gray-300">
                                🌐 Rota aberta e pública (<code className="text-emerald-300">/agendamento/:linkId</code>). Não exige autenticação de usuário para efetuar agendamentos.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="GET" 
                                endpoint="/agendamentos/disponibilidade?barbeiroId={id}&data={YYYY-MM-DD}&duracaoTotalMin=45" 
                                description="Retorna os horários livres na agenda do barbeiro considerando a duração acumulada dos serviços." 
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/agendamentos" 
                                description="Cria um novo agendamento público realizado pelo cliente." 
                                body={{
                                    empresaId: "696972f3447c500cfe3e05a2",
                                    barbeiroId: "barbeiro-lucas-id",
                                    clienteNome: "Carlos Eduardo",
                                    clienteTelefone: "11988887777",
                                    servicos: ["Corte Degradê", "Barba Terapia"],
                                    valorTotalPrevisto: 80.00,
                                    dataAgendada: "2026-02-18",
                                    horario: "14:30"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 5: Barbearia Admin */}
            <AccordionItem
                id="barbeariaAdmin"
                isOpen={!!openSections.barbeariaAdmin}
                onToggle={() => toggleSection('barbeariaAdmin')}
                title="5. Barbearia Admin (Gestão, Serviços & Clubes VIP)"
                subtitle="Administração do catálogo de serviços, tabela de comissões e assinaturas VIP"
                icon="💈"
                badgeText="Administrativo Master"
                badgeColor="bg-red-500/20 text-red-300 border-red-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Painel completo de controle do proprietário. Permite cadastrar a tabela de preços de serviços, configurar regras de comissões da casa, gerenciar produtos para revenda e criar Planos de Assinatura Recorrente (Clube VIP).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-red-300 text-xs uppercase tracking-wider">Regras de Negócio</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Catálogo de Serviços:</strong> Cadastro de Preço (R$), Duração (Minutos) e % de Comissão para cada serviço.</li>
                                <li><strong>Clubes de Assinatura VIP:</strong> Planos mensais (ex: "Corte Ilimitado - R$ 99,90/mês") que garantem desconto ou isenção de pagamento no caixa para assinantes ativos.</li>
                                <li><strong>Gestão de Assinantes:</strong> Controle de clientes com mensalidades em dia e inadimplentes.</li>
                                <li><strong>Resumo de Comissões Acumuladas:</strong> Visão do total devido a cada barbeiro antes de efetuar os pagamentos/repasses.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Permissões de Acesso</h5>
                            <p className="text-xs text-gray-300">
                                Restrito aos administradores e gerentes gerais (<code className="text-red-300">barbearia: true</code>).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="POST" 
                                endpoint="/barbearia/servicos" 
                                description="Cadastra um novo serviço no catálogo da barbearia." 
                                body={{
                                    nome: "Corte Social + Lavagem",
                                    valor: 50.00,
                                    duracaoMinutos: 35,
                                    percentualComissao: 50
                                }}
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/barbearia/planos" 
                                description="Cria uma modalidade de plano VIP de assinatura recorrente." 
                                body={{
                                    nome: "Clube VIP Premium - Cabelo & Barba",
                                    valorMensal: 149.90,
                                    descricao: "Cortes e barbas ilimitados durante o mês."
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 6: Caixa Barbearia */}
            <AccordionItem
                id="caixaBarbearia"
                isOpen={!!openSections.caixaBarbearia}
                onToggle={() => toggleSection('caixaBarbearia')}
                title="6. Caixa Barbearia (PDV & Comanda Eletrônica)"
                subtitle="Frente de caixa, venda de produtos, recebimento de comandas e fechamento diário"
                icon="🛒"
                badgeText="PDV & Comandas"
                badgeColor="bg-blue-500/20 text-blue-300 border-blue-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Frente de caixa e encerramento de comandas do dia. Puxa atendimentos finalizados da agenda, adiciona vendas de produtos de balcão (pomadas, minoxidil, bebidas) e efetua a liquidação com divisão automática das comissões dos barbeiros.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-blue-300 text-xs uppercase tracking-wider">Regras do Caixa</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Abertura de Caixa:</strong> Registro do valor inicial de fundo de troco (suprimento).</li>
                                <li><strong>Puxada de Comanda da Agenda:</strong> Importa o cliente e os serviços executados pelo barbeiro.</li>
                                <li><strong>Adição de Produtos:</strong> Permite incluir produtos consumidos ou comprados no balcão com baixa automática no estoque.</li>
                                <li><strong>Desconto para Assinantes VIP:</strong> Se o cliente possuir plano ativo, o valor dos serviços cobertos é zerado.</li>
                                <li><strong>Divisão Instantânea de Comissão:</strong> Ao fechar a comanda, o sistema registra a receita da casa e o crédito de comissão do barbeiro.</li>
                                <li><strong>Formas de Pagamento:</strong> PIX, Cartão de Crédito, Débito, Dinheiro ou Fiado/A Prazo.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Permissões de Acesso</h5>
                            <p className="text-xs text-gray-300">
                                Operadores de Caixa, Recepcionistas, Gerentes e Barbeiros com acesso ao PDV (<code className="text-blue-300">caixaBarbearia: true</code>).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="POST" 
                                endpoint="/caixa/atendimentos" 
                                description="Inicia uma nova comanda de balcão ou importa do agendamento." 
                                body={{
                                    barbeiroId: "barbeiro-lucas-id",
                                    clienteNome: "João Silva",
                                    origem: "agendamento"
                                }}
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/caixa/atendimentos/{id}/fechar" 
                                description="Fecha a comanda, registra o pagamento e credita a comissão do barbeiro." 
                                body={{
                                    formaPagamento: "pix",
                                    valorTotalPago: 85.00,
                                    descontoConcedido: 0.00,
                                    itens: [
                                        { tipo: "servico", nome: "Corte Degradê", valor: 50.00, comissaoBarbeiro: 25.00 },
                                        { tipo: "produto", nome: "Pomada Matte", valor: 35.00, comissaoBarbeiro: 3.50 }
                                    ]
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 7: Financeiro Barbearia */}
            <AccordionItem
                id="financeiroBarbearia"
                isOpen={!!openSections.financeiroBarbearia}
                onToggle={() => toggleSection('financeiroBarbearia')}
                title="7. Financeiro Barbearia (DRE, Faturamento, Custos & Comissões)"
                subtitle="Análise estratégica de lucro, controle de repasses de comissão e DRE simplificado"
                icon="📊"
                badgeText="Demonstrativo Financeiro"
                badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            >
                <div className="space-y-4 text-xs sm:text-sm text-gray-300">
                    <div className="p-4 bg-gray-800/80 rounded-xl border border-gray-700/60">
                        <h4 className="font-bold text-white text-sm mb-2">📌 Propósito do Módulo</h4>
                        <p className="text-gray-300">
                            Apresenta a saúde financeira real da barbearia. Apura o DRE mensal, calcula o lucro líquido após o desconto de comissões, taxas operacionais e custos fixos, e gerencia a quitação dos repasses dos barbeiros.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Estrutura do DRE da Barbearia</h5>
                            <div className="p-3 bg-gray-950 rounded-xl font-mono text-[11px] space-y-1.5 text-gray-300 border border-gray-800">
                                <p className="text-emerald-400 font-bold">(+) Receita Bruta Total</p>
                                <p className="pl-3 text-gray-400">• Faturamento de Serviços (Cortes/Barba)</p>
                                <p className="pl-3 text-gray-400">• Venda de Produtos no Balcão</p>
                                <p className="pl-3 text-gray-400">• Receita de Assinaturas VIP</p>
                                <p className="text-red-400 font-bold">(-) Custos Variáveis</p>
                                <p className="pl-3 text-gray-400">• Comissões Pagas aos Barbeiros</p>
                                <p className="pl-3 text-gray-400">• Custo dos Produtos Vendidos (CMV)</p>
                                <p className="pl-3 text-gray-400">• Taxas de Cartão de Crédito e PIX</p>
                                <p className="text-blue-300 font-bold">(=) Margem de Contribuição</p>
                                <p className="text-orange-400 font-bold">(-) Despesas Fixas (Aluguel, Luz, Água, Marketing, Pró-labore)</p>
                                <p className="text-emerald-300 font-bold border-t border-gray-800 pt-1">(=) Lucro Líquido Real da Barbearia</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-2">
                            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">Gestão de Repasses aos Barbeiros</h5>
                            <ul className="space-y-1.5 text-xs list-disc list-inside text-gray-300">
                                <li><strong>Apuração de Comissões:</strong> Relatório individual mostrando todos os atendimentos do barbeiro no mês e a soma das comissões acumuladas.</li>
                                <li><strong>Dedução de Adiantamentos:</strong> Permite descontar vales ou produtos retirados pelo barbeiro durante o mês.</li>
                                <li><strong>Baixa do Pagamento:</strong> Registro do pagamento da comissão no sistema gerando a saída da conta da barbearia.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h5 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Exemplos de Endpoints (API)</h5>
                        <div className="space-y-3">
                            <EndpointExample 
                                method="GET" 
                                endpoint="/barbearia/financeiro/dre?empresaId={id}&mes={MM-YYYY}" 
                                description="Gera o DRE mensal consolidado com receitas, custos de comissão e lucro líquido." 
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/barbearia/repasses/quitar" 
                                description="Registra a quitação do repasse de comissão pago a um barbeiro." 
                                body={{
                                    barbeiroId: "barbeiro-lucas-id",
                                    mesReferencia: "02-2026",
                                    valorComissaoBruta: 2100.00,
                                    deducoesVales: 200.00,
                                    valorLiquidoPago: 1900.00,
                                    comprovanteUrl: "https://comprovantes.barbearia.com/repasse-123.pdf"
                                }}
                            />
                        </div>
                    </div>
                </div>
            </AccordionItem>

            {/* Accordion 8: Endpoints Genéricos & Exemplos do Sistema */}
            <AccordionItem
                id="apiGeral"
                isOpen={!!openSections.apiGeral}
                onToggle={() => toggleSection('apiGeral')}
                title="8. Endpoints Gerais da Aplicação & Exemplos Visuais"
                subtitle="Autenticação, Transações Financeiras Pessoais, Registros de Ponto e Chamados (OS)"
                icon="⚡"
                badgeText="Outros Módulos"
                badgeColor="bg-gray-700 text-gray-300 border-gray-600"
            >
                <div className="space-y-6 text-xs sm:text-sm text-gray-300">
                    {/* Endpoints Globais */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>🔑 Autenticação & Transações Financeiras Globais</span>
                        </h4>

                        <div className="space-y-3">
                            <EndpointExample 
                                method="POST" 
                                endpoint="/users/auth" 
                                description="Autentica um usuário no sistema com e-mail e senha." 
                                body={{ email: 'usuario@gmail.com', pass: 'senha123' }} 
                            />
                            <EndpointExample 
                                method="GET" 
                                endpoint="/transactions?idEmail={idEmail}&month={m}&year={y}" 
                                description="Busca transações e resumo financeiro de um usuário em um mês específico." 
                            />
                            <EndpointExample 
                                method="POST" 
                                endpoint="/transactions/simple" 
                                description="Cria uma nova transação simples de receita ou despesa." 
                                body={{ ownerEmail: 'usuario@gmail.com', type: 'expense', name: 'Aluguel Barbearia', amount: 1500.00, date: '2026-02-10', status: 'pago' }} 
                            />
                        </div>
                    </div>

                    {/* Componentes de Exemplo Renderizados */}
                    <div className="pt-4 border-t border-gray-700/80 space-y-6">
                        <h4 className="font-bold text-white text-sm">Exemplos Práticos de Listagens no Sistema</h4>

                        {/* Transaction List Example */}
                        <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
                            <h5 className="font-bold text-blue-300 text-xs">Exemplo: Lista de Transações Financeiras</h5>
                            <TransactionList
                                transactions={mockTransactions}
                                currentUserEmail="123"
                                onUpdateStatus={() => alert('Ação de exemplo: Atualizar status')}
                                onToggleSimplePaid={async () => { alert('Ação de exemplo: Alternar pago/não pago'); }}
                                onStartEdit={() => alert('Ação de exemplo: Editar')}
                                onDelete={() => alert('Ação de exemplo: Deletar')}
                                onDeleteSubTransaction={async () => alert('Ação de exemplo: Deletar sub-transação')}
                                onOpenAddValueModal={() => alert('Ação de exemplo: Abrir modal de adicionar valor')}
                                isPastMonth={false}
                            />
                        </div>

                        {/* Ponto Records Example */}
                        <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
                            <h5 className="font-bold text-purple-300 text-xs">Exemplo: Registros de Ponto da Equipe</h5>
                            <div className="space-y-2.5">
                                {mockWorkRecords.map(record => (
                                    <div key={record.id} className="p-3 bg-gray-900 rounded-xl border border-gray-800 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-white text-xs">{record.employeeEmail}</p>
                                            <p className="text-[11px] text-gray-400">
                                                {formatDate(record.entryTime)} • {formatTime(record.entryTime)} - {record.exitTime ? formatTime(record.exitTime) : '...'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <PontoStatusBadge status={record.status} />
                                            {record.durationMinutes !== undefined && (
                                                <span className="px-2.5 py-1 text-xs font-mono font-bold text-gray-200 bg-gray-800 rounded-lg border border-gray-700">
                                                    {formatDuration(record.durationMinutes)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chamados Example */}
                        <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-3">
                            <h5 className="font-bold text-amber-300 text-xs">Exemplo: Ordens de Serviço e Suporte Interno</h5>
                            <div className="space-y-3">
                                {mockChamados.map(os => (
                                    <div key={os.id} className="p-3.5 bg-gray-900 rounded-xl border border-gray-800 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h6 className="font-bold text-white text-xs">{os.title}</h6>
                                                <p className="text-[11px] text-gray-400">Solicitante: {os.openerEmail}</p>
                                            </div>
                                            <OSStatusBadge status={os.status} />
                                        </div>
                                        <p className="text-xs text-gray-300">{os.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>
        </div>
    );
};

export default ExemploPage;
