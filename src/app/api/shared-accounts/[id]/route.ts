// DELETE: Remove shared account and all associated data (cascade)
import { verifyToken } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  const accountId = Number(params.id);
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
  // Elimina la cuenta y cascada todo lo asociado
  const { error: deleteError } = await supabase
    .from('shared_accounts')
    .delete()
    .eq('id', accountId);
  if (deleteError) {
    return NextResponse.json({ error: 'No se pudo eliminar el parche' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('shared_accounts')
    .select('id, name, description, creator_id, is_closed, created_at, closed_at')
    .eq('id', Number(params.id))
    .single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ account: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('shared_accounts')
    .update({ is_closed: true, closed_at: new Date().toISOString() })
    .eq('id', Number(params.id))
    .select()
    .single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ account: data });
}
