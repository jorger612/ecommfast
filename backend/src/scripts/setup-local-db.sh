#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# EcommFast — Setup DB Local (PostgreSQL nativo)
# Crea el usuario, la base de datos y ejecuta las migraciones.
# Uso: bash src/scripts/setup-local-db.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

DB_NAME="ecommfast"
DB_USER="ecommfast_user"
DB_PASSWORD="ecommfast_secret"

echo ""
echo -e "${BOLD}EcommFast — Setup de Base de Datos Local${RESET}"
echo "────────────────────────────────────────"

# 1. Detectar WSL2
IS_WSL=false
if grep -qi microsoft /proc/version 2>/dev/null; then
  IS_WSL=true
  echo -e "${YELLOW}ℹ  Entorno WSL2 detectado${RESET}"
fi

# 2. Verificar PostgreSQL activo
if ! pg_isready -h 127.0.0.1 -p 5432 -q 2>/dev/null; then
  echo -e "${RED}✗  PostgreSQL no está activo.${RESET}"
  if $IS_WSL; then
    echo -e "   Ejecuta: ${BOLD}sudo service postgresql start${RESET}"
  else
    echo -e "   Ejecuta: ${BOLD}sudo systemctl start postgresql${RESET}"
  fi
  exit 1
fi
echo -e "${GREEN}✓  PostgreSQL activo${RESET}"

# Helper: ejecuta psql como postgres desde /tmp para evitar el warning
# "could not change directory" cuando postgres no tiene permisos sobre $PWD
pg_exec() {
  cd /tmp && sudo -u postgres psql "$@"
  cd - > /dev/null
}

# 3. Crear usuario si no existe
echo -e "→  Verificando usuario ${BOLD}${DB_USER}${RESET}..."
if pg_exec -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  echo -e "${YELLOW}   Usuario ya existe, omitiendo creación${RESET}"
else
  pg_exec -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
  echo -e "${GREEN}✓  Usuario ${DB_USER} creado${RESET}"
fi

# 4. Crear base de datos si no existe
echo -e "→  Verificando base de datos ${BOLD}${DB_NAME}${RESET}..."
if pg_exec -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo -e "${YELLOW}   Base de datos ya existe, omitiendo creación${RESET}"
else
  pg_exec -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  pg_exec -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
  echo -e "${GREEN}✓  Base de datos ${DB_NAME} creada${RESET}"
fi

# 5. Instalar dependencias si no existen
SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
  echo -e "→  Instalando dependencias npm..."
  npm install
  echo -e "${GREEN}✓  Dependencias instaladas${RESET}"
else
  echo -e "${YELLOW}ℹ  node_modules ya existe, omitiendo npm install${RESET}"
fi

# 6. Ejecutar migraciones
echo -e "→  Ejecutando migraciones..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}"
npm run migrate

echo ""
echo -e "${GREEN}${BOLD}✓  Setup completado. DB local lista para EcommFast.${RESET}"
echo -e "   Ejecuta ${BOLD}npm run health-check${RESET} para verificar."
echo ""
