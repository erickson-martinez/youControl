
import type { MenuPermissions } from './types';

export const API_BASE_URL = 'https://stok-5ytv.onrender.com';

export const ALL_PERMISSION_KEYS_WITH_LABELS: { key: keyof MenuPermissions, label: string }[] = [
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'graficos', label: 'Relatórios e Gráficos' },
    { key: 'financialManual', label: 'Manual Financeiro' },
    { key: 'listPurcharse', label: 'Lista de Compras' },
    { key: 'rh', label: 'RH' },
    { key: 'os', label: 'OS' },
    { key: 'ponto', label: 'Ponto' },
    { key: 'aprovarHoras', label: 'Aprovar Horas' },
    { key: 'chamados', label: 'Chamados' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'lojas', label: 'Lojas' },
    { key: 'settings', label: 'Configurações' },
    { key: 'exemplo', label: 'Exemplos' },
];

export const ALL_PERMISSION_KEYS = ALL_PERMISSION_KEYS_WITH_LABELS.map(p => p.key);

const createPermissions = (activeKeys: (keyof MenuPermissions)[]): MenuPermissions => {
    const permissions: Partial<MenuPermissions> = {};
    for (const key of ALL_PERMISSION_KEYS) {
        permissions[key] = activeKeys.includes(key);
    }
    return permissions as MenuPermissions;
};

export const FALLBACK_PERMISSIONS = createPermissions(['financeiro', 'graficos', 'exemplo', 'financialManual']);
export const NEW_COLLABORATOR_PERMISSIONS = createPermissions(['financeiro', 'graficos', 'os', 'ponto', 'exemplo', 'financialManual']);
export const MODAL_DEFAULT_PERMISSIONS = createPermissions(['financeiro', 'graficos', 'exemplo', 'financialManual']);
