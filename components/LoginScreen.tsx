
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { EyeIcon, EyeSlashIcon } from './icons';
import { auth } from '../firebase';
import { API_BASE_URL } from '../constants';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  initialRegisterMode?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, initialRegisterMode = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(initialRegisterMode);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const syncUserWithBackend = async (user: User, pass: string = '1234dummy') => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (response.ok) {
        let allUsers = await response.json();
        if (allUsers.users) allUsers = allUsers.users;
        const exists = allUsers.find((u: any) => (u.email === user.email) || (u.idEmail && u.idEmail === user.id));
        if (!exists) {
          await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: '00000000000',
              pass: pass,
              idEmail: user.id || ''
            })
          });
        }
      }
    } catch (err) {
      console.warn("Falha ao sincronizar usuário com o backend", err);
    }
  };

  const handleModeToggle = () => {
    setIsRegisterMode(!isRegisterMode);
    setIsForgotPasswordMode(false);
    setError('');
    setMessage('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleForgotPasswordClick = () => {
    setIsForgotPasswordMode(true);
    setIsRegisterMode(false);
    setError('');
    setMessage('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleBackToLogin = () => {
    setIsForgotPasswordMode(false);
    setIsRegisterMode(false);
    setError('');
    setMessage('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      
      const user: User = {
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || `Usuário Google`,
        id: firebaseUser.uid
      };

      await syncUserWithBackend(user);

      localStorage.setItem('currentUser', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Erro ao realizar login com o Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isForgotPasswordMode) {
      if (!email.trim()) {
        setError('Telefone/Email é obrigatório para recuperação de senha.');
        setLoading(false);
        return;
      }
      try {
        const resetEmail = email.trim().includes('@') ? email.trim() : `${email.trim()}@barbearia.app`;
        await sendPasswordResetEmail(auth, resetEmail);
        setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setIsForgotPasswordMode(false);
        setPassword('');
      } catch (err: any) {
        if (err.code === 'auth/operation-not-allowed') {
          setError('A autenticação não está habilitada no Firebase Console. Por favor, use o login com o Google.');
        } else {
          setError(err.message || 'Ocorreu um erro ao enviar email de recuperação.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isRegisterMode) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Nome, telefone e senha são obrigatórios.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: email.trim(),
            pass: password.trim(),
            email: '',
            idEmail: ''
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Erro ao cadastrar.');
          setLoading(false);
          return;
        }

        const user: User = {
          email: data.user?.email || '',
          name: data.user?.name || name.trim(),
          id: data.user?.idEmail || data.user?._id || '',
          idEmail: data.user?.idEmail || data.user?._id || ''
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        onLoginSuccess(user);
      } catch (err: any) {
        setError(err.message || 'Erro de conexão ao cadastrar.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Telefone e senha são obrigatórios.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: email.trim(),
            pass: password.trim() // Usando 'pass' ao invés de 'senha' como testado
          })
        });

        const data = await response.json();

        if (!response.ok) {
           setError(data.error || 'Credenciais inválidas.');
           setLoading(false);
           return;
        }

        const user: User = {
          email: data.email || data.user?.email || '',
          name: data.name || data.user?.name || `Usuário`,
          id: data.idEmail || data._id || data.user?.idEmail || data.user?._id || '',
          idEmail: data.idEmail || data._id || data.user?.idEmail || data.user?._id || ''
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        onLoginSuccess(user);
      } catch (err: any) {
        setError('Erro de conexão ao autenticar.');
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
            {isForgotPasswordMode ? 'Redefinir Senha' : (isRegisterMode ? 'Criar Conta' : 'Seu Controle')}
          </h2>
          <p className="mt-2 text-sm text-center text-gray-400">
            {isForgotPasswordMode 
              ? 'Informe seu email para redefinir' 
              : (isRegisterMode ? 'Preencha os dados para se cadastrar' : 'Acesse sua conta')}
          </p>
        </div>
        
        {!isForgotPasswordMode && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com o Google
            </button>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-400 bg-gray-800">Ou use seu telefone</span>
              </div>
            </div>
          </div>
        )}

        <form className="mt-2 space-y-6" onSubmit={handleSubmit}>
         <fieldset disabled={loading} className="space-y-4 rounded-md shadow-sm">
            {(isRegisterMode || isForgotPasswordMode) && !isForgotPasswordMode && (
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
              <label htmlFor="email" className="sr-only">Telefone</label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="tel"
                required
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                placeholder="Telefone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isForgotPasswordMode && (
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
            )}
          </fieldset>

          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          {message && <p className="text-sm text-center text-green-500">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? 'Aguarde...' : (isForgotPasswordMode ? 'Redefinir Senha' : (isRegisterMode ? 'Cadastrar (se habilitado)' : 'Entrar'))}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between px-2 text-sm text-center">
            {isForgotPasswordMode ? (
                <button 
                  onClick={handleBackToLogin}
                  className="w-full font-medium text-blue-400 bg-transparent border-none cursor-pointer hover:text-blue-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
                  disabled={loading}
                >
                  Voltar para Login
                </button>
            ) : isRegisterMode ? (
                <button 
                  onClick={handleModeToggle}
                  className="w-full font-medium text-blue-400 bg-transparent border-none cursor-pointer hover:text-blue-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
                  disabled={loading}
                >
                  Já tem uma conta? Entrar
                </button>
            ) : (
                <>
                  <button 
                    onClick={handleModeToggle}
                    className="font-medium text-blue-400 bg-transparent border-none cursor-pointer hover:text-blue-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-blue-400"
                    disabled={loading}
                  >
                    Cadastrar
                  </button>
                  <button 
                    onClick={handleForgotPasswordClick}
                    className="font-medium text-gray-400 bg-transparent border-none cursor-pointer hover:text-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    Esqueci Senha
                  </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

