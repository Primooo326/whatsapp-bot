# Base de Datos - MongoDB

El sistema utiliza **MongoDB** para almacenar métricas y estadísticas de uso. Si MongoDB no está disponible, el servidor arrancará normalmente pero sin registro de métricas.

---

## Colecciones

### 1. `metrics`

Almacena cada evento individuales del sistema.

**Ubicación:** `src/database/models/Metric.ts`

#### Esquema

```typescript
{
  // Tipo de evento (requerido, indexado)
  eventType: {
    type: String,
    required: true,
    enum: [
      'message_sent',
      'message_failed',
      'group_message_sent',
      'group_message_failed',
      'groups_fetched',
      'client_ready',
      'client_disconnected',
      'api_request',
      'api_error',
      'media_sent',
      'media_failed',
      'file_sent',
      'file_failed',
      'download_failed'
    ],
    index: true
  },

  // Timestamp del evento (indexado)
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Datos variables según el tipo de evento
  data: {
    type: Schema.Types.Mixed,  // Object flexible
    default: {},

    // Para mensajes
    recipient?: string,        // Número de teléfono destinatario
    groupId?: string,          // ID del grupo
    groupName?: string,         // Nombre del grupo
    messageLength?: number,   // Longitud del mensaje
    tags?: string[],           // Tags asociados

    // Para API requests
    endpoint?: string,          // Endpoint llamado
    method?: string,           // Método HTTP
    statusCode?: number,       // Código de respuesta
    responseTimeMs?: number,   // Tiempo de respuesta en ms

    // Para errores
    errorMessage?: string,     // Mensaje de error
    errorCode?: string,        // Código de error

    // Metadata
    sessionId?: string,        // ID de sesión de WhatsApp
  }
}
```

#### Índices

```javascript
// Índice compuesto para consultas por tipo y fecha
{ eventType: 1, timestamp: -1 }

// Índice para consultas de endpoints
{ "data.endpoint": 1, timestamp: -1 }
```

#### Ejemplos de Documentos

**Mensaje enviado:**
```json
{
  "_id": "684a1b2c3d4e5f6a7b8c9d0e",
  "eventType": "message_sent",
  "timestamp": "2026-05-13T10:30:00.000Z",
  "data": {
    "recipient": "573001234567",
    "messageLength": 145,
    "tags": ["reporte", "mensual"],
    "sessionId": "default-session"
  }
}
```

**Mensaje a grupo:**
```json
{
  "_id": "684a1b2c3d4e5f6a7b8c9d1e",
  "eventType": "group_message_sent",
  "timestamp": "2026-05-13T10:35:00.000Z",
  "data": {
    "groupId": "120363423058577571@g.us",
    "groupName": "Equipo de Desarrollo",
    "messageLength": 89,
    "tags": ["aviso"],
    "sessionId": "default-session"
  }
}
```

**Error en mensaje:**
```json
{
  "_id": "684a1b2c3d4e5f6a7b8c9d2e",
  "eventType": "message_failed",
  "timestamp": "2026-05-13T10:32:00.000Z",
  "data": {
    "recipient": "573009999999",
    "errorMessage": "Session closed",
    "tags": ["spam"],
    "sessionId": "default-session"
  }
}
```

**Petición API:**
```json
{
  "_id": "684a1b2c3d4e5f6a7b8c9d3e",
  "eventType": "api_request",
  "timestamp": "2026-05-13T10:30:05.000Z",
  "data": {
    "endpoint": "/api/wha/send",
    "method": "POST",
    "statusCode": 200,
    "responseTimeMs": 1245,
    "sessionId": "default-session"
  }
}
```

---

### 2. `daily_summaries`

Almacena métricas diarias agregadas (opcional, para optimización).

**Ubicación:** `src/database/models/DailySummary.ts`

#### Esquema

```typescript
{
  // Fecha del resumen (unique, indexado)
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },

  // Conteo de mensajes
  totalMessagesSent: { type: Number, default: 0 },
  totalMessagesFailed: { type: Number, default: 0 },

  // Conteo de mensajes a grupos
  totalGroupMessagesSent: { type: Number, default: 0 },
  totalGroupMessagesFailed: { type: Number, default: 0 },

  // Conteo de API
  totalApiRequests: { type: Number, default: 0 },
  totalApiErrors: { type: Number, default: 0 },

  // Métricas de unicidad
  uniqueRecipients: { type: Number, default: 0 },
  uniqueGroups: { type: Number, default: 0 },

  // Rendimiento
  avgResponseTimeMs: { type: Number, default: 0 }
}
```

#### Ejemplo de Documento

```json
{
  "_id": "684a1b2c3d4e5f6a7b8c9d4e",
  "date": "2026-05-13T00:00:00.000Z",
  "totalMessagesSent": 150,
  "totalMessagesFailed": 2,
  "totalGroupMessagesSent": 45,
  "totalGroupMessagesFailed": 1,
  "totalApiRequests": 230,
  "totalApiErrors": 3,
  "uniqueRecipients": 28,
  "uniqueGroups": 5,
  "avgResponseTimeMs": 1205.5,
  "createdAt": "2026-05-13T23:59:00.000Z",
  "updatedAt": "2026-05-13T23:59:00.000Z"
}
```

---

## Queries Comunes

### Métricas del día actual

```javascript
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);

await Metric.countDocuments({
  eventType: 'message_sent',
  timestamp: { $gte: startOfDay }
});
```

### Top destinatarios con más mensajes

```javascript
await Metric.aggregate([
  { $match: { eventType: 'message_sent' } },
  { $group: { _id: '$data.recipient', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

### Reporte mensual

```javascript
const startDate = new Date(2026, 4, 1);  // Mayo 2026
const endDate = new Date(2026, 5, 0, 23, 59, 59);

await Metric.aggregate([
  {
    $match: {
      timestamp: { $gte: startDate, $lte: endDate },
      eventType: { $in: ['message_sent', 'message_failed', 'group_message_sent', 'group_message_failed'] }
    }
  },
  {
    $group: {
      _id: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        eventType: '$eventType'
      },
      count: { $sum: 1 }
    }
  }
]);
```

---

## Optimización

### Índices Recomendados

El schema ya incluye los índices necesarios, pero en entornos con alto volumen considera agregar:

```javascript
// Para métricas de destinatario específico
MetricSchema.index({ "data.recipient": 1, timestamp: -1 });

// Para métricas de grupos específicos
MetricSchema.index({ "data.groupId": 1, timestamp: -1 });
```

### TTL (Time-To-Live)

Para auto-limpieza de métricas antiguas (ej: mantener solo 90 días):

```javascript
MetricSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

---

## Conexión

La conexión se realiza en `src/database/connection.ts`:

```typescript
await mongoose.connect(config.mongodb.uri, {
  serverSelectionTimeoutMS: 5000
});
```

El servidor **no fallará** si MongoDB no está disponible; simplemente omitirá el registro de métricas.

---

## URI de Conexión

Por defecto: `mongodb://localhost:27017/wha_metrics`

Configurable via variable de entorno `MONGODB_URI` en `.env`.

---

## Modelo de Datos - Relaciones

```
┌─────────────────────────────────────────────────────────────┐
│                         metrics                              │
├─────────────────────────────────────────────────────────────┤
│ _id: ObjectId                                               │
│ eventType: String (enum)                                   │
│ timestamp: Date                                            │
│ data: Mixed                                                │
│   ├── recipient? (message_sent/failed)                     │
│   ├── groupId? (group_message_*)                           │
│   ├── groupName?                                           │
│   ├── messageLength?                                       │
│   ├── tags?                                                │
│   ├── endpoint? (api_request)                              │
│   ├── method?                                              │
│   ├── statusCode?                                          │
│   ├── responseTimeMs?                                      │
│   ├── errorMessage?                                        │
│   └── sessionId?                                           │
└─────────────────────────────────────────────────────────────┘
```

No hay relaciones entre colecciones. `daily_summaries` es opcional y puede generarse desde `metrics`.