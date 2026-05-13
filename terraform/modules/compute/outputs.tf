output "container_app_id" {
  value       = azurerm_container_app.az_ca.id
  description = "ID of the Container App"
}

output "container_app_fqdn" {
  value       = azurerm_container_app.az_ca.latest_revision_fqdn
  description = "FQDN of the Container App"
}

output "container_app_name" {
  value       = azurerm_container_app.az_ca.name
  description = "Name of the Container App"
}

output "container_app_identity_principal_id" {
  value       = azurerm_container_app.az_ca.identity[0].principal_id
  description = "Principal ID of the Container App's managed identity"
}
