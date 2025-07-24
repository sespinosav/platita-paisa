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
    // Calcular ingresos
    const ingresos = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "ingreso"',
      payload.userId
    );
    
    // Calcular gastos
    const gastos = await db.get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "gasto"',
      payload.userId
    );
    
    // Obtener datos por categoría para la gráfica
    const categoryData = await db.all(
      `SELECT 
         category,
         type,
         SUM(amount) as total
       FROM transactions 
       WHERE user_id = ? 
       GROUP BY category, type`,
      payload.userId
    );
    
    const balance = ingresos.total - gastos.total;
    
    return NextResponse.json({
      balance,
      ingresos: ingresos.total,
      gastos: gastos.total,
      categoryData
    });
    
  } finally {
    await db.close();
  }
}