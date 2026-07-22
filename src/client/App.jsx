import React, { useState, useEffect } from 'react'
import { LogOut, PenTool, Edit3 } from 'lucide-react'
import LoginSignup from './components/LoginSignup.jsx'
import DocumentList from './components/DocumentList.jsx'
import Editor from './components/Editor.jsx'
import Presence from './components/Presence.jsx'
import './App.css'

const API_BASE_URL = 'http://localhost:5000'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('inkscribe_token') || null)
  const [user, setUser] = useState(null)
  const [documents, setDocuments] = useState([])
  const [activeDoc, setActiveDoc] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeUsers, setActiveUsers] = useState([])

  // 1. Verify token and load user profile on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setIsAuthLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Token verification failed')
        }

        setUser(data.user)
        fetchDocuments(token)
      } catch (err) {
        console.error('Auth check error:', err)
        handleLogout()
      } finally {
        setIsAuthLoading(false)
      }
    }

    initAuth()
  }, [token])

  // 2. Fetch all documents for user
  const fetchDocuments = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      const data = await response.json()
      if (response.ok) {
        setDocuments(data.documents)
      }
    } catch (err) {
      console.error('Fetch documents error:', err)
    }
  }

  const handleAuthSuccess = (userData, authToken) => {
    setToken(authToken)
    setUser(userData)
    fetchDocuments(authToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('inkscribe_token')
    setToken(null)
    setUser(null)
    setDocuments([])
    setActiveDoc(null)
  }

  // 3. Select and fetch a specific document
  const handleSelectDoc = async (doc) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setActiveDoc(data.document)
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      console.error('Load document error:', err)
    }
  }

  // 4. Create a document
  const handleCreateDoc = async (title) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, content: '' })
      })

      const data = await response.json()

      if (response.ok) {
        setDocuments([data.document, ...documents])
        setActiveDoc(data.document)
        setHasUnsavedChanges(false)
      } else {
        alert(data.error || 'Failed to create document')
      }
    } catch (err) {
      console.error('Create document error:', err)
    }
  }

  // 5. Update/Save document content
  const handleSaveDoc = async (htmlContent) => {
    if (!activeDoc) return
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${activeDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: htmlContent })
      })

      const data = await response.json()

      if (response.ok) {
        // Update documents list
        setDocuments(
          documents.map((d) => (d.id === activeDoc.id ? { ...d, title: data.document.title } : d))
        )
        setActiveDoc({ ...activeDoc, content: data.document.content })
        setHasUnsavedChanges(false)
      } else {
        alert(data.error || 'Failed to save document')
      }
    } catch (err) {
      console.error('Save document error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // 6. Share document with collaborator
  const handleShareDoc = async (docId, email, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${docId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()
      alert(data.message || data.error)
    } catch (err) {
      console.error('Share document error:', err)
    }
  }

  // 7. Handle workspace title change
  const handleTitleChange = async (newTitle) => {
    if (!activeDoc || !newTitle.trim() || newTitle === activeDoc.title) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${activeDoc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setDocuments(
          documents.map((d) => (d.id === activeDoc.id ? { ...d, title: data.document.title } : d))
        )
        setActiveDoc({ ...activeDoc, title: data.document.title })
      }
    } catch (err) {
      console.error('Update title error:', err)
    }
  }

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)' }}>
        <div className="counter">Verifying User Credentials...</div>
      </div>
    )
  }

  if (!token || !user) {
    return <LoginSignup onAuthSuccess={handleAuthSuccess} apiBaseUrl={API_BASE_URL} />
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar Panel */}
      <div className="app-sidebar">
        <div className="sidebar-brand">
          <PenTool size={24} style={{ color: 'var(--accent)' }} />
          <span>InkScribe</span>
        </div>

        {/* User Card */}
        <div className="sidebar-user">
          <div className="user-details">
            <span className="user-name">{user.name || 'Collaborator'}</span>
            <span className="user-email">{user.email}</span>
          </div>
          <button
            className="btn-secondary"
            onClick={handleLogout}
            title="Log out"
            style={{ padding: '6px' }}
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="sidebar-content">
          <DocumentList
            documents={documents}
            activeDocId={activeDoc?.id}
            onSelectDoc={handleSelectDoc}
            onCreateDoc={handleCreateDoc}
            onShareDoc={handleShareDoc}
            currentUserEmail={user.email}
          />
        </div>
      </div>

      {/* Main Workspace Panel */}
      <div className="app-workspace">
        {activeDoc ? (
          <>
            <div className="workspace-header">
              <input
                className="workspace-title-input"
                value={activeDoc.title}
                onChange={(e) => setActiveDoc({ ...activeDoc, title: e.target.value })}
                onBlur={(e) => handleTitleChange(e.target.value)}
                disabled={activeDoc.role === 'viewer'}
                title={activeDoc.role === 'viewer' ? 'Title editing disabled' : 'Click to edit title'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Presence users={activeUsers} />
              </div>
            </div>

            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              <Editor
                documentId={activeDoc.id}
                title={activeDoc.title}
                role={activeDoc.role}
                initialContent={activeDoc.content}
                user={user}
                onSave={handleSaveDoc}
                isSaving={isSaving}
                onAwarenessUpdate={setActiveUsers}
              />
            </div>
          </>
        ) : (
          <div className="workspace-welcome">
            <div className="welcome-logo">InkScribe</div>
            <p className="welcome-subtitle">
              Welcome to your real-time collaborative workspace. Create a new document or select one
              from the list to begin editing.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
