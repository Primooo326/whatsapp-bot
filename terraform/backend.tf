terraform {
  backend "azurerm" {
    storage_account_name = "lakeoberon360"
    container_name       = "statesterraform"
    key                  = "states_whabot360.tfstate"
    sas_token            = "sv=2025-11-05&ss=b&srt=sco&sp=rwdlacyx&se=2026-05-26T01:11:24Z&st=2026-05-04T16:56:24Z&spr=https&sig=F8urcNBCeeSrwm4XzV%2F6RqImiKeF%2BYquQKi%2FKhbR5yM%3D"
    # sas_token = "value"
  }
}

# terraform init -backend-config="sas_tocken={sas}"
