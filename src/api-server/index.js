import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.js'
import documentsRouter from './routes/documents.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API server is running', timestamp: new Date() })
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/documents', documentsRouter)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong on the server' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Express API server is listening on port ${PORT}`)
})
