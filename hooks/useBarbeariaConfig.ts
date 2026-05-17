import { useState, useEffect } from 'react';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  custo: number;
  comissao: number;
  margemLucro: number;
  precoVenda: number;
  estoque: number;
  linkId?: string;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: 'cabelo' | 'barba' | string;
  valor: number;
  linkId?: string;
}

export interface Custo {
  id: string;
  nome: string;
  valor: number;
  tipo: 'fixo' | 'variavel';
  linkId?: string;
}

export const useBarbeariaConfig = (empresaId?: string) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);

  const suffix = empresaId ? `_${empresaId}` : '';
  const keyP = `barbearia_produtos${suffix}`;
  const keyS = `barbearia_servicos${suffix}`;
  const keyC = `barbearia_custos${suffix}`;

  const loadConfig = () => {
    const dataP = localStorage.getItem(keyP);
    const dataS = localStorage.getItem(keyS);
    const dataC = localStorage.getItem(keyC);
    
    setProdutos(dataP ? JSON.parse(dataP) : []);
    setServicos(dataS ? JSON.parse(dataS) : []);
    setCustos(dataC ? JSON.parse(dataC) : []);
  };

  useEffect(() => {
    loadConfig();
  }, [empresaId]);

  useEffect(() => {
    localStorage.setItem(keyP, JSON.stringify(produtos));
  }, [produtos, keyP]);

  useEffect(() => {
    localStorage.setItem(keyS, JSON.stringify(servicos));
  }, [servicos, keyS]);

  useEffect(() => {
    localStorage.setItem(keyC, JSON.stringify(custos));
  }, [custos, keyC]);

  // Produtos
  const addProduto = (produto: Omit<Produto, 'id'>) => {
    setProdutos(prev => [...prev, { ...produto, id: Date.now().toString() }]);
  };
  const removeProduto = (id: string) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  };
  const updateProduto = (id: string, produto: Partial<Produto>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...produto } : p));
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
    produtos, addProduto, removeProduto, updateProduto,
    servicos, addServico, removeServico,
    custos, addCusto, removeCusto,
    loadConfig
  };
};
