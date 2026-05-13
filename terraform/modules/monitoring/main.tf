resource "azurerm_application_insights" "az_appinsights" {
  name                = var.appinsights_name
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
}
