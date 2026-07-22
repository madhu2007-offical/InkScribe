import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
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

export default function Editor({
  documentId,
  title,
  role = 'owner', // 'owner', 'editor', 'viewer'
  initialContent = '',
  onSave,
  isSaving = false,
  hasUnsavedChanges = false
}) {
  const isReadOnly = role === 'viewer'

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      // Trigger a change handler or local state tracking if needed
    }
  })

  // Update content if initialContent changes (e.g. switching documents)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHTML = editor.getHTML()
      // Avoid resetting cursor if the content is the same
      if (initialContent !== currentHTML) {
        editor.commands.setContent(initialContent)
      }
    }
  }, [editor, initialContent])

  // Update editable state if role changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly)
    }
  }, [editor, isReadOnly])

  if (!editor) {
    return (
      <div className="editor-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="counter">Loading Editor Workspace...</div>
      </div>
    )
  }

  // Calculate statistics
  const textContent = editor.getText()
  const charCount = textContent.length
  const wordCount = textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length

  const handleSaveClick = () => {
    if (onSave) {
      onSave(editor.getHTML())
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

        {/* Save button for REST API manual triggers */}
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
              : 'All changes saved'}
          </span>
        </div>
      </div>
    </div>
  )
}
