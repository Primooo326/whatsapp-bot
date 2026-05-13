output "container_app_id" {
  value       = module.compute.container_app_id
  description = "ID of the Container App"
}

output "container_app_fqdn" {
  value       = module.compute.container_app_fqdn
  description = "FQDN of the Container App"
}

output "container_app_name" {
  value       = module.compute.container_app_name
  description = "Name of the Container App"
}

output "appinsights_connection_string" {
  value       = module.monitoring.connection_string
  description = "Connection string of Application Insights"
  sensitive   = true
}
