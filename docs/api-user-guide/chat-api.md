---
order: 7
---

# Chat API

The Chat API allows external platforms (e.g. Powertrust) to exchange messages with D-REC administrators directly from their own systems. All chat endpoints accept both **JWT** (browser sessions) and **OAuth2 client credentials** (API user tokens).

## Authentication

Include your API user Bearer token in every request:

```http
Authorization: Bearer <your-api-token>
```

## Endpoints

### List Conversations

```http
GET /api/chat/conversations/user/:email
```

Returns all conversations the user participates in.

**Response:**

```json
[
  {
    "id": 1,
    "participant1": "admin@drecs.org",
    "participant2": "admin@powertrust.com",
    "headUuid": "a1b2c3d4-...",
    "lastEntryUuid": "e5f6a7b8-...",
    "deviceProjectName": "Powertrust Site Alpha"
  }
]
```

### Find Conversation

```http
POST /api/chat/conversations/find
Content-Type: application/json

{
  "participant1": "admin@powertrust.com",
  "participant2": "admin@drecs.org",
  "deviceProjectName": "Powertrust Site Alpha"
}
```

All fields are optional. Use `deviceProjectName` to find the conversation for a specific device/site.

### Start a Conversation

```http
POST /api/chat/conversations/start
Content-Type: application/json

{
  "participant1": "admin@powertrust.com",
  "participant2": "admin@drecs.org",
  "username": "admin@powertrust.com",
  "chatEntry": "Hello, we have a question about Site Alpha.",
  "deviceProjectName": "Powertrust Site Alpha"
}
```

**Response:**

```json
{
  "conversation": {
    "id": 5,
    "participant1": "admin@powertrust.com",
    "participant2": "admin@drecs.org",
    "headUuid": "abc123...",
    "lastEntryUuid": "abc123...",
    "deviceProjectName": "Powertrust Site Alpha"
  },
  "message": {
    "uuid": "abc123...",
    "username": "admin@powertrust.com",
    "chatEntry": "Hello, we have a question about Site Alpha.",
    "createdAt": "2026-04-01T12:00:00.000Z"
  }
}
```

### Send a Message

```http
POST /api/chat/conversations/:id/messages
Content-Type: application/json

{
  "username": "admin@powertrust.com",
  "chatEntry": "Can you confirm the panel count?"
}
```

### Get Message History

Retrieve all messages in a conversation chain:

```http
GET /api/chat/chain/:headUuid
```

**Response:**

```json
[
  {
    "uuid": "abc123...",
    "username": "admin@powertrust.com",
    "chatEntry": "Hello, we have a question.",
    "nextEntryUuid": "def456...",
    "createdAt": "2026-04-01T12:00:00.000Z"
  },
  {
    "uuid": "def456...",
    "username": "admin@drecs.org",
    "chatEntry": "Sure, how can I help?",
    "nextEntryUuid": null,
    "createdAt": "2026-04-01T12:05:00.000Z"
  }
]
```

### Unread Count

```http
GET /api/chat/unread-count/:email
```

**Response:**

```json
{ "count": 3 }
```

### Unread Device Names

```http
GET /api/chat/unread-devices/:email
```

**Response:**

```json
["Powertrust Site Alpha", "Powertrust Site Beta"]
```

### Mark Conversation as Read

```http
PATCH /api/chat/conversations/:id/read
Content-Type: application/json

{ "email": "admin@powertrust.com" }
```

## Typical Integration Flow

1. **Find or start** a conversation for a device using `POST /conversations/find` or `POST /conversations/start`
2. **Send messages** via `POST /conversations/:id/messages`
3. **Poll for new messages** via `GET /chain/:headUuid` or use [webhooks](webhooks.md) for real-time notifications
4. **Check unread count** via `GET /unread-count/:email` to show badge indicators

## Rate Limits

There are currently no rate limits on the chat API. Please be considerate with polling frequency — we recommend no more than once every 30 seconds for unread counts.
