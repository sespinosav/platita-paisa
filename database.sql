-- Tablas existentes
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS user_categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, category_name)
);

-- NUEVAS TABLAS PARA GASTOS COMPARTIDOS "EL PARCHE"

-- Tabla para las cuentas compartidas
CREATE TABLE IF NOT EXISTS shared_accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users (id)
);

-- Tabla para los participantes de cada cuenta compartida
CREATE TABLE IF NOT EXISTS shared_account_participants (
  id SERIAL PRIMARY KEY,
  shared_account_id INTEGER NOT NULL,
  user_id INTEGER, -- NULL si es un invitado sin cuenta
  guest_name TEXT, -- Nombre del invitado si no tiene cuenta
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shared_account_id) REFERENCES shared_accounts (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(shared_account_id, user_id), -- Un usuario no puede estar duplicado en la misma cuenta
  CHECK ((user_id IS NOT NULL AND guest_name IS NULL) OR (user_id IS NULL AND guest_name IS NOT NULL))
);

-- Tabla para las transacciones compartidas
CREATE TABLE IF NOT EXISTS shared_transactions (
  id SERIAL PRIMARY KEY,
  shared_account_id INTEGER NOT NULL,
  added_by_user_id INTEGER NOT NULL, -- Usuario que agregó la transacción
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'gasto')),
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shared_account_id) REFERENCES shared_accounts (id) ON DELETE CASCADE,
  FOREIGN KEY (added_by_user_id) REFERENCES users (id)
);

-- Tabla para registrar quién pagó qué en cada transacción compartida
CREATE TABLE IF NOT EXISTS shared_transaction_payers (
  id SERIAL PRIMARY KEY,
  shared_transaction_id INTEGER NOT NULL,
  participant_id INTEGER NOT NULL, -- ID del participante (de shared_account_participants)
  amount_paid INTEGER NOT NULL,
  FOREIGN KEY (shared_transaction_id) REFERENCES shared_transactions (id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES shared_account_participants (id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shared_accounts_creator ON shared_accounts (creator_id);
CREATE INDEX IF NOT EXISTS idx_shared_account_participants_account ON shared_account_participants (shared_account_id);
CREATE INDEX IF NOT EXISTS idx_shared_account_participants_user ON shared_account_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_shared_transactions_account ON shared_transactions (shared_account_id);
CREATE INDEX IF NOT EXISTS idx_shared_transactions_user ON shared_transactions (added_by_user_id);

-- Migración: Agregar shared_account_id a transactions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='transactions' AND column_name='shared_account_id'
    ) THEN
        ALTER TABLE transactions ADD COLUMN shared_account_id INTEGER NULL;
        ALTER TABLE transactions ADD CONSTRAINT fk_transactions_shared_account 
            FOREIGN KEY (shared_account_id) REFERENCES shared_accounts (id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_shared_transaction_payers_transaction ON shared_transaction_payers (shared_transaction_id);
CREATE INDEX IF NOT EXISTS idx_shared_transaction_payers_participant ON shared_transaction_payers (participant_id);

-- Agregar campo shared_account_id a la tabla transactions existente
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shared_account_id INTEGER NULL;

-- Agregar constraint solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_transactions_shared_account' 
        AND table_name = 'transactions'
    ) THEN
        ALTER TABLE transactions ADD CONSTRAINT fk_transactions_shared_account 
            FOREIGN KEY (shared_account_id) REFERENCES shared_accounts (id);
    END IF;
END $$;