import { useState, useEffect } from 'react';

export interface Barbeiro {
  id: string;
  nome: string;
  telefone: string;
  comissao: number;
  corte: number;
  diasTrabalhados: string[];
}

export const useBarbeiros = (empresaId?: string) => {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const key = empresaId ? `barbearia_barbeiros_${empresaId}` : 'barbearia_barbeiros';

  const reloadBarbeiros = () => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        setBarbeiros(JSON.parse(data));
      } catch (e) {
        console.error('Erro ao ler barbeiros', e);
        setBarbeiros([]);
      }
    } else {
      setBarbeiros([]);
    }
  };

  // Carregar do localStorage ao iniciar ou mudar de empresa
  useEffect(() => {
    reloadBarbeiros();
  }, [empresaId]);

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(barbeiros));
    
    // TODO: Aqui poderá ser feita a requisição para salvar no banco no futuro:
    // const saveToDB = async () => {
    //   await fetch('/api/barbeiros', { method: 'POST', body: JSON.stringify(barbeiros) });
    // }
    // saveToDB();
  }, [barbeiros]);

  const addBarbeiro = (barbeiro: Omit<Barbeiro, 'id'>) => {
    const novo = { ...barbeiro, id: Date.now().toString() };
    setBarbeiros(prev => [...prev, novo]);
  };

  const removeBarbeiro = (id: string) => {
    setBarbeiros(prev => prev.filter(b => b.id !== id));
  };

  return { barbeiros, addBarbeiro, removeBarbeiro, reloadBarbeiros };
};
