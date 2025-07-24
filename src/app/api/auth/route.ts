import { NextRequest, NextResponse } from 'next/server';
import { openDb, initDb } from '@/lib/database';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDb();
  
  const { username, password, action } = await request.json();
  
  if (!username || !password) {
    return NextResponse.json({ error: 'Username y password son requeridos' }, { status: 400 });
  }
  
  const db = await openDb();
  
  try {
    if (action === 'register') {
      // Verificar si el usuario ya existe
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', username);
      
      if (existingUser) {
        return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
      }
      
      // Crear nuevo usuario
      const hashedPassword = await hashPassword(password);
      const result = await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        username,
        hashedPassword
      );
      
      const token = generateToken(result.lastID!);
      
      return NextResponse.json({
        success: true,
        token,
        user: { id: result.lastID, username }
      });
      
    } else if (action === 'login') {
      // Verificar credenciales
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
      
      if (!user || !(await verifyPassword(password, user.password))) {
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
    
  } finally {
    await db.close();
  }
}