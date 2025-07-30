'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Users, DollarSign, Calendar, Edit, Trash2, 
  Lock, Unlock, Calculator, TrendingUp, TrendingDown, Receipt 
} from 'lucide-react';
import AddSharedTransactionModal from '@/components/AddSharedTransactionModal';
import SharedAccountSettlement from '@/components/SharedAccountSettlement';
import ConfirmModal from '@/components/ConfirmModal';
import { formatCurrency } from '@/lib/utils';

interface SharedAccountDetailsProps {
  accountId: number;
  token: string;
  user: any;
  onBack: () => void;
  onAccountUpdated: () => void;
}

interface SharedAccount {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  is_closed: boolean;
  created_at: string;
  closed_at: string | null;
  creator_username: string;
}

interface Participant {
  id: number;
  user_id: number | null;
  guest_name: string | null;
  username: string | null;
  joined_at: string;
}

interface SharedTransaction {
  id: number;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string;
  created_at: string;
  added_by_username: string;
  payers: Array<{
    participant_id: number;
    amount_paid: number;
    participant_name: string;
  }>;
}

interface AccountSummary {
  total_ingresos: number;
  total_gastos: number;
  balance: number;
  category_breakdown: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export default function SharedAccountDetails({
  accountId,
  token,
  user,
  onBack,
  onAccountUpdated
}: SharedAccountDetailsProps) {
  const [account, setAccount] = useState<SharedAccount | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transactions, setTransactions] = useState<SharedTransaction[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'summary'>('transactions');

  const fetchAccountDetails = async () => {
    try {
      const [accountResponse, participantsResponse, transactionsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/shared-accounts/${accountId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/shared-accounts/${accountId}/participants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/shared-accounts/${accountId}/transactions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/shared-accounts/${accountId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const accountData = await accountResponse.json();
      const participantsData = await participantsResponse.json();
      const transactionsData = await transactionsResponse.json();
      const summaryData = await summaryResponse.json();

      setAccount(accountData.account);
      setParticipants(participantsData.participants || []);
      setTransactions(transactionsData.transactions || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Error fetching account details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [accountId, token]);

  const handleTransactionAdded = () => {
    setShowAddTransaction(false);
    fetchAccountDetails();
  };

  const handleCloseAccount = async () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseAccount = async () => {
    try {
      const response = await fetch(`/api/shared-accounts/${accountId}/close`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAccountDetails();
        onAccountUpdated();
      }
    } catch (error) {
      console.error('Error closing account:', error);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    setTransactionToDelete(transactionId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      const response = await fetch(`/api/shared-transactions/${transactionToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchAccountDetails();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      setTransactionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la información del parche</p>
          <button
            onClick={onBack}
            className="mt-4 text-purple-600 hover:text-purple-800"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header mejorado para mobile */}
      <header className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-3 py-4 sm:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Volver</span>
              </button>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 break-words">{account.name}</h1>
              <p className="text-sm text-gray-600 break-words mt-1">
                {account.description || 'Sin descripción'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  Creado por {account.creator_username}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  account.is_closed 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {account.is_closed ? (
                    <><Lock className="w-3 h-3 inline mr-1" />Cerrado</>
                  ) : (
                    <><Unlock className="w-3 h-3 inline mr-1" />Activo</>
                  )}
                </span>
              </div>
            </div>
            {/* Botones de acción móvil */}
            <div className="flex flex-wrap gap-2">
              {!account.is_closed && (
                <>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg text-sm flex-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Gasto</span>
                  </button>
                  <button
                    onClick={handleCloseAccount}
                    className="flex items-center space-x-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all shadow-lg text-sm"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Cerrar</span>
                  </button>
                </>
              )}
              {account.is_closed && (
                <button
                  onClick={() => setShowSettlement(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-sm flex-1"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Ver Liquidación</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex sm:items-center sm:justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                <p className="text-sm text-gray-600">
                  {account.description || 'Sin descripción'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    Creado por {account.creator_username}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account.is_closed 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {account.is_closed ? (
                      <><Lock className="w-3 h-3 inline mr-1" />Cerrado</>
                    ) : (
                      <><Unlock className="w-3 h-3 inline mr-1" />Activo</>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {!account.is_closed && (
                <>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Gasto</span>
                  </button>
                  <button
                    onClick={handleCloseAccount}
                    className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all shadow-lg"
                  >
                    <Lock className="w-5 h-5" />
                    <span>Cerrar Parche</span>
                  </button>
                </>
              )}
              {account.is_closed && (
                <button
                  onClick={() => setShowSettlement(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Ver Liquidación</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Resumen Cards - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Parceros</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {participants.length}
                </p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Ingresos</p>
                <p className="text-sm sm:text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.total_ingresos || 0)}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Gastos</p>
                <p className="text-sm sm:text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.total_gastos || 0)}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-6 text-white col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Balance</p>
                <p className="text-lg sm:text-2xl font-bold">
                  {formatCurrency(summary?.balance || 0)}
                </p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Tabs - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Movimientos ({transactions.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Users className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Parceros ({participants.length})</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'transactions' ? (
              <div className="space-y-3 sm:space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">No hay movimientos registrados</p>
                    {!account.is_closed && (
                      <button
                        onClick={() => setShowAddTransaction(true)}
                        className="mt-4 text-purple-600 hover:text-purple-800 font-medium text-sm sm:text-base"
                      >
                        Agregar el primer movimiento
                      </button>
                    )}
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2 space-y-1 sm:space-y-0">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                transaction.type === 'ingreso' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {transaction.description || 'Sin descripción'}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                              transaction.type === 'ingreso' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-medium">Monto:</span>
                              <span className={`sm:ml-2 font-semibold ${
                                transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-medium">Categoría:</span>
                              <span className="sm:ml-2 truncate">{transaction.category}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <span className="font-medium">Agregado por:</span>
                              <span className="sm:ml-2 truncate">{transaction.added_by_username}</span>
                            </div>
                          </div>

                          {transaction.payers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Quién pagó:
                              </p>
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                {transaction.payers.map((payer, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                  >
                                    <span className="truncate max-w-24 sm:max-w-none">
                                      {payer.participant_name}: {formatCurrency(payer.amount_paid)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-2 sm:ml-4 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('es-CO')}
                          </span>
                          {!account.is_closed && (
                            <button
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="text-red-500 hover:text-red-700 transition-colors self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      participant.user_id ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        participant.user_id ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {participant.username || participant.guest_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {participant.user_id ? 'Usuario registrado' : 'Invitado'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">
                        Se unió el {new Date(participant.joined_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      <AddSharedTransactionModal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onTransactionAdded={handleTransactionAdded}
        accountId={accountId}
        participants={participants}
        token={token}
        user={user}
      />

      <SharedAccountSettlement
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        accountId={accountId}
        token={token}
      />

      {/* Modal de confirmación para cerrar cuenta */}
      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseAccount}
        title="Cerrar Parche"
        message="¿Estás seguro de que querés cerrar este parche? No se podrán agregar más movimientos y se generarán los gastos individuales correspondientes."
        confirmText="Sí, cerrar parche"
        cancelText="Cancelar"
        type="warning"
        icon={<Lock className="h-6 w-6 text-yellow-600" />}
      />

      {/* Modal de confirmación para eliminar transacción */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDeleteTransaction}
        title="Eliminar Transacción"
        message="¿Estás seguro de que querés eliminar esta transacción? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
        icon={<Trash2 className="h-6 w-6 text-red-600" />}
      />
    </div>
  );
}