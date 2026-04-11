#!/bin/sh
set -e

echo "▶ Ejecutando migraciones..."
node dist/scripts/migrate.js

echo "▶ Iniciando servidor..."
exec node dist/index.js
