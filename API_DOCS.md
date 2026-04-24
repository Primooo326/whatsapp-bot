# WhatsApp Bot API Documentation

Base URL: `http://localhost:3000` (or your configured port)

## Endpoints

### 1. Send Message
Sends text, multimedia, or files to one or multiple recipients (phone numbers or groups).

- **URL:** `/send`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | `string[]` | Yes | Array of phone numbers (e.g., `"573001234567"`) or Group IDs (e.g., `"120363@g.us"`). |
| `message` | `string` | No* | Text message to send. (*Required if no multimedia/file). |
| `multimedia` | `string[]` | No | Array of URLs for images/videos. |
| `archivo` | `string[]` | No | Array of URLs for documents (PDF, etc). |
| `tags` | `string[]` | No | Array of strings to tag/classify this message for metrics. |
| `envioMultimediaJunto` | `boolean` | No | If `true`, sends the `message` as a caption for the *first* multimedia item. Default: `false`. |

**Example:**
```json
{
  "to": ["573046282936", "120363423058577571@g.us"],
  "message": "Hola, mira este reporte",
  "multimedia": ["https://example.com/image.jpg"],
  "tags": ["reporte", "mensual"],
  "envioMultimediaJunto": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensajes enviados: 2, fallidos: 0",
  "data": {
    "success": ["573046282936", "120363423058577571@g.us"],
    "failed": []
  }
}
```

---

### 2. Send to Group (Specific)
Sends a message to a specific group ID. *(Note: `/send` can also handle groups).*

- **URL:** `/send-group`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `groupId` | `string` | Yes | The Group ID specific string (e.g., `"120363@g.us"`). |
| `message` | `string` | No* | Text message. |
| `multimedia` | `string[]` | No | Array of multimedia URLs. |
| `archivo` | `string[]` | No | Array of document URLs. |
| `tags` | `string[]` | No | Tags for metrics. |
| `envioMultimediaJunto` | `boolean` | No | Attach message as caption to first media. |

**Example:**
```json
{
  "groupId": "120363423058577571@g.us",
  "message": "Aviso importante",
  "envioMultimediaJunto": false
}
```

---

### 3. Get Groups
Retrieves a list of all groups the bot is part of.

- **URL:** `/groups`
- **Method:** `GET`

**Response:**
```json
{
  "success": true,
  "message": "Se encontraron 5 grupos",
  "data": [
    {
      "id": "120363423058577571@g.us",
      "name": "Dev Team",
      "participants": ["573001234567", "573109876543"]
    }
  ]
}
```

---

### 4. Get Metrics
Returns usage statistics, including top recipients, groups, and daily counts.

- **URL:** `/metrics`
- **Method:** `GET`

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "messagesSent": 150,
      "messagesFailed": 2,
      ...
    },
    "avgResponseTimeMs": 1205.5,
    "topRecipients": {
      "sent": [{ "recipient": "573001234567", "count": 12 }],
      "failed": []
    },
    "topGroups": {
      "sent": [{ "groupId": "1203@g.us", "groupName": "Dev Team", "count": 50 }],
      "failed": []
    }
  }
}
```

---

### 5. Other Endpoints

- **GET /health**: Check if bot API is running and WhatsApp client status.
- **GET /qr**: Retrieve the QR code for authentication (if not authenticated).
