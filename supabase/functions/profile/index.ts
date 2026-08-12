import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET /profile  -> devolve o perfil do utilizador (ou valores por omissão)
// PUT /profile  -> cria/atualiza o perfil (upsert por ownerId)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return jsonResponse({ error }, 401);

  try {
    if (req.method === "GET") {
      const existing = await sanity.fetch(
        `*[_type == "profile" && ownerId == $ownerId][0]{ _id, monthlyIncome, mealAllowance }`,
        { ownerId: user.id },
      );
      return jsonResponse({
        profile: {
          monthlyIncome: existing?.monthlyIncome ?? 0,
          mealAllowance: existing?.mealAllowance ?? 0,
        },
      });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json();
      const income = Math.max(0, Number(body.monthlyIncome) || 0);
      const meal = Math.max(0, Number(body.mealAllowance) || 0);

      const existingId = await sanity.fetch(
        `*[_type == "profile" && ownerId == $ownerId][0]._id`,
        { ownerId: user.id },
      );

      if (existingId) {
        await sanity
          .patch(existingId)
          .set({ monthlyIncome: income, mealAllowance: meal })
          .commit();
      } else {
        await sanity.create({
          _type: "profile",
          monthlyIncome: income,
          mealAllowance: meal,
          ownerId: user.id,
        });
      }
      return jsonResponse({
        profile: { monthlyIncome: income, mealAllowance: meal },
      });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /profile:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
