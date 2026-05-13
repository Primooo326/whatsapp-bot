variable "az_ca_name" {
  type        = string
  description = "Name of the Container App"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}

variable "container_apps_environment_id" {
  type        = string
  description = "ID of the Container Apps Environment"
}

variable "location" {
  type        = string
  description = "Azure region location"
}

variable "registry_server" {
  type        = string
  description = "Login server of the Azure Container Registry"
}

variable "image_name" {
  type        = string
  description = "Image name and tag in ACR"
}

variable "cpu_cores" {
  type        = number
  description = "CPU cores for the container app (0.25, 0.5, 1, 2)"
  default     = 0.5
}

variable "memory" {
  type        = string
  description = "Memory for the container app (0.5Gi, 1Gi, 2Gi)"
  default     = "1Gi"
}

variable "min_replicas" {
  type        = number
  description = "Minimum number of replicas"
  default     = 1
}

variable "max_replicas" {
  type        = number
  description = "Maximum number of replicas"
  default     = 2
}

variable "revision_mode" {
  type        = string
  description = "Revision mode: Single or Multiple"
  default     = "Single"
}

variable "is_public" {
  type        = bool
  description = "Whether the container app is publicly accessible"
  default     = true
}
variable "target_port" {
  type        = number
  description = "Target port for the container ingress"
  default     = 3000
}

variable "allow_insecure_connections" {
  type        = bool
  description = "Allow insecure connections on ingress"
  default     = true
}

variable "identity_ids" {
  type        = list(string)
  description = "List of User Assigned Identity IDs to assign"
}

variable "env_vars" {
  type = list(object({
    name        = string
    value       = optional(string)
    secret_name = optional(string)
  }))
  description = "List of environment variables for the container"
  default     = []
}

variable "secrets" {
  type = list(object({
    name                = string
    key_vault_secret_id = string
    identity            = string
  }))
  description = "List of secrets to reference from Key Vault"
  default     = []
}

# --- Volume (session persistence) ---
variable "volume_name" {
  type        = string
  description = "Name of the volume to mount in the container"
  default     = null
}

variable "volume_storage_name" {
  type        = string
  description = "Name of the environment storage to use for the volume"
  default     = null
}

variable "volume_mount_path" {
  type        = string
  description = "Path in the container where the volume should be mounted"
  default     = null
}
