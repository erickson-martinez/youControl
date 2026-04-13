import React, { useState } from 'react';
import { useJornada } from '../hooks/useJornada';
import { User } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon, DownloadIcon, CheckCircleIcon } from './icons';
import DayNavigator from './DayNavigator';
import MonthNavigator from './MonthNavigator';

const TIMEFRAMES = [
  { value: 'dias', label: 'Dias' },
  { value: 'semanas', label: 'Semanas' },
  { value: '5_meses', label: '5 Meses' },
  { value: '6_meses', label: '6 Meses' },
  { value: '1_ano', label: '1 Ano' },
  { value: '2_anos', label: '2 Anos' },
  { value: '5_anos', label: '5 Anos' },
  { value: 'conquistas', label: 'Conquistas (Ex: Carro)' },
];

interface JornadaPageProps {
  user: User;
}

const JornadaPage: React.FC<JornadaPageProps> = ({ user }) => {
  const { data, updateContext, toggleHabit, addHabit, deleteHabit, addGoal, toggleGoal, deleteGoal, addPrayer, togglePrayer, deletePrayer, registerFastFood } = useJornada();
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date());
  const selectedDate = selectedDateObj.toISOString().split('T')[0];
  
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTimeframe, setNewGoalTimeframe] = useState<any>('dias');
  
  const [newPrayer, setNewPrayer] = useState('');
  const [newHabitLabel, setNewHabitLabel] = useState('');
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState(data.context);

  const handleSaveContext = () => {
    updateContext(contextForm);
    setIsEditingContext(false);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalTitle.trim()) {
      addGoal(newGoalTitle, newGoalTimeframe);
      setNewGoalTitle('');
    }
  };

  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrayer.trim()) {
      addPrayer(newPrayer);
      setNewPrayer('');
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitLabel.trim()) {
      addHabit(newHabitLabel);
      setNewHabitLabel('');
    }
  };

  const handleExport = () => {
    let report = `RELATÓRIO DE JORNADA E EVOLUÇÃO\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    report += `=========================================\n`;
    report += `1. CONTEXTO PESSOAL E PROFISSIONAL\n`;
    report += `=========================================\n`;
    report += `Nome: ${data.context.nome}\n`;
    report += `Idade: ${data.context.idade}\n`;
    report += `Profissão: ${data.context.profissao}\n`;
    report += `Família: ${data.context.familia}\n`;
    report += `Rotina do filho: ${data.context.rotinaFilho}\n`;
    report += `Empreendimento: ${data.context.empreendimento}\n`;
    report += `Veículo: ${data.context.veiculo}\n\n`;

    report += `=========================================\n`;
    report += `2. PONTUAÇÃO GERAL\n`;
    report += `=========================================\n`;
    report += `Pontos Acumulados: ${data.points}\n\n`;

    report += `=========================================\n`;
    report += `3. DESEMPENHO DOS HÁBITOS (Últimos 7 dias)\n`;
    report += `=========================================\n`;
    
    // Calculate last 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = data.dailyLogs[dateStr] || {};
      const completedCount = Object.values(dayLogs).filter(Boolean).length;
      report += `Data: ${dateStr} - Hábitos concluídos: ${completedCount}/${data.customHabits.length}\n`;
    }
    report += `\n`;

    report += `=========================================\n`;
    report += `4. METAS\n`;
    report += `=========================================\n`;
    TIMEFRAMES.forEach(tf => {
      const goalsInTf = data.goals.filter(g => g.timeframe === tf.value);
      if (goalsInTf.length > 0) {
        report += `[${tf.label.toUpperCase()}]\n`;
        goalsInTf.forEach(g => {
          report += `  ${g.completed ? '[X]' : '[ ]'} ${g.title}\n`;
        });
      }
    });
    report += `\n`;

    report += `=========================================\n`;
    report += `5. PEDIDOS DE ORAÇÃO\n`;
    report += `=========================================\n`;
    if (data.prayers.length === 0) report += `Nenhum pedido de oração registrado.\n`;
    data.prayers.forEach(p => {
      report += `  ${p.answered ? '[RESPONDIDA]' : '[PENDENTE]'} ${p.request}\n`;
    });
    report += `\n`;

    report += `=========================================\n`;
    report += `6. RECOMPENSAS E ALIMENTAÇÃO\n`;
    report += `=========================================\n`;
    report += `Último Fast Food: ${data.lastFastFoodDate ? new Date(data.lastFastFoodDate).toLocaleDateString('pt-BR') : 'Nenhum registro'}\n`;
    if (data.lastFastFoodDate) {
      const lastDate = new Date(data.lastFastFoodDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      report += `Dias desde o último Fast Food: ${diffDays} (Meta: 15 dias)\n`;
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jornada_erickson_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentDayLogs = data.dailyLogs[selectedDate] || {};

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-yellow-400" />
            Minha Jornada e Evolução
          </h1>
          <p className="text-gray-400 mt-1">Gerencie seus hábitos, metas e rotina diária.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 flex items-center justify-between sm:justify-start gap-2">
             <span className="text-sm text-gray-400">Pontuação:</span>
             <span className="text-xl font-bold text-yellow-400">{data.points} pts</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingContext(true)}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium shadow-md"
            >
              Sobre mim
            </button>
            <button
              onClick={handleExport}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-md"
            >
              <DownloadIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar para IA</span>
              <span className="sm:hidden">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {isEditingContext && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h2 className="text-xl font-bold text-white">Meu Contexto</h2>
              <button 
                onClick={() => setIsEditingContext(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Nome</label>
                <input type="text" value={contextForm.nome} onChange={e => setContextForm({...contextForm, nome: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Idade</label>
                <input type="text" value={contextForm.idade} onChange={e => setContextForm({...contextForm, idade: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs mb-1">Profissão/Trabalho</label>
                <input type="text" value={contextForm.profissao} onChange={e => setContextForm({...contextForm, profissao: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Família</label>
                <input type="text" value={contextForm.familia} onChange={e => setContextForm({...contextForm, familia: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Rotina do Filho</label>
                <input type="text" value={contextForm.rotinaFilho} onChange={e => setContextForm({...contextForm, rotinaFilho: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs mb-1">Empreendimento</label>
                <input type="text" value={contextForm.empreendimento} onChange={e => setContextForm({...contextForm, empreendimento: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs mb-1">Veículo</label>
                <input type="text" value={contextForm.veiculo} onChange={e => setContextForm({...contextForm, veiculo: e.target.value})} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditingContext(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveContext}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Habits */}
        <div className="space-y-6">
          <div className="space-y-2">
            <MonthNavigator 
              currentDate={selectedDateObj} 
              setCurrentDate={setSelectedDateObj} 
            />
            <DayNavigator 
              currentDate={selectedDateObj} 
              setCurrentDate={setSelectedDateObj} 
            />
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Hábitos Diários</h2>
            </div>
            
            <form onSubmit={handleAddHabit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Novo hábito..."
                value={newHabitLabel}
                onChange={(e) => setNewHabitLabel(e.target.value)}
                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {data.customHabits.map(habit => {
                const isCompleted = !!currentDayLogs[habit.id];
                return (
                  <div 
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isCompleted ? 'bg-green-900/20 border-green-500/30' : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleHabit(selectedDate, habit.id)}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-500'
                      }`}>
                        {isCompleted && <CheckCircleIcon className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm ${isCompleted ? 'text-gray-300 line-through' : 'text-white'}`}>
                        {habit.label}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHabit(habit.id);
                      }} 
                      className="text-red-400 hover:text-red-300 p-1 ml-2"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fast Food Reward */}
          {(!data.lastFastFoodDate || (new Date().getTime() - new Date(data.lastFastFoodDate).getTime()) / (1000 * 60 * 60 * 24) >= 15) && (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Recompensa: Fast Food</h2>
              <p className="text-sm text-gray-400 mb-4">Meta: 1 vez a cada 15 dias.</p>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-700 p-4 rounded-lg gap-4">
                <div>
                  <p className="text-xs text-gray-400">Último Fast Food</p>
                  <p className="text-lg font-semibold text-white">
                    {data.lastFastFoodDate ? new Date(data.lastFastFoodDate).toLocaleDateString('pt-BR') : 'Nenhum registro'}
                  </p>
                </div>
                <button
                  onClick={() => registerFastFood(new Date().toISOString().split('T')[0])}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Comi Hoje! 🍔
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Goals & Prayers */}
        <div className="space-y-6">
          {/* Goals */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Metas</h2>
            
            <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                placeholder="Nova meta..."
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <select
                  value={newGoalTimeframe}
                  onChange={(e) => setNewGoalTimeframe(e.target.value)}
                  className="flex-1 sm:flex-none bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {TIMEFRAMES.map(tf => (
                    <option key={tf.value} value={tf.value}>{tf.label}</option>
                  ))}
                </select>
                <button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {TIMEFRAMES.map(tf => {
                const goalsInTf = data.goals.filter(g => g.timeframe === tf.value);
                if (goalsInTf.length === 0) return null;
                return (
                  <div key={tf.value}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{tf.label}</h3>
                    <div className="space-y-2">
                      {goalsInTf.map(goal => (
                        <div key={goal.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGoal(goal.id)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                              goal.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                            }`}>
                              {goal.completed && <CheckCircleIcon className="w-4 h-4 text-white" />}
                            </div>
                            <span className={`text-sm ${goal.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                              {goal.title}
                            </span>
                          </div>
                          <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-300 p-1">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {data.goals.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma meta cadastrada.</p>
              )}
            </div>
          </div>

          {/* Prayers */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Pedidos de Oração</h2>
            
            <form onSubmit={handleAddPrayer} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Novo pedido de oração..."
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
                className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="p-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">
                <PlusIcon className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {data.prayers.map(prayer => (
                <div key={prayer.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => togglePrayer(prayer.id)}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                      prayer.answered ? 'bg-green-500 border-green-500' : 'border-gray-400'
                    }`}>
                      {prayer.answered && <CheckCircleIcon className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-sm ${prayer.answered ? 'text-gray-400 line-through' : 'text-white'}`}>
                      {prayer.request}
                    </span>
                  </div>
                  <button onClick={() => deletePrayer(prayer.id)} className="text-red-400 hover:text-red-300 p-1">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {data.prayers.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum pedido registrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JornadaPage;
