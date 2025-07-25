export async function GET() {
  try {
    const { data, error } = await supabase.from('users').select('id');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ count: Array.isArray(data) ? data.length : 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { username, password, action } = await request.json();
  
  if (!username || !password) {
    return NextResponse.json({ error: 'Username y password son requeridos' }, { status: 400 });
  }
  
  try {
    if (action === 'register') {
      // Verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (existingUser) {
        return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
      }
      
      // Crear nuevo usuario
      const hashedPassword = await hashPassword(password);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword }])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating user:', insertError);
        return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 });
      }
      
      const token = generateToken(newUser.id);
      
      return NextResponse.json({
        success: true,
        token,
        user: { id: newUser.id, username: newUser.username }
      });
      
    } else if (action === 'login') {
      // Verificar credenciales
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !user || !(await verifyPassword(password, user.password))) {
        return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
      }
      
      const token = generateToken(user.id);
      
      return NextResponse.json({
        success: true,
        token,
        user: { id: user.id, username: user.username }
      });
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}