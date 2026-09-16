# Terraform — Auth_360

Infraestructura como código (IaC) para desplegar microservicios en **Azure Container Apps** dentro del ecosistema Oberon 360.

Este repositorio es el **modelo base** para cualquier microservicio del proyecto. La estructura está diseñada para ser copiada y adaptada a nuevos microservicios con cambios mínimos.

---

## Arquitectura

```
              ┌─────────────────────────────────────────────┐
              │           AZURE SUBSCRIPTION                │
              │  ┌───────────────────────────────────────┐  │
              │  │        RESOURCE GROUP: DESARROLLO      │  │
              │  │                                       │  │
              │  │  Infraestructura Core (existente)     │  │
              │  │  ├─ ACR: oberonregistry.azurecr.io    │  │
              │  │  ├─ ACA Environment: core-360-env     │  │
              │  │  ├─ Log Analytics: core-law           │  │
              │  │  └─ Managed Identity: core-identity   │  │
              │  │                                       │  │
              │  │  Creado por Terraform Auth_360         │  │
              │  │  ├─ App Insights: auth-360-appinsights │  │
              │  │  └─ Container App: auth-360            │  │
              │  └───────────────────────────────────────┘  │
              └─────────────────────────────────────────────┘
```

---

## Estructura del proyecto

```
terraform/
├── provider.tf                  # Providers: azurerm 4.70.0, azurecaf
├── backend.tf                   # Remote state en Azure Blob Storage
├── main.tf                      # Data sources + orquestación de módulos
├── variables.tf                 # Variables de entrada del root
├── outputs.tf                   # Outputs expuestos
├── terraform.tfvars.example     # Template de configuración
├── modules/
│   ├── monitoring/              # Application Insights
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── compute/                 # Container App
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
```

---

## Cómo replicar este módulo para otro microservicio

Sigue estos pasos para crear la infraestructura Terraform de un nuevo microservicio (ej: `wha-bot`, `osrm`, `api-gateway`).

### Paso 1: Copiar la carpeta `terraform/`

```bash
cp -r auth_360/terraform/ nuevo-microservicio/terraform/
cd nuevo-microservicio/terraform
```

### Paso 2: Actualizar `variables.tf`

Cambia los valores por defecto:

```hcl
variable "container_name" {
  default = "wha-bot"                # ← Nombre del nuevo microservicio
}

variable "appinsights_name" {
  default = "wha-bot-appinsights"    # ← Nombre del App Insights
}

variable "revision_mode" {
  default = "Single"                 # Single si no necesitas revisions multiples
}

variable "is_public" {
  default = false                    # false = interno, solo accesible via VNET
}
```

### Paso 3: Actualizar `main.tf`

Ajusta las variables de entorno del microservicio en el bloque `locals.env_vars`:

```hcl
locals {
  env_vars = [
    { name = "APPINSIGHTS-CONNECTION-STRING", value = module.monitoring.connection_string },
    { name = "AZURE_KEY_VAULT_URL",           value = "https://kv-oberon360.vault.azure.net/" },
    { name = "REDIS_HOSTNAME",                value = "oberon-redis.redis.cache.windows.net" },
    { name = "TZ",                            value = "America/Bogota" },
  ]

  # Secrets hardcodeados temporalmente (migrar a Key Vault después)
  secret_env_vars = [
    { name = "API-KEY", value = "supersecret" },
  ]

  all_env_vars = concat(local.env_vars, local.secret_env_vars)
}
```

### Paso 4: Ajustar el `target_port` si es necesario

```hcl
variable "target_port" {
  default = 3100  # ← Puerto donde escucha el contenedor
}
```

### Paso 5: Crear `terraform.tfvars`

```hcl
container_name = "wha-bot"
image_name     = "wha_bot:latest"
appinsights_name = "wha-bot-appinsights"
```

### Paso 6: Inicializar y desplegar

```bash
terraform init
terraform plan
terraform apply
```

---

## Módulos

### `modules/monitoring/`

Crea el recurso **Application Insights** para telemetría del microservicio.

| Input | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre del recurso |
| `location` | `string` | Región Azure |
| `resource_group_name` | `string` | Resource Group |
| `workspace_id` | `string` (opcional) | ID del Log Analytics Workspace |

| Output | Descripción |
|---|---|
| `appinsights_id` | ID del recurso |
| `connection_string` | Connection string (sensitive) |

### `modules/compute/`

Crea el recurso **Container App** con su configuración completa.

| Input | Tipo | Default | Descripción |
|---|---|---|---|
| `name` | `string` | — | Nombre de la Container App |
| `resource_group_name` | `string` | — | Resource Group |
| `container_apps_environment_id` | `string` | — | ID del ACA Environment |
| `location` | `string` | — | Región Azure |
| `registry_server` | `string` | — | Servidor del ACR |
| `image_name` | `string` | — | Imagen Docker (nombre:tag) |
| `cpu_cores` | `number` | `0.5` | CPUs (0.25, 0.5, 1, 2) |
| `memory` | `string` | `1Gi` | Memoria (0.5Gi, 1Gi, 2Gi) |
| `min_replicas` | `number` | `0` | Mínimo de réplicas |
| `max_replicas` | `number` | `2` | Máximo de réplicas |
| `revision_mode` | `string` | `Multiple` | `Single` o `Multiple` |
| `is_public` | `bool` | `false` | Accesible públicamente |
| `target_port` | `number` | `3000` | Puerto del contenedor |
| `allow_insecure_connections` | `bool` | `false` | Permitir HTTP |
| `identity_ids` | `list(string)` | — | IDs de Managed Identity |
| `env_vars` | `list(object)` | `[]` | Variables de entorno |
| `secrets` | `list(object)` | `[]` | Secretos desde Key Vault |

| Output | Descripción |
|---|---|
| `container_app_id` | ID del recurso |
| `container_app_fqdn` | FQDN del contenedor |
| `container_app_name` | Nombre del contenedor |
| `container_app_identity_principal_id` | Principal ID de la identidad |

---

## Root module

### Data Sources

| Data Source | Recurso | Propósito |
|---|---|---|
| `azurerm_resource_group` | `DESARROLLO` | Obtener location e ID del RG |
| `azurerm_container_app_environment` | `core-360-env` | Entorno ACA compartido |
| `azurerm_user_assigned_identity` | `core-identity` | Identidad para RBAC y ACR |
| `azurerm_log_analytics_workspace` | `core-law` | Workspace para App Insights |

### Variables

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `location` | no | `eastus2` | Región Azure |
| `resource_group_name` | no | `DESARROLLO` | Resource Group |
| `container_name` | no | `auth-360` | Nombre del contenedor |
| `image_name` | **sí** | — | Imagen Docker (ej: `auth_360:latest`) |
| `registry_server` | no | `oberonregistry.azurecr.io` | Servidor ACR |
| `cpu_cores` | no | `0.5` | CPUs |
| `memory` | no | `1Gi` | Memoria |
| `min_replicas` | no | `0` | Réplicas mínimas |
| `max_replicas` | no | `2` | Réplicas máximas |
| `is_public` | no | `true` | Acceso público |
| `target_port` | no | `3000` | Puerto del contenedor |
| `allow_insecure_connections` | no | `false` | HTTP permitido |
| `revision_mode` | no | `Multiple` | Revision mode |
| `appinsights_name` | no | `auth-360-appinsights` | Nombre App Insights |
| `container_app_environment_name` | no | `core-360-env` | ACA Environment |
| `managed_identity_name` | no | `core-identity` | Managed Identity |
| `log_analytics_workspace_name` | no | `core-law` | Log Analytics |

### Outputs

| Output | Descripción |
|---|---|
| `container_app_id` | ID de la Container App |
| `container_app_fqdn` | FQDN de la aplicación |
| `container_app_name` | Nombre de la Container App |
| `appinsights_connection_string` | Connection string de telemetría (sensitive) |

---

## Container App — Configuración interna

### Identity
- **Tipo**: UserAssigned
- **Identidad**: `core-identity`
- **Registry**: autenticación contra ACR via Managed Identity

### Ingress
- **Público**: `true` (accesible desde internet / App Gateway)
- **Puerto**: 3000
- **Transporte**: `auto` (HTTP/2 si el cliente lo soporta)
- **HTTPS**: forzado (`allow_insecure_connections = false`)
- **Tráfico**: 100% a la última revisión

### Auto-scaling
- **Mínimo réplicas**: 0 (scale-to-zero cuando no hay tráfico)
- **Máximo réplicas**: 2
- **Startup probe**: TCP en puerto 3000, 30 fallos tolerados, cada 2s

### Lifecycle
```hcl
lifecycle {
  ignore_changes = [
    template[0].container[0].image,  # La imagen la actualiza el pipeline
    tags["azd-timestamp"],
    tags["azd-service-name"]
  ]
}
```

---

## Pipeline CI/CD

El pipeline en `azure-pipelines.yml` (raíz del repo) sigue este flujo:

```
QualityGate (lint + test)
       ↓
BuildAndPush (docker build + push a ACR)
       ↓
Deploy (az containerapp update --image <nueva imagen>)
```

Terraform se ejecuta **una sola vez** para crear la infraestructura inicial.  
Los deploys subsecuentes actualizan **solo la imagen** via `az containerapp update`.

> Si el Container App no existe, ejecutar `terraform apply` manualmente antes del primer deploy automático.

---

## Guía rápida

```bash
# 1. Inicializar Terraform
cd terraform
terraform init

# 2. Validar configuración
terraform validate

# 3. Ver plan de cambios
terraform plan

# 4. Desplegar infraestructura
terraform apply

# 5. Obtener URL de la app
terraform output container_app_fqdn
```

### Múltiples entornos

```bash
terraform apply -var-file="terraform.dev.tfvars"
terraform apply -var-file="terraform.prod.tfvars"
```

---

## Seguridad

| Práctica | Estado |
|---|---|
| Secrets hardcodeados en código | ⚠️ Temporal (migrar a Key Vault) |
| `.terraform/` en `.gitignore` | ✅ |
| `terraform.tfvars` en `.gitignore` | ✅ |
| Remote state en Azure Blob Storage | ✅ |
| SAS token no hardcodeado | ⚠️ Usar `-backend-config` |

### Pendiente

- [ ] Reemplazar secrets hardcodeados por referencias a Key Vault
- [ ] Implementar `sync-env-to-kv.sh` para sincronizar variables de entorno al Key Vault
- [ ] Configurar RBAC role assignments para acceso a Key Vault desde el pipeline

---

## Troubleshooting

```bash
# Error de SAS token vencido
terraform init -reconfigure -backend-config="sas_token={nuevo_token}"

# Error de autenticación Azure
az login
az account set --subscription "7e2f567f-9ce1-4851-a60b-ff077ee872a6"

# Detectar drift (cambios manuales en Azure)
terraform plan -refresh-only

# Destruir infraestructura (solo si es necesario)
terraform destroy
```
