'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Users, Receipt, Calculator, AlertTriangle, CheckCircle2, Zap, Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Participant {
  id: number;
  user_id: number | null;
  guest_name: string | null;
  username: string | null;
}

interface AddSharedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: () => void;
  accountId: number;
  participants: Participant[];
  token: string;
  user: any;
}

interface PayerData {
  participant_id: number;
  amount_paid: number;
}

export default function AddSharedTransactionModal({
  isOpen,
  onClose,
  onTransactionAdded,
  accountId,
  participants,
  token,
  user
}: AddSharedTransactionModalProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [payers, setPayers] = useState<PayerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setType('gasto');
      setAmount('');
      setCategory('');
      setDescription('');
      setPayers([]);
      setErrors([]);
    }
  }, [isOpen]);

  const totalPaid = payers.reduce((sum, p) => sum + p.amount_paid, 0);
  const transactionAmount = Number(amount) || 0;
  const difference = totalPaid - transactionAmount;
  const isBalanced = Math.abs(difference) < 0.01;

  const getParticipantName = (participant: Participant) => {
    return participant.username || participant.guest_name || `Participante ${participant.id}`;
  };

  const handleAddPayer = (participant_id: number) => {
    if (!payers.some(p => p.participant_id === participant_id)) {
      setPayers([...payers, { participant_id, amount_paid: 0 }]);
    }
  };

  const handleRemovePayer = (participant_id: number) => {
    setPayers(payers.filter(p => p.participant_id !== participant_id));
  };

  const handlePayerAmountChange = (participant_id: number, value: string) => {
    const numValue = Number(value) || 0;
    setPayers(payers.map(p =>
      p.participant_id === participant_id ? { ...p, amount_paid: numValue } : p
    ));
  };

  const handleSplitEvenly = () => {
    if (participants.length === 0 || transactionAmount === 0) return;
    // Si no están todos, los agrega
    const allPayers = participants.map(p => ({ participant_id: p.id, amount_paid: 0 }));
    const amountPerPerson = transactionAmount / participants.length;
    setPayers(allPayers.map(p => ({ ...p, amount_paid: amountPerPerson })));
  };

  const handleOnePersonPays = (participant_id: number) => {
    setPayers(payers.map(p => ({
      ...p,
      amount_paid: p.participant_id === participant_id ? transactionAmount : 0
    })));
  };

  const validateStep1 = () => {
    const newErrors = [];
    if (!amount || Number(amount) <= 0) newErrors.push('El monto debe ser mayor a 0');
    if (!category.trim()) newErrors.push('La categoría es requerida');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateStep2 = () => {
    const newErrors = [];
    if (payers.length === 0) newErrors.push('Debe seleccionar al menos una persona que pagó');
    if (!isBalanced) newErrors.push('El total pagado debe coincidir con el monto de la transacción');
    if (payers.some(p => p.amount_paid < 0)) newErrors.push('Los montos no pueden ser negativos');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/shared-accounts/${accountId}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          amount: transactionAmount,
          category: category.trim(),
          description: description.trim(),
          payers: payers.filter(p => p.amount_paid > 0)
        })
      });

      if (response.ok) {
        onTransactionAdded();
        onClose();
      } else {
        const errorData = await response.json();
        setErrors([errorData.error || 'Error al agregar la transacción']);
      }
    } catch (error) {
      setErrors(['Error de conexión. Inténtalo de nuevo.']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Mobile Optimized */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold">Nuevo Movimiento</h2>
                <p className="text-purple-100 text-xs sm:text-sm">
                  Paso {step} de 2 - {step === 1 ? 'Detalles del movimiento' : 'División de pagos'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-1 sm:p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-white text-purple-600' : 'bg-white/30'}`}>
                {step > 1 ? <CheckCircle2 className="w-3 h-3" /> : '1'}
              </div>
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-white text-purple-600' : 'bg-white/30'}`}>
                2
              </div>
            </div>
          </div>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-red-800">Corrige los siguientes errores:</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            /* Step 1: Transaction Details */
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de movimiento</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button 
                    type="button" 
                    onClick={() => setType('gasto')} 
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      type === 'gasto' 
                        ? 'border-red-500 bg-red-50 text-red-700 shadow-md' 
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium text-sm sm:text-base">Gasto</span>
                    </div>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setType('ingreso')} 
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      type === 'ingreso' 
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-md' 
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium text-sm sm:text-base">Ingreso</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="0" 
                    step="100" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0"
                    className="text-gray-800 w-full px-4 py-3 text-base sm:text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {amount && Number(amount) > 0 && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    {formatCurrency(Number(amount))}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  placeholder="ej. Comida, Transporte, Alojamiento..."
                  className="text-gray-800 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={3}
                  placeholder="Describe brevemente el gasto o ingreso..."
                  className="text-gray-800 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                />
              </div>
            </div>
          ) : (
            /* Step 2: Payment Division */
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Resumen del movimiento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className={`ml-2 font-medium ${type === 'gasto' ? 'text-red-600' : 'text-green-600'}`}>
                      {type === 'gasto' ? 'Gasto' : 'Ingreso'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Monto:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatCurrency(transactionAmount)}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-600">Categoría:</span>
                    <span className="ml-2 font-medium text-gray-900">{category}</span>
                  </div>
                </div>
              </div>

              {/* Balance indicator */}
              <div className={`rounded-xl p-3 sm:p-4 border-2 ${
                isBalanced 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">
                        Total pagado: {formatCurrency(totalPaid)}
                      </span>
                      <span className={`font-bold text-sm sm:text-base ${
                        difference === 0 ? 'text-green-600' : 
                        difference > 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {difference > 0 ? `+${formatCurrency(difference)}` : 
                         difference < 0 ? formatCurrency(difference) : 'Balanceado ✓'}
                      </span>
                    </div>
                    {!isBalanced && (
                      <p className="text-sm text-gray-600 mt-1">
                        {difference > 0 ? 'Sobra dinero' : 'Falta dinero'} para completar el monto total
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              {transactionAmount > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Acciones rápidas
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSplitEvenly}
                      disabled={participants.length === 0 || transactionAmount === 0}
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Dividir equitativamente
                    </button>
                    {payers.map(payer => {
                      const participant = participants.find(p => p.id === payer.participant_id);
                      if (!participant) return null;
                      return (
                        <button
                          key={payer.participant_id}
                          type="button"
                          onClick={() => handleOnePersonPays(payer.participant_id)}
                          className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          {getParticipantName(participant)} paga todo
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  ¿Quién pagó?
                </h3>
                
                <div className="space-y-3">
                  {participants.map(participant => {
                    const payer = payers.find(p => p.participant_id === participant.id);
                    const isPaying = !!payer;
                    const isCurrentUser = participant.user_id === user?.id;
                    
                    return (
                      <div key={participant.id} className={`border rounded-xl p-4 transition-all ${
                        isPaying ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              isPaying ? 'bg-purple-500' : 'bg-gray-400'
                            }`}>
                              {getParticipantName(participant).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {getParticipantName(participant)}
                                </span>
                                {isCurrentUser && (
                                  <Crown className="w-4 h-4 text-yellow-500" title="Eres tú" />
                                )}
                              </div>
                              {participant.guest_name && (
                                <span className="text-xs text-gray-500">Invitado</span>
                              )}
                            </div>
                          </div>
                          
                          {isPaying ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                step="100" 
                                value={payer.amount_paid || ''} 
                                onChange={e => handlePayerAmountChange(participant.id, e.target.value)}
                                placeholder="0"
                                className="text-gray-800 w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemovePayer(participant.id)} 
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => handleAddPayer(participant.id)} 
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2 sm:gap-3">
            {step === 1 ? (
              <>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg font-medium text-sm sm:text-base"
                >
                  Continuar
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Atrás
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isBalanced || payers.length === 0}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Agregando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span className="hidden sm:inline">Agregar movimiento</span>
                      <span className="sm:hidden">Agregar</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}