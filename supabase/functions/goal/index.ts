import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// PATCH  /goal?id=<id>  -> atualiza um objetivo (inclui adicionar poupança)
// DELETE /goal?id=<id>  -> apaga um objetivo
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse({ error }, 401);
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return jsonResponse({ error: "Falta o parâmetro 'id'." }, 400);
  }

  try {
    // Verificação de posse antes de qualquer mutação.
    const owner = await sanity.fetch(
      `*[_type == "goal" && _id == $id][0].ownerId`,
      { id },
    );
    if (!owner) return jsonResponse({ error: "Objetivo não encontrado." }, 404);
    if (owner !== user.id)
      return jsonResponse({ error: "Sem permissão para este objetivo." }, 403);

    if (req.method === "PATCH") {
      const body = await req.json();
      const patch = sanity.patch(id);

      const set: Record<string, unknown> = {};
      if (body.name !== undefined) set.name = String(body.name);
      if (body.icon !== undefined) set.icon = body.icon;
      if (body.color !== undefined) set.color = body.color;
      if (typeof body.target === "number") set.target = body.target;
      if (typeof body.saved === "number") set.saved = body.saved;
      if (body.monthly !== undefined) set.monthly = body.monthly;
      if (Object.keys(set).length) patch.set(set);

      // Adicionar poupança de forma incremental e segura.
      if (typeof body.addSaved === "number" && body.addSaved !== 0) {
        patch.inc({ saved: body.addSaved });
      }

      const updated = await patch.commit();
      return jsonResponse({ goal: updated });
    }

    if (req.method === "DELETE") {
      await sanity.delete(id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /goal:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
