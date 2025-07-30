import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  const user = await verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  const { id } = await params;
  const accountId = Number(id);
  if (!accountId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  // Verifica que el usuario sea el creador del parche
  const { data: account, error: accountError } = await supabase
    .from('shared_accounts')
    .select('creator_id, is_closed')
    .eq('id', accountId)
    .single();
  if (accountError || !account) {
    return NextResponse.json({ error: 'Parche no encontrado' }, { status: 404 });
  }
  if (account.is_closed) {
    return NextResponse.json({ error: 'El parche ya está cerrado' }, { status: 400 });
  }
  if (account.creator_id !== user.userId) {
    return NextResponse.json({ error: 'Solo el creador puede cerrar el parche' }, { status: 403 });
  }
  
  // Antes de cerrar, generar las transacciones individuales basadas en el settlement
  try {
    // Obtener el settlement de la cuenta para calcular lo que debe cada usuario
    const settlementResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/shared-accounts/${accountId}/settlement`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!settlementResponse.ok) {
      return NextResponse.json({ error: 'Error calculando settlement' }, { status: 500 });
    }

    const settlementData = await settlementResponse.json();
    
    // Obtener información de la cuenta para usar en las descripciones
    const accountName = settlementData.account_info?.name || 'Cuenta compartida';

    // Obtener participantes que son usuarios registrados (no invitados)
    const { data: participants } = await supabase
      .from('shared_account_participants')
      .select('id, user_id, guest_name')
      .eq('shared_account_id', accountId)
      .not('user_id', 'is', null);

    if (!participants || participants.length === 0) {
      // Si no hay usuarios registrados, solo cerrar la cuenta
      const { error: updateError } = await supabase
        .from('shared_accounts')
        .update({ is_closed: true, closed_at: new Date().toISOString() })
        .eq('id', accountId);

      if (updateError) {
        return NextResponse.json({ error: 'No se pudo cerrar el parche' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Obtener nombres de usuarios para hacer el match
    const userIds = participants.map(p => p.user_id);
    const { data: usersData } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);

    // Crear mapa de username a user_id
    const userNameToIdMap = new Map();
    usersData?.forEach(u => {
      userNameToIdMap.set(u.username, u.id);
    });

    // Crear transacciones individuales para cada usuario que debe dinero
    const transactionsToCreate: any[] = [];

    for (const settlement of settlementData.settlement) {
      if (settlement.total_paid > 0) {
        // Extraer el username del participant_name (puede ser "username" o "username (invitado)")
        let username = settlement.participant_name;
        if (username.includes(' (invitado)')) {
          // Si es invitado, saltar
          continue;
        }
        
        const userId = userNameToIdMap.get(username);

        if (userId) {
          transactionsToCreate.push({
            user_id: userId,
            type: 'gasto',
            amount: settlement.total_paid,
            category: 'Parche Compartido',
            description: accountName,
            shared_account_id: accountId
          });
        }
      }
    }

    // Insertar las transacciones si hay alguna
    if (transactionsToCreate.length > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactionsToCreate);

      if (transactionError) {
        console.error('Error creating individual transactions:', transactionError);
        return NextResponse.json({ error: 'Error generando transacciones individuales' }, { status: 500 });
      }
    }

    // Actualiza el estado a cerrado y registra la fecha
    const { error: updateError } = await supabase
      .from('shared_accounts')
      .update({ is_closed: true, closed_at: new Date().toISOString() })
      .eq('id', accountId);

    if (updateError) {
      return NextResponse.json({ error: 'No se pudo cerrar el parche' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      transactions_created: transactionsToCreate.length 
    });

  } catch (error) {
    console.error('Error in close process:', error);
    return NextResponse.json({ error: 'Error en el proceso de cierre' }, { status: 500 });
  }
}
