import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Terminal,
  Undo,
  Redo,
  Save,
  Lock,
  Edit2
} from 'lucide-react'
import './Editor.css'

// Helper to generate deterministic colors based on username
function getRandomColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#f87171', // Red
    '#fb923c', // Orange
    '#fbbf24', // Amber
    '#34d399', // Emerald
    '#22d3ee', // Cyan
    '#60a5fa', // Blue
    '#818cf8', // Indigo
    '#c084fc', // Purple
    '#f472b6'  // Pink
  ]
  return colors[Math.abs(hash) % colors.length]
}

// 1. Parent Wrapper: Handles Yjs Doc & WebSocket Provider Lifecycle
export default function Editor({
  documentId,
  role = 'owner',
  initialContent = '',
  user = null,
  onSave,
  isSaving = false,
  onAwarenessUpdate // callback: (usersList) => void
}) {
  const [ydoc, setYdoc] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isSynced, setIsSynced] = useState(false)

  useEffect(() => {
    if (!documentId) return

    setIsSynced(false)
    const y = new Y.Doc()
    
    // Connect to Yjs Sync Server (port 6000)
    const wsUrl = 'ws://localhost:6000'
    const p = new WebsocketProvider(wsUrl, documentId, y)

    // Set local user awareness state
    const userName = user?.name || user?.email || 'Collaborator'
    const userColor = getRandomColor(userName)
    
    p.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor
    })

    // Listen to changes in active users (awareness)
    const handleAwarenessChange = () => {
      const states = Array.from(p.awareness.getStates().values())
      const activeUsers = states
        .map((s) => s.user)
        .filter(Boolean)
        .map((u, index) => ({ id: index, ...u }))
      
      if (onAwarenessUpdate) {
        onAwarenessUpdate(activeUsers)
      }
    }

    p.awareness.on('change', handleAwarenessChange)
    
    // Check if synced
    p.on('sync', (isSynced) => {
      setIsSynced(isSynced)
    })

    setYdoc(y)
    setProvider(p)

    // Cleanup
    return () => {
      p.awareness.off('change', handleAwarenessChange)
      p.destroy()
      y.destroy()
      if (onAwarenessUpdate) {
        onAwarenessUpdate([])
      }
    }
  }, [documentId, user])

  if (!provider || !ydoc || !isSynced) {
    return (
      <div className="editor-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
        <div className="counter">Connecting to real-time document sync...</div>
      </div>
    )
  }

  return (
    <CollaborativeEditor
      ydoc={ydoc}
      provider={provider}
      role={role}
      initialContent={initialContent}
      onSave={onSave}
      isSaving={isSaving}
    />
  )
}

// 2. Child Component: Instantiates TipTap Editor with Yjs Extensions
function CollaborativeEditor({ ydoc, provider, role, initialContent, onSave, isSaving }) {
  const isReadOnly = role === 'viewer'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history because Collaboration handles history states
        history: false
      }),
      Collaboration.configure({
        document: ydoc
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: provider.awareness.getLocalState()?.user || { name: 'Collaborator', color: '#aa3bff' }
      })
    ],
    editable: !isReadOnly,
    onUpdate: () => {
      setHasUnsavedChanges(true)
    }
  }, [ydoc, provider])

  // Load database content if Yjs doc is empty
  useEffect(() => {
    if (editor && initialContent) {
      // Check if Yjs document is empty (meaning first user opening it)
      const textContent = editor.getText().trim()
      if (textContent === '') {
        editor.commands.setContent(initialContent)
        setHasUnsavedChanges(false)
      }
    }
  }, [editor, initialContent])

  // Update read-only state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly)
    }
  }, [editor, isReadOnly])

  if (!editor) return null

  const textContent = editor.getText()
  const charCount = textContent.length
  const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length

  const handleSaveClick = () => {
    if (onSave) {
      onSave(editor.getHTML())
      setHasUnsavedChanges(false)
    }
  }

  return (
    <div className="editor-container">
      {/* Editor Header / Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="Bold"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="Italic"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('code') ? 'is-active' : ''}`}
            title="Inline Code"
          >
            <Code size={18} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="Bullet List"
          >
            <List size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="Blockquote"
          >
            <Quote size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={isReadOnly}
            className={`toolbar-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
            title="Code Block"
          >
            <Terminal size={18} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={isReadOnly || !editor.can().undo()}
            className="toolbar-btn"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={isReadOnly || !editor.can().redo()}
            className="toolbar-btn"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isReadOnly ? (
            <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text)' }}>
              <Lock size={14} /> Read-only (Viewer)
            </span>
          ) : (
            <>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text)' }}>
                <Edit2 size={14} /> Editing as {role}
              </span>
              <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className={`toolbar-btn ${hasUnsavedChanges ? 'is-active' : ''}`}
                title="Save changes"
              >
                <Save size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="editor-workspace">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="editor-statusbar">
        <div className="statusbar-info">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div className="statusbar-status">
          <span className={`status-dot ${isSaving ? 'saving' : hasUnsavedChanges ? 'offline' : ''}`} />
          <span>
            {isReadOnly
              ? 'Viewing document'
              : isSaving
              ? 'Saving updates...'
              : hasUnsavedChanges
              ? 'Unsaved changes'
              : 'Synced & saved'}
          </span>
        </div>
      </div>
    </div>
  )
}
