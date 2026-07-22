import { query } from './db.js'

async function initDb() {
  console.log('Initializing database tables...')
  try {
    // Enable UUID extension
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('- "users" table checked/created.')

    // Create documents table
    await query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('- "documents" table checked/created.')

    // Create document_permissions table
    await query(`
      CREATE TABLE IF NOT EXISTS document_permissions (
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('editor', 'viewer')),
        PRIMARY KEY (document_id, user_id)
      )
    `)
    console.log('- "document_permissions" table checked/created.')

    console.log('Database initialization completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

initDb()
