'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SharedAccountDetails from '@/components/SharedAccountDetails';

export default function SharedAccountPage() {
  const params = useParams();
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('platita-token');
    const storedUser = localStorage.getItem('platita-user');

    if (!storedToken || !storedUser) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setAuthLoaded(true);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (authLoaded) {
      if (!token || !user) {
        router.push('/');
        return;
      }
      if (params.id) {
        checkAccess();
      }
    }
  }, [authLoaded, token, user, params.id, router]);

  const checkAccess = async () => {
    try {
      // Verificar si el usuario tiene acceso a esta cuenta compartida
      const response = await fetch(`/api/shared-accounts/${params.id}/access`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        setError('No tienes acceso a esta cuenta compartida.');
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setError('La cuenta compartida no existe.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Error verificando acceso');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      setError('Error verificando acceso a la cuenta.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/shared-accounts');
  };

  const handleAccountUpdated = () => {
    // Recargar la página o actualizar datos si es necesario
    checkAccess();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Volver a Mis Parches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SharedAccountDetails
      accountId={Number(params.id)}
      token={token}
      user={user}
      onBack={handleBack}
      onAccountUpdated={handleAccountUpdated}
    />
  );
}
