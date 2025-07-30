'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Calendar, DollarSign, Eye, Lock, Unlock, Trash2 } from 'lucide-react';
import CreateSharedAccountModal from '@/components/CreateSharedAccountModal';
import SharedAccountDetails from '@/components/SharedAccountDetails';
import { formatCurrency } from '@/lib/utils';

interface SharedAccount {
    id: number;
    name: string;
    description: string;
    creator_id: number;
    is_closed: boolean;
    created_at: string;
    closed_at: string | null;
    participants_count: number;
    total_amount: number;
    creator_username: string;
}

export default function ElParche() {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setToken(localStorage.getItem('platita-token'));
            setUser(JSON.parse(localStorage.getItem('platita-user') || 'null'));
            setAuthChecked(true);
        }
    }, []);
    if (authChecked && (!token || !user)) {
        return (<>
            <div className="text-center text-red-500">Por favor, inicia sesión para ver tus parches.</div>
            <button
                onClick={() => window.location.href = '/'}
                className='bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors'
            >
                Iniciar sesión
            </button>
        </>
        );
    }
    const [sharedAccounts, setSharedAccounts] = useState<SharedAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const router = require('next/navigation').useRouter();
    const handleBack = () => router.push('/');

    const fetchSharedAccounts = async () => {
        if (!token) return;
        try {
            const response = await fetch('/api/shared-accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSharedAccounts(data.accounts || []);
        } catch (error) {
            console.error('Error fetching shared accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchSharedAccounts();
    }, [token]);

    const handleAccountCreated = () => {
        setShowCreateModal(false);
        fetchSharedAccounts();
    };

    const handleAccountUpdated = () => {
        fetchSharedAccounts();
    };

    const handleDeleteAccount = async (accountId: number) => {
        if (!token) return;
        if (!confirm('¿Estás seguro de que quieres eliminar este parche? Toda la información asociada se eliminará permanentemente.')) return;
        try {
            const response = await fetch(`/api/shared-accounts/${accountId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                fetchSharedAccounts();
            } else {
                alert(data.error || 'No se pudo eliminar el parche');
            }
        } catch (error) {
            alert('Error eliminando el parche');
        }
    };

    if (selectedAccountId) {
        return (
            <SharedAccountDetails
                accountId={selectedAccountId}
                token={token || ''}
                user={user}
                onBack={() => setSelectedAccountId(null)}
                onAccountUpdated={handleAccountUpdated}
            />
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
            {/* Header */}
            <header className="bg-white shadow-lg border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Mobile Header */}
                    <div className="flex flex-col space-y-3 py-4 sm:hidden">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleBack}
                                className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="text-sm">Volver</span>
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">El Parche 🎉</h1>
                                <p className="text-sm text-gray-600">Gastos compartidos con tus parceros</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden sm:flex items-center justify-between py-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Volver</span>
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">El Parche 🎉</h1>
                                    <p className="text-sm text-gray-600">Gastos compartidos con tus parceros</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="cursor-pointer flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Crear Parche</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {sharedAccounts.length === 0 ? (
                    // Estado vacío
                    <div className="text-center py-12">
                        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                ¡Tu primer parche!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Crea tu primera cuenta compartida para gestionar gastos grupales con tus parceros.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                            >
                                Crear mi primer parche
                            </button>
                        </div>
                    </div>
                ) : (
                    // Lista de cuentas compartidas
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {sharedAccounts.map((account) => (
                            <div
                                key={account.id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
                                onClick={() => setSelectedAccountId(account.id)}
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                                {account.name}
                                            </h3>
                                            {account.description && (
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {account.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 truncate">
                                                Creado por: {account.creator_username}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                                            {account.is_closed ? (
                                                <Lock className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <Unlock className="w-5 h-5 text-green-500" />
                                            )}
                                            {/* Botón eliminar solo para el creador */}
                                            {user && user.id === account.creator_id && (
                                                <button
                                                    title="Eliminar parche"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                                                    className="cursor-pointer text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Mobile: Stack vertically */}
                                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Users className="w-4 h-4 flex-shrink-0" />
                                                <span>{account.participants_count} parceros</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                <span>{new Date(account.created_at).toLocaleDateString('es-CO')}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    Total: {formatCurrency(account.total_amount)}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${account.is_closed
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {account.is_closed ? 'Cerrado' : 'Activo'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 text-sm font-medium w-full justify-center">
                                            <Eye className="w-4 h-4" />
                                            <span>Ver detalles</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips para El Parche */}
                <div className="mt-8 sm:mt-12 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-r-xl">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">🤝</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-yellow-800">
                                Tips para El Parche
                            </h3>
                            <ul className="mt-2 text-yellow-700 space-y-1 text-sm">
                                <li>• Agregá a todos los parceros antes de empezar a registrar gastos</li>
                                <li>• Podés incluir personas que no tienen cuenta en la plataforma</li>
                                <li>• Registrá quién pagó cada gasto para un balance justo</li>
                                <li>• Al cerrar la cuenta, se calcula automáticamente quién le debe a quién</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal para crear cuenta compartida */}
            <CreateSharedAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onAccountCreated={handleAccountCreated}
                token={token || ''}
                user={user}
            />
        </div>
    );
}