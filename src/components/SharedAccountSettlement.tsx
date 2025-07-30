'use client';
import { X, TrendingUp, TrendingDown, Calculator, Users, DollarSign, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

interface SharedAccountSettlementProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: number;
  token: string;
}

interface TransactionDetail {
  transaction_id: number;
  description: string;
  amount: number;
  amount_paid: number;
  should_pay: number;
  category: string;
}

interface SettlementParticipant {
  participant_name: string;
  total_paid: number;
  should_pay: number;
  balance: number;
  amount_to_receive: number;
  amount_to_pay: number;
  details: TransactionDetail[];
}

interface PaymentSuggestion {
  from: string;
  to: string;
  amount: number;
}

interface SettlementData {
  settlement: SettlementParticipant[];
  summary: {
    total_expenses: number;
    total_income: number;
    net_amount: number;
    per_person: number;
    participants_count: number;
  };
  account_info: {
    id: number;
    name: string;
    is_closed: boolean;
  };
  payment_suggestions?: PaymentSuggestion[];
}

export default function SharedAccountSettlement({ isOpen, onClose, accountId, token }: SharedAccountSettlementProps) {
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [paymentSuggestions, setPaymentSuggestions] = useState<PaymentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    
    const loadSettlement = async () => {
      setLoading(true);
      try {
        // Cargar settlement
        const settlementRes = await fetch(`/api/shared-accounts/${accountId}/settlement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const settlementData = await settlementRes.json();
        
        if (settlementData.settlement) {
          setSettlementData(settlementData);
          
          // Cargar sugerencias de pagos
          const suggestionsRes = await fetch(`/api/shared-accounts/${accountId}/settlement`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const suggestionsData = await suggestionsRes.json();
          
          if (suggestionsData.payment_suggestions) {
            setPaymentSuggestions(suggestionsData.payment_suggestions);
          }
        }
      } catch (error) {
        console.error('Error loading settlement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettlement();
  }, [isOpen, accountId, token]);

  const toggleParticipantDetails = (participantName: string) => {
    const newExpanded = new Set(expandedParticipants);
    if (newExpanded.has(participantName)) {
      newExpanded.delete(participantName);
    } else {
      newExpanded.add(participantName);
    }
    setExpandedParticipants(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Liquidación de Gastos
              </h2>
              {settlementData?.account_info && (
                <p className="text-purple-100 mt-1 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {settlementData.account_info.name}
                </p>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Calculando liquidación...</p>
              </div>
            </div>
          ) : settlementData && settlementData.settlement.length > 0 ? (
            <div className="p-6 space-y-6">
              {/* Resumen */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Resumen General
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(settlementData.summary.total_expenses)}
                    </div>
                    <div className="text-sm text-gray-600">Total Gastos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(settlementData.summary.total_income)}
                    </div>
                    <div className="text-sm text-gray-600">Total Ingresos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(Math.abs(settlementData.summary.net_amount))}
                    </div>
                    <div className="text-sm text-gray-600">Monto Neto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(Math.abs(settlementData.summary.per_person))}
                    </div>
                    <div className="text-sm text-gray-600">Por Persona</div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setShowSuggestions(false)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    !showSuggestions
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Balances Individuales
                </button>
                <button
                  onClick={() => setShowSuggestions(true)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    showSuggestions
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sugerencias de Pago ({paymentSuggestions.length})
                </button>
              </div>

              {!showSuggestions ? (
                /* Balances por participante */
                <div className="space-y-4">
                  {settlementData.settlement.map((participant, idx) => {
                    const isExpanded = expandedParticipants.has(participant.participant_name);
                    const isCreditor = participant.amount_to_receive > 0;
                    const isDebtor = participant.amount_to_pay > 0;
                    const isBalanced = participant.balance === 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-xl overflow-hidden transition-all ${
                          isCreditor ? 'border-green-200 bg-green-50' :
                          isDebtor ? 'border-red-200 bg-red-50' :
                          'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div 
                          className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                          onClick={() => toggleParticipantDetails(participant.participant_name)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {participant.participant_name}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Pagó: {formatCurrency(participant.total_paid)}</span>
                                  <span>Debe: {formatCurrency(participant.should_pay)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {isBalanced ? (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="font-medium">Balanceado</span>
                                </div>
                              ) : isCreditor ? (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  <div>
                                    <div className="text-lg font-bold text-green-700">
                                      +{formatCurrency(participant.amount_to_receive)}
                                    </div>
                                    <div className="text-sm text-green-600">Le deben</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                  <div>
                                    <div className="text-lg font-bold text-red-700">
                                      -{formatCurrency(participant.amount_to_pay)}
                                    </div>
                                    <div className="text-sm text-red-600">Debe pagar</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Detalles expandibles */}
                        {isExpanded && participant.details.length > 0 && (
                          <div className="border-t bg-white p-4">
                            <h4 className="font-medium text-gray-900 mb-3">Detalle por transacción:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {participant.details.map((detail, detailIdx) => (
                                <div key={detailIdx} className="bg-gray-50 rounded-lg p-3 text-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{detail.description}</div>
                                      <div className="text-gray-600 text-xs">{detail.category}</div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="font-medium">Total: {formatCurrency(detail.amount)}</div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>Pagó: {formatCurrency(detail.amount_paid)}</span>
                                    <span>Debe: {formatCurrency(Math.abs(detail.should_pay))}</span>
                                    <span className={detail.amount_paid - Math.abs(detail.should_pay) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      Balance: {formatCurrency(detail.amount_paid - Math.abs(detail.should_pay))}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Sugerencias de pago */
                <div className="space-y-4">
                  {paymentSuggestions.length > 0 ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900">Sugerencias para liquidar</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              Estas son las transferencias mínimas necesarias para saldar todas las deudas:
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {paymentSuggestions.map((suggestion, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-gray-900">{suggestion.from}</span>
                                  <ArrowRight className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{suggestion.to}</span>
                                </div>
                              </div>
                              <div className="text-lg font-bold text-purple-600">
                                {formatCurrency(suggestion.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <div className="text-sm text-green-800">
                            <strong>Total de transferencias necesarias:</strong> {paymentSuggestions.length}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Todo está balanceado!</h3>
                      <p className="text-gray-600">No hay pagos pendientes entre los participantes.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay liquidación disponible</h3>
              <p className="text-gray-600">No se encontraron transacciones para calcular la liquidación.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}