
# --- Container App ---
container_name = "wha-bot"
image_name     = "wha-bot:latest"

cpu_cores    = 0.5
memory       = "1Gi"
min_replicas = 1
max_replicas = 2

is_public                  = true
target_port                = 3100
allow_insecure_connections = true
revision_mode              = "Single"

# --- Monitoring ---
appinsights_name = "wha-bot-appinsights"

# --- Core references ---
container_app_environment_name = "core-360-env"
managed_identity_name          = "core-identity"
log_analytics_workspace_name   = "core-law"

# --- Storage (WhatsApp session) ---
storage_account_name = "stwhatsession360"
