import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

/**
 * Valida o token de acesso Supabase enviado pela app no cabeçalho
 * Authorization e devolve o utilizador autenticado.
 *
 * Isto garante que só pedidos com uma sessão Supabase válida chegam ao Sanity.
 * O token do Sanity nunca sai do servidor.
 */
export async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "Falta o cabeçalho Authorization." };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Sessão inválida ou expirada." };
  }

  return { user, error: null };
}
