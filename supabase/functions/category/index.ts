import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// PATCH  /category?id=<id>  -> atualiza uma categoria
// DELETE /category?id=<id>  -> apaga uma categoria
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
      `*[_type == "category" && _id == $id][0].ownerId`,
      { id },
    );
    if (!owner) return jsonResponse({ error: "Categoria não encontrada." }, 404);
    if (owner !== user.id)
      return jsonResponse({ error: "Sem permissão para esta categoria." }, 403);

    if (req.method === "PATCH") {
      const body = await req.json();
      const set: Record<string, unknown> = {};
      const unset: string[] = [];
      if (body.name !== undefined) set.name = String(body.name);
      if (body.icon !== undefined) set.icon = body.icon;
      if (body.color !== undefined) set.color = body.color;
      if (body.budget !== undefined) {
        const b = Number(body.budget);
        if (!b || b <= 0) unset.push("budget");
        else set.budget = b;
      }
      let patch = sanity.patch(id).set(set);
      if (unset.length) patch = patch.unset(unset);
      const updated = await patch.commit();
      return jsonResponse({ category: updated });
    }

    if (req.method === "DELETE") {
      await sanity.delete(id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /category:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
