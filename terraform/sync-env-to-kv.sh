#!/bin/bash

# ==============================================================================
# Script: sync-env-to-kv.sh
# Uso: ./sync-env-to-kv.sh <archivo_.env> <nombre_vault> <prefijo_microservicio>
# ==============================================================================

# 1. Validar parámetros
if [ "$#" -ne 3 ]; then
    echo -e "\e[31mError: Faltan parámetros.\e[0m"
    echo "Uso: $0 .env mi-key-vault MI-SERVICIO"
    exit 1
fi

ENV_FILE=$1
VAULT_NAME=$2
PREFIX=$3

# 2. Validar sesión de Azure
az account show &>/dev/null
if [ $? -ne 0 ]; then
    echo -e "\e[31mError: No detecto una sesión activa de Azure CLI. Ejecuta 'az login' primero.\e[0m"
    exit 1
fi

# 3. Validar existencia del archivo .env
if [ ! -f "$ENV_FILE" ]; then
    echo -e "\e[31mError: El archivo $ENV_FILE no existe.\e[0m"
    exit 1
fi

# --- FASE 1: VALIDACIÓN DE FORMATO (Guiones bajos) ---
echo "Verificando formato de las keys..."
ERRORS=0
while read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == "#"* || "$line" != *"="* ]] && continue
    
    KEY=$(echo "$line" | cut -d'=' -f1 | xargs)
    if [[ "$KEY" == *"_"* ]]; then
        echo -e "\e[31m[FORMATO INVÁLIDO]: La key '$KEY' contiene guiones bajos (_).\e[0m"
        ERRORS=$((ERRORS + 1))
    fi
done < "$ENV_FILE"

if [ $ERRORS -gt 0 ]; then
    echo -e "\n\e[33mSe encontraron $ERRORS errores. Por favor, cambia los guiones bajos por guiones medios (-) manualmente en tu archivo .env antes de continuar.\e[0m"
    exit 1
fi

# --- FASE 2: CONFIRMACIÓN DE SOBRESCRITURA ---
echo -e "\n\e[34m¡Formato validado correctamente!\e[0m"
echo -e "\e[33mADVERTENCIA: Se van a sobrescribir los secretos en el Vault '$VAULT_NAME' con el prefijo '$PREFIX'.\e[0m"
read -p "¿Confirmas que deseas continuar con la sobrescritura? (s/n): " CONFIRM
if [[ $CONFIRM != "s" && $CONFIRM != "S" ]]; then
    echo "Operación cancelada por el usuario."
    exit 0
fi

# --- FASE 3: CARGA DE DATOS ---
echo -e "\n--- Iniciando carga masiva ---"

while read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == "#"* || "$line" != *"="* ]] && continue

    # Extraer KEY y VALUE (Manejando caracteres especiales en el valor)
    KEY=$(echo "$line" | cut -d'=' -f1 | xargs)
    VALUE=$(echo "$line" | cut -d'=' -f2- | xargs)

    SECRET_NAME="${PREFIX}--${KEY}"

    echo -n "Subiendo $SECRET_NAME... "

    # Usamos comillas dobles para el VALUE para proteger caracteres especiales
    # --output none para mantener la terminal limpia
    az keyvault secret set \
        --vault-name "$VAULT_NAME" \
        --name "$SECRET_NAME" \
        --value "$VALUE" \
        --description "Sincronizado localmente para $PREFIX" \
        --output none

    if [ $? -eq 0 ]; then
        echo -e "\e[32m[OK]\e[0m"
    else
        echo -e "\e[31m[ERROR]\e[0m"
    fi

done < "$ENV_FILE"

echo -e "\n\e[32m--- Proceso finalizado para $PREFIX ---\e[0m"