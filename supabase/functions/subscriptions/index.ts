import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET  /subscriptions  -> lista as recorrências do utilizador
// POST /subscriptions  -> cria uma recorrência
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return jsonResponse({ error }, 401);

  try {
    if (req.method === "GET") {
      const subscriptions = await sanity.fetch(
        `*[_type == "subscription" && ownerId == $ownerId] | order(amount desc) {
          _id, name, amount, icon, color
        }`,
        { ownerId: user.id },
      );
      return jsonResponse({ subscriptions });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.name || typeof body.amount !== "number" || body.amount <= 0) {
        return jsonResponse(
          { error: "Campos obrigatórios: name, amount (número > 0)." },
          400,
        );
      }
      const created = await sanity.create({
        _type: "subscription",
        name: String(body.name),
        amount: body.amount,
        icon: body.icon ?? undefined,
        color: body.color ?? undefined,
        ownerId: user.id,
      });
      return jsonResponse({ subscription: created }, 201);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /subscriptions:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
