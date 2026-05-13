import { useState, useEffect } from 'react';

export interface Barbeiro {
  id: string;
  nome: string;
  telefone: string;
  comissao: number;
  corte: number;
  diasTrabalhados: string[];
}

export const useBarbeiros = () => {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);

  const reloadBarbeiros = () => {
    const data = localStorage.getItem('barbearia_barbeiros');
    if (data) {
      try {
        setBarbeiros(JSON.parse(data));
      } catch (e) {
        console.error('Erro ao ler barbeiros', e);
      }
    }
  };

  // Carregar do localStorage ao iniciar
  useEffect(() => {
    reloadBarbeiros();
  }, []);

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem('barbearia_barbeiros', JSON.stringify(barbeiros));
    
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
