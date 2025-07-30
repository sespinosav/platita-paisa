import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { request } from 'https';

// GET: List shared accounts for the user (where user is participant)
export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  const userId = payload.userId;
  // Get accounts where user is a participant
  const { data: participantRows, error: partError } = await supabase
    .from('shared_account_participants')
    .select('shared_account_id')
    .eq('user_id', userId);
  if (partError) return NextResponse.json({ error: partError.message }, { status: 500 });
  const accountIds = participantRows?.map((p: any) => p.shared_account_id) || [];
  if (accountIds.length === 0) return NextResponse.json({ accounts: [] });
  const { data, error } = await supabase
    .from('shared_accounts')
    .select('id, name, description, creator_id, is_closed, created_at, closed_at')
    .in('id', accountIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Get creator usernames
  const creatorIds = [...new Set((data || []).map((acc: any) => acc.creator_id))];
  const { data: creators } = await supabase
    .from('users')
    .select('id, username')
    .in('id', creatorIds);
  // Get participants count for each account
  const { data: participants } = await supabase
    .from('shared_account_participants')
    .select('shared_account_id')
    .in('shared_account_id', accountIds);

  // Get balance for each account (sum of transactions)
  const { data: transactions } = await supabase
    .from('shared_transactions')
    .select('shared_account_id, type, amount')
    .in('shared_account_id', accountIds);

  // Calculate balance for each account
  const balanceByAccount = accountIds.reduce((acc: any, accountId: number) => {
    const accountTransactions = transactions?.filter((t: any) => t.shared_account_id === accountId) || [];
    const ingresos = accountTransactions
      .filter((t: any) => t.type === 'ingreso')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    const gastos = accountTransactions
      .filter((t: any) => t.type === 'gasto')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    acc[accountId] = ingresos - gastos;
    return acc;
  }, {});

  // Format response
  const accounts = (data || []).map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    description: acc.description,
    creator_id: acc.creator_id,
    is_closed: acc.is_closed,
    created_at: acc.created_at,
    closed_at: acc.closed_at,
    participants_count: participants?.filter((p: any) => p.shared_account_id === acc.id).length || 0,
    balance: balanceByAccount[acc.id] || 0,
    creator_username: creators?.find((c: any) => c.id === acc.creator_id)?.username || ''
  }));
  return NextResponse.json({ accounts });
}

// POST: Create shared account and participants
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  const userId = payload.userId;
  const { name, description, participants } = await req.json();
  // Create shared account
  const { data: account, error: accError } = await supabase
    .from('shared_accounts')
    .insert({ name, description, creator_id: userId })
    .select()
    .single();
  if (accError || !account) return NextResponse.json({ error: accError?.message || 'No se pudo crear la cuenta' }, { status: 500 });
  // Add participants
  type ParticipantRow = { shared_account_id: number; user_id?: number; guest_name?: string };
  const participantRows: ParticipantRow[] = [];
  // Always add creator as participant
  participantRows.push({ shared_account_id: account.id, user_id: userId });
  for (const p of participants) {
    if (p.type === 'user' && p.username) {
      // Find user by username
      const { data: userData } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', p.username)
        .single();
      if (userData) {
        participantRows.push({ shared_account_id: account.id, user_id: userData.id });
      }
    } else if (p.type === 'guest' && p.guestName) {
      participantRows.push({ shared_account_id: account.id, guest_name: p.guestName });
    }
  }
  if (participantRows.length > 0) {
    await supabase.from('shared_account_participants').insert(participantRows);
  }
  return NextResponse.json({ account });
}