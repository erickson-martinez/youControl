import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../constants';

export interface Barbeiro {
  id: string;
  nome: string;
  telefone: string;
  comissao: number;
  corte: number;
  diasTrabalhados: string[];
  linkId?: string;
  cargo?: 'barbeiro' | 'caixa';
}

const promiseCache = new Map<string, Promise<any>>();

export const useBarbeiros = (empresaId?: string) => {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);

  const reloadBarbeiros = useCallback(async () => {
    if (!empresaId) {
      setBarbeiros([]);
      return;
    }
    const url = `${API_BASE_URL}/api/barbers?linkId=${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(r => {
          if (!r.ok) throw new Error('Erro ao buscar barbeiros');
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }
      
      const data = await promiseCache.get(url);
      // Ensure local 'id' property is populated for backward compatibility
      const mapped = data.map((b: any) => ({
        ...b,
        id: b._id || b.id
      }));
      setBarbeiros(mapped);
    } catch (e) {
      console.error('Erro ao ler barbeiros', e);
      setBarbeiros([]);
    }
  }, [empresaId]);

  // Carregar ao iniciar ou mudar de empresa
  useEffect(() => {
    reloadBarbeiros();
  }, [reloadBarbeiros]);

  // Manter compatibilidade com a adição manual temporária enquanto a tela não for 100% migrada
  const addBarbeiro = (barbeiro: Omit<Barbeiro, 'id'>) => {
    // Isso pode ser removido quando a tela estiver usando o reload diretamente após o POST
    const novo = { ...barbeiro, id: Date.now().toString() };
    setBarbeiros(prev => [...prev, novo]);
  };

  const removeBarbeiro = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barbers/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBarbeiros(prev => prev.filter(b => b.id !== id));
        return true;
      } else {
        console.error('Erro ao deletar barbeiro');
        return false;
      }
    } catch (e) {
      console.error('Erro ao deletar barbeiro', e);
      return false;
    }
  };

  const updateBarbeiro = async (id: string, updates: Partial<Barbeiro>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barbers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        reloadBarbeiros();
      } else {
        console.error('Erro ao atualizar barbeiro via API');
      }
    } catch (e) {
      console.error('Erro ao comunicar atualização do barbeiro', e);
    }
  };

  return { barbeiros, addBarbeiro, removeBarbeiro, updateBarbeiro, reloadBarbeiros };
};
