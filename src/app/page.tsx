'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/app/dashboard/page';
import DatabaseErrorMessage from '@/components/DatabaseErrorMessage';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDatabaseError, setShowDatabaseError] = useState(false);

  useEffect(() => {
    // Verificar si hay parámetro de error de base de datos en la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('db-error') === 'true') {
      setShowDatabaseError(true);
      setLoading(false);
      // Limpiar parámetro de la URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Verificar si hay un token guardado
    const savedToken = localStorage.getItem('platita-token');
    const savedUser = localStorage.getItem('platita-user');
    
    if (savedToken && savedUser) {
      // Verificar que el token sigue siendo válido
      validateSession(savedToken, JSON.parse(savedUser));
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (savedToken: string, savedUser: any) => {
    try {
      // Hacer una llamada simple para verificar si la sesión es válida
      const response = await fetch('/api/balance', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      });

      if (response.status === 401) {
        // Token inválido - mostrar error de base de datos
        setShowDatabaseError(true);
        setLoading(false);
        return;
      }

      if (response.status === 500) {
        // Error del servidor - podría ser problema de base de datos
        setShowDatabaseError(true);
        setLoading(false);
        return;
      }

      if (response.ok) {
        // Sesión válida
        setToken(savedToken);
        setUser(savedUser);
      } else {
        // Otros errores - limpiar sesión
        handleLogout();
      }
    } catch (error) {
      // Error de conexión - mostrar error de base de datos
      console.error('Session validation error:', error);
      setShowDatabaseError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    setShowDatabaseError(false); // Ocultar error al hacer login exitoso
    localStorage.setItem('platita-token', newToken);
    localStorage.setItem('platita-user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setShowDatabaseError(false);
    localStorage.removeItem('platita-token');
    localStorage.removeItem('platita-user');
  };

  const handleReturnToLogin = () => {
    // Limpiar todo y mostrar formulario de login
    handleLogout();
  };

  const handleDatabaseError = () => {
    // Mostrar mensaje de error de base de datos
    setShowDatabaseError(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Mostrar mensaje de error de base de datos
  if (showDatabaseError) {
    return <DatabaseErrorMessage onReturnToLogin={handleReturnToLogin} />;
  }

  if (!token || !user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard token={token} user={user} onLogout={handleLogout} onDatabaseError={handleDatabaseError} />;
}