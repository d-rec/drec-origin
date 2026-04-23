---
order: 8
---

# Webhooks

Webhooks allow your platform to receive real-time notifications when chat events occur, eliminating the need to poll for new messages.

## How It Works

1. You register a webhook URL with the D-REC API
2. When a subscribed event occurs (e.g. new message), D-REC sends an HTTP POST to your URL
3. The payload is signed with HMAC-SHA256 so you can verify it came from D-REC
4. If delivery fails, D-REC retries up to 3 times with exponential backoff (1s, 4s, 16s)

## Events

| Event                  | Triggered when                            |
| ---------------------- | ----------------------------------------- |
| `message.new`          | A new message is added to a conversation  |
| `conversation.created` | A new conversation is started             |

## Managing Webhooks

### Create a Webhook

```http
POST /api/chat/webhooks
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://your-platform.com/drec-webhook",
  "events": ["message.new", "conversation.created"]
}
```

The `secret` field is optional — if omitted, a random 64-character hex secret is generated for you.

**Response:**

```json
{
  "id": 1,
  "userId": 42,
  "url": "https://your-platform.com/drec-webhook",
  "events": ["message.new", "conversation.created"],
  "secret": "a3f8b2c1d4e5...full secret shown only on creation",
  "active": true,
  "createdAt": "2026-04-01T12:00:00.000Z"
}
```

> **Important:** Copy the `secret` from the creation response. It is only shown in full once. Subsequent GET responses mask it to the last 4 characters.

### List Webhooks

```http
GET /api/chat/webhooks
```

Admin users see all webhooks. Other users see only their own.

### Update a Webhook

```http
PATCH /api/chat/webhooks/:id
Content-Type: application/json

{
  "url": "https://new-url.com/webhook",
  "events": ["message.new"],
  "active": false
}
```

All fields are optional.

### Delete a Webhook

```http
DELETE /api/chat/webhooks/:id
```

### Test a Webhook (Ping)

Send a test payload to verify your endpoint is reachable:

```http
POST /api/chat/webhooks/:id/test
```

This sends a `ping` event to your URL.

## Webhook Payload Format

### `message.new`

```json
{
  "conversationId": 1,
  "message": {
    "uuid": "abc123-...",
    "username": "admin@drecs.org",
    "chatEntry": "Your device has been approved.",
    "createdAt": "2026-04-01T12:05:00.000Z"
  },
  "deviceProjectName": "Powertrust Site Alpha"
}
```

### `conversation.created`

```json
{
  "conversation": {
    "id": 5,
    "participant1": "admin@drecs.org",
    "participant2": "admin@powertrust.com",
    "deviceProjectName": "Powertrust Site Alpha"
  },
  "message": {
    "uuid": "abc123-...",
    "username": "admin@drecs.org",
    "chatEntry": "Welcome! This conversation is for Site Alpha."
  }
}
```

### `ping`

```json
{
  "event": "ping",
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

## Verifying Webhook Signatures

Every webhook delivery includes two headers:

| Header                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `X-Webhook-Signature`  | HMAC-SHA256 hex digest of the request body     |
| `X-Webhook-Event`      | Event name (e.g. `message.new`)                |

To verify the payload is authentic:

### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

// In your Express handler:
app.post('/drec-webhook', (req, res) => {
  const raw = JSON.stringify(req.body);
  const sig = req.headers['x-webhook-signature'];

  if (!verifyWebhook(raw, sig, YOUR_WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-webhook-event'];
  console.log(`Received ${event}:`, req.body);

  res.status(200).send('OK');
});
```

### Python Example

```python
import hmac
import hashlib

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

## Retry Behavior

| Attempt | Delay before retry |
| ------- | ------------------ |
| 1       | Immediate          |
| 2       | 1 second           |
| 3       | 4 seconds          |

After 3 failed attempts, the delivery is abandoned and logged. The webhook remains active — subsequent events will still be delivered.

## Admin UI

Administrators can manage webhooks for all users from the D-REC admin panel under **Chat Webhooks** in the sidebar. From there you can:

- View all registered webhooks
- Enable/disable webhooks with a toggle
- Send test pings
- Edit or delete webhook configurations
