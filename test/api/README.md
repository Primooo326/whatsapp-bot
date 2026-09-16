# Tests de API

Suite de tests de integración para probar los endpoints del API de WhatsApp Bot.

## Requisitos

```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

## Configuración

Agregar a `package.json`:

```json
{
  "scripts": {
    "test:api": "jest test/api --config jest.config.js"
  }
}
```

## Ejecutar Tests

```bash
npm run test:api
```

## Estructura de Tests

- `health.test.ts` - Tests de endpoints de salud
- `messages.test.ts` - Tests de envío de mensajes
- `groups.test.ts` - Tests de grupos
- `metrics.test.ts` - Tests de métricas
- `session.test.ts` - Tests de gestión de sesión
- `validation.test.ts` - Tests de validación de inputs

## Variables de Entorno para Tests

Crear `.env.test`:

```env
API_BASE_URL=http://localhost:3100
TEST_PHONE=573001234567
TEST_GROUP_ID=120363423058577571@g.us
```