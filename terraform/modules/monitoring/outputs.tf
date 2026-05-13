output "appinsights_id" {
  value       = azurerm_application_insights.az_appinsights.id
  description = "ID of the Application Insights resource"
}

output "connection_string" {
  value       = azurerm_application_insights.az_appinsights.connection_string
  description = "Connection string for Application Insights"
  sensitive   = true
}
