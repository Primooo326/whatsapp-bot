variable "appinsights_name" {
  type        = string
  description = "Name of the Application Insights resource"
}

variable "location" {
  type        = string
  description = "Azure region location"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}

variable "workspace_id" {
  type        = string
  description = "ID of the Log Analytics Workspace"
  default     = null
}
