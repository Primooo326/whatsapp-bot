variable "rg_nombre" {
  type = string
}

variable "global_location" {
  type = string
}

variable "registry_name" {
  type = string
}

variable "image_name" {
  type = string
}

variable "container_name" {
  type = string
}

variable "cpu_cores" {
  type    = number
  default = 0.5
}

variable "memory" {
  type    = string
  default = "1Gi"
}

variable "cap_name" {
  type = string
}

variable "registry_server" {
  type = string
}

variable "appinsights_name" {
  type    = string
  default = "auth-360-appinsights"
}

variable "key_vault_name" {
  type        = string
  description = "The name of the core Key Vault"
  default     = "kv-oberon360"
}
