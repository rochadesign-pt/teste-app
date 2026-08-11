import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// PATCH  /subscription?id=<id>  -> atualiza uma recorrência
// DELETE /subscription?id=<id>  -> apaga uma recorrência
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return jsonResponse({ error }, 401);

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return jsonResponse({ error: "Falta o parâmetro 'id'." }, 400);

  try {
    const owner = await sanity.fetch(
      `*[_type == "subscription" && _id == $id][0].ownerId`,
      { id },
    );
    if (!owner) return jsonResponse({ error: "Recorrência não encontrada." }, 404);
    if (owner !== user.id)
      return jsonResponse({ error: "Sem permissão para esta recorrência." }, 403);

    if (req.method === "PATCH") {
      const body = await req.json();
      const set: Record<string, unknown> = {};
      if (body.name !== undefined) set.name = String(body.name);
      if (typeof body.amount === "number") set.amount = body.amount;
      if (body.icon !== undefined) set.icon = body.icon;
      if (body.color !== undefined) set.color = body.color;
      const updated = await sanity.patch(id).set(set).commit();
      return jsonResponse({ subscription: updated });
    }

    if (req.method === "DELETE") {
      await sanity.delete(id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /subscription:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
