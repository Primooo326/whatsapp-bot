# Tests de Stress y Carga

Suite de pruebas para detectar vulnerabilidades, límites y comportamiento bajo carga.

## Contenido

### 1. Rate Limiting Test
Verifica cómo responde el servidor ante múltiples peticiones rápidas.

### 2. Payload Size Test
Envía payloads grandes para probar límites de memoria.

### 3. Concurrent Requests
Envía múltiples peticiones simultáneas para probar condiciones de carrera.

### 4. Invalid Input Fuzzing
Envía datos maliciosos o inesperados para encontrar errores.

### 5. Long Running Test
Envía peticiones continuas para detectar memory leaks.

## Herramientas

### Opción A: Script Node.js (incluido)
```bash
node test/stress/load-test.js
```

### Opción B: k6 (recomendado)
```bash
npm install -g k6
k6 run test/stress/k6-script.js
```

### Opción C: Apache Bench
```bash
ab -n 1000 -c 10 http://localhost:3100/api/health
```

## Resultados Esperados

- El servidor debe responder con 429 (Too Many Requests) si hay rate limiting
- Payload > 1MB debe ser rechazado con 413 (Payload Too Large)
- Peticiones concurrentes no deben causar crashes
- Inputs inválidos deben ser validados y rechazados