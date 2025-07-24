export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  const db = await openDb();
  try {
    // Verificar que la transacción pertenezca al usuario
    const tx = await db.get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', id, payload.userId);
    if (!tx) {
      return NextResponse.json({ error: 'Transacción no encontrada o no autorizada' }, { status: 404 });
    }
    await db.run('DELETE FROM transactions WHERE id = ?', id);
    return NextResponse.json({ success: true });
  } finally {
    await db.close();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  const db = await openDb();
  
  try {
    const transactions = await db.all(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      payload.userId
    );
    
    return NextResponse.json({ transactions });
  } finally {
    await db.close();
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
  
  const { type, amount, category, description } = await request.json();
  
  if (!type || !amount || !category) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }
  
  const db = await openDb();
  
  try {
    // Guardar la categoría si es nueva
    await db.run(
      'INSERT OR IGNORE INTO user_categories (user_id, category_name) VALUES (?, ?)',
      payload.userId,
      category
    );
    
    // Crear la transacción
    const result = await db.run(
      'INSERT INTO transactions (user_id, type, amount, category, description) VALUES (?, ?, ?, ?, ?)',
      payload.userId,
      type,
      amount,
      category,
      description || null
    );
    
    return NextResponse.json({
      success: true,
      transaction: {
        id: result.lastID,
        type,
        amount,
        category,
        description
      }
    });
    
  } finally {
    await db.close();
  }
}