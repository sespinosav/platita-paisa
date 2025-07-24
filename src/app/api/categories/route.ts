import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { defaultCategories } from '@/lib/utils';

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
    // Obtener categorías personalizadas del usuario
    const userCategories = await db.all(
      'SELECT category_name FROM user_categories WHERE user_id = ?',
      payload.userId
    );
    
    const userCategoryNames = userCategories.map(cat => cat.category_name);
    
    // Combinar categorías por defecto con las personalizadas
    const allCategories = [...new Set([...defaultCategories, ...userCategoryNames])];
    
    return NextResponse.json({ categories: allCategories });
  } finally {
    await db.close();
  }
}