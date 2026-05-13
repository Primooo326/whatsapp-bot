terraform {
  backend "azurerm" {
    storage_account_name = "lakeoberon360"
    container_name       = "statesterraform"
    key                  = "states_wha-bot.tfstate"
    sas_token            = "sv=2025-11-05&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2026-05-28T23:50:59Z&st=2026-05-07T15:35:59Z&spr=https&sig=obVZCE6kxPSPrUH9Pte3q7H%2FPL7hEztZLiv0%2BEwEkeU%3D"
    # sas_token = "value"
  }
}

# terraform init -backend-config="sas_tocken={sas}"
