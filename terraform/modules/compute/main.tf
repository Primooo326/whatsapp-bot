resource "azurerm_container_app" "az_ca" {
  name                         = var.az_ca_name
  container_app_environment_id = var.container_apps_environment_id
  resource_group_name          = var.resource_group_name
  revision_mode                = var.revision_mode

  identity {
    type         = "UserAssigned"
    identity_ids = var.identity_ids
  }

  registry {
    server   = var.registry_server
    identity = var.identity_ids[0]
  }

  ingress {
    allow_insecure_connections = var.allow_insecure_connections
    external_enabled           = var.is_public
    target_port                = var.target_port
    transport                  = "auto"
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  dynamic "secret" {
    for_each = var.secrets
    content {
      name                = secret.value.name
      key_vault_secret_id = secret.value.key_vault_secret_id
      identity            = secret.value.identity
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    dynamic "volume" {
      for_each = var.volume_name != null ? [1] : []
      content {
        name         = var.volume_name
        storage_name = var.volume_storage_name
        storage_type = "AzureFile"
      }
    }

    container {
      name   = var.az_ca_name
      image  = "${var.registry_server}/${var.image_name}"
      cpu    = var.cpu_cores
      memory = var.memory

      startup_probe {
        port                    = var.target_port
        transport               = "TCP"
        failure_count_threshold = 30
        interval_seconds        = 5
      }

      dynamic "volume_mounts" {
        for_each = var.volume_name != null ? [1] : []
        content {
          name = var.volume_name
          path = var.volume_mount_path
        }
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name        = env.value.name
          value       = try(env.value.value, null)
          secret_name = try(env.value.secret_name, null)
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      tags["azd-timestamp"],
      tags["azd-service-name"]
    ]
  }
}
