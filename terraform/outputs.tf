output "app_fqdn" {
  value = azurerm_container_app.ca.latest_revision_fqdn
}
