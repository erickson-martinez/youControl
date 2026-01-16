
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { WorkRecord, Empresa, User } from '../types';
import { PontoStatus } from '../types';
import { ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from './icons';
import MonthNavigator from './MonthNavigator';
import { API_BASE_URL } from '../constants';

interface AprovarHorasPageProps {
  user: User;
  empresas: Empresa[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
}

const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const formatDuration = (minutes: number) => {
    if (!minutes || minutes < 0) return '00:00';
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
    return <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color} bg-gray-700`}>{statusInfo.icon}<span>{statusInfo.text}</span></div>;
};

const AprovarHorasPage: React.FC<AprovarHorasPageProps> = ({ user, empresas, currentDate, setCurrentDate }) => {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'pendentes' | 'historico'>('pendentes');
  const [rejectingRecord, setRejectingRecord] = useState<WorkRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingRecordId, setProcessingRecordId] = useState<string | null>(null);
  
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

  const fetchAllUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
        const response = await apiFetch(`${API_BASE_URL}/users`);
        const data = await response.json();
        const usersList = Array.isArray(data) ? data : data.users;
        setAllUsers(usersList || []);
    } catch (err) {
       console.error("Falha ao buscar todos os usuários.", err);
       setError((err as Error).message);
    } finally {
       setIsLoadingUsers(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const fetchCompanyWorkRecords = useCallback(async () => {
    if (empresas.length === 0) {
      setRecords([]);
      setIsLoadingRecords(false);
      return;
    }
    setIsLoadingRecords(true);
    setError(null);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const promises = empresas.map(empresa =>
        apiFetch(`${API_BASE_URL}/work-records?companyId=${empresa.id}&month=${month}&year=${year}`)
          .then(res => res.ok ? res.json() : Promise.resolve({ records: [] }))
          .then(data => (data.records || []).map((rec: any) => ({
            ...rec,
            id: rec._id,
            companyId: (rec.companyId && typeof rec.companyId === 'object') ? rec.companyId._id : rec.companyId,
          })))
      );
      const results = await Promise.all(promises);
      const allRecords: WorkRecord[] = results.flat();
      setRecords(allRecords);
    } catch (err) {
      console.error("Falha ao buscar registros de ponto da empresa:", err);
      setError((err as Error).message);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [currentDate, empresas, apiFetch]);

  useEffect(() => {
    fetchCompanyWorkRecords();
  }, [fetchCompanyWorkRecords]);

  const onApprove = async (recordId: string) => {
    try {
        await apiFetch(`${API_BASE_URL}/work-records/${recordId}/approve`, {
            method: 'PATCH',
            body: JSON.stringify({ approverPhone: user.phone }),
        });
        await fetchCompanyWorkRecords();
    } catch (err) {
        alert(`Falha ao aprovar registro: ${(err as Error).message}`);
    }
  };

  const onReject = async (recordId: string, reason: string) => {
    try {
        await apiFetch(`${API_BASE_URL}/work-records/${recordId}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ approverPhone: user.phone, rejectionReason: reason }),
        });
        await fetchCompanyWorkRecords();
    } catch (err) {
        alert(`Falha ao rejeitar registro: ${(err as Error).message}`);
    }
  };

  const userMap = useMemo(() => {
    return allUsers.reduce((acc, user) => {
      acc[user.phone] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const { pendentes, historico } = useMemo(() => {
    const sortedRecords = [...records].sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
    return {
      pendentes: sortedRecords.filter(r => r.status === PontoStatus.PENDENTE && r.exitTime),
      historico: sortedRecords.filter(r => r.status !== PontoStatus.PENDENTE),
    };
  }, [records]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCompanyWorkRecords();
    setIsRefreshing(false);
  };

  const handleStartReject = (record: WorkRecord) => {
    setRejectingRecord(record);
    setRejectionReason('');
  };

  const handleApproveClick = async (recordId: string) => {
    setProcessingRecordId(recordId);
    try {
        await onApprove(recordId);
    } finally {
        setProcessingRecordId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (rejectingRecord && rejectionReason) {
        setProcessingRecordId(rejectingRecord.id);
        try {
            await onReject(rejectingRecord.id, rejectionReason);
        } finally {
            setProcessingRecordId(null);
            setRejectingRecord(null);
        }
    }
  };

  const groupRecordsByCompany = (recordList: WorkRecord[]) => {
      const grouped: Record<string, WorkRecord[]> = {};
      recordList.forEach(record => {
          if (!grouped[record.companyId]) {
              grouped[record.companyId] = [];
          }
          grouped[record.companyId].push(record);
      });
      return grouped;
  };

  const renderGroupedRecordList = (recordList: WorkRecord[]) => {
    if (isLoadingRecords || isLoadingUsers) {
      return <p className="mt-4 text-center text-gray-400">Carregando dados...</p>;
    }
    if (error) {
      return <p className="mt-4 text-center text-red-accent">Erro ao carregar: {error}</p>;
    }
    if (recordList.length === 0) {
      return <p className="mt-4 text-center text-gray-400">Nenhum registro encontrado para este mês.</p>;
    }
    
    const groupedRecords = groupRecordsByCompany(recordList);

    return (
      <div className="mt-4 space-y-6">
        {Object.entries(groupedRecords).map(([empresaId, companyRecords]) => {
          const empresa = empresas.find(e => e.id === empresaId);
          return (
            <div key={empresaId}>
                <h2 className="mb-3 text-lg font-semibold text-white">{empresa?.name || 'Empresa desconhecida'}</h2>
                <div className="space-y-3">
                    {companyRecords.map(record => {
                        const isProcessing = !!processingRecordId;
                        const isCurrentRecordProcessing = processingRecordId === record.id;
                        return (
                        <div key={record.id} className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                            <div>
                              <p className="font-bold text-white">{record.employeeName || userMap[record.employeePhone] || record.employeePhone || 'Usuário Desconhecido'}</p>
                              <p className="text-xs text-gray-400">{formatDate(record.entryTime)}</p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end">
                                <PontoStatusBadge status={record.status} />
                                {record.exitTime && record.durationMinutes !== undefined ? (
                                    <p className="mt-1 text-sm text-gray-300">
                                        {formatTime(record.entryTime)} - {formatTime(record.exitTime)} ({formatDuration(record.durationMinutes)})
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-yellow-accent">Em andamento...</p>
                                )}
                            </div>
                          </div>
                          {record.status === PontoStatus.REJEITADO && (
                            <div className="p-2 mt-2 text-xs bg-red-900/50 rounded-md">
                                {record.rejectedBy && <p className="font-semibold text-red-300">Rejeitado por: {userMap[record.rejectedBy] || record.rejectedBy}</p>}
                                {record.rejectionReason && <>
                                    <p className="font-semibold text-red-300">Motivo da Rejeição:</p>
                                    <p className="text-red-200">{record.rejectionReason}</p>
                                </>}
                            </div>
                          )}
                           {record.status === PontoStatus.APROVADO && record.approvedBy && (
                                <div className="p-2 mt-2 text-xs bg-green-900/50 rounded-md">
                                    <p className="font-semibold text-green-300">Aprovado por: {userMap[record.approvedBy] || record.approvedBy}</p>
                                </div>
                            )}
                          {activeTab === 'pendentes' && record.exitTime && (
                            <div className="flex items-center justify-end mt-3 space-x-2">
                              <button onClick={() => handleStartReject(record)} disabled={isProcessing} className="px-3 py-1 text-xs font-semibold text-white transition-colors bg-red-accent rounded-md hover:bg-red-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">Reprovar</button>
                              <button onClick={() => handleApproveClick(record.id)} disabled={isProcessing} className="px-3 py-1 text-xs font-semibold text-white transition-colors bg-green-accent rounded-md hover:bg-green-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isCurrentRecordProcessing ? 'Aprovando...' : 'Aprovar'}
                              </button>
                            </div>
                          )}
                        </div>
                    );
                    })}
                </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Aprovação de Horas</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingRecords}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white disabled:cursor-wait disabled:text-gray-600"
            title="Atualizar lista"
          >
            <ArrowPathIcon className={`w-5 h-5 ${(isRefreshing || isLoadingRecords) ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <MonthNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />

        <div>
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px space-x-6">
              <button onClick={() => setActiveTab('pendentes')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'pendentes' ? 'border-b-2 border-blue-accent text-white' : 'text-gray-400 hover:text-white'}`}>Pendentes ({pendentes.length})</button>
              <button onClick={() => setActiveTab('historico')} className={`px-3 py-2 font-medium text-sm rounded-t-md ${activeTab === 'historico' ? 'border-b-2 border-blue-accent text-white' : 'text-gray-400 hover:text-white'}`}>Histórico</button>
            </nav>
          </div>
          {activeTab === 'pendentes' ? renderGroupedRecordList(pendentes) : renderGroupedRecordList(historico)}
        </div>
      </div>
      
      {rejectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="w-full max-w-md p-6 mx-4 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="mb-4 text-xl font-bold text-white">Rejeitar Ponto</h2>
                <p className="mb-1 text-sm text-gray-300">Colaborador: {rejectingRecord.employeeName || userMap[rejectingRecord.employeePhone] || rejectingRecord.employeePhone}</p>
                <p className="mb-4 text-sm text-gray-400">Data: {formatDate(rejectingRecord.entryTime)}</p>
                <div>
                    <label htmlFor="rejectionReason" className="block mb-2 text-sm font-medium text-gray-300">Motivo da Rejeição</label>
                    <textarea 
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                        rows={3}
                        className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
                    />
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                    <button onClick={() => setRejectingRecord(null)} className="px-4 py-2 font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
                    <button onClick={handleConfirmReject} disabled={!!processingRecordId} className="px-4 py-2 font-medium text-white bg-red-accent rounded-md hover:bg-red-accent/90 disabled:opacity-50">
                        {processingRecordId === rejectingRecord.id ? 'Confirmando...' : 'Confirmar Rejeição'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default AprovarHorasPage;
