import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface RecurringReminder {
  id: string;
  title: string;
  type: 'assinatura' | 'conta_fixa';
  amount: number;
  frequency: 'mensal' | 'semanal' | 'bimestral' | 'trimestral' | 'anual';
  dueDay: number; // 1-31
  dueMonth?: number; // 1-12
  alertDaysBefore: number; // 0, 1, 3, 5, 7
  alertTime: string; // e.g. "08:00"
  emailNotification: boolean;
  emailAddress: string;
  appAlert: boolean;
  active: boolean;
  notes?: string;
  lastTriggered?: string; // YYYY-MM-DD
  createdAt: string;
  userEmail?: string;
}

const STORAGE_KEY = 'recurring_payment_reminders_v1';

export function useLembretesRecorrentes(currentUserEmail?: string) {
  const [reminders, setReminders] = useState<RecurringReminder[]>([]);
  const { sendNotification, requestPermission } = useNotifications();
  const [lastCheck, setLastCheck] = useState<string | null>(null);

  const loadReminders = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RecurringReminder[] = JSON.parse(raw);
        setReminders(parsed);
      } else {
        const defaultEmail = currentUserEmail || 'financeiro@empresa.com';
        const initialSamples: RecurringReminder[] = [
          {
            id: 'rem_sample_1',
            title: 'Assinatura Plano Sistema Barbearia',
            type: 'assinatura',
            amount: 99.90,
            frequency: 'mensal',
            dueDay: 10,
            alertDaysBefore: 3,
            alertTime: '08:00',
            emailNotification: true,
            emailAddress: defaultEmail,
            appAlert: true,
            active: true,
            notes: 'Plano mensal de clientes VIPs',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'rem_sample_2',
            title: 'Aluguel do Estabelecimento (Conta Fixa)',
            type: 'conta_fixa',
            amount: 1500.00,
            frequency: 'mensal',
            dueDay: 15,
            alertDaysBefore: 5,
            alertTime: '09:00',
            emailNotification: true,
            emailAddress: defaultEmail,
            appAlert: true,
            active: true,
            notes: 'Transferência Pix para proprietário',
            createdAt: new Date().toISOString(),
          }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSamples));
        setReminders(initialSamples);
      }
    } catch (e) {
      console.error('Erro ao carregar lembretes recorrentes:', e);
    }
  }, [currentUserEmail]);

  useEffect(() => {
    loadReminders();

    const handleSync = () => loadReminders();
    window.addEventListener('lembretes_sync', handleSync);
    return () => window.removeEventListener('lembretes_sync', handleSync);
  }, [loadReminders]);

  const saveReminders = (newList: RecurringReminder[]) => {
    setReminders(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    window.dispatchEvent(new Event('lembretes_sync'));
  };

  const addReminder = (data: Omit<RecurringReminder, 'id' | 'createdAt'>) => {
    const newRem: RecurringReminder = {
      ...data,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRem, ...reminders];
    saveReminders(updated);
    return newRem;
  };

  const updateReminder = (id: string, data: Partial<RecurringReminder>) => {
    const updated = reminders.map(r => r.id === id ? { ...r, ...data } : r);
    saveReminders(updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveReminders(updated);
  };

  const toggleReminder = (id: string) => {
    const updated = reminders.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveReminders(updated);
  };

  const getNextDueDate = (rem: RecurringReminder): Date => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    let due = new Date(year, month, Math.min(rem.dueDay, 28));

    if (now.getDate() > rem.dueDay) {
      if (rem.frequency === 'mensal') {
        due = new Date(year, month + 1, Math.min(rem.dueDay, 28));
      } else if (rem.frequency === 'bimestral') {
        due = new Date(year, month + 2, Math.min(rem.dueDay, 28));
      } else if (rem.frequency === 'trimestral') {
        due = new Date(year, month + 3, Math.min(rem.dueDay, 28));
      } else if (rem.frequency === 'anual') {
        due = new Date(year + 1, rem.dueMonth ? rem.dueMonth - 1 : month, Math.min(rem.dueDay, 28));
      } else if (rem.frequency === 'semanal') {
        due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
    }
    return due;
  };

  const checkDueReminders = useCallback(async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setLastCheck(new Date().toLocaleTimeString('pt-BR'));

    let triggeredCount = 0;

    for (const rem of reminders) {
      if (!rem.active) continue;

      const nextDue = getNextDueDate(rem);
      const diffTime = nextDue.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      const shouldAlert = diffDays <= rem.alertDaysBefore && diffDays >= 0;

      if (shouldAlert && rem.lastTriggered !== todayStr) {
        triggeredCount++;
        const formattedAmount = rem.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dayLabel = diffDays === 0 ? 'vence HOJE' : `vence em ${diffDays} dia(s) (${nextDue.toLocaleDateString('pt-BR')})`;
        const titleText = `⏰ Lembrete: ${rem.title}`;
        const bodyText = `Cobrança de ${rem.type === 'assinatura' ? 'Assinatura' : 'Conta Fixa'} no valor de ${formattedAmount} ${dayLabel}.`;

        if (rem.appAlert) {
          await sendNotification(titleText, {
            body: bodyText,
            icon: '/pwa-192x192.png',
          });
        }

        updateReminder(rem.id, { lastTriggered: todayStr });
      }
    }
    return triggeredCount;
  }, [reminders, sendNotification]);

  return {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    getNextDueDate,
    checkDueReminders,
    lastCheck,
    requestPermission,
  };
}
