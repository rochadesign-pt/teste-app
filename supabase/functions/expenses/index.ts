import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET  /expenses        -> lista as despesas do utilizador autenticado
// POST /expenses        -> cria uma despesa para o utilizador autenticado
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Autenticação: só passa quem tiver uma sessão Supabase válida.
  const { user, error } = await getAuthenticatedUser(req);
  if (!user) {
    return jsonResponse({ error }, 401);
  }

  try {
    // 2. LISTAR
    if (req.method === "GET") {
      const expenses = await sanity.fetch(
        `*[_type == "expense" && ownerId == $ownerId] | order(date desc, _createdAt desc) {
          _id,
          title,
          amount,
          currency,
          date,
          paymentMethod,
          note,
          "category": category->{ _id, name, icon, color, budget }
        }`,
        { ownerId: user.id },
      );
      return jsonResponse({ expenses });
    }

    // 3. CRIAR
    if (req.method === "POST") {
      const body = await req.json();

      if (!body.title || typeof body.amount !== "number" || !body.date) {
        return jsonResponse(
          { error: "Campos obrigatórios: title, amount (número), date." },
          400,
        );
      }

      const doc = {
        _type: "expense",
        title: String(body.title),
        amount: body.amount,
        currency: body.currency ?? "EUR",
        date: body.date,
        paymentMethod: body.paymentMethod ?? undefined,
        note: body.note ?? undefined,
        // O ownerId é imposto pelo servidor a partir da sessão — nunca do body.
        ownerId: user.id,
        ...(body.categoryId
          ? {
              category: {
                _type: "reference",
                _ref: String(body.categoryId),
              },
            }
          : {}),
      };

      const created = await sanity.create(doc);
      return jsonResponse({ expense: created }, 201);
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /expenses:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
