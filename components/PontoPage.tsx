
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { User, Empresa, WorkRecord } from '../types';
import { PontoStatus } from '../types';
import { OfficeBuildingIcon, ClockIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import MonthNavigator from './MonthNavigator';
import { API_BASE_URL } from '../constants';

interface PontoPageProps {
  user: User;
  empresa: Empresa;
  onPontoUpdate: () => void;
}

type ActiveWorkSession = { id: string; startTime: string; companyId: string };

const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

const PontoPage: React.FC<PontoPageProps> = ({ user, empresa, onPontoUpdate }) => {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveWorkSession | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<WorkRecord | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const response = await fetch(url, {
            ...options,
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', ...options.headers },
        });
        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            const message = errorJson.error || errorJson.message || `Erro do servidor (HTTP ${response.status}).`;
            throw new Error(message);
        }
        return response;
  }, []);
  
  const syncActiveSession = useCallback((recs: WorkRecord[]) => {
      const openRecord = recs.find(rec => !rec.exitTime);
      if (openRecord) {
          const session = { id: openRecord.id, startTime: openRecord.entryTime, companyId: openRecord.companyId };
          setActiveSession(session);
          localStorage.setItem('activeWorkSession', JSON.stringify(session));
      } else {
          setActiveSession(null);
          localStorage.removeItem('activeWorkSession');
      }
  }, []);
  
  const fetchMyRecords = useCallback(async () => {
    if (!user || !empresa) {
        setRecords([]);
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const response = await apiFetch(`${API_BASE_URL}/work-records?companyId=${empresa.id}&employeePhone=${user.phone}&month=${month}&year=${year}`);
        const data = await response.json();
        const mappedRecords: WorkRecord[] = (data.records || []).map((rec: any) => ({ 
            ...rec, 
            id: rec._id,
            companyId: (rec.companyId && typeof rec.companyId === 'object') ? rec.companyId._id : rec.companyId,
        }));
        setRecords(mappedRecords);

        const today = new Date();
        if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
            syncActiveSession(mappedRecords);
        }

    } catch (err) {
        if (!(err as Error).message.includes('404')) {
          console.error("Falha ao buscar meus registros de ponto:", err);
          setError((err as Error).message);
        }
        setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, empresa, currentDate, apiFetch, syncActiveSession]);

  useEffect(() => {
    fetchMyRecords();
  }, [fetchMyRecords]);

  useEffect(() => {
    const savedSession = localStorage.getItem('activeWorkSession');
    if (savedSession) {
      try {
        const parsedSession: ActiveWorkSession = JSON.parse(savedSession);
        if (parsedSession.id && parsedSession.companyId === empresa.id) {
          setActiveSession(parsedSession);
        } else {
          localStorage.removeItem('activeWorkSession');
        }
      } catch(e) {
         localStorage.removeItem('activeWorkSession');
      }
    }
  }, [empresa.id]);
  
  const handleClockInOut = async () => {
    try {
        if (activeSession) {
            await apiFetch(`${API_BASE_URL}/work-records/${activeSession.id}/clock-out`, {
                method: 'PATCH',
                body: JSON.stringify({ employeePhone: user.phone, exitTime: new Date().toISOString() }),
            });
            setActiveSession(null);
            localStorage.removeItem('activeWorkSession');
        } else {
            const response = await apiFetch(`${API_BASE_URL}/work-records/clock-in`, {
                method: 'POST',
                body: JSON.stringify({ employeePhone: user.phone, companyId: empresa.id, entryTime: new Date().toISOString() }),
            });
            const data = await response.json();
            if (data.record && data.record._id) {
                const newActiveSession: ActiveWorkSession = {
                    id: data.record._id,
                    startTime: data.record.entryTime,
                    companyId: data.record.companyId,
                };
                setActiveSession(newActiveSession);
                localStorage.setItem('activeWorkSession', JSON.stringify(newActiveSession));
            }
        }
        await fetchMyRecords();
        onPontoUpdate();
    } catch (error) {
        alert(`Falha ao bater o ponto: ${(error as Error).message}`);
        await fetchMyRecords(); // Re-sync state on failure
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      await apiFetch(`${API_BASE_URL}/work-records/${recordId}`, {
        method: 'DELETE',
        body: JSON.stringify({ requesterPhone: user.phone })
      });
      await fetchMyRecords();
      onPontoUpdate();
    } catch (error) {
       alert(`Falha ao excluir o registro de ponto: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    if (!activeSession) return;

    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(activeSession.startTime);
      const diffSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);


  const { sortedRecords, canWorkMore, isCurrentMonth, disablePrev, disableNext } = useMemo(() => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const viewingMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const threeMonthsAgoStart = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
    const isCurrent = viewingMonthStart.getTime() === currentMonthStart.getTime();
    const sorted = [...records].sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
    const todayStr = today.toISOString().split('T')[0];
    const completedMinutesToday = sorted
      .filter(r => new Date(r.entryTime).toISOString().startsWith(todayStr) && r.durationMinutes)
      .reduce((total, record) => total + (record.durationMinutes || 0), 0);

    return {
      sortedRecords: sorted,
      canWorkMore: isCurrent && (completedMinutesToday < 10 * 60),
      isCurrentMonth: isCurrent,
      disablePrev: viewingMonthStart <= threeMonthsAgoStart,
      disableNext: viewingMonthStart >= currentMonthStart,
    };
  }, [records, currentDate]);

  // FIX: Make function async to match onConfirm prop type which expects a Promise.
  const handleConfirmDelete = async () => {
    if (deletingRecord) {
      await handleDelete(deletingRecord.id);
    }
    setDeletingRecord(null);
  };

  const renderRecordList = () => {
    const recordsToDisplay = sortedRecords.filter(record => !activeSession || record.id !== activeSession.id);

    if (isLoading) {
      return <p className="mt-4 text-center text-gray-400">Carregando registros...</p>;
    }
    if (error) {
      return <p className="mt-4 text-center text-red-accent">Erro ao carregar: {error}</p>;
    }
    if (recordsToDisplay.length === 0 && !activeSession) {
        return <p className="mt-4 text-center text-gray-400">Nenhum registro encontrado para este mês.</p>;
    }

    return (
        <div className="mt-4 space-y-3">
            {isCurrentMonth && activeSession && (
                <div className="p-3 bg-gray-700 rounded-lg animate-pulse">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="flex-grow min-w-0">
                            <p className="font-semibold text-white">{formatDate(activeSession.startTime)}</p>
                            <p className="text-xs text-gray-400">{formatTime(activeSession.startTime)} - ...</p>
                        </div>
                        <div className="flex items-center flex-shrink-0">
                             <div className="flex items-center px-2 py-1 space-x-1 text-xs font-medium rounded-full text-yellow-accent bg-gray-600"><ClockIcon className="w-4 h-4" /><span>Em andamento</span></div>
                        </div>
                    </div>
                </div>
            )}
            {recordsToDisplay.map(record => (
                 <div key={record.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="flex-grow min-w-0">
                            <p className="font-semibold text-white">{formatDate(record.entryTime)}</p>
                            <p className="text-xs text-gray-400">{formatTime(record.entryTime)} - {record.exitTime ? formatTime(record.exitTime) : '...'}</p>
                        </div>
                        <div className="flex items-center flex-shrink-0 gap-x-4 gap-y-2">
                            <PontoStatusBadge status={record.status} />
                            {record.durationMinutes !== undefined && (<div className="px-3 py-1 text-sm font-bold text-white bg-gray-600 rounded-full whitespace-nowrap">{formatDuration(record.durationMinutes)}</div>)}
                            {record.status === PontoStatus.PENDENTE && (<button onClick={() => setDeletingRecord(record)} className="p-2 text-gray-400 rounded-md hover:bg-gray-600 hover:text-red-accent" title="Cancelar Registro"><TrashIcon className="w-4 h-4" /></button>)}
                        </div>
                    </div>
                    {record.status === PontoStatus.REJEITADO && record.rejectionReason && (<div className="pt-3 mt-3 text-xs border-t border-gray-600"><div className="p-2 bg-red-900/50 rounded-md"><p className="font-semibold text-red-300">Motivo da Rejeição:</p><p className="text-red-200">{record.rejectionReason}</p></div></div>)}
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <OfficeBuildingIcon className="w-8 h-8 text-blue-accent" />
          <div>
            <h1 className="text-xl font-bold text-white">{empresa.name}</h1>
            <p className="text-sm text-gray-400">Controle de Ponto</p>
          </div>
        </div>
      </div>
      
      <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} disablePrev={disablePrev} disableNext={disableNext} />
      
      {isCurrentMonth && (
        <div>
          <button onClick={handleClockInOut} disabled={!activeSession && !canWorkMore} className={`w-full py-4 text-lg font-bold text-white rounded-lg transition-colors ${activeSession ? 'bg-red-accent hover:bg-red-accent/90' : 'bg-green-accent hover:bg-green-accent/90'} disabled:bg-gray-600 disabled:cursor-not-allowed`}>
            {activeSession ? `Finalizar (${elapsedTime})` : 'Iniciar Expediente'}
          </button>
          {!activeSession && !canWorkMore && <p className="mt-2 text-sm text-center text-yellow-accent">Você atingiu o limite de horas por hoje.</p>}
        </div>
      )}

      <div className="p-4 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold text-white">Registros do Mês</h2>
        {renderRecordList()}
      </div>

      <ConfirmationModal isOpen={!!deletingRecord} onClose={() => setDeletingRecord(null)} onConfirm={handleConfirmDelete} title="Cancelar Registro de Ponto" message="Tem certeza de que deseja cancelar este registro de ponto pendente? Esta ação não pode ser desfeita."/>
    </div>
  );
};

export default PontoPage;
