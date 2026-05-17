import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../constants';

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
  _id?: string;
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
  const keyS = `barbearia_servicos${suffix}`;
  const keyC = `barbearia_custos${suffix}`;

  const fetchProdutos = useCallback(async () => {
    try {
      const url = empresaId 
        ? `${API_BASE_URL}/api/barber-products?linkId=${empresaId}`
        : `${API_BASE_URL}/api/barber-products`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((p: any) => ({ ...p, id: p.id || p._id }));
        setProdutos(mapped);
      }
    } catch (e) {
      console.error('Erro ao buscar produtos', e);
    }
  }, [empresaId]);

  const loadConfig = useCallback(() => {
    const dataS = localStorage.getItem(keyS);
    const dataC = localStorage.getItem(keyC);
    
    setServicos(dataS ? JSON.parse(dataS) : []);
    setCustos(dataC ? JSON.parse(dataC) : []);
    
    fetchProdutos();
  }, [keyS, keyC, fetchProdutos]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    localStorage.setItem(keyS, JSON.stringify(servicos));
  }, [servicos, keyS]);

  useEffect(() => {
    localStorage.setItem(keyC, JSON.stringify(custos));
  }, [custos, keyC]);

  // Produtos (API API)
  const addProduto = async (produto: Omit<Produto, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barber-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
      });
      if (response.ok) {
        fetchProdutos();
      }
    } catch (e) {
      console.error('Erro ao addProduto', e);
    }
  };

  const removeProduto = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barber-products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchProdutos();
      }
    } catch (e) {
      console.error('Erro ao removeProduto', e);
    }
  };

  const updateProduto = async (id: string, produto: Partial<Produto>) => {
    try {
      // Use PATCH for stock if only 'estoque' is sent, else PUT/PATCH depending on fields.
      // The instructions mention: app.put("/api/barber-products/:id",...)
      // app.patch("/api/barber-products/:id/stock", ...)
      // Let's use PUT for general updates and PATCH for stock only if we have special needs, but for simplicity:
      
      const isOnlyStock = Object.keys(produto).length === 1 && 'estoque' in produto;
      const url = isOnlyStock 
        ? `${API_BASE_URL}/api/barber-products/${id}/stock`
        : `${API_BASE_URL}/api/barber-products/${id}`;
        
      const response = await fetch(url, {
        method: isOnlyStock ? 'PATCH' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
      });
      if (response.ok) {
        fetchProdutos();
      }
    } catch (e) {
      console.error('Erro ao updateProduto', e);
    }
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
    produtos, addProduto, removeProduto, updateProduto, fetchProdutos,
    servicos, addServico, removeServico,
    custos, addCusto, removeCusto,
    loadConfig
  };
};
