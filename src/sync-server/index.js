import http from 'http'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 6000

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('InkScribe Yjs Sync Server is running.')
})

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws, req) => {
  // y-websocket setupWSConnection automatically resolves docName from req.url
  setupWSConnection(ws, req)
})

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

server.listen(PORT, () => {
  console.log(`InkScribe Yjs Sync Server is listening on port ${PORT}`)
})
