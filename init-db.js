const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'platita-paisa.db'),
    driver: sqlite3.Database
  });
}

async function initDb() {
  const db = await openDb();
  
  console.log('🔧 Inicializando base de datos...');
  
  // Tabla de usuarios
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabla de transacciones
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  // Tabla de categorías personalizadas por usuario
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, category_name)
    )
  `);
  
  await db.close();
  console.log('✅ Base de datos inicializada correctamente');
  console.log('📁 Archivo: platita-paisa.db');
}

initDb().catch((error) => {
  console.error('❌ Error inicializando la base de datos:', error);
  process.exit(1);
});