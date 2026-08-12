# ☀️ Correr de manhã — deploy pendente

Copia e cola este bloco no terminal, **na raiz do projeto** (`teste-app/`),
com o Supabase CLI já ligado ao projeto (`supabase link` já feito antes).

```bash
# Publica as edge functions (investimentos + rendimento + categorias)
supabase functions deploy investments
supabase functions deploy investment
supabase functions deploy profile
supabase functions deploy category
```

> `category` é a mais recente (editar/apagar categorias e orçamentos).
> Criar e listar categorias já funcionava antes. Mesmo sem este deploy, a
> app deixa-te gerir categorias no telemóvel (guarda localmente) e sincroniza
> quando publicares.

Isto ativa em produção:

- **Investimentos com depósitos recorrentes** (tab Investir → "Os meus investimentos")
- **Rendimento mensal** = salário líquido + subsídio de alimentação (Conta → Rendimento)
- **Análise do mês fidedigna** (saldo do mês e taxa de poupança)

## Opcional — Sanity Studio

As funções escrevem no Sanity na mesma sem isto. Só precisas se quiseres
**ver/editar** os novos tipos (`investment`, `profile`) dentro do Studio:

```bash
cd sanity
npx sanity deploy
cd ..
```

## Verificação rápida (opcional)

Depois do deploy, confirma que respondem (401 = no ar, à espera de sessão):

```bash
curl -s -o /dev/null -w "profile: %{http_code}\n"      https://fhbiklshcyjidspfpszm.supabase.co/functions/v1/profile
curl -s -o /dev/null -w "investments: %{http_code}\n"  https://fhbiklshcyjidspfpszm.supabase.co/functions/v1/investments
curl -s -o /dev/null -w "investment: %{http_code}\n"   https://fhbiklshcyjidspfpszm.supabase.co/functions/v1/investment
```

> A app não quebra sem isto — as secções aparecem vazias (com atalho para
> adicionar). Assim que fizeres deploy, começam a guardar.

---

_Podes apagar este ficheiro depois de correres tudo._
