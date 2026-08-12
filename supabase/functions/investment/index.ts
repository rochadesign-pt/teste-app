import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// PATCH  /investment?id=<id>  -> atualiza um investimento
// DELETE /investment?id=<id>  -> apaga um investimento
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
      `*[_type == "investment" && _id == $id][0].ownerId`,
      { id },
    );
    if (!owner) return jsonResponse({ error: "Investimento não encontrado." }, 404);
    if (owner !== user.id)
      return jsonResponse({ error: "Sem permissão para este investimento." }, 403);

    if (req.method === "PATCH") {
      const body = await req.json();
      const set: Record<string, unknown> = {};
      if (body.name !== undefined) set.name = String(body.name);
      if (body.initialValue !== undefined) set.initialValue = Number(body.initialValue) || 0;
      if (body.monthlyDeposit !== undefined) set.monthlyDeposit = Number(body.monthlyDeposit) || 0;
      if (body.annualRate !== undefined) set.annualRate = Number(body.annualRate) || 0;
      if (body.startDate !== undefined) set.startDate = String(body.startDate);
      if (body.icon !== undefined) set.icon = body.icon;
      if (body.color !== undefined) set.color = body.color;
      const updated = await sanity.patch(id).set(set).commit();
      return jsonResponse({ investment: updated });
    }

    if (req.method === "DELETE") {
      await sanity.delete(id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /investment:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
