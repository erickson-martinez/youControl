
import React from 'react';
import { 
    ChevronLeftIcon, ChevronRightIcon, PlusIcon, MinusIcon, UsersIcon, 
    PencilIcon, TrashIcon, CheckCircleIcon, CashIcon, ShareIcon, ClockIcon 
} from './icons';

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="p-6 mb-6 bg-gray-700 rounded-lg">
        <h2 className="flex items-center mb-4 text-2xl font-bold text-white">
            {icon && <span className="mr-3">{icon}</span>}
            {title}
        </h2>
        <div className="space-y-4 text-gray-300 leading-relaxed">
            {children}
        </div>
    </div>
);

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="px-2 py-1 mx-1 text-sm font-mono text-blue-300 bg-gray-900 rounded-md">{children}</span>
);

const FinancialManualPage: React.FC = () => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <h1 className="mb-8 text-3xl font-bold text-center text-white">Manual do Módulo Financeiro</h1>
            
            <Section title="Visão Geral do Painel" icon={<CashIcon className="w-8 h-8 text-blue-accent" />}>
                <p>
                    O painel financeiro é sua central de controle. Aqui você pode visualizar suas finanças mensais, adicionar novas transações e ver um resumo de sua saúde financeira.
                </p>
                <div className="space-y-3">
                    <div>
                        <h3 className="mb-2 font-semibold text-white">Navegador de Mês</h3>
                        <p>
                            Use os botões <ChevronLeftIcon className="inline w-5 h-5" /> e <ChevronRightIcon className="inline w-5 h-5" /> no topo da tela para navegar entre os meses. Isso permite que você reveja seu histórico financeiro ou planeje seus meses futuros.
                        </p>
                    </div>
                    <div>
                        <h3 className="mb-2 font-semibold text-white">Cartões de Resumo</h3>
                        <p>Os quatro cartões no topo oferecem uma visão rápida do mês selecionado:</p>
                        <ul className="pl-5 mt-2 list-disc space-y-1">
                            <li><strong>Receitas:</strong> O total de dinheiro que entrou no mês.</li>
                            <li><strong>Despesas:</strong> O total de dinheiro que saiu no mês.</li>
                            <li><strong>Saldo do Mês:</strong> A diferença entre receitas e despesas do mês corrente. Se for um mês futuro, aparecerá como <Highlight>Previsão Saldo</Highlight>.</li>
                            <li><strong>Total:</strong> Seu saldo acumulado de todos os meses anteriores até o mês atual. Para meses futuros, este valor é uma <Highlight>Previsão Total</Highlight>, somando os saldos previstos dos meses intermediários.</li>
                        </ul>
                    </div>
                </div>
            </Section>

            <Section title="Gerenciando Transações" icon={<PencilIcon className="w-8 h-8 text-yellow-accent" />}>
                 <p>
                    Manter suas transações atualizadas é a chave para um bom controle financeiro. O sistema oferece várias ferramentas para facilitar esse processo.
                </p>
                <div>
                    <h3 className="mb-2 font-semibold text-white">Adicionar Receita ou Despesa</h3>
                    <p>
                        Use os botões <Highlight>+ Receita</Highlight> e <Highlight>- Despesa</Highlight> para abrir o formulário de nova transação. Preencha os detalhes e salve.
                    </p>
                    <ul className="pl-5 mt-2 list-disc space-y-1">
                        <li><strong>Transação Recorrente:</strong> Marque a opção <Highlight>Repetir</Highlight> para que a transação seja criada automaticamente nos próximos meses. Ideal para aluguel, salários ou assinaturas.</li>
                        <li><strong>Transação Controlada:</strong> Marque <Highlight>Cobrar de</Highlight> ou <Highlight>Pagar para</Highlight> para criar uma transação vinculada a outro usuário do sistema. Isso enviará uma notificação para a outra pessoa aprovar, mantendo as finanças de ambos sincronizadas.</li>
                    </ul>
                </div>
                 <div>
                    <h3 className="mb-2 font-semibold text-white">Marcar como Pago/Não Pago</h3>
                    <p>
                        Use o checkbox <Highlight>Pago</Highlight> ao lado de cada transação para atualizar seu status.
                    </p>
                     <ul className="pl-5 mt-2 list-disc space-y-1">
                        <li>Ao desmarcar uma transação que já estava paga, um modal de confirmação aparecerá para evitar alterações acidentais.</li>
                        <li>Esta opção não está disponível para transações controladas que aguardam aprovação.</li>
                    </ul>
                </div>
                 <div>
                    <h3 className="mb-2 font-semibold text-white">Adicionar Detalhes a uma Transação</h3>
                     <p>
                         Para despesas como uma compra de supermercado com vários itens, você pode adicionar detalhes. Clique no botão <Highlight>-$</Highlight> (para despesas) ou <Highlight>+$</Highlight> (para receitas). Isso abre um modal para adicionar um item com descrição e valor, que será subtraído do valor total da transação. Isso ajuda a detalhar de onde o dinheiro veio ou para onde foi.
                    </p>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold text-white">Editar e Excluir</h3>
                    <p>
                        Use os ícones de <PencilIcon className="inline w-5 h-5" /> (Editar) e <TrashIcon className="inline w-5 h-5" /> (Excluir) para gerenciar suas transações. A exclusão sempre pedirá uma confirmação.
                    </p>
                    <p className="mt-2 text-sm text-yellow-300 bg-yellow-900/50 p-2 rounded-md">
                        <strong>Atenção:</strong> Não é possível adicionar, editar ou excluir transações em meses passados para garantir a integridade do seu histórico financeiro.
                    </p>
                </div>
            </Section>

             <Section title="Recursos Especiais" icon={<CheckCircleIcon className="w-8 h-8 text-green-accent" />}>
                 <div>
                    <h3 className="mb-2 font-semibold text-white">Avisos de Vencimento</h3>
                    <p>
                        Ao entrar no aplicativo, se você tiver contas não pagas com data de vencimento anterior a hoje, um alerta (<ClockIcon className="inline w-5 h-5" />) aparecerá. Este modal lista todas as suas pendências, permitindo que você as visualize e as marque como pagas diretamente, sem precisar procurá-las na lista.
                    </p>
                </div>
                <div>
                    <h3 className="mb-2 font-semibold text-white">Compartilhamento e Abas</h3>
                    <p>
                        Você pode compartilhar suas finanças com outros usuários através do botão <Highlight>Compartilhar</Highlight> (<UsersIcon className="inline w-5 h-5" />). As transações são divididas em duas abas:
                    </p>
                    <ul className="pl-5 mt-2 list-disc space-y-1">
                        <li><strong>Minhas Transações:</strong> Contas que você criou.</li>
                        <li><strong>Compartilhados Comigo:</strong> Contas que outros usuários compartilharam com você.</li>
                    </ul>
                </div>
            </Section>
        </div>
    );
};

export default FinancialManualPage;
