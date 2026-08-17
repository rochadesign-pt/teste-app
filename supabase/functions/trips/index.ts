import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { sanity } from "../_shared/sanity.ts";

// GET /trips  -> devolve as viagens do utilizador (array)
// PUT /trips  -> substitui o conjunto de viagens do utilizador
//
// As viagens são dados aninhados (membros, despesas, acertos). Para manter
// simples e robusto, guardamos TODO o array como JSON num único documento
// por utilizador (`tripStore`), espelhando o modelo local do cliente.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { user, error } = await getAuthenticatedUser(req);
  if (!user) return jsonResponse({ error }, 401);

  const docId = `trips.${user.id}`;

  try {
    if (req.method === "GET") {
      const existing = await sanity.fetch(
        `*[_type == "tripStore" && ownerId == $ownerId][0]{ dataJson }`,
        { ownerId: user.id },
      );
      let trips: unknown[] = [];
      if (existing?.dataJson) {
        try {
          const parsed = JSON.parse(existing.dataJson);
          if (Array.isArray(parsed)) trips = parsed;
        } catch {
          trips = [];
        }
      }
      return jsonResponse({ trips });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      const body = await req.json();
      const trips = Array.isArray(body?.trips) ? body.trips : [];
      await sanity.createOrReplace({
        _id: docId,
        _type: "tripStore",
        ownerId: user.id,
        dataJson: JSON.stringify(trips),
      });
      return jsonResponse({ trips });
    }

    return jsonResponse({ error: "Método não suportado." }, 405);
  } catch (err) {
    console.error("Erro em /trips:", err);
    return jsonResponse({ error: "Erro interno ao processar o pedido." }, 500);
  }
});
