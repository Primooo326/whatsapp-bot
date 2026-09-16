# WhatsApp Bot

Bot de WhatsApp con API REST para enviar mensajes, multimedia y documentos. Construido con **Node.js**, **Express**, **TypeScript** y **whatsapp-web.js**.

---

## Características

- **Envío de mensajes** a números individuales y grupos
- **Multimedia**: imágenes, videos y documentos (hasta 50MB)
- **Captura de mensajes entrantes** via WebSocket
- **Métricas** integradas: mensajes enviados/fallidos, tiempo de respuesta, reportes mensuales
- **Gestión de sesión**: reinicio, logout, limpieza de caché
- **Autenticación** mediante código QR
- **API REST** completa con documentación

---

## Requisitos

- Node.js 18+
- MongoDB (para métricas)
- Docker y Docker Compose (opcional)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd wha-bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configúralo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Puerto del servidor
PORT=3100

# ID de sesión (para persistencia de autenticación)
WHATSAPP_SESSION_ID=default-session

# URI de MongoDB (opcional, el servidor funciona sinMetrics)
MONGODB_URI=mongodb://localhost:27017/wha_metrics

# Puerto frontend (para desarrollo)
FRONTEND_PORT=5173
```

---

## Uso

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3100`

### Producción (Build)

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

El servicio estará en `http://localhost:3100` (nginx) y la API en `http://localhost:3100`

---

## Estructura del Proyecto

```
wha-bot/
├── src/
│   ├── config/          # Configuración centralizada
│   ├── controllers/     # Controladores de endpoints
│   ├── core/            # WhatsAppClient, MessageQueue, LogCapture
│   ├── database/        # Modelos y conexión a MongoDB
│   ├── middlewares/     # Middlewares de Express
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio (metrics)
│   ├── types/           # Tipos y interfaces TypeScript
│   ├── utils/           # Utilidades
│   └── index.ts         # Punto de entrada
├── frontend/            # Frontend React (Vite)
├── terraform/           # Configuración de infraestructura
├── dockerfile           # Imagen Docker
├── docker-compose.yml   # Orquestación
└── package.json
```

---

## API

Consulta la documentación completa en [API_DOCS.md](./API_DOCS.md)

### Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/wha/send` | Enviar mensaje(s) |
| `GET` | `/api/wha/groups` | Listar grupos |
| `GET` | `/api/wha/metrics` | Métricas del día |
| `GET` | `/api/wha/metrics/monthly` | Reporte mensual |
| `POST` | `/api/wha/session/restart` | Reiniciar cliente |
| `GET` | `/api/wha/logs` | Ver logs |

---

## WebSocket

El servidor emite eventos en tiempo real:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3100');

socket.on('whatsapp_status', (data) => {
  console.log('Estado:', data.state);
});

socket.on('whatsapp_message', (msg) => {
  console.log('Nuevo mensaje:', msg.body);
});
```

---

## Métricas y Base de Datos

El sistema registra eventos en MongoDB. Consulta [DATABASE.md](./DATABASE.md) para detalles de esquemas.

Si MongoDB no está disponible, el servidor iniciarán正常工作 sin métricas.

---

## Solución de Problemas

Consulta [SOLUCION_PROBLEMAS.md](./SOLUCION_PROBLEMAS.md) para problemas comunes:

- Error "Session closed"
- QR no aparece
- Mensajes no se envían
- Memoria alta en Docker

---

## Infraestructura (Terraform)

El proyecto incluye configuración para desplegar en Azure:

```bash
cd terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply
```

Ver [terraform/README.md](./terraform/README.md) para detalles.

---

## Tecnologías

| Componente | Tecnología |
|------------|------------|
| Runtime | Node.js 18+ |
| Lenguaje | TypeScript |
| Framework | Express.js |
| WhatsApp | whatsapp-web.js |
| Base de datos | MongoDB (Mongoose) |
| Tiempo real | Socket.IO |
| Frontend | React + Vite |
| Docker | Multi-stage build |
| CI/CD | Azure Pipelines |

---

## Licencia

ISC