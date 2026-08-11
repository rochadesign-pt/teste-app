import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET  /goals  -> lista os objetivos do utilizador
// POST /goals  -> cria um objetivo
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse({ error }, 401);
  }

  try {
    if (req.method === "GET") {
      const goals = await sanity.fetch(
        `*[_type == "goal" && ownerId == $ownerId] | order(_createdAt asc) {
          _id, name, icon, color, target, saved, monthly
        }`,
        { ownerId: user.id },
      );
      return jsonResponse({ goals });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.name || typeof body.target !== "number" || body.target <= 0) {
        return jsonResponse(
          { error: "Campos obrigatórios: name, target (número > 0)." },
          400,
        );
      }
      const created = await sanity.create({
        _type: "goal",
        name: String(body.name),
        icon: body.icon ?? undefined,
        color: body.color ?? undefined,
        target: body.target,
        saved: typeof body.saved === "number" ? body.saved : 0,
        monthly: typeof body.monthly === "number" ? body.monthly : undefined,
        ownerId: user.id,
      });
      return jsonResponse({ goal: created }, 201);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /goals:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
