import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';

declare global {
  interface Window {
    PluggyConnect: any;
  }
}

interface PluggyConnectProps {
  onSuccess?: (itemId: string) => void;
  onClose?: () => void;
}

export const PluggyConnect: React.FC<PluggyConnectProps> = ({ onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Pluggy Connect script
    const script = document.createElement('script');
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/index.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleOpenWidget = async () => {
    setLoading(true);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/banking/pluggy/connect-token', {});
      
      const pluggyConnect = new window.PluggyConnect({
        accessToken,
        onSuccess: async (data: { item: { id: string } }) => {
          const itemId = data.item.id;
          showSuccess('Conexão estabelecida! Sincronizando dados...');
          
          try {
            await api.post('/banking/pluggy/sync', { itemId });
            showSuccess('Dados sincronizados com sucesso!');
            if (onSuccess) onSuccess(itemId);
          } catch (err) {
            showError('Erro ao sincronizar dados bancários.');
          }
        },
        onError: (error: any) => {
          console.error('Pluggy Error:', error);
          showError('Erro na conexão com o banco.');
        },
        onClose: () => {
          if (onClose) onClose();
        },
      });

      pluggyConnect.init();
    } catch (err) {
      showError('Não foi possível iniciar a conexão segura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleOpenWidget}
      disabled={loading}
      className="btn-purple w-full flex items-center justify-center gap-2 py-3 mt-4"
    >
      {loading ? 'Preparando conexão...' : 'Conectar nova conta bancária'}
    </button>
  );
};
