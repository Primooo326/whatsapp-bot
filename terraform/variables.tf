variable "location" {
  type        = string
  description = "Azure region location"
  default     = "eastus2"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
  default     = "DESARROLLO"
}

variable "container_name" {
  type        = string
  description = "Name of the Container App"
  default     = "auth-360"
}

variable "image_name" {
  type        = string
  description = "Image name and tag in ACR (e.g. auth_360:12345)"
}

variable "registry_server" {
  type        = string
  description = "Login server of the Azure Container Registry"
  default     = "oberonregistry.azurecr.io"
}

# --- Compute sizing ---
variable "cpu_cores" {
  type        = number
  description = "CPU cores (0.25, 0.5, 1, 2)"
  default     = 0.5
}

variable "memory" {
  type        = string
  description = "Memory (0.5Gi, 1Gi, 2Gi)"
  default     = "1Gi"
}

variable "min_replicas" {
  type        = number
  description = "Minimum replicas"
  default     = 1
}

variable "max_replicas" {
  type        = number
  description = "Maximum replicas"
  default     = 2
}

# --- Ingress ---
variable "is_public" {
  type        = bool
  description = "Expose the app publicly"
  default     = true
}

variable "target_port" {
  type        = number
  description = "Container target port"
  default     = 3005
}

variable "allow_insecure_connections" {
  type        = bool
  description = "Allow ingress without HTTPS"
  default     = true
}

variable "revision_mode" {
  type        = string
  description = "Single or Multiple revision mode"
  default     = "Single"
}

# --- Monitoring ---
variable "appinsights_name" {
  type        = string
  description = "Name of the Application Insights resource"
  default     = "auth-360-appinsights"
}

# --- Core references ---
variable "container_app_environment_name" {
  type        = string
  description = "Name of the Container Apps Environment"
  default     = "core-360-env"
}

variable "managed_identity_name" {
  type        = string
  description = "Name of the User Assigned Managed Identity"
  default     = "core-identity"
}

variable "log_analytics_workspace_name" {
  type        = string
  description = "Name of the Log Analytics Workspace"
  default     = "core-law"
}

# --- Storage (session persistence) ---
variable "storage_account_name" {
  type        = string
  description = "Name of the Storage Account for WhatsApp session persistence (must be globally unique, 3-24 chars, lowercase alphanumeric only)"
}

variable "session_share_quota_gb" {
  type        = number
  description = "Quota in GB for the WhatsApp session Azure File Share"
  default     = 1
}
