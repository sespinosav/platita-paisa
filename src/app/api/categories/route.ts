import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
  
  try {
    // Obtener categorías personalizadas del usuario
    const { data: userCategories, error: categoriesError } = await supabase
      .from('user_categories')
      .select('category_name')
      .eq('user_id', payload.userId);
    
    if (categoriesError) {
      console.error('Error fetching user categories:', categoriesError);
      // Si hay error, solo devolver categorías por defecto
      return NextResponse.json({ categories: defaultCategories });
    }
    
    const userCategoryNames = userCategories?.map(cat => cat.category_name) || [];
    
    // Combinar categorías por defecto con las personalizadas
    const allCategories = [...new Set([...defaultCategories, ...userCategoryNames])];
    
    return NextResponse.json({ categories: allCategories });
    
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}