# Controlo de Custos 📱

Aplicação **mobile** pessoal para controlo de despesas.

- **App** — [Expo](https://expo.dev) (React Native + TypeScript)
- **Autenticação** — [Supabase Auth](https://supabase.com)
- **Base de dados** — [Sanity](https://www.sanity.io)
- **Camada API** — Supabase Edge Functions (validam a sessão e falam com o Sanity)

## Como está montada a segurança 🔒

O ponto central: **o token do Sanity nunca chega ao telemóvel.**

```
┌─────────────┐   1. login/sessão      ┌──────────────┐
│             │ ─────────────────────▶ │  Supabase    │
│  App (Expo) │                        │  Auth        │
│             │ ◀───────────────────── │              │
│             │   access_token (JWT)   └──────────────┘
│             │
│             │   2. pedido + JWT      ┌──────────────────────┐   3. valida JWT
│             │ ─────────────────────▶ │  Edge Function       │──────┐
│             │                        │  (a "camada API")    │      │
│             │                        │                      │ ◀────┘
│             │                        │  4. fala c/ Sanity   │   token Sanity
│             │                        │     filtrando por    │   (secret, só aqui)
│             │ ◀───────────────────── │     ownerId == user  │──────▶ Sanity
└─────────────┘   5. só os teus dados  └──────────────────────┘
```

1. A app autentica-se no Supabase e recebe um `access_token`.
2. Em cada pedido, envia esse token no cabeçalho `Authorization`.
3. A edge function **valida o token** com o Supabase.
4. Só depois fala com o Sanity, usando um token de escrita que vive **apenas**
   como *secret* no servidor, e **filtra sempre por `ownerId == user.id`**.
5. Cada utilizador só consegue ler/alterar/apagar as suas próprias despesas
   (há verificação de dono antes de qualquer alteração).

## Estrutura do projeto

```
teste-app/
├── mobile/      → app Expo (React Native)
├── sanity/      → Sanity Studio + esquema de dados (expense, category)
└── supabase/    → edge functions (a camada API segura)
```

## Setup passo a passo

### 1. Sanity (base de dados)

```bash
cd sanity
npm install
cp .env.example .env      # preenche SANITY_STUDIO_PROJECT_ID e DATASET
npm run dev               # abre o Studio em http://localhost:3333
```

- Cria um projeto em [sanity.io/manage](https://www.sanity.io/manage) e copia o
  **Project ID**.
- Gera um **token de API com permissão de escrita** (Editor). Vais precisar dele
  no passo do Supabase (é o `SANITY_API_TOKEN`).
- Faz deploy do Studio quando quiseres: `npm run deploy`.

### 2. Supabase (auth + camada API)

- Cria um projeto em [supabase.com](https://supabase.com).
- Em **Authentication → Providers**, garante que o *Email* está ativo. Para
  desenvolvimento podes desativar a confirmação por email.
- Instala a [CLI do Supabase](https://supabase.com/docs/guides/cli) e liga o
  projeto:

```bash
cd supabase
supabase login
supabase link --project-ref <o-teu-project-ref>

# Define os secrets das edge functions (inclui o token do Sanity)
cp functions/.env.example functions/.env   # preenche os valores
supabase secrets set --env-file functions/.env

# Faz deploy das funções
supabase functions deploy expenses
supabase functions deploy expense
```

> `SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetados automaticamente nas funções
> — não precisas de os definir.

### 3. App mobile (Expo)

```bash
cd mobile
npm install
cp .env.example .env      # preenche URL/anon key do Supabase e o API_URL
npm start                 # abre o Expo; usa o Expo Go ou um simulador
```

- `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estão no painel do
  Supabase em **Project Settings → API**. A *anon key* é pública por design.
- `EXPO_PUBLIC_API_URL` é normalmente
  `https://<project-ref>.supabase.co/functions/v1`.

## O que já funciona

- ✅ Registo e login por email/palavra-passe (Supabase)
- ✅ Sessão persistida de forma segura (Keychain/Keystore via `expo-secure-store`)
- ✅ Rotas protegidas (sem sessão → login)
- ✅ Listar, criar e apagar despesas — sempre isoladas por utilizador
- ✅ Total das despesas no topo
- ✅ Sanity Studio para gerir dados e categorias

## Próximos passos sugeridos

- Categorias na app (o esquema já suporta; falta o seletor no formulário)
- Edição de despesas (o endpoint `PATCH /expense` já existe)
- Filtros por mês e gráficos de resumo
- Recuperação de palavra-passe / login social
- Restringir o CORS das edge functions à origem da app
