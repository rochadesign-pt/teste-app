import { createClient } from "https://esm.sh/@sanity/client@6.24.1";

/**
 * Cliente Sanity com token de escrita. Vive APENAS no servidor (edge function)
 * — o token é um secret do Supabase e nunca é exposto à app.
 */
export const sanity = createClient({
  projectId: Deno.env.get("SANITY_PROJECT_ID") ?? "",
  dataset: Deno.env.get("SANITY_DATASET") ?? "production",
  apiVersion: Deno.env.get("SANITY_API_VERSION") ?? "2024-01-01",
  token: Deno.env.get("SANITY_API_TOKEN"),
  useCdn: false,
});
