# Guia de deploy — pôr a app no teu iPhone (PWA)

Este guia leva-te de "código no GitHub" a "app com ícone no ecrã principal do
iPhone", sem App Store nem conta Apple Developer.

São **4 etapas**, por esta ordem (cada uma dá-te valores que a seguinte precisa):

| # | Etapa | O que fica live | Custo |
|---|-------|-----------------|-------|
| A | Sanity | Base de dados | Grátis |
| B | Supabase | Autenticação + API | Grátis |
| C | Vercel | A web app (URL público) | Grátis |
| D | iPhone | Ícone no ecrã principal | — |

No fim, sempre que fizermos `git push`, o Vercel reconstrói sozinho e a app no
teu telemóvel fica atualizada.

---

## Etapa A — Sanity (base de dados)

1. Vai a **[sanity.io/manage](https://www.sanity.io/manage)** e cria um projeto
   (ou usa um existente).
2. Aponta o **Project ID** (aparece no topo do projeto). Guarda-o.
3. Confirma que tens um **dataset** chamado `production` (é o predefinido).
4. Cria um **token de API**:
   - Projeto → **API** → **Tokens** → **Add API token**
   - Nome: `edge-functions` · Permissão: **Editor** (leitura + escrita)
   - Copia o token **agora** (só é mostrado uma vez). Guarda-o bem — é secreto.

> Não é preciso configurar CORS: a app **nunca** fala diretamente com o Sanity;
> quem fala é a edge function do Supabase, do lado do servidor.

*(Opcional)* Para editares dados/categorias num painel visual:
```bash
cd sanity
npm install
cp .env.example .env      # preenche SANITY_STUDIO_PROJECT_ID e DATASET
npm run dev               # Studio em http://localhost:3333
```

**No fim desta etapa tens:** `SANITY_PROJECT_ID`, `SANITY_DATASET=production`,
`SANITY_API_TOKEN`.

---

## Etapa B — Supabase (autenticação + API)

1. Cria um projeto em **[supabase.com](https://supabase.com)**.
2. Em **Project Settings → API**, aponta:
   - **Project URL** → será o `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → será o `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     *(esta chave é pública por design — pode viver no telemóvel)*
3. Em **Authentication → Providers → Email**: garante que está **ativo**.
   Para começares sem fricção, podes desligar a confirmação por email
   (**Authentication → Sign In / Providers → Confirm email = off**).
4. Instala a **[CLI do Supabase](https://supabase.com/docs/guides/cli)** e faz o
   deploy das edge functions (a nossa "camada API"):

```bash
cd supabase
supabase login
supabase link --project-ref <o-teu-project-ref>   # o ref está no URL do projeto

# Secrets das funções (inclui o token do Sanity da Etapa A)
cp functions/.env.example functions/.env
#  -> edita functions/.env e preenche:
#     SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION, SANITY_API_TOKEN
supabase secrets set --env-file functions/.env

# Deploy
supabase functions deploy expenses
supabase functions deploy expense
```

> `SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetados automaticamente nas
> funções — não os metas nos secrets.

O URL base da API será:
`https://<project-ref>.supabase.co/functions/v1`
→ este é o `EXPO_PUBLIC_API_URL`.

**No fim desta etapa tens:** `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_URL`.

---

## Etapa C — Vercel (publicar a web app)

1. Cria conta em **[vercel.com](https://vercel.com)** (podes entrar com o GitHub).
2. **Add New → Project** e importa o repositório `rochadesign-pt/teste-app`.
3. Configura assim (importante, porque a app está na pasta `mobile/`):

   | Campo | Valor |
   |-------|-------|
   | **Root Directory** | `mobile` |
   | **Framework Preset** | Other |
   | **Build Command** | `npm run build:web` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |

4. Em **Environment Variables**, adiciona as três (das etapas A/B):

   ```
   EXPO_PUBLIC_SUPABASE_URL       = https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY  = <a-tua-anon-key>
   EXPO_PUBLIC_API_URL            = https://<project-ref>.supabase.co/functions/v1
   ```

   > Estas variáveis são "cozidas" no build (prefixo `EXPO_PUBLIC_`). Se as
   > mudares mais tarde, tens de fazer **Redeploy**.

5. **Deploy**. No fim, o Vercel dá-te um URL tipo
   `https://teste-app.vercel.app`. Abre-o no computador para confirmar que
   carrega o ecrã de login.

---

## Etapa D — Instalar no iPhone

1. No **iPhone**, abre o URL do Vercel no **Safari**
   (tem de ser o Safari — o "Adicionar ao ecrã principal" é dele).
2. Toca no botão **Partilhar** (o quadrado com a seta para cima).
3. Escolhe **Adicionar ao ecrã principal**.
4. Confirma o nome ("Custos") e toca em **Adicionar**.

Fica um ícone no ecrã principal. Ao abri-lo, a app corre em **ecrã inteiro**,
sem a barra do Safari — como uma app nativa. Cria a tua conta e começa a usar.

---

## Como funcionam as atualizações

Depois de tudo montado, o ciclo é automático:

```
alteração no código → git push → Vercel reconstrói → abres a app e está atualizada
```

Não precisas de reinstalar nada no telemóvel.

---

## Notas de segurança

- A **anon key** do Supabase é pública por design; a segurança real vem da
  validação da sessão nas edge functions + do filtro por `ownerId`.
- O **token do Sanity** vive **apenas** como secret no Supabase — nunca é
  enviado para o telemóvel.
- Numa PWA, a sessão é guardada no armazenamento do browser (protegido por
  HTTPS + o passcode do telemóvel). Para uso pessoal é seguro; é apenas
  ligeiramente menos "blindado" que o Keychain de uma app nativa.

## E se um dia quiseres app nativa (App Store / notificações push)?

O mesmo código serve. Bastaria usar o **EAS Build** para gerar a app nativa e
distribuí-la via TestFlight/App Store. Nada do que fizeste aqui se perde.
