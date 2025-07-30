import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('shared_transactions')
    .select('id, type, amount, category, description, created_at, added_by_user_id')
    .eq('shared_account_id', Number(params.id));
  if (error) return NextResponse.json({ transactions: [] });
  // Get usernames for added_by_user_id
  const userIds = data?.map((t: any) => t.added_by_user_id) || [];
  let usernames: any[] = [];
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);
    usernames = users || [];
  }
  // Get payers for each transaction
  const transactionIds = data?.map((t: any) => t.id) || [];
  let payers: any[] = [];
  if (transactionIds.length > 0) {
    const { data: payerRows } = await supabase
      .from('shared_transaction_payers')
      .select('shared_transaction_id, participant_id, amount_paid')
      .in('shared_transaction_id', transactionIds);
    payers = payerRows || [];
  }
  // Get participant names
  const participantIds = payers.map((p: any) => p.participant_id);
  let participants: any[] = [];
  if (participantIds.length > 0) {
    const { data: partRows } = await supabase
      .from('shared_account_participants')
      .select('id, user_id, guest_name')
      .in('id', participantIds);
    participants = partRows || [];
  }
  // Format transactions
  const transactions = (data || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    created_at: t.created_at,
    added_by_username: usernames.find((u: any) => u.id === t.added_by_user_id)?.username || '',
    payers: payers.filter((p: any) => p.shared_transaction_id === t.id).map((p: any) => {
      const participant = participants.find((pt: any) => pt.id === p.participant_id);
      return {
        participant_id: p.participant_id,
        amount_paid: p.amount_paid,
        participant_name: participant?.user_id ? usernames.find((u: any) => u.id === participant.user_id)?.username : participant?.guest_name || ''
      };
    })
  }));
  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  const userId = payload.userId;
  const { type, amount, category, description, payers } = await req.json();
  // Create transaction
  const { data: transaction, error: transError } = await supabase
    .from('shared_transactions')
    .insert({
      shared_account_id: Number(params.id),
      added_by_user_id: userId,
      type,
      amount,
      category,
      description
    })
    .select()
    .single();
  if (transError || !transaction) return NextResponse.json({ error: transError?.message || 'No se pudo crear la transacción' }, { status: 500 });
  // Add payers
  const payerRows = payers.map((p: any) => ({
    shared_transaction_id: transaction.id,
    participant_id: p.participant_id,
    amount_paid: p.amount_paid
  }));
  if (payerRows.length > 0) {
    await supabase.from('shared_transaction_payers').insert(payerRows);
  }
  return NextResponse.json({ transaction });
}
