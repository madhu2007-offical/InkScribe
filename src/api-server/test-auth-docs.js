const API_BASE = 'http://localhost:5000'

async function runTests() {
  console.log('Starting API Server End-to-End Verification Tests...')
  
  let tokenA, tokenB;
  let userA, userB;
  let docId;

  try {
    // 1. Signup User A
    console.log('\n--- Test 1: Signup User A ---')
    const signupARes = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'usera@example.com',
        password: 'password123',
        name: 'User A'
      })
    })
    const signupAData = await signupARes.json()
    if (signupARes.status !== 201) throw new Error(`Signup A failed: ${signupAData.error}`)
    tokenA = signupAData.token
    userA = signupAData.user
    console.log('User A signed up successfully!')

    // 2. Signup User B
    console.log('\n--- Test 2: Signup User B ---')
    const signupBRes = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'userb@example.com',
        password: 'password456',
        name: 'User B'
      })
    })
    const signupBData = await signupBRes.json()
    if (signupBRes.status !== 201) throw new Error(`Signup B failed: ${signupBData.error}`)
    tokenB = signupBData.token
    userB = signupBData.user
    console.log('User B signed up successfully!')

    // 3. Create Document as User A
    console.log('\n--- Test 3: Create Document as User A ---')
    const createDocRes = await fetch(`${API_BASE}/api/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        title: 'User A Secret Document',
        content: '<p>Initial content by User A</p>'
      })
    })
    const createDocData = await createDocRes.json()
    if (createDocRes.status !== 201) throw new Error(`Create Doc failed: ${createDocData.error}`)
    docId = createDocData.document.id
    console.log(`Document created with ID: ${docId}`)

    // 4. Verify User B cannot access User A's document
    console.log('\n--- Test 4: Verify User B Access Restriction ---')
    const fetchDocBRes = await fetch(`${API_BASE}/api/documents/${docId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    if (fetchDocBRes.status === 404 || fetchDocBRes.status === 403) {
      console.log('User B access correctly blocked (404/403: Not Found or Denied)!')
    } else {
      throw new Error(`Security breach: User B accessed private document with status ${fetchDocBRes.status}`)
    }

    // 5. Share document with User B as 'viewer'
    console.log('\n--- Test 5: Share Document with User B as Viewer ---')
    const shareRes = await fetch(`${API_BASE}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        email: 'userb@example.com',
        role: 'viewer'
      })
    })
    const shareData = await shareRes.json()
    if (shareRes.status !== 200) throw new Error(`Sharing failed: ${shareData.error}`)
    console.log('Document shared successfully with User B!')

    // 6. Verify User B can now fetch the document (read-only)
    console.log('\n--- Test 6: Verify User B Can Read Shared Document ---')
    const fetchDocBSharedRes = await fetch(`${API_BASE}/api/documents/${docId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    const fetchDocBSharedData = await fetchDocBSharedRes.json()
    if (fetchDocBSharedRes.status !== 200) throw new Error(`Fetch failed: ${fetchDocBSharedData.error}`)
    if (fetchDocBSharedData.document.role !== 'viewer') {
      throw new Error(`Incorrect role returned: Expected viewer, got ${fetchDocBSharedData.document.role}`)
    }
    console.log('User B fetched shared document successfully and verified as Viewer!')

    // 7. Verify User B cannot update document contents
    console.log('\n--- Test 7: Verify User B Cannot Edit Document as Viewer ---')
    const updateDocBRes = await fetch(`${API_BASE}/api/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ content: '<p>Malicious edit by User B</p>' })
    })
    const updateDocBData = await updateDocBRes.json()
    if (updateDocBRes.status === 403) {
      console.log('User B edit correctly blocked with 403 Forbidden!')
    } else {
      throw new Error(`Security breach: Viewer was allowed to edit document with status ${updateDocBRes.status}`)
    }

    // 8. Update User B to 'editor'
    console.log('\n--- Test 8: Update User B Role to Editor ---')
    const shareEditorRes = await fetch(`${API_BASE}/api/documents/${docId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        email: 'userb@example.com',
        role: 'editor'
      })
    })
    const shareEditorData = await shareEditorRes.json()
    if (shareEditorRes.status !== 200) throw new Error(`Role update failed: ${shareEditorData.error}`)
    console.log('User B permission successfully upgraded to Editor!')

    // 9. Verify User B can now edit the document
    console.log('\n--- Test 9: Verify User B Can Edit Document as Editor ---')
    const updateDocBEditorRes = await fetch(`${API_BASE}/api/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ content: '<p>Collaborative edit by User B</p>' })
    })
    const updateDocBEditorData = await updateDocBEditorRes.json()
    if (updateDocBEditorRes.status !== 200) throw new Error(`Editor update failed: ${updateDocBEditorData.error}`)
    console.log('User B successfully updated document contents as Editor!')

    console.log('\n======================================')
    console.log('🎉 ALL SECURITY & ACCESS TESTS PASSED! 🎉')
    console.log('======================================\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error)
    process.exit(1)
  }
}

runTests()
