import pg from 'pg'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const { Pool } = pg

// In-Memory Database State
const memoryDb = {
  users: [],
  documents: [],
  document_permissions: []
}

let useMemoryDb = false
let pool = null

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000 // fail fast if not reachable
  })

  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database.')
  })

  pool.on('error', (err) => {
    console.error('Unexpected database client error:', err)
    if (!useMemoryDb) {
      console.warn('Switching to In-Memory Database mode due to PG connection failure.')
      useMemoryDb = true
    }
  })
} catch (e) {
  console.error('Failed to initialize PG Pool, switching to In-Memory mode:', e)
  useMemoryDb = true
}

// In-memory SQL engine simulation
function runMemoryQuery(text, params = []) {
  const queryType = text.trim().toUpperCase()

  // 1. SELECT id FROM users WHERE email = $1
  if (queryType.startsWith('SELECT ID FROM USERS WHERE EMAIL = $1')) {
    const email = params[0]?.toLowerCase()
    const user = memoryDb.users.find(u => u.email === email)
    return { rows: user ? [{ id: user.id }] : [] }
  }

  // 2. INSERT INTO users ... RETURNING id, email, name, created_at
  if (queryType.startsWith('INSERT INTO USERS')) {
    const [email, password_hash, name] = params
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password_hash,
      name: name || null,
      created_at: new Date().toISOString()
    }
    memoryDb.users.push(newUser)
    return { rows: [{ id: newUser.id, email: newUser.email, name: newUser.name, created_at: newUser.created_at }] }
  }

  // 3. SELECT * FROM users WHERE email = $1
  if (queryType.startsWith('SELECT * FROM USERS WHERE EMAIL = $1')) {
    const email = params[0]?.toLowerCase()
    const user = memoryDb.users.find(u => u.email === email)
    return { rows: user ? [user] : [] }
  }

  // 4. SELECT id, email, name, created_at FROM users WHERE id = $1
  if (queryType.startsWith('SELECT ID, EMAIL, NAME, CREATED_AT FROM USERS WHERE ID = $1')) {
    const id = params[0]
    const user = memoryDb.users.find(u => u.id === id)
    return { rows: user ? [{ id: user.id, email: user.email, name: user.name, created_at: user.created_at }] : [] }
  }

  // 5. List all documents (owned or shared)
  if (queryType.includes('SELECT D.ID, D.TITLE, D.CREATED_AT, D.UPDATED_AT') && queryType.includes('FROM DOCUMENTS D')) {
    const userId = params[0]
    const matchedDocs = []

    for (const doc of memoryDb.documents) {
      const isOwner = doc.owner_id === userId
      const perm = memoryDb.document_permissions.find(p => p.document_id === doc.id && p.user_id === userId)
      
      if (isOwner || perm) {
        const owner = memoryDb.users.find(u => u.id === doc.owner_id)
        matchedDocs.push({
          id: doc.id,
          title: doc.title,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          owner_email: owner ? owner.email : 'unknown',
          role: isOwner ? 'owner' : perm.role
        })
      }
    }
    
    // Sort by updated_at descending
    matchedDocs.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    return { rows: matchedDocs }
  }

  // 6. Create a document
  if (queryType.startsWith('INSERT INTO DOCUMENTS')) {
    const [title, content, owner_id] = params
    const newDoc = {
      id: crypto.randomUUID(),
      title,
      content: content || '',
      owner_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    memoryDb.documents.push(newDoc)
    return { rows: [newDoc] }
  }

  // 7. Get single document
  if (queryType.includes('SELECT D.ID, D.TITLE, D.CONTENT, D.OWNER_ID') && queryType.includes('FROM DOCUMENTS D')) {
    const [userId, docId] = params
    const doc = memoryDb.documents.find(d => d.id === docId)
    if (!doc) return { rows: [] }

    const isOwner = doc.owner_id === userId
    const perm = memoryDb.document_permissions.find(p => p.document_id === docId && p.user_id === userId)

    if (isOwner || perm) {
      const owner = memoryDb.users.find(u => u.id === doc.owner_id)
      return {
        rows: [{
          id: doc.id,
          title: doc.title,
          content: doc.content,
          owner_id: doc.owner_id,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          owner_email: owner ? owner.email : 'unknown',
          role: isOwner ? 'owner' : perm.role
        }]
      }
    }
    return { rows: [] }
  }

  // 8. Check update permission
  if (queryType.includes('SELECT D.OWNER_ID, DP.ROLE') && queryType.includes('FROM DOCUMENTS D')) {
    const [userId, docId] = params
    const doc = memoryDb.documents.find(d => d.id === docId)
    if (!doc) return { rows: [] }

    const perm = memoryDb.document_permissions.find(p => p.document_id === docId && p.user_id === userId)
    return {
      rows: [{
        owner_id: doc.owner_id,
        role: perm ? perm.role : null
      }]
    }
  }

  // 9. Update document
  if (queryType.startsWith('UPDATE DOCUMENTS')) {
    const docId = params[0]
    const doc = memoryDb.documents.find(d => d.id === docId)
    if (!doc) return { rows: [] }

    // Parse values dynamically
    // The query format is: UPDATE documents SET ... WHERE id = $1 RETURNING ...
    // Params: [docId, title, content] or [docId, title] or [docId, content] etc.
    let titleVal = undefined
    let contentVal = undefined

    // Determine positions
    if (text.includes('title = $2')) titleVal = params[1]
    if (text.includes('content = $2')) contentVal = params[1]
    if (text.includes('content = $3')) contentVal = params[2]

    if (titleVal !== undefined) doc.title = titleVal
    if (contentVal !== undefined) doc.content = contentVal
    doc.updated_at = new Date().toISOString()

    return { rows: [doc] }
  }

  // 10. Document lookup for sharing
  if (queryType.startsWith('SELECT OWNER_ID, TITLE FROM DOCUMENTS WHERE ID = $1')) {
    const docId = params[0]
    const doc = memoryDb.documents.find(d => d.id === docId)
    return { rows: doc ? [{ owner_id: doc.owner_id, title: doc.title }] : [] }
  }

  // 11. Find user by email for sharing
  if (queryType.startsWith('SELECT ID, EMAIL FROM USERS WHERE EMAIL = $1')) {
    const email = params[0]?.toLowerCase()
    const user = memoryDb.users.find(u => u.email === email)
    return { rows: user ? [{ id: user.id, email: user.email }] : [] }
  }

  // 12. Create / Update permission
  if (queryType.startsWith('INSERT INTO DOCUMENT_PERMISSIONS')) {
    const [docId, shareUserId, role] = params
    const existingIdx = memoryDb.document_permissions.findIndex(p => p.document_id === docId && p.user_id === shareUserId)
    
    if (existingIdx >= 0) {
      memoryDb.document_permissions[existingIdx].role = role
    } else {
      memoryDb.document_permissions.push({ document_id: docId, user_id: shareUserId, role })
    }
    return { rows: [] }
  }

  // 13. Create extension / tables (DDL runs on startup)
  if (queryType.startsWith('CREATE EXTENSION') || queryType.startsWith('CREATE TABLE')) {
    return { rows: [] }
  }

  console.warn('Unknown simulated query:', text, params)
  return { rows: [] }
}

export const query = async (text, params) => {
  if (useMemoryDb) {
    return runMemoryQuery(text, params)
  }

  try {
    return await pool.query(text, params)
  } catch (error) {
    // If it's a connection refused error, toggle memory DB
    if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED') || error.message.includes('Authentication failed')) {
      console.warn('PostgreSQL database not available. Toggling In-Memory Database Mode.')
      useMemoryDb = true
      return runMemoryQuery(text, params)
    }
    throw error
  }
}

export default pool
