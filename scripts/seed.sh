#!/usr/bin/env bash
#
# Carrega as categorias + despesas de exemplo (as da demo) diretamente no Sanity.
# Uso:  bash scripts/seed.sh <O_TEU_SUPABASE_USER_ID>
#
# O user id está em: Supabase -> Authentication -> Users -> (o teu utilizador) -> UID.
# O token e o project id são lidos de supabase/functions/.env (não vão para lado nenhum).

set -euo pipefail

OWNER="${1:-}"
if [ -z "$OWNER" ]; then
  echo "❌ Falta o teu Supabase user id."
  echo "   Uso: bash scripts/seed.sh <SUPABASE_USER_ID>"
  echo "   (Supabase -> Authentication -> Users -> copia o UID)"
  exit 1
fi

ENV_FILE="supabase/functions/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Não encontrei $ENV_FILE. Corre a partir da raiz do repositório."
  exit 1
fi

get() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d ' "'; }
PROJECT="$(get SANITY_PROJECT_ID)"
TOKEN="$(get SANITY_API_TOKEN)"
DATASET="$(get SANITY_DATASET)"
DATASET="${DATASET:-production}"

if [ -z "$PROJECT" ] || [ -z "$TOKEN" ]; then
  echo "❌ Falta SANITY_PROJECT_ID ou SANITY_API_TOKEN em $ENV_FILE."
  exit 1
fi

# Datas relativas (macOS/BSD date)
d() { date -v-"$1"d +%F 2>/dev/null || date -d "-$1 day" +%F; }
D0="$(d 0)"; D1="$(d 1)"; D2="$(d 2)"; D3="$(d 3)"; D4="$(d 4)"; D6="$(d 6)"; D7="$(d 7)"; D9="$(d 9)"

read -r -d '' BODY <<JSON || true
{
  "mutations": [
    { "createOrReplace": { "_id": "seed-cat-food",     "_type": "category", "name": "Restaurantes", "icon": "🍴", "color": "#FF9500", "budget": 220 } },
    { "createOrReplace": { "_id": "seed-cat-transport","_type": "category", "name": "Transportes",  "icon": "🚗", "color": "#0A84FF", "budget": 150 } },
    { "createOrReplace": { "_id": "seed-cat-home",     "_type": "category", "name": "Habitação",    "icon": "🏠", "color": "#8B5CF6", "budget": 800 } },
    { "createOrReplace": { "_id": "seed-cat-shopping", "_type": "category", "name": "Compras",      "icon": "🛒", "color": "#34C759", "budget": 140 } },
    { "createOrReplace": { "_id": "seed-cat-leisure",  "_type": "category", "name": "Lazer",        "icon": "🎬", "color": "#FF375F", "budget": 120 } },

    { "createOrReplace": { "_id": "seed-exp-1", "_type": "expense", "ownerId": "$OWNER", "title": "Renda da casa",      "amount": 750,   "currency": "EUR", "date": "$D9", "category": { "_type": "reference", "_ref": "seed-cat-home" } } },
    { "createOrReplace": { "_id": "seed-exp-2", "_type": "expense", "ownerId": "$OWNER", "title": "Continente",         "amount": 74.18, "currency": "EUR", "date": "$D7", "category": { "_type": "reference", "_ref": "seed-cat-shopping" } } },
    { "createOrReplace": { "_id": "seed-exp-3", "_type": "expense", "ownerId": "$OWNER", "title": "Combustível",        "amount": 62.30, "currency": "EUR", "date": "$D6", "category": { "_type": "reference", "_ref": "seed-cat-transport" } } },
    { "createOrReplace": { "_id": "seed-exp-4", "_type": "expense", "ownerId": "$OWNER", "title": "Jantar fora",        "amount": 38.5,  "currency": "EUR", "date": "$D4", "category": { "_type": "reference", "_ref": "seed-cat-food" } } },
    { "createOrReplace": { "_id": "seed-exp-5", "_type": "expense", "ownerId": "$OWNER", "title": "Netflix",            "amount": 13.99, "currency": "EUR", "date": "$D3", "category": { "_type": "reference", "_ref": "seed-cat-leisure" } } },
    { "createOrReplace": { "_id": "seed-exp-6", "_type": "expense", "ownerId": "$OWNER", "title": "Uber",               "amount": 8.40,  "currency": "EUR", "date": "$D2", "category": { "_type": "reference", "_ref": "seed-cat-transport" } } },
    { "createOrReplace": { "_id": "seed-exp-7", "_type": "expense", "ownerId": "$OWNER", "title": "Cinema",             "amount": 24,    "currency": "EUR", "date": "$D2", "category": { "_type": "reference", "_ref": "seed-cat-leisure" } } },
    { "createOrReplace": { "_id": "seed-exp-8", "_type": "expense", "ownerId": "$OWNER", "title": "Almoço no trabalho", "amount": 11.5,  "currency": "EUR", "date": "$D1", "category": { "_type": "reference", "_ref": "seed-cat-food" } } },
    { "createOrReplace": { "_id": "seed-exp-9", "_type": "expense", "ownerId": "$OWNER", "title": "Starbucks",          "amount": 5.20,  "currency": "EUR", "date": "$D0", "category": { "_type": "reference", "_ref": "seed-cat-food" } } }
  ]
}
JSON

URL="https://${PROJECT}.api.sanity.io/v2021-10-21/data/mutate/${DATASET}?returnIds=true&visibility=sync"
echo "▶️  A escrever no Sanity (projeto $PROJECT, dataset $DATASET) para o utilizador $OWNER…"

HTTP=$(curl -sS -o /tmp/seed_resp.json -w "%{http_code}" \
  -X POST "$URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY")

echo "HTTP $HTTP"
echo "--- resposta ---"
cat /tmp/seed_resp.json; echo

if [ "$HTTP" = "200" ]; then
  echo "✅ Feito! Abre a app e faz refresh — devem aparecer 9 despesas e 5 categorias."
else
  echo "⚠️  Falhou. Se disser algo como 'Insufficient permissions', o teu token do Sanity é só de leitura:"
  echo "   cria um token com permissão de Editor (sanity.io/manage -> API -> Tokens),"
  echo "   volta a correr 'supabase secrets set --env-file supabase/functions/.env' e este script."
fi
