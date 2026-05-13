import { useState, useEffect } from 'react';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  custo: number;
  comissao: number;
  margemLucro: number;
  precoVenda: number;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: 'cabelo' | 'barba' | string;
  valor: number;
}

export interface Custo {
  id: string;
  nome: string;
  valor: number;
  tipo: 'fixo' | 'variavel';
}

export const useBarbeariaConfig = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);

  const loadConfig = () => {
    const dataP = localStorage.getItem('barbearia_produtos');
    const dataS = localStorage.getItem('barbearia_servicos');
    const dataC = localStorage.getItem('barbearia_custos');
    
    if (dataP) setProdutos(JSON.parse(dataP));
    if (dataS) setServicos(JSON.parse(dataS));
    if (dataC) setCustos(JSON.parse(dataC));
  };

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    localStorage.setItem('barbearia_produtos', JSON.stringify(produtos));
  }, [produtos]);

  useEffect(() => {
    localStorage.setItem('barbearia_servicos', JSON.stringify(servicos));
  }, [servicos]);

  useEffect(() => {
    localStorage.setItem('barbearia_custos', JSON.stringify(custos));
  }, [custos]);

  // Produtos
  const addProduto = (produto: Omit<Produto, 'id'>) => {
    setProdutos(prev => [...prev, { ...produto, id: Date.now().toString() }]);
  };
  const removeProduto = (id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  // Servicos
  const addServico = (servico: Omit<Servico, 'id'>) => {
    setServicos(prev => [...prev, { ...servico, id: Date.now().toString() }]);
  };
  const removeServico = (id: string) => {
    setServicos(prev => prev.filter(s => s.id !== id));
  };

  // Custos
  const addCusto = (custo: Omit<Custo, 'id'>) => {
    setCustos(prev => [...prev, { ...custo, id: Date.now().toString() }]);
  };
  const removeCusto = (id: string) => {
    setCustos(prev => prev.filter(c => c.id !== id));
  };

  return {
    produtos, addProduto, removeProduto,
    servicos, addServico, removeServico,
    custos, addCusto, removeCusto,
    loadConfig
  };
};
