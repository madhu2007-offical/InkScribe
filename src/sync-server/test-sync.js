import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import ws from 'ws'

const wsUrl = 'ws://localhost:6000'
const roomName = 'test-sync-room-' + Math.random().toString(36).substring(7)

async function testSync() {
  console.log(`Starting WebSocket sync server verification in room: ${roomName}...`)

  const doc1 = new Y.Doc()
  const doc2 = new Y.Doc()

  // Connect Client 1
  console.log('Connecting Client 1...')
  const provider1 = new WebsocketProvider(wsUrl, roomName, doc1, { WebSocketPolyfill: ws })

  // Connect Client 2
  console.log('Connecting Client 2...')
  const provider2 = new WebsocketProvider(wsUrl, roomName, doc2, { WebSocketPolyfill: ws })

  // Wait for both clients to connect and sync
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return new Promise((resolve, reject) => {
    // Listen for changes on doc2
    doc2.on('update', () => {
      const text2 = doc2.getText('content').toString()
      console.log(`Client 2 received update. Content: "${text2}"`)
      if (text2 === 'Hello from Client 1!') {
        console.log('\n======================================')
        console.log('🎉 REAL-TIME WEBSOCKET SYNC SUCCESSFUL! 🎉')
        console.log('======================================\n')
        
        // Clean up connections
        provider1.destroy()
        provider2.destroy()
        doc1.destroy()
        doc2.destroy()
        resolve()
      }
    })

    // Modify doc1
    console.log('Client 1 inserting text...')
    doc1.getText('content').insert(0, 'Hello from Client 1!')
    
    // Set a timeout to fail if not sync in 5 seconds
    setTimeout(() => {
      provider1.destroy()
      provider2.destroy()
      doc1.destroy()
      doc2.destroy()
      reject(new Error('Sync timeout: updates were not received by Client 2 in time.'))
    }, 5000)
  })
}

testSync().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Sync verification failed:', err)
  process.exit(1)
})
