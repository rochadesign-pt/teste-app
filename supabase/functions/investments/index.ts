import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET  /investments  -> lista os investimentos do utilizador
// POST /investments  -> cria um investimento
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return jsonResponse({ error }, 401);

  try {
    if (req.method === "GET") {
      const investments = await sanity.fetch(
        `*[_type == "investment" && ownerId == $ownerId] | order(_createdAt asc) {
          _id, name, initialValue, monthlyDeposit, annualRate, startDate, icon, color
        }`,
        { ownerId: user.id },
      );
      return jsonResponse({ investments });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.name) {
        return jsonResponse({ error: "Campo obrigatório: name." }, 400);
      }
      const created = await sanity.create({
        _type: "investment",
        name: String(body.name),
        initialValue: Number(body.initialValue) || 0,
        monthlyDeposit: Number(body.monthlyDeposit) || 0,
        annualRate: Number(body.annualRate) || 0,
        startDate: body.startDate ? String(body.startDate) : undefined,
        icon: body.icon ?? undefined,
        color: body.color ?? undefined,
        ownerId: user.id,
      });
      return jsonResponse({ investment: created }, 201);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /investments:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
