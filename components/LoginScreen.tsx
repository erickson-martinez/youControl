
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { API_BASE_URL } from '../constants';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For registration
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadingMessages = ['Entrando...', 'Iniciando servidor...', 'Realizando conexão...'];
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    let interval: number | undefined;
    if (loading && !isRegisterMode) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]); // Reset to first message on new load
      interval = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 11000); // Change message every 11 seconds
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
      if (!name.trim() || !phone.trim() || !password.trim()) {
        setError('Nome, telefone e senha são obrigatórios.');
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
          const errorData = await response.json().catch(() => ({ message: 'Erro ao cadastrar. O telefone já pode estar em uso.' }));
          throw new Error(errorData.message || 'Falha no cadastro');
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
            {isRegisterMode ? 'Criar Conta' : 'Controle Financeiro'}
          </h2>
          <p className="mt-2 text-sm text-center text-gray-400">
            {isRegisterMode ? 'Preencha os dados para se cadastrar' : 'Acesse sua conta'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="sr-only">Nome</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                required
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-accent">{error}</p>}
          {message && <p className="text-sm text-center text-green-accent">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? (isRegisterMode ? 'Cadastrando...' : loadingMessage) : (isRegisterMode ? 'Cadastrar' : 'Entrar')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <button 
              onClick={handleModeToggle}
              className="font-medium text-blue-400 bg-transparent border-none cursor-pointer hover:text-blue-300 focus:outline-none"
            >
              {isRegisterMode ? 'Já tem uma conta? Entrar' : 'Cadastrar'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
