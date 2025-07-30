import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Participant {
  id: number;
  user_id: number | null;
  guest_name: string | null;
  name: string;
}

interface Transaction {
  id: number;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string | null;
}

interface PaymentDetail {
  participant_id: number;
  amount_paid: number;
}

interface ParticipantBalance {
  participant_id: number;
  participant_name: string;
  total_paid: number;
  should_pay: number;
  balance: number; // positivo = le deben, negativo = debe
  amount_to_receive: number;
  amount_to_pay: number;
  details: TransactionDetail[];
}

interface TransactionDetail {
  transaction_id: number;
  description: string;
  amount: number;
  amount_paid: number;
  should_pay: number;
  category: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const sharedAccountId = Number(awaitedParams.id);

    // Validar que la cuenta existe y no está cerrada
    const { data: account, error: accountError } = await supabase
      .from('shared_accounts')
      .select('id, name, is_closed')
      .eq('id', sharedAccountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ 
        error: 'Cuenta compartida no encontrada' 
      }, { status: 404 });
    }

    // 1. Obtener participantes
    const { data: participants, error: partError } = await supabase
      .from('shared_account_participants')
      .select('id, user_id, guest_name')
      .eq('shared_account_id', sharedAccountId);

    if (partError) {
      return NextResponse.json({ 
        error: 'Error al obtener participantes' 
      }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ 
        settlement: [],
        summary: {
          total_expenses: 0,
          total_income: 0,
          net_amount: 0,
          per_person: 0,
          participants_count: 0
        }
      });
    }

    // 2. Obtener nombres de usuarios registrados
    const userIds = participants
      .filter(p => p.user_id)
      .map(p => p.user_id);

    let userMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username')
        .in('id', userIds);

      if (usersData) {
        usersData.forEach(u => {
          userMap[u.id] = u.username;
        });
      }
    }

    // 3. Crear lista de participantes con nombres
    const participantsList: Participant[] = participants.map(p => ({
      id: p.id,
      user_id: p.user_id,
      guest_name: p.guest_name,
      name: p.user_id 
        ? (userMap[p.user_id] || `Usuario ${p.user_id}`)
        : `${p.guest_name} (invitado)`
    }));

    // 4. Obtener transacciones con detalles de pagos
    const { data: transactions, error: transError } = await supabase
      .from('shared_transactions')
      .select(`
        id,
        type,
        amount,
        category,
        description,
        shared_transaction_payers (
          participant_id,
          amount_paid
        )
      `)
      .eq('shared_account_id', sharedAccountId);

    if (transError) {
      return NextResponse.json({ 
        error: 'Error al obtener transacciones' 
      }, { status: 500 });
    }

    // 5. Calcular balances
    const participantBalances: Record<number, ParticipantBalance> = {};
    
    // Inicializar balances
    participantsList.forEach(participant => {
      participantBalances[participant.id] = {
        participant_id: participant.id,
        participant_name: participant.name,
        total_paid: 0,
        should_pay: 0,
        balance: 0,
        amount_to_receive: 0,
        amount_to_pay: 0,
        details: []
      };
    });

    // Calcular totales
    let totalExpenses = 0;
    let totalIncome = 0;

    transactions?.forEach(transaction => {
      const amount = transaction.amount;
      const isExpense = transaction.type === 'gasto';
      
      if (isExpense) {
        totalExpenses += amount;
      } else {
        totalIncome += amount;
      }

      // Calcular cuánto debe pagar cada persona (división equitativa)
      const amountPerPerson = amount / participantsList.length;

      // Procesar pagos de cada participante en esta transacción
      const payers = transaction.shared_transaction_payers || [];
      
      participantsList.forEach(participant => {
        const participantBalance = participantBalances[participant.id];
        
        // Encontrar cuánto pagó este participante en esta transacción
        const payerRecord = payers.find(p => p.participant_id === participant.id);
        const amountPaid = payerRecord ? payerRecord.amount_paid : 0;

        // Agregar a totales
        participantBalance.total_paid += amountPaid;
        
        if (isExpense) {
          // Para gastos: cada persona debe su parte proporcional
          participantBalance.should_pay += amountPerPerson;
        } else {
          // Para ingresos: cada persona recibe su parte proporcional
          participantBalance.should_pay -= amountPerPerson;
        }

        // Agregar detalle de la transacción
        participantBalance.details.push({
          transaction_id: transaction.id,
          description: transaction.description || `${transaction.category}`,
          amount: amount,
          amount_paid: amountPaid,
          should_pay: isExpense ? amountPerPerson : -amountPerPerson,
          category: transaction.category
        });
      });
    });

    // 6. Calcular balances finales
    Object.values(participantBalances).forEach(balance => {
      // Balance = lo que pagó - lo que debería pagar
      balance.balance = balance.total_paid - balance.should_pay;
      
      if (balance.balance > 0) {
        // Le deben dinero
        balance.amount_to_receive = balance.balance;
        balance.amount_to_pay = 0;
      } else {
        // Debe dinero
        balance.amount_to_receive = 0;
        balance.amount_to_pay = Math.abs(balance.balance);
      }
    });

    // 7. Crear resumen y respuesta
    const netAmount = totalIncome - totalExpenses;
    const perPerson = participantsList.length > 0 ? netAmount / participantsList.length : 0;

    const settlement = Object.values(participantBalances).map(balance => ({
      participant_name: balance.participant_name,
      total_paid: balance.total_paid,
      should_pay: balance.should_pay,
      balance: balance.balance,
      amount_to_receive: Math.round(balance.amount_to_receive),
      amount_to_pay: Math.round(balance.amount_to_pay),
      details: balance.details.map(detail => ({
        ...detail,
        amount_paid: Math.round(detail.amount_paid),
        should_pay: Math.round(detail.should_pay)
      }))
    }));

    return NextResponse.json({
      settlement,
      summary: {
        total_expenses: totalExpenses,
        total_income: totalIncome,
        net_amount: netAmount,
        per_person: Math.round(perPerson),
        participants_count: participantsList.length
      },
      account_info: {
        id: account.id,
        name: account.name,
        is_closed: account.is_closed
      }
    });

  } catch (error) {
    console.error('Error en settlement API:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Función auxiliar para crear sugerencias de pagos (opcional)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const awaitedParams = await params;
    const sharedAccountId = Number(awaitedParams.id);

    // Primero obtener el settlement actual
    const getResponse = await GET(req, { params });
    const data = await getResponse.json();

    if (!data.settlement) {
      return NextResponse.json({ error: 'No se pudo calcular el settlement' }, { status: 400 });
    }

    // Crear sugerencias de pagos para minimizar transacciones
    const creditors = data.settlement.filter((p: any) => p.amount_to_receive > 0);
    const debtors = data.settlement.filter((p: any) => p.amount_to_pay > 0);

    const suggestions = [];
    let debtorsCopy = [...debtors];
    let creditorsCopy = [...creditors];

    while (debtorsCopy.length > 0 && creditorsCopy.length > 0) {
      const debtor = debtorsCopy[0];
      const creditor = creditorsCopy[0];

      const amount = Math.min(debtor.amount_to_pay, creditor.amount_to_receive);

      if (amount > 0.01) { // Evitar pagos muy pequeños
        suggestions.push({
          from: debtor.participant_name,
          to: creditor.participant_name,
          amount: Math.round(amount)
        });
      }

      debtor.amount_to_pay -= amount;
      creditor.amount_to_receive -= amount;

      if (debtor.amount_to_pay <= 0.01) {
        debtorsCopy.shift();
      }
      if (creditor.amount_to_receive <= 0.01) {
        creditorsCopy.shift();
      }
    }

    return NextResponse.json({
      payment_suggestions: suggestions,
      settlement: data.settlement,
      summary: data.summary
    });

  } catch (error) {
    console.error('Error en payment suggestions:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}