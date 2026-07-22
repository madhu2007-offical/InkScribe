import jwt from 'jsonwebtoken'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.id,
      email: decoded.email
    }
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired access token' })
  }
}
