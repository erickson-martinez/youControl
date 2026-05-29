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
  _id?: string;
}

export interface Custo {
  id: string;
  nome: string;
  valor: number;
  tipo: 'fixo' | 'variavel';
  linkId?: string;
}

export interface TaxasPagamento {
  pix: number;
  dinheiro: number;
  credito: number;
  debito: number;
}

const promiseCache = new Map<string, Promise<any>>();

export const useBarbeariaConfig = (empresaId?: string) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [custos, setCustos] = useState<Custo[]>([]);
  const [taxas, setTaxas] = useState<Record<string, number>>({ pix: 0, dinheiro: 0, credito: 0, debito: 0 });
  const [metaLucro, setMetaLucro] = useState<number>(0);
  const [imposto, setImposto] = useState<number>(0);

  const suffix = empresaId ? `_${empresaId}` : '';
  const keyS = `barbearia_servicos${suffix}`;
  const keyT = `barbearia_taxas${suffix}`;

  const fetchProdutos = useCallback(async () => {
    if (!empresaId) {
      setProdutos([]);
      return;
    }
    const url = `${API_BASE_URL}/api/barber-products?linkId=${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) throw new Error('Erro ao buscar produtos');
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }
      const data = await promiseCache.get(url);
      const mapped = data.map((p: any) => ({ ...p, id: p.id || p._id }));
      setProdutos(mapped);
    } catch (e) {
      console.error('Erro ao buscar produtos', e);
    }
  }, [empresaId]);

  const fetchServicos = useCallback(async () => {
    if (!empresaId) {
      setServicos([]);
      return;
    }
    const url = `${API_BASE_URL}/api/barber-services?linkId=${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) throw new Error('Erro ao buscar servicos');
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }
      const data = await promiseCache.get(url);
      const mapped = data.map((s: any) => ({ ...s, id: s.id || s._id }));
      setServicos(mapped);
    } catch (e) {
      console.error('Erro ao buscar servicos', e);
    }
  }, [empresaId]);

  const fetchCustos = useCallback(async () => {
    if (!empresaId) {
      setCustos([]);
      return;
    }
    const url = `${API_BASE_URL}/api/costs?linkId=${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) throw new Error('Erro ao buscar custos');
          return r.json();
        }).finally(() => {
          setTimeout(() => promiseCache.delete(url), 100);
        }));
      }
      const data = await promiseCache.get(url);
      const mapped = data.map((c: any) => ({ ...c, id: c.id || c._id }));
      setCustos(mapped);
    } catch (e) {
      console.error('Erro ao buscar custos', e);
    }
  }, [empresaId]);

  const fetchCompanyConfig = useCallback(async () => {
    if (!empresaId) return;
    const url = `${API_BASE_URL}/api/company-config/${empresaId}`;
    try {
      if (!promiseCache.has(url)) {
        promiseCache.set(url, fetch(url).then(async (r) => {
          if (!r.ok) {
            if (r.status === 404) return null;
            throw new Error('Erro ao buscar config da empresa');
          }
          return r.json();
        }).finally(() => setTimeout(() => promiseCache.delete(url), 100)));
      }
      const data = await promiseCache.get(url);
      if (data) {
        if (data.taxas) setTaxas(data.taxas);
        if (data.metaLucro !== undefined) setMetaLucro(data.metaLucro);
        if (data.imposto !== undefined) setImposto(data.imposto);
      }
    } catch (e) {
      console.error('Erro ao buscar company config', e);
    }
  }, [empresaId]);

  const updateCompanyConfig = async (updates: Partial<{ taxas: Record<string, number>, metaLucro: number, imposto: number }>) => {
    if (!empresaId) return;
    const payload = {
      taxas: updates.taxas || taxas,
      metaLucro: updates.metaLucro !== undefined ? updates.metaLucro : metaLucro,
      imposto: updates.imposto !== undefined ? updates.imposto : imposto
    };
    try {
      const response = await fetch(`${API_BASE_URL}/api/company-config/${empresaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          if (data.config.taxas) setTaxas(data.config.taxas);
          if (data.config.metaLucro !== undefined) setMetaLucro(data.config.metaLucro);
          if (data.config.imposto !== undefined) setImposto(data.config.imposto);
        }
      }
    } catch (e) {
      console.error('Erro ao salvar company config', e);
    }
  };

  const loadConfig = useCallback(() => {
    fetchProdutos();
    fetchServicos();
    fetchCustos();
    fetchCompanyConfig();
  }, [fetchProdutos, fetchServicos, fetchCustos, fetchCompanyConfig]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    localStorage.setItem(keyS, JSON.stringify(servicos));
  }, [servicos, keyS]);

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

  // Servicos (API API)
  const addServico = async (servico: Omit<Servico, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barber-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servico)
      });
      if (response.ok) {
        fetchServicos();
      }
    } catch (e) {
      console.error('Erro ao addServico', e);
    }
  };

  const removeServico = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barber-services/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchServicos();
      }
    } catch (e) {
      console.error('Erro ao removeServico', e);
    }
  };

  const updateServico = async (id: string, servico: Partial<Servico>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/barber-services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servico)
      });
      if (response.ok) {
        fetchServicos();
      }
    } catch (e) {
      console.error('Erro ao updateServico', e);
    }
  };

  // Custos (API API)
  const addCusto = async (custo: Omit<Custo, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custo)
      });
      if (response.ok) {
        fetchCustos();
      }
    } catch (e) {
      console.error('Erro ao addCusto', e);
    }
  };

  const removeCusto = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/costs/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchCustos();
      }
    } catch (e) {
      console.error('Erro ao removeCusto', e);
    }
  };

  const updateCusto = async (id: string, custo: Partial<Custo>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/costs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custo)
      });
      if (response.ok) {
        fetchCustos();
      }
    } catch (e) {
      console.error('Erro ao updateCusto', e);
    }
  };

  const updateTaxas = (novasTaxas: Record<string, number>) => {
    updateCompanyConfig({ taxas: novasTaxas });
  };

  return {
    produtos, addProduto, removeProduto, updateProduto, fetchProdutos,
    servicos, addServico, removeServico, updateServico, fetchServicos,
    custos, addCusto, removeCusto, updateCusto, fetchCustos,
    taxas, updateTaxas,
    metaLucro, imposto, updateCompanyConfig, fetchCompanyConfig,
    loadConfig
  };
};
