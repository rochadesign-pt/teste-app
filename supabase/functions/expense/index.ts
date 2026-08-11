import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// PATCH  /expense?id=<id>  -> atualiza uma despesa do utilizador
// DELETE /expense?id=<id>  -> apaga uma despesa do utilizador
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
    // Verificação de propriedade: confirma que a despesa pertence ao utilizador
    // ANTES de qualquer mutação. Impede aceder a dados de terceiros.
    const owner = await sanity.fetch(
      `*[_type == "expense" && _id == $id][0].ownerId`,
      { id },
    );

    if (!owner) {
      return jsonResponse({ error: "Despesa não encontrada." }, 404);
    }
    if (owner !== user.id) {
      return jsonResponse({ error: "Sem permissão para esta despesa." }, 403);
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const allowed: Record<string, unknown> = {};

      if (body.title !== undefined) allowed.title = String(body.title);
      if (body.amount !== undefined) allowed.amount = body.amount;
      if (body.currency !== undefined) allowed.currency = body.currency;
      if (body.date !== undefined) allowed.date = body.date;
      if (body.paymentMethod !== undefined) {
        allowed.paymentMethod = body.paymentMethod;
      }
      if (body.note !== undefined) allowed.note = body.note;
      if (body.categoryId !== undefined) {
        allowed.category = body.categoryId
          ? { _type: "reference", _ref: String(body.categoryId) }
          : undefined;
      }

      const updated = await sanity
        .patch(id)
        .set(allowed)
        .commit();
      return jsonResponse({ expense: updated });
    }

    if (req.method === "DELETE") {
      await sanity.delete(id);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /expense:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
