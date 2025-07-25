import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuración múltiple para máxima compatibilidad
const configs = [
  {
    name: 'Supabase REST API',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  {
    name: 'Supabase Alternative',
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY
  }
];

async function trySupabaseConnection() {
  for (const config of configs) {
    if (!config.url || !config.key) {
      console.log(`⏭️  Saltando ${config.name} - variables faltantes`);
      continue;
    }

    try {
      console.log(`🔄 Intentando ${config.name}...`);
      
      const supabase = createClient(config.url, config.key, {
        auth: { persistSession: false },
        global: { headers: { 'X-Client-Info': 'init-db-script' } }
      });

      // Test de conexión simple
      const { data, error } = await supabase.auth.getSession();
      
      if (error && !error.message.includes('session')) {
        throw error;
      }

      console.log(`✅ ${config.name} conectado exitosamente`);
      return supabase;

    } catch (error) {
      console.log(`❌ ${config.name} falló:`, error.message);
      continue;
    }
  }
  
  throw new Error('No se pudo establecer conexión con ningún método');
}

async function initDatabase() {
  console.log('🚀 Inicializando base de datos...');
  console.log('📋 Variables disponibles:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('  - SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const supabase = await trySupabaseConnection();

    // Crear tabla users
    console.log('📝 Creando tabla users...');
    
    // Método 1: Usando RPC para ejecutar SQL directo
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    if (rpcError && !rpcError.message.includes('does not exist')) {
      console.log('⚠️  RPC method failed, trying table operations...');
    } else if (!rpcError) {
      console.log('✅ Tabla creada via RPC');
    }

    // Método 2: Verificar si la tabla existe intentando hacer select
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tableError && tableError.message.includes('does not exist')) {
      console.log('📋 Tabla users no existe. Instrucciones para crearla:');
      console.log('');
      console.log('🔗 Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/editor');
      console.log('📝 Ejecuta este SQL:');
      console.log('');
      console.log(`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`);
      console.log('');
      console.log('⚡ Luego ejecuta este script nuevamente');
      return;
    }

    console.log('✅ Tabla users existe o fue creada');

    // Insertar datos de prueba
    console.log('📝 Insertando datos de prueba...');
    
    const testUsers = [
      { name: 'Juan Pérez', email: 'juan@email.com' },
      { name: 'María García', email: 'maria@email.com' },
      { name: 'Carlos López', email: 'carlos@email.com' }
    ];

    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { 
          onConflict: 'email',
          ignoreDuplicates: true 
        })
        .select();

      if (error) {
        console.log(`⚠️  Error con ${user.name}:`, error.message);
      } else {
        console.log(`✅ Usuario procesado: ${user.name}`);
      }
    }

    // Verificar datos existentes
    const { data: existingUsers, error: selectError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (selectError) {
      console.log('⚠️  Error leyendo usuarios:', selectError.message);
    } else {
      console.log('');
      console.log('👥 Usuarios en la base de datos:');
      existingUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }

    console.log('');
    console.log('🎉 ¡Base de datos inicializada correctamente!');
    console.log('🔗 Dashboard: https://supabase.com/dashboard');

  } catch (error) {
    console.error('');
    console.error('❌ Error crítico:', error.message);
    console.error('');
    console.error('🔧 Soluciones sugeridas:');
    console.error('1. Verifica las variables de entorno en .env');
    console.error('2. Confirma que tu proyecto Supabase esté activo');
    console.error('3. Revisa que las keys sean correctas');
    console.error('4. Intenta crear las tablas manualmente en Supabase Dashboard');
  }
}

initDatabase();