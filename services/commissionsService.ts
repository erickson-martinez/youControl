import { API_BASE_URL } from '../constants';

export interface Commission {
  id?: string;
  _id?: string;
  email: string;
  valorComissao: number;
  data: string;
  status: 'pago' | 'pendente' | 'cancelado';
  linkId: string;
  barbeiroNome: string;
  paidAt?: string;
}

export const extractValidEmail = (val?: string): string => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (trimmed.includes('@') && trimmed.includes('.')) {
    return trimmed;
  }
  return '';
};

export const commissionsService = {
  async getByLink(linkId: string): Promise<Commission[]> {
    const link = linkId || 'default';
    try {
      let res = await fetch(`${API_BASE_URL}/commissions/by-link?linkId=${link}`).catch(() => null);
      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/commissions/by-link?linkId=${link}`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.commissions || data.data || []);
        return list.map((item: any) => ({
          id: item.id || item._id,
          email: extractValidEmail(item.email),
          valorComissao: Number(item.valorComissao ?? item.amount ?? 0),
          data: item.data || '',
          status: item.status || 'pago',
          linkId: item.linkId || link,
          barbeiroNome: item.barbeiroNome || 'Barbeiro',
          paidAt: item.paidAt || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error("Erro ao buscar comissões da API:", e);
    }
    return [];
  },

  async getByStatus(linkId: string, status: string): Promise<Commission[]> {
    const link = linkId || 'default';
    try {
      let res = await fetch(`${API_BASE_URL}/commissions/by-status?linkId=${link}&status=${status}`).catch(() => null);
      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/commissions/by-status?linkId=${link}&status=${status}`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.commissions || data.data || []);
        return list.map((item: any) => ({
          id: item.id || item._id,
          email: extractValidEmail(item.email),
          valorComissao: Number(item.valorComissao ?? item.amount ?? 0),
          data: item.data || '',
          status: item.status || 'pago',
          linkId: item.linkId || link,
          barbeiroNome: item.barbeiroNome || 'Barbeiro',
          paidAt: item.paidAt || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error("Erro ao buscar comissões por status:", e);
    }
    return [];
  },

  async getByBarber(linkId: string, barbeiroNome: string): Promise<Commission[]> {
    const link = linkId || 'default';
    const encodedNome = encodeURIComponent(barbeiroNome);
    try {
      let res = await fetch(`${API_BASE_URL}/commissions/by-barber?linkId=${link}&barbeiroNome=${encodedNome}`).catch(() => null);
      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/commissions/by-barber?linkId=${link}&barbeiroNome=${encodedNome}`).catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.commissions || data.data || []);
        return list.map((item: any) => ({
          id: item.id || item._id,
          email: extractValidEmail(item.email),
          valorComissao: Number(item.valorComissao ?? item.amount ?? 0),
          data: item.data || '',
          status: item.status || 'pago',
          linkId: item.linkId || link,
          barbeiroNome: item.barbeiroNome || 'Barbeiro',
          paidAt: item.paidAt || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error("Erro ao buscar comissões por barbeiro:", e);
    }
    return [];
  },

  async create(commission: Omit<Commission, 'id' | '_id'>): Promise<Commission | null> {
    const payload = {
      ...commission,
      email: extractValidEmail(commission.email),
      status: commission.status || 'pendente',
      paidAt: commission.status === 'pago' ? (commission.paidAt || new Date().toISOString()) : undefined
    };

    try {
      let res = await fetch(`${API_BASE_URL}/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/commissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        return {
          id: data.id || data._id,
          email: extractValidEmail(data.email || payload.email),
          valorComissao: Number(data.valorComissao ?? payload.valorComissao),
          data: data.data || payload.data,
          status: data.status || payload.status,
          linkId: data.linkId || payload.linkId,
          barbeiroNome: data.barbeiroNome || payload.barbeiroNome,
          paidAt: data.paidAt || payload.paidAt
        };
      }
    } catch (e) {
      console.error("Erro ao criar comissão na API:", e);
    }
    return null;
  },

  async update(id: string, commission: Partial<Commission>): Promise<Commission | null> {
    try {
      let res = await fetch(`${API_BASE_URL}/commissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commission)
      }).catch(() => null);

      if (!res || !res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
        res = await fetch(`/api/v1/commissions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commission)
        }).catch(() => null);
      }

      if (res && res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.error("Erro ao atualizar comissão na API:", e);
    }
    return null;
  },

  async delete(id: string): Promise<boolean> {
    try {
      let res = await fetch(`${API_BASE_URL}/commissions/${id}`, {
        method: 'DELETE'
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/api/v1/commissions/${id}`, {
          method: 'DELETE'
        }).catch(() => null);
      }

      return Boolean(res && res.ok);
    } catch (e) {
      console.error("Erro ao deletar comissão na API:", e);
      return false;
    }
  }
};
