// DELETE: Remove shared account and all associated data (cascade)
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  const { id } = await params;
  const accountId = Number(id);
  if (!accountId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  // Verifica que el usuario sea el creador del parche
  const { data: account, error: accountError } = await supabase
    .from('shared_accounts')
    .select('creator_id')
    .eq('id', accountId)
    .single();
  if (accountError || !account) {
    return NextResponse.json({ error: 'Parche no encontrado' }, { status: 404 });
  }
  if (account.creator_id !== user.userId) {
    return NextResponse.json({ error: 'Solo el creador puede eliminar el parche' }, { status: 403 });
  }
  
  try {
    // Primero eliminar las transacciones individuales que referencian esta cuenta compartida
    const { error: deleteIndividualTransactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('shared_account_id', accountId);
    
    if (deleteIndividualTransactionsError) {
      console.error('Error deleting individual transactions:', deleteIndividualTransactionsError);
      return NextResponse.json({ error: 'Error eliminando transacciones asociadas' }, { status: 500 });
    }
    
    // Luego eliminar la cuenta compartida (esto eliminará automáticamente las shared_transactions por cascada)
    const { error: deleteError } = await supabase
      .from('shared_accounts')
      .delete()
      .eq('id', accountId);
      
    if (deleteError) {
      console.error('Error deleting shared account:', deleteError);
      return NextResponse.json({ error: 'No se pudo eliminar el parche' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete process:', error);
    return NextResponse.json({ error: 'Error eliminando el parche' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Get account data
  const { data: accountData, error: accountError } = await supabase
    .from('shared_accounts')
    .select('id, name, description, creator_id, is_closed, created_at, closed_at')
    .eq('id', Number(id))
    .single();
  
  if (accountError || !accountData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // Get creator username
  const { data: creatorData } = await supabase
    .from('users')
    .select('username')
    .eq('id', accountData.creator_id)
    .single();
  
  // Combine the data
  const account = {
    ...accountData,
    creator_username: creatorData?.username || 'Usuario desconocido'
  };
  
  return NextResponse.json({ account });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('shared_accounts')
    .update({ is_closed: true, closed_at: new Date().toISOString() })
    .eq('id', Number(id))
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ account: data });
}
