import React from 'react';
import { GestaoAssinaturas, SubscriptionPlan, SubscriptionClient } from './GestaoAssinaturas';

export type { SubscriptionPlan, SubscriptionClient };

export interface InitialClienteData {
  nome?: string;
  telefone?: string;
  email?: string;
}

interface CadastrarAssinaturaFormProps {
  linkId: string;
  initialCliente?: InitialClienteData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CadastrarAssinaturaForm: React.FC<CadastrarAssinaturaFormProps> = ({
  linkId,
  initialCliente,
  onSuccess,
  onCancel,
}) => {
  return (
    <GestaoAssinaturas
      linkId={linkId}
      initialCliente={initialCliente}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
};
