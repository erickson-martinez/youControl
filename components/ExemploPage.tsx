
import React from 'react';
import type { Transaction, WorkRecord, OrdemServico } from '../types';
import { TransactionType, PaymentStatus, PontoStatus, OSStatus } from '../types';
import TransactionList from './TransactionList';
import { ClockIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './icons';
import { API_BASE_URL } from '../constants';


// --- Mock Data ---

const mockTransactions: Transaction[] = [
    {
        id: '1',
        ownerPhone: '123',
        type: TransactionType.EXPENSE,
        name: 'Aluguel',
        amount: 700.00,
        date: '2026-02-10',
        isControlled: false,
        status: PaymentStatus.UNPAID,
    },
    {
        id: '2',
        ownerPhone: '123',
        type: TransactionType.REVENUE,
        name: 'Salário Meta',
        amount: 16558.96,
        date: '2026-01-12',
        isControlled: false,
        status: PaymentStatus.PAID,
    },
     {
        id: '3',
        ownerPhone: '123',
        type: TransactionType.REVENUE,
        name: 'Silveira',
        amount: 500.00,
        date: '2026-01-13',
        isControlled: false,
        status: PaymentStatus.UNPAID,
    },
    {
        id: '4',
        ownerPhone: '456',
        sharerPhone: '123',
        type: TransactionType.EXPENSE,
        name: 'Conta de Luz (Compartilhado)',
        amount: 150.75,
        date: '2026-01-20',
        isControlled: false,
        status: PaymentStatus.PAID,
    },
    {
        id: '5',
        ownerPhone: '123',
        type: TransactionType.EXPENSE,
        name: 'Pro-labore',
        amount: 1610.00,
        date: '2026-01-11',
        isControlled: true,
        counterpartyPhone: '67984726820',
        status: PaymentStatus.PAID,
    },
];

const mockWorkRecords: WorkRecord[] = [
    {
        id: 'rec1',
        employeePhone: '123',
        companyId: 'comp1',
        entryTime: '2026-01-16T11:42:00Z',
        exitTime: '2026-01-16T11:48:00Z',
        durationMinutes: 6,
        status: PontoStatus.PENDENTE,
    },
    {
        id: 'rec2',
        employeePhone: '123',
        companyId: 'comp1',
        entryTime: '2026-01-15T20:12:00Z',
        exitTime: '2026-01-15T20:13:00Z',
        durationMinutes: 1,
        status: PontoStatus.APROVADO,
    },
    {
        id: 'rec3',
        employeePhone: '123',
        companyId: 'comp1',
        entryTime: '2026-01-14T09:00:00Z',
        exitTime: '2026-01-14T09:05:00Z',
        durationMinutes: 5,
        status: PontoStatus.REJEITADO,
        rejectionReason: 'Registro de teste, favor desconsiderar.'
    }
];

const mockChamados: OrdemServico[] = [
    {
        id: 'os1',
        openerPhone: '67987654321',
        empresaId: 'comp-owner-123',
        title: 'Impressora não funciona',
        description: 'A impressora do setor de marketing está offline e não imprime nenhum documento.',
        status: OSStatus.ABERTO,
        createdAt: '2026-01-18T14:00:00Z',
    },
    {
        id: 'os2',
        openerPhone: '67911223344',
        empresaId: 'comp-owner-123',
        title: 'Acesso ao sistema de vendas',
        description: 'Não consigo acessar o sistema de vendas, aparece uma mensagem de erro de autenticação.',
        status: OSStatus.FECHADO,
        createdAt: '2026-01-17T10:30:00Z',
        resolution: 'A senha do usuário foi resetada e um novo acesso foi concedido com sucesso.'
    }
];

// --- Helper Components & Functions ---

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
        [PontoStatus.PENDENTE]: { text: 'Pendente', icon: <ClockIcon className="w-4 h-4" />, color: 'text-yellow-accent' },
        [PontoStatus.APROVADO]: { text: 'Aprovado', icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-green-accent' },
        [PontoStatus.REJEITADO]: { text: 'Rejeitado', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-red-accent' },
        [PontoStatus.CANCELADO]: { text: 'Cancelado', icon: <XCircleIcon className="w-4 h-4" />, color: 'text-gray-400' },
    };
    const statusInfo = statusMap[status] || statusMap[PontoStatus.PENDENTE];
    return <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color} bg-gray-600`}>{statusInfo.icon}<span>{statusInfo.text}</span></div>;
};

const osStatusDisplayMap: Record<OSStatus, string> = {
    [OSStatus.ABERTO]: 'Aberto',
    [OSStatus.EM_ANDAMENTO]: 'Em Andamento',
    [OSStatus.FECHADO]: 'Resolvido',
    [OSStatus.CANCELADO]: 'Cancelado',
};

const OSStatusBadge: React.FC<{ status: OSStatus }> = ({ status }) => {
    const statusStyles: Record<OSStatus, string> = {
        [OSStatus.ABERTO]: 'bg-yellow-600 text-yellow-100',
        [OSStatus.EM_ANDAMENTO]: 'bg-blue-600 text-blue-100',
        [OSStatus.FECHADO]: 'bg-green-600 text-green-100',
        [OSStatus.CANCELADO]: 'bg-gray-500 text-gray-100'
    };
    return <span className={`self-start px-2 py-1 text-xs font-medium rounded-full sm:self-center ${statusStyles[status] || 'bg-gray-500'}`}>{osStatusDisplayMap[status] || 'Desconhecido'}</span>;
}

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
        GET: 'text-blue-400',
        POST: 'text-green-400',
        PUT: 'text-yellow-400',
        PATCH: 'text-orange-400',
        DELETE: 'text-red-400',
    };

    return (
        <div className="p-4 bg-gray-700 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="font-mono text-sm">
                    <span className={`font-bold ${methodColors[method]}`}>{method}</span>
                    <span className="ml-2 text-gray-300">{endpoint}</span>
                </div>
                <button onClick={handleCopy} className="self-start px-3 py-1 mt-2 text-xs font-semibold text-white transition-colors rounded-md sm:self-center sm:mt-0 bg-blue-accent hover:bg-blue-accent/90">{copyText}</button>
            </div>
            <p className="mt-2 text-sm text-gray-400">{description}</p>
            {body && (
                <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-300">Exemplo de Body:</h4>
                    <pre className="p-2 mt-1 text-xs text-white bg-gray-900 rounded-md"><code>{JSON.stringify(body, null, 2)}</code></pre>
                </div>
            )}
        </div>
    );
};


const apiEndpoints = {
    'Autenticação': [
        { method: 'POST', endpoint: '/users/auth', description: 'Autentica um usuário e retorna o nome.', body: { phone: '67912345678', pass: 'senha123' } },
        { method: 'POST', endpoint: '/users', description: 'Registra um novo usuário.', body: { name: 'Novo Usuário', phone: '67987654321', pass: 'novaSenha456' } },
    ],
    'Financeiro': [
        { method: 'GET', endpoint: '/transactions?phone={phone}&month={m}&year={y}', description: 'Busca transações e o resumo financeiro para um usuário em um mês específico.' },
        { method: 'POST', endpoint: '/transactions/simple', description: 'Cria uma nova transação simples (receita ou despesa).', body: { ownerPhone: '67912345678', type: 'expense', name: 'Supermercado', amount: 250.75, date: 'YYYY-MM-DD', status: 'pago' } },
        { method: 'POST', endpoint: '/transactions/controlled', description: 'Cria uma transação controlada (cobrança/pagamento) entre dois usuários.', body: { ownerPhone: '67912345678', counterpartyPhone: '67987654321', name: 'Aluguel', amount: 1200, date: 'YYYY-MM-DD' } },
        { method: 'PUT', endpoint: '/transactions/{id}', description: 'Atualiza os dados de uma transação existente.', body: { name: 'Nome Atualizado', amount: 300 } },
        { method: 'PATCH', endpoint: '/transactions/status', description: 'Altera o status de uma transação (ex: de não pago para pago).', body: { transactionId: 'id_da_transacao', ownerPhone: '67912345678', status: 'pago' } },
        { method: 'DELETE', endpoint: '/transactions', description: 'Exclui uma transação.', body: { transactionId: 'id_da_transacao', ownerPhone: '67912345678' } },
    ],
    'Ponto e RH': [
        { method: 'GET', endpoint: '/rh/company/{userPhone}', description: 'Busca o vínculo de empresa de um usuário para obter o `empresaId`.' },
        { method: 'POST', endpoint: '/rh/link-user', description: 'Vincula um usuário a uma empresa.', body: { userPhone: '67912345678', empresaId: 'id_da_empresa', status: 'ativo' } },
        { method: 'GET', endpoint: '/work-records?companyId={id}&employeePhone={phone}&month={m}&year={y}', description: "Busca os registros de ponto de um colaborador para um mês específico." },
        { method: 'POST', endpoint: '/work-records/clock-in', description: 'Inicia um novo registro de ponto (bater ponto de entrada).', body: { employeePhone: '67912345678', companyId: 'id_da_empresa', entryTime: 'ISODateString' } },
        { method: 'PATCH', endpoint: '/work-records/{id}/clock-out', description: 'Finaliza um registro de ponto (bater ponto de saída).', body: { employeePhone: '67912345678', exitTime: 'ISODateString' } },
        { method: 'PATCH', endpoint: '/work-records/{id}/approve', description: 'Aprova um registro de ponto pendente.', body: { approverPhone: 'phone_do_aprovador' } },
        { method: 'PATCH', endpoint: '/work-records/{id}/reject', description: 'Rejeita um registro de ponto pendente com um motivo.', body: { approverPhone: 'phone_do_aprovador', rejectionReason: 'Horário inválido' } },
    ],
    'Ordem de Serviço (OS) / Chamados': [
        { method: 'POST', endpoint: '/os', description: 'Cria uma nova Ordem de Serviço.', body: { openerPhone: "67984726822", empresaId: "696972f3447c500cfe3e05a2", title: "Falha no software de faturamento", description: "Ao emitir nota fiscal, o sistema apresenta erro 500." } },
        { method: 'GET', endpoint: '/os/my?phone=67984726822', description: 'Lista as Ordens de Serviço abertas pelo próprio usuário.' },
        { method: 'GET', endpoint: '/os/company?empresaId=696972f3447c500cfe3e05a2&phone=6798426823', description: 'Lista todos os chamados da empresa (apenas para o dono).' },
        { method: 'PATCH', endpoint: '/os/{id}/start', description: 'Inicia o atendimento de uma OS, mudando o status para "em andamento".', body: { phone: "6798426823" } },
        { method: 'PATCH', endpoint: '/os/{id}/resolve', description: 'Resolve/finaliza uma Ordem de Serviço.', body: { resolverPhone: "6798426823", resolution: "Atualizado o endpoint de emissão de NF-e." } },
        { method: 'PATCH', endpoint: '/os/{id}/cancel', description: 'Cancela uma Ordem de Serviço (apenas quem abriu pode cancelar).', body: { phone: "67984726822" } },
    ],
     'Configurações e Empresa': [
        { method: 'GET', endpoint: '/companies/{ownerPhone}', description: 'Busca as empresas de um proprietário.'},
        { method: 'POST', endpoint: '/companies', description: 'Cria uma nova empresa.', body: { name: 'Minha Nova Empresa', owner: 'phone_do_dono' } },
        { method: 'PUT', endpoint: '/companies/{id}', description: 'Atualiza os dados de uma empresa.', body: { name: 'Nome Atualizado da Empresa', cnpj: '12345678000190' } },
        { method: 'GET', endpoint: '/permissions?userPhone={phone}', description: 'Obtém a lista de permissões de um usuário específico.' },
        { method: 'PATCH', endpoint: '/permissions?phone={phone}&add=true', description: 'Adiciona permissões a um usuário.', body: { permissions: ['ponto', 'rh'] } },
    ],
};

// --- Main Component ---

const ExemploPage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="p-4 bg-gray-800 rounded-lg">
                <h1 className="mb-6 text-2xl font-bold text-white">Página de Exemplos</h1>
                <p className="text-gray-400">Esta página demonstra a aparência de alguns componentes e documenta os endpoints da API com exemplos de cURL.</p>
            </div>

            {/* API Endpoints */}
            <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="mb-4 text-xl font-bold text-white">API Endpoints e Exemplos cURL</h2>
                <div className="space-y-6">
                    {Object.entries(apiEndpoints).map(([category, endpoints]) => (
                        <div key={category}>
                            <h3 className="mb-3 text-lg font-semibold text-blue-300">{category}</h3>
                            <div className="space-y-3">
                                {endpoints.map(ep => <EndpointExample key={`${ep.method}-${ep.endpoint}`} {...ep} />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction List Example */}
            <div className="p-4 bg-gray-800 rounded-lg">
                <TransactionList
                    transactions={mockTransactions}
                    currentUserPhone="123"
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
            <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-bold text-white">Exemplo de Registros do Mês (Ponto)</h2>
                 <div className="mt-4 space-y-3">
                    {mockWorkRecords.map(record => (
                         <div key={record.id} className="p-3 bg-gray-700 rounded-lg">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-white">{formatDate(record.entryTime)}</p>
                                    <p className="text-xs text-gray-400">
                                        {formatTime(record.entryTime)} - {record.exitTime ? formatTime(record.exitTime) : '...'}
                                    </p>
                                </div>

                                <div className="flex items-center flex-shrink-0 gap-x-4 gap-y-2">
                                    <PontoStatusBadge status={record.status} />
                                    {record.durationMinutes !== undefined ? (
                                        <div className="px-3 py-1 text-sm font-bold text-white bg-gray-600 rounded-full whitespace-nowrap">
                                            {formatDuration(record.durationMinutes)}
                                        </div>
                                    ) : null}
                                    {record.status === PontoStatus.PENDENTE && (
                                        <button 
                                            onClick={() => alert('Ação de exemplo: Deletar registro pendente')}
                                            className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent"
                                            title="Cancelar Registro (Exemplo)"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {record.status === PontoStatus.REJEITADO && record.rejectionReason && (
                                <div className="pt-3 mt-3 text-xs border-t border-gray-600">
                                    <div className="p-2 bg-red-900/50 rounded-md">
                                        <p className="font-semibold text-red-300">Motivo da Rejeição:</p>
                                        <p className="text-red-200">{record.rejectionReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chamados Example */}
            <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-xl font-bold text-white">Exemplo de Caixa de Entrada de Chamados</h2>
                <div className="mt-4 space-y-3">
                    {mockChamados.map(os => (
                        <div key={os.id} className="p-4 bg-gray-700 rounded-lg">
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{os.title}</h3>
                                    <p className="text-xs text-gray-400">Aberto por: {os.openerPhone}</p>
                                </div>
                                <OSStatusBadge status={os.status} />
                            </div>
                            <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{os.description}</p>
                            
                            {os.status === OSStatus.FECHADO && os.resolution && (
                                <div className="p-3 mt-3 text-sm bg-gray-600 border-l-4 border-green-accent rounded-r-md">
                                    <p className="font-semibold text-green-300">Solução:</p>
                                    <p className="mt-1 text-gray-300 whitespace-pre-wrap">{os.resolution}</p>
                                </div>
                            )}

                            <div className="flex items-end justify-between pt-2 mt-3 border-t border-gray-600">
                                <p className="text-xs text-gray-500">
                                    {new Date(os.createdAt).toLocaleString('pt-BR')}
                                </p>
                                {os.status === OSStatus.ABERTO && (
                                    <button 
                                        onClick={() => alert('Ação de exemplo: Resolver chamado')}
                                        className="px-3 py-1 text-sm font-semibold text-white transition-colors rounded-md bg-blue-accent hover:bg-blue-accent/90"
                                    >
                                        Resolver
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExemploPage;
