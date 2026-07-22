import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email])
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert user
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email.toLowerCase(), passwordHash, name || null]
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Server error during signup' })
  }
})

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error during login' })
  }
})

// Get current user route
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Server error while fetching profile' })
  }
})

export default router
