import React, { useState } from 'react'
import { FilePlus, Share2, Users, FileText } from 'lucide-react'
import './DocumentList.css'

export default function DocumentList({
  documents = [],
  activeDocId = null,
  onSelectDoc,
  onCreateDoc,
  onShareDoc,
  currentUserEmail = ''
}) {
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [selectedShareDoc, setSelectedShareDoc] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('viewer') // 'editor', 'viewer'

  const openShare = (e, doc) => {
    e.stopPropagation()
    setSelectedShareDoc(doc)
    setIsShareOpen(true)
  }

  const closeShare = () => {
    setIsShareOpen(false)
    setSelectedShareDoc(null)
    setShareEmail('')
    setShareRole('viewer')
  }

  const handleShareSubmit = (e) => {
    e.preventDefault()
    if (onShareDoc && selectedShareDoc && shareEmail.trim()) {
      onShareDoc(selectedShareDoc.id, shareEmail.trim(), shareRole)
      closeShare()
    }
  }

  const handleCreateClick = () => {
    const title = prompt('Enter document title:')
    if (title && title.trim()) {
      onCreateDoc(title.trim())
    }
  }

  return (
    <div className="doc-list-container">
      <div className="doc-list-header">
        <h3 className="doc-list-title">My Documents</h3>
        <button className="btn-primary" onClick={handleCreateClick}>
          <FilePlus size={16} /> New
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="doc-list-empty">
          <FileText size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No documents found. Create one to get started!</p>
        </div>
      ) : (
        <div className="doc-grid">
          {documents.map((doc) => {
            const isActive = doc.id === activeDocId
            const isOwner = doc.owner_email === currentUserEmail || doc.role === 'owner'
            return (
              <div
                key={doc.id}
                className={`doc-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectDoc(doc)}
              >
                <div className="doc-info">
                  <span className="doc-title">{doc.title}</span>
                  <span className="doc-meta">
                    Created {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="doc-actions">
                  <span className={`role-badge ${doc.role || 'viewer'}`}>
                    {doc.role || 'viewer'}
                  </span>
                  {isOwner && (
                    <button
                      className="btn-secondary"
                      onClick={(e) => openShare(e, doc)}
                      title="Share document"
                      style={{ padding: '4px 8px' }}
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share Modal Dialog */}
      {isShareOpen && selectedShareDoc && (
        <div className="share-dialog">
          <div className="share-dialog-content">
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} /> Share "{selectedShareDoc.title}"
            </h3>
            <form onSubmit={handleShareSubmit}>
              <div className="share-form-group">
                <label htmlFor="shareEmail">User Email</label>
                <input
                  id="shareEmail"
                  type="email"
                  placeholder="collaborator@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                />
              </div>
              <div className="share-form-group">
                <label htmlFor="shareRole">Permission Role</label>
                <select
                  id="shareRole"
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                >
                  <option value="viewer">Viewer (Read Only)</option>
                  <option value="editor">Editor (Read & Write)</option>
                </select>
              </div>
              <div className="share-actions">
                <button type="button" className="btn-secondary" onClick={closeShare}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
