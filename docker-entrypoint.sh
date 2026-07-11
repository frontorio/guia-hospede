#!/bin/sh
set -e

# Aplica o schema no banco antes de subir a API.
# Se houver migrations versionadas, usa `migrate deploy` (recomendado em
# produção). Caso contrário, sincroniza o schema diretamente com `db push`.
if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "==> Aplicando migrations (prisma migrate deploy)"
  npx prisma migrate deploy
else
  echo "==> Nenhuma migration encontrada; sincronizando schema (prisma db push)"
  npx prisma db push --skip-generate
fi

echo "==> Iniciando aplicação"
exec "$@"
