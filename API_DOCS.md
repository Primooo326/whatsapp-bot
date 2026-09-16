# WhatsApp Bot API Documentation

Base URL: `http://localhost:3100` (or your configured port)

---

## Table of Contents

1. [Health & Status](#1-health--status)
2. [Messaging](#2-messaging)
3. [Groups & Chats](#3-groups--chats)
4. [Media](#4-media)
5. [Metrics & Analytics](#5-metrics--analytics)
6. [Session Management](#6-session-management)
7. [Logs](#7-logs)
8. [WebSocket Events](#8-websocket-events)

---

## 1. Health & Status

### 1.1 Health Check (Global)

- **URL:** `/api/health`
- **Method:** `GET`
- **Description:** Verifica que el servidor esté funcionando.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-13T10:30:00.000Z"
}
```

---

### 1.2 Health Check (WhatsApp)

- **URL:** `/api/wha/health`
- **Method:** `GET`
- **Description:** Verifica el estado del cliente de WhatsApp.

**Response (200):**
```json
{
  "success": true,
  "message": "Estado obtenido",
  "data": {
    "ready": true,
    "sessionId": "default-session"
  }
}
```

---

## 2. Messaging

### 2.1 Send Message

Envía mensajes de texto, multimedia o archivos a uno o múltiples destinatarios (números de teléfono o grupos).

- **URL:** `/api/wha/send`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | `string[]` | Yes | Array de números telefónicos (ej: `"573001234567"`) o IDs de grupo (ej: `"120363@g.us"`). |
| `message` | `string` | No* | Mensaje de texto. (*Requerido si no hay multimedia/archivo). |
| `multimedia` | `string[]` | No | Array de URLs de imágenes/videos. |
| `archivo` | `string[]` | No | Array de URLs de documentos (PDF, etc). |
| `tags` | `string[]` | No | Array de strings para clasificar el mensaje en métricas. |
| `envioMultimediaJunto` | `boolean` | No | Si es `true`, envía el `message` como caption del *primer* multimedia. Default: `false`. |
| `replyMessageId` | `string` | No | ID del mensaje al cual responder (quoted message). |

**Example:**
```json
{
  "to": ["573046282936", "573123456789"],
  "message": "Hola, mira este reporte",
  "multimedia": ["https://example.com/image.jpg"],
  "archivo": ["https://example.com/doc.pdf"],
  "tags": ["reporte", "mensual"],
  "envioMultimediaJunto": true,
  "replyMessageId": "false_573046282936@c.us_3EB0A8B9C7D8E9F"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mensajes enviados: 2, fallidos: 0",
  "data": {
    "success": ["573046282936", "573123456789"],
    "failed": []
  }
}
```

**Response (400) - Validation Error:**
```json
{
  "success": false,
  "message": "El campo \"to\" es requerido y debe ser un array de números o IDs"
}
```

**Response (503) - Client Not Ready:**
```json
{
  "success": false,
  "message": "El cliente de WhatsApp no está listo"
}
```

---

### 2.2 Send to Specific Group

Envía un mensaje a un grupo específico por su ID.

- **URL:** `/api/wha/groups/send`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | `string` | Yes | ID del grupo (ej: `"120363423058577571@g.us"`). |
| `message` | `string` | No* | Mensaje de texto. |
| `multimedia` | `string[]` | No | Array de URLs de multimedia. |
| `archivo` | `string[]` | No | Array de URLs de documentos. |
| `tags` | `string[]` | No | Tags para métricas. |
| `envioMultimediaJunto` | `boolean` | No | Adjuntar mensaje como caption del primer media. |
| `replyMessageId` | `string` | No | ID del mensaje a responder. |

**Example:**
```json
{
  "groupId": "120363423058577571@g.us",
  "message": "Aviso importante para el equipo",
  "multimedia": ["https://example.com/notice.png"],
  "tags": ["aviso", "urgente"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Mensaje enviado al grupo exitosamente"
}
```

---

## 3. Groups & Chats

### 3.1 Get All Groups

Obtiene una lista de todos los grupos donde está el bot.

- **URL:** `/api/wha/groups`
- **Method:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Se encontraron 5 grupos",
  "data": [
    {
      "id": "120363423058577571@g.us",
      "name": "Equipo de Desarrollo",
      "participants": ["573001234567", "573109876543", "573157654321"],
      "image": "https://cdn.whatsapp.net/..."
    }
  ]
}
```

---

### 3.2 Get All Chats

Obtiene una lista de todos los chats individuales (no grupos).

- **URL:** `/api/wha/chats`
- **Method:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Se encontraron 12 chats",
  "data": [
    {
      "name": "Juan Perez",
      "number": "573001234567",
      "image": "https://cdn.whatsapp.net/..."
    }
  ]
}
```

---

## 4. Media

### 4.1 Get Media from Message

Descarga el contenido multimedia de un mensaje por su ID.

- **URL:** `/api/wha/messages/:id/media`
- **Method:** `GET`
- **Description:** Retorna el archivobinario directamente (no JSON).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | ID del mensaje que contiene el multimedia. |

**Response (200):** Binary data (image/pdf/video)

**Headers:**
```
Content-Type: image/jpeg
Content-Disposition: attachment; filename="message-media.jpg"
```

**Response (400) - Missing ID:**
```json
{
  "success": false,
  "message": "El parámetro \"id\" es requerido y deben ser un string"
}
```

**Response (404) - Media Not Found:**
```json
{
  "success": false,
  "message": "Media no encontrada o mensaje expirado"
}
```

**Response (503):**
```json
{
  "success": false,
  "message": "El cliente de WhatsApp no está listo"
}
```

---

## 5. Metrics & Analytics

### 5.1 Get Today's Metrics

Retorna estadísticas de uso del día actual, incluyendo destinatarios principales, grupos y conteos diarios.

- **URL:** `/api/wha/metrics`
- **Method:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Métricas obtenidas exitosamente",
  "data": {
    "today": {
      "messagesSent": 150,
      "messagesFailed": 2,
      "groupMessagesSent": 45,
      "groupMessagesFailed": 1,
      "apiRequests": 230,
      "apiErrors": 3,
      "mediaSent": 28,
      "mediaFailed": 1,
      "filesSent": 12,
      "filesFailed": 0
    },
    "avgResponseTimeMs": 1205.5,
    "topRecipients": {
      "sent": [
        { "recipient": "573001234567", "count": 12 },
        { "recipient": "573109876543", "count": 8 }
      ],
      "failed": [
        { "recipient": "573157654321", "count": 2 }
      ]
    },
    "topGroups": {
      "sent": [
        { "groupId": "120363423058577571@g.us", "groupName": "Equipo Dev", "count": 50 },
        { "groupId": "120363987654321@g.us", "groupName": "Marketing", "count": 30 }
      ],
      "failed": []
    }
  }
}
```

---

### 5.2 Get Metrics by Date Range

Obtiene métricas en un rango de fechas específico.

- **URL:** `/api/wha/metrics/range`
- **Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | `string` | Yes | Fecha de inicio (ISO 8601). Ej: `2026-01-01` |
| `endDate` | `string` | Yes | Fecha de fin (ISO 8601). Ej: `2026-01-31` |

**Example:** `/api/wha/metrics/range?startDate=2026-01-01&endDate=2026-01-31`

**Response (200):**
```json
{
  "success": true,
  "message": "Se encontraron 450 eventos",
  "data": {
    "total": 450,
    "byType": {
      "message_sent": 320,
      "message_failed": 15,
      "group_message_sent": 100,
      "group_message_failed": 5,
      "media_sent": 8,
      "file_sent": 2
    }
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Se requieren los parámetros startDate y endDate"
}
```

---

### 5.3 Get Monthly Report

Obtiene un reporte consolidado mensual con desglose diario.

- **URL:** `/api/wha/metrics/monthly`
- **Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | `string` | Yes | Año (4 dígitos). Ej: `2026` |
| `month` | `string` | Yes | Mes (1-12). Ej: `5` |

**Example:** `/api/wha/metrics/monthly?year=2026&month=5`

**Response (200):**
```json
{
  "success": true,
  "message": "Reporte de 5/2026 generado",
  "data": {
    "year": 2026,
    "month": 5,
    "summary": {
      "totalMessagesSent": 1250,
      "totalMessagesFailed": 45,
      "totalGroupMessagesSent": 380,
      "totalGroupMessagesFailed": 12,
      "totalMessages": 1687,
      "successRate": 96.62
    },
    "dailyBreakdown": [
      {
        "date": "2026-05-01",
        "messagesSent": 45,
        "messagesFailed": 2,
        "groupMessagesSent": 10,
        "groupMessagesFailed": 0,
        "totalMessages": 57
      },
      {
        "date": "2026-05-02",
        "messagesSent": 50,
        "messagesFailed": 1,
        "groupMessagesSent": 15,
        "groupMessagesFailed": 1,
        "totalMessages": 67
      }
    ]
  }
}
```

---

## 6. Session Management

### 6.1 Get Session Status

Obtiene el estado actual de la sesión de WhatsApp.

- **URL:** `/api/wha/session/status`
- **Method:** `GET`

**Response (200):**
```json
{
  "success": true,
  "message": "Estado obtenido",
  "data": {
    "ready": true,
    "sessionId": "default-session"
  }
}
```

---

### 6.2 Restart Session

Reinicia el cliente de WhatsApp sin cerrar sesión.

- **URL:** `/api/wha/session/restart`
- **Method:** `POST`

**Response (200):**
```json
{
  "success": true,
  "message": "Reinicio del cliente iniciado"
}
```
*El reinicio se ejecuta en background. Usa `/api/wha/session/status` para verificar.*

---

### 6.3 Logout

Cierra la sesión de WhatsApp (requirá nuevo código QR).

- **URL:** `/api/wha/session/logout`
- **Method:** `POST`

**Response (200):**
```json
{
  "success": true,
  "message": "Cierre de sesión iniciado"
}
```

---

### 6.4 Clear Cache

Elimina la caché y datos de sesión, luego reinicia (útil cuando hay problemas de conexión).

- **URL:** `/api/wha/session/clear`
- **Method:** `POST`

**Response (200):**
```json
{
  "success": true,
  "message": "Limpieza de caché y reinicio iniciados"
}
```

---

## 7. Logs

### 7.1 Get Logs

Obtiene los logs capturados del servidor.

- **URL:** `/api/wha/logs`
- **Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | `string` | No | Cantidad máxima de logs (default: 500). |
| `level` | `string` | No | Filtrar por nivel: `info`, `warn`, `error`. |
| `since` | `string` | No | Filtrar logs desde esta timestamp. |

**Example:** `/api/wha/logs?limit=100&level=error`

**Response (200):**
```json
{
  "success": true,
  "message": "Se obtienen 100 logs",
  "data": [
    {
      "timestamp": "2026-05-13T10:30:00.000Z",
      "level": "info",
      "message": "[Server] Running on port 3100"
    },
    {
      "timestamp": "2026-05-13T10:30:05.000Z",
      "level": "error",
      "message": "[WhatsApp] Error enviando mensaje a 573001234567",
      "context": { "error": "Session closed" }
    }
  ]
}
```

---

## 8. WebSocket Events

El servidor utiliza **Socket.IO** para transmitir eventos en tiempo real.

### 8.1 Connect

```javascript
const socket = io('http://localhost:3100');
```

---

### 8.2 Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `whatsapp_status` | Server → Client | Estado del cliente: `UNAUTHENTICATED`, `LOADING`, `AUTHENTICATED`, `CONNECTED`, `DISCONNECTED`, `RESTARTING`, `LOGGING_OUT`, `CLEARING_CACHE` |
| `whatsapp_qr` | Server → Client | Código QR para autenticación (cuando no está autenticado). |
| `whatsapp_message` | Server → Client | Mensaje recibido entrante. |

### 8.3 Ejemplo de Suscripción

```javascript
// Estado del cliente
socket.on('whatsapp_status', (data) => {
  console.log('Estado:', data.state);
  // data: { state: 'CONNECTED' }
});

// QR para autenticación
socket.on('whatsapp_qr', (data) => {
  console.log('QR:', data.qr);
  // Renderizar QR en frontend
});

// Mensajes recibidos
socket.on('whatsapp_message', (msg) => {
  console.log('Nuevo mensaje:', msg.body);
  // msg: { from, number, name, body, hasMedia, type, ... }
});
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `200` | Éxito |
| `400` | Error de validación |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |
| `503` | Servicio no disponible (cliente WhatsApp no listo) |

---

## Formato de Fechas

Todas las fechas en responses usan formato **ISO 8601**: `YYYY-MM-DDTHH:mm:ss.sssZ`

Ejemplo: `2026-05-13T10:30:00.000Z`

---

## Formato de Números Telónicos

- **Individual:** `573001234567@c.us` o `573001234567`
- **Grupo:** `120363423058577571@g.us`

El API acepta números sin sufijo y los convierte automáticamente.
