# --- DATA SOURCES ---
data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_container_app_environment" "env" {
  name                = var.container_app_environment_name
  resource_group_name = var.resource_group_name
}

data "azurerm_user_assigned_identity" "core_id" {
  name                = var.managed_identity_name
  resource_group_name = var.resource_group_name
}

data "azurerm_log_analytics_workspace" "core_law" {
  name                = var.log_analytics_workspace_name
  resource_group_name = var.resource_group_name
}

# --- STORAGE (WhatsApp session persistence) ---
resource "azurerm_storage_account" "wha_session" {
  name                     = var.storage_account_name
  resource_group_name      = data.azurerm_resource_group.rg.name
  location                 = data.azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_share" "wha_session" {
  name               = "wha-session"
  storage_account_id = azurerm_storage_account.wha_session.id
  quota              = var.session_share_quota_gb
}

resource "azurerm_container_app_environment_storage" "wha_session" {
  name                         = "wha-session-storage"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  account_name                 = azurerm_storage_account.wha_session.name
  share_name                   = azurerm_storage_share.wha_session.name
  access_key                   = azurerm_storage_account.wha_session.primary_access_key
  access_mode                  = "ReadWrite"
}

# --- MONITORING ---
module "monitoring" {
  source = "./modules/monitoring"

  appinsights_name    = var.appinsights_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  workspace_id        = data.azurerm_log_analytics_workspace.core_law.id
}

# --- COMPUTE ---
locals {


  env_vars = [
    { name = "APPINSIGHTS-CONNECTION-STRING", value = module.monitoring.connection_string },
    { name = "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD", value = "true" },
    # WHATSAPP_SESSION_ID=your-session-id
    { name = "WHATSAPP_SESSION_ID", value = "session-xxx" },
  ]

  secret_env_vars = [

    { name = "MONGODB_URI", value = "mongodb+srv://JuanMorales:zhSX71i0GyvH98M5@clusterdev.wzclky.mongodb.net/wha_metrics?appName=ClusterDev" },
  ]

  all_env_vars = concat(local.env_vars, local.secret_env_vars)
}

module "compute" {
  source = "./modules/compute"

  az_ca_name                    = var.container_name
  resource_group_name           = data.azurerm_resource_group.rg.name
  location                      = data.azurerm_resource_group.rg.location
  container_apps_environment_id = data.azurerm_container_app_environment.env.id

  registry_server = var.registry_server
  image_name      = var.image_name

  cpu_cores = var.cpu_cores
  memory    = var.memory

  min_replicas = var.min_replicas
  max_replicas = var.max_replicas

  is_public                  = var.is_public
  target_port                = var.target_port
  allow_insecure_connections = var.allow_insecure_connections
  revision_mode              = var.revision_mode

  identity_ids = [data.azurerm_user_assigned_identity.core_id.id]

  env_vars = local.all_env_vars

  # Volume for WhatsApp session persistence
  volume_name         = "wha-session-vol"
  volume_storage_name = azurerm_container_app_environment_storage.wha_session.name
  volume_mount_path   = "/app/.wwebjs_auth"
}
