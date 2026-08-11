import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET  /categories  -> lista todas as categorias
// POST /categories  -> cria uma categoria
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
      const categories = await sanity.fetch(
        `*[_type == "category"] | order(name asc) {
          _id, name, icon, color, budget
        }`,
      );
      return jsonResponse({ categories });
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.name) {
        return jsonResponse({ error: "Falta o nome da categoria." }, 400);
      }
      const created = await sanity.create({
        _type: "category",
        name: String(body.name),
        icon: body.icon ?? undefined,
        color: body.color ?? undefined,
        budget: typeof body.budget === "number" ? body.budget : undefined,
      });
      return jsonResponse({ category: created }, 201);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /categories:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
