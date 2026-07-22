import React from 'react'
import './Presence.css'

export default function Presence({ users = [] }) {
  if (users.length === 0) return null

  // Get initials for avatar display
  const getInitials = (name = '') => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="presence-container">
      <div className="presence-list">
        {users.map((user) => {
          const initials = getInitials(user.name || user.email)
          const bgColor = user.color || '#aa3bff'
          return (
            <div
              key={user.id}
              className="presence-avatar"
              style={{ backgroundColor: bgColor }}
              title={`${user.name || user.email} is active`}
            >
              {initials}
            </div>
          )
        })}
      </div>
      <span className="presence-label">
        {users.length} user{users.length > 1 ? 's' : ''} online
      </span>
    </div>
  )
}
