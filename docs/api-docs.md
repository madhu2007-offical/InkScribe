# InkScribe API & Connection Documentation

This document describes the REST API endpoints and WebSocket sync server interfaces for the InkScribe collaborative editor.

---

## 1. Authentication Endpoints

### Signup User
Creates a new account and returns a signed JWT access token.
- **URL**: `/api/auth/signup`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "collaborator@example.com",
    "password": "secure_password",
    "name": "Jane Doe"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "a0e1530f-...",
      "email": "collaborator@example.com",
      "name": "Jane Doe"
    }
  }
  ```

### Login User
Validates password credentials and returns a signed JWT access token.
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "collaborator@example.com",
    "password": "secure_password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged in successfully",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "a0e1530f-...",
      "email": "collaborator@example.com",
      "name": "Jane Doe"
    }
  }
  ```

### Fetch Current User Profile
Retrieves details of the currently logged-in user.
- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "a0e1530f-...",
      "email": "collaborator@example.com",
      "name": "Jane Doe",
      "created_at": "2026-07-22T10:00:00.000Z"
    }
  }
  ```

---

## 2. Document REST Endpoints

All document endpoints are protected and require the `Authorization: Bearer <token>` header.

### List Documents
Returns all documents owned by or shared with the authenticated user.
- **URL**: `/api/documents`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "documents": [
      {
        "id": "3df5dee7-...",
        "title": "Weekly Planning",
        "created_at": "2026-07-22T12:00:00.000Z",
        "updated_at": "2026-07-22T12:15:00.000Z",
        "owner_email": "owner@example.com",
        "role": "owner"
      }
    ]
  }
  ```

### Create Document
Creates a new blank document with the authenticated user as the owner.
- **URL**: `/api/documents`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "title": "Meeting Notes",
    "content": ""
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Document created successfully",
    "document": {
      "id": "4ffe-479a-...",
      "title": "Meeting Notes",
      "content": "",
      "owner_id": "a0e1530f-...",
      "role": "owner"
    }
  }
  ```

### Get Single Document
Fetches the content and metadata of a specific document.
- **URL**: `/api/documents/:id`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "document": {
      "id": "4ffe-479a-...",
      "title": "Meeting Notes",
      "content": "<p>Meeting has started.</p>",
      "owner_id": "a0e1530f-...",
      "owner_email": "owner@example.com",
      "role": "editor"
    }
  }
  ```

### Update Document
Updates document title and/or static HTML body contents. Requires `owner` or `editor` permission roles.
- **URL**: `/api/documents/:id`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "title": "Updated Meeting Notes",
    "content": "<p>Meeting is concluded.</p>"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Document updated successfully",
    "document": {
      "id": "4ffe-479a-...",
      "title": "Updated Meeting Notes",
      "content": "<p>Meeting is concluded.</p>"
    }
  }
  ```

### Share Document
Grants access to another user by email. Only the document `owner` can share.
- **URL**: `/api/documents/:id/share`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "collaborator@example.com",
    "role": "editor" // must be 'editor' or 'viewer'
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Document \"Meeting Notes\" shared successfully with collaborator@example.com as editor"
  }
  ```

---

## 3. WebSocket Sync Server

Real-time conflict-free document synchronization and presence.

- **URL Protocol**: `ws://localhost:6000/:documentId`
- **Port**: `6000` (Default)
- **Protocol Payload**: Binary buffers using Yjs sync-protocol v1.

### Awareness (Presence) Object Format
The awareness state is synchronized via WebSocket to handle cursors, hover tags, and active client listings.
```json
{
  "user": {
    "name": "Jane Doe",
    "color": "#60a5fa" // Hex color code for cursor rendering
  }
}
```
If a client updates their cursor location in the text area, the corresponding ProseMirror offset range is broadcasted to all connected peers in the room.
