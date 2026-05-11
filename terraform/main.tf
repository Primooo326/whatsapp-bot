data "azurerm_resource_group" "rg" {
  name = var.rg_nombre
}

data "azurerm_container_registry" "acr" {
  name                = var.registry_name
  resource_group_name = var.rg_nombre
}

data "azurerm_container_app_environment" "core_env" {
  name                = var.cap_name
  resource_group_name = var.rg_nombre
}

data "azurerm_log_analytics_workspace" "core_law" {
  name                = "acc-auth"
  resource_group_name = var.rg_nombre
}

data "azurerm_key_vault" "core_kv" {
  name                = var.key_vault_name
  resource_group_name = var.rg_nombre
}

resource "azurerm_user_assigned_identity" "id_aca" {
  name                = "${var.container_name}-id"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
}

resource "azurerm_role_assignment" "containerapp_to_acr" {
  scope                = data.azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.id_aca.principal_id
}

resource "azurerm_role_assignment" "containerapp_to_kv" {
  scope                = data.azurerm_key_vault.core_kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.id_aca.principal_id
}

resource "azurerm_application_insights" "appinsights" {
  name                = var.appinsights_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  application_type    = "web"
  workspace_id        = data.azurerm_log_analytics_workspace.core_law.id
}

resource "azurerm_container_app" "ca" {
  name                         = "${var.container_name}-container"
  container_app_environment_id = data.azurerm_container_app_environment.core_env.id
  resource_group_name          = data.azurerm_resource_group.rg.name
  revision_mode                = "Multiple"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.id_aca.id]
  }

  registry {
    server   = var.registry_server
    identity = azurerm_user_assigned_identity.id_aca.id
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = "${data.azurerm_key_vault.core_kv.vault_uri}secrets/JWT-SECRET"
    identity            = azurerm_user_assigned_identity.id_aca.id
  }

  template {
    container {
      name   = var.container_name
      image  = "${var.registry_server}/${var.image_name}"
      cpu    = var.cpu_cores
      memory = var.memory

      env {
        name  = "APPINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.appinsights.connection_string
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
    }
  }

  depends_on = [
    azurerm_role_assignment.containerapp_to_acr,
    azurerm_role_assignment.containerapp_to_kv
  ]
}
