import React from 'react';
import { CadastrarAssinaturaForm, InitialClienteData } from './CadastrarAssinaturaForm';

interface CadastrarAssinaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  initialCliente?: InitialClienteData;
  onSuccess?: () => void;
}

export const CadastrarAssinaturaModal: React.FC<CadastrarAssinaturaModalProps> = ({
  isOpen,
  onClose,
  linkId,
  initialCliente,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8">
        <CadastrarAssinaturaForm
          linkId={linkId}
          initialCliente={initialCliente}
          onCancel={onClose}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      </div>
    </div>
  );
};
