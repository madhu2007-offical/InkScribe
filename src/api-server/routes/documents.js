import express from 'express'
import { query } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all document routes
router.use(authMiddleware)

// 1. List all documents (owned or shared)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await query(
      `SELECT d.id, d.title, d.created_at, d.updated_at, u.email as owner_email,
              CASE 
                WHEN d.owner_id = $1 THEN 'owner'
                ELSE dp.role
              END as role
       FROM documents d
       JOIN users u ON d.owner_id = u.id
       LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
       WHERE d.owner_id = $1 OR dp.user_id = $1
       ORDER BY d.updated_at DESC`,
      [userId]
    )
    res.json({ documents: result.rows })
  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({ error: 'Server error while listing documents' })
  }
})

// 2. Create a new document
router.post('/', async (req, res) => {
  const { title, content } = req.body
  const userId = req.user.id

  if (!title) {
    return res.status(400).json({ error: 'Document title is required' })
  }

  try {
    const result = await query(
      'INSERT INTO documents (title, content, owner_id) VALUES ($1, $2, $3) RETURNING id, title, content, owner_id, created_at, updated_at',
      [title, content || '', userId]
    )
    res.status(201).json({
      message: 'Document created successfully',
      document: {
        ...result.rows[0],
        role: 'owner'
      }
    })
  } catch (error) {
    console.error('Create document error:', error)
    res.status(500).json({ error: 'Server error while creating document' })
  }
})

// 3. Get single document
router.get('/:id', async (req, res) => {
  const docId = req.params.id
  const userId = req.user.id

  try {
    const result = await query(
      `SELECT d.id, d.title, d.content, d.owner_id, d.created_at, d.updated_at, u.email as owner_email,
              CASE 
                WHEN d.owner_id = $1 THEN 'owner'
                ELSE dp.role
              END as role
       FROM documents d
       JOIN users u ON d.owner_id = u.id
       LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
       WHERE d.id = $2 AND (d.owner_id = $1 OR dp.user_id = $1)`,
      [userId, docId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' })
    }

    res.json({ document: result.rows[0] })
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({ error: 'Server error while fetching document' })
  }
})

// 4. Update document
router.put('/:id', async (req, res) => {
  const docId = req.params.id
  const userId = req.user.id
  const { title, content } = req.body

  try {
    // Check permission: Must be owner or editor
    const checkPerm = await query(
      `SELECT d.owner_id, dp.role
       FROM documents d
       LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $1
       WHERE d.id = $2`,
      [userId, docId]
    )

    if (checkPerm.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' })
    }

    const { owner_id, role } = checkPerm.rows[0]
    const isOwner = owner_id === userId
    const isEditor = role === 'editor'

    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: 'Permission denied: Read-only access' })
    }

    // Build update query dynamically based on what was provided
    let updateFields = []
    let values = [docId]
    let paramIndex = 2

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`)
      values.push(title)
    }

    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`)
      values.push(content)
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    const updateQuery = `
      UPDATE documents 
      SET ${updateFields.join(', ')} 
      WHERE id = $1 
      RETURNING id, title, content, owner_id, updated_at
    `
    const result = await query(updateQuery, values)

    res.json({
      message: 'Document updated successfully',
      document: {
        ...result.rows[0],
        role: isOwner ? 'owner' : 'editor'
      }
    })
  } catch (error) {
    console.error('Update document error:', error)
    res.status(500).json({ error: 'Server error while updating document' })
  }
})

// 5. Share document
router.post('/:id/share', async (req, res) => {
  const docId = req.params.id
  const userId = req.user.id
  const { email, role } = req.body // role must be 'editor' or 'viewer'

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role ("editor" or "viewer") are required' })
  }

  if (role !== 'editor' && role !== 'viewer') {
    return res.status(400).json({ error: 'Invalid role. Must be "editor" or "viewer"' })
  }

  try {
    // Only owner can share the document
    const docResult = await query('SELECT owner_id, title FROM documents WHERE id = $1', [docId])
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' })
    }

    if (docResult.rows[0].owner_id !== userId) {
      return res.status(403).json({ error: 'Only the document owner can share it' })
    }

    // Find the user to share with
    const shareUserResult = await query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()])
    if (shareUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User to share with not found. They must signup first' })
    }

    const shareUserId = shareUserResult.rows[0].id

    if (shareUserId === userId) {
      return res.status(400).json({ error: 'You cannot share a document with yourself' })
    }

    // Insert or update permission
    await query(
      `INSERT INTO document_permissions (document_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id, user_id)
       DO UPDATE SET role = EXCLUDED.role`,
      [docId, shareUserId, role]
    )

    res.json({
      message: `Document "${docResult.rows[0].title}" shared successfully with ${email} as ${role}`
    })
  } catch (error) {
    console.error('Share document error:', error)
    res.status(500).json({ error: 'Server error while sharing document' })
  }
})

export default router
