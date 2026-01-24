
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { API_BASE_URL } from '../constants';
import { EyeIcon, EyeSlashIcon } from './icons';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  initialRegisterMode?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, initialRegisterMode = false }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For registration
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loginLoadingMessages = ['Entrando...', 'Iniciando servidor...', 'Realizando conexão...'];
  const registrationLoadingMessages = ['Realizando cadastro...', 'Criando permissões...', 'Liberando acesso...'];
  
  // Efeito para "acordar" o servidor no Render ao carregar a página
  useEffect(() => {
    const prewarmServer = async () => {
      console.log('Enviando requisição para iniciar o servidor...');
      try {
        // Simplesmente faz uma requisição para a URL base para iniciar o serviço
        await fetch(API_BASE_URL, { method: 'GET' });
        console.log('Servidor iniciado ou já estava ativo.');
      } catch (error) {
        // É normal que isso possa falhar se o servidor estiver completamente inativo,
        // mas a requisição ainda assim o fará iniciar.
        console.warn('Falha na requisição de aquecimento do servidor. Isso é esperado se o servidor estiver iniciando.', error);
      }
    };

    prewarmServer();
  }, []); // O array vazio garante que isso rode apenas uma vez quando o componente montar

  useEffect(() => {
    let interval: number | undefined;
    if (loading) {
      const messages = isRegisterMode ? registrationLoadingMessages : loginLoadingMessages;
      let messageIndex = 0;
      setLoadingMessage(messages[0]);
      
      interval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 11000);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [loading, isRegisterMode]);


  const handleModeToggle = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setMessage('');
    // Clear fields when switching modes
    setName('');
    setPhone('');
    setPassword('');
  };
  
  const apiFetchWithoutUser = async (url: string, options: RequestInit = {}) => {
     return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isRegisterMode) {
      // --- Registration Logic ---
      const cleanPhone = phone.replace(/\D/g, '');

      if (!name.trim() || !phone.trim() || !password.trim()) {
        setError('Nome, telefone e senha são obrigatórios.');
        setLoading(false);
        return;
      }

      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        setError('O telefone deve ter 10 ou 11 dígitos (DDD + número).');
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetchWithoutUser(`${API_BASE_URL}/users`, {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            pass: password.trim(),
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Erro ao cadastrar. O telefone já pode estar em uso.';
          try {
            const errorData = await response.json();
            // Prioriza o campo 'error' que vem da API com as validações de senha
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            console.error("Erro ao processar resposta de erro JSON", e);
          }
          throw new Error(errorMessage);
        }

        setMessage('Cadastro realizado com sucesso! Por favor, faça o login.');
        handleModeToggle();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
        setLoading(false);
      }
    } else {
      // --- Login Logic ---
      if (!phone.trim() || !password.trim()) {
        setError('Telefone e senha são obrigatórios.');
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetchWithoutUser(`${API_BASE_URL}/users/auth`, {
          method: 'POST',
          body: JSON.stringify({
            phone: phone.trim(),
            pass: password.trim(),
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Credenciais inválidas ou erro no servidor.';
          try {
            const errorData = await response.json();
            // Prioritize the 'error' field from the API, then 'message', then fallback.
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Keep the default error message if JSON parsing fails.
            console.error("Failed to parse error response from login API", e);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        const user: User = {
          phone: phone.trim(),
          name: data.name || `Usuário ${phone.trim()}`,
          id: data.id || data._id // Store ID for features that require it (like Shopping Lists)
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        onLoginSuccess(user);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-white">
            {isRegisterMode ? 'Criar Conta' : 'Seu Controle'}
          </h2>
          <p className="mt-2 text-sm text-center text-gray-400">
            {isRegisterMode ? 'Preencha os dados para se cadastrar' : 'Acesse sua conta'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
         <fieldset disabled={loading} className="space-y-4 rounded-md shadow-sm">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="sr-only">Nome</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="phone" className="sr-only">Telefone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                required
                className="relative block w-full px-3 py-3 pr-10 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white disabled:opacity-50"
                aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                disabled={loading}
              >
                {isPasswordVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </fieldset>

          {error && <p className="text-sm text-center text-red-accent">{error}</p>}
          {message && <p className="text-sm text-center text-green-accent">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? loadingMessage : (isRegisterMode ? 'Cadastrar' : 'Entrar')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <button 
              onClick={handleModeToggle}
              className="font-medium text-blue-400 bg-transparent border-none cursor-pointer hover:text-blue-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
              disabled={loading}
            >
              {isRegisterMode ? 'Já tem uma conta? Entrar' : 'Cadastrar'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
