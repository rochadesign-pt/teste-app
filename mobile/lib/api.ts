import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export type Category = {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
};

export type Expense = {
  _id: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod?: string;
  note?: string;
  category?: Category | null;
};

export type ExpenseInput = {
  title: string;
  amount: number;
  currency?: string;
  date: string;
  paymentMethod?: string;
  note?: string;
  categoryId?: string;
};

/**
 * Faz um pedido à camada API (edge functions) juntando SEMPRE o token de
 * acesso da sessão Supabase atual. É esse token que a função valida antes
 * de falar com o Sanity.
 */
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sem sessão ativa. Inicia sessão novamente.");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers ?? {}),
    },
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload?.error ?? `Erro ${res.status}`);
  }

  return payload as T;
}

export const api = {
  listExpenses: () =>
    apiFetch<{ expenses: Expense[] }>("/expenses").then((r) => r.expenses),

  createExpense: (input: ExpenseInput) =>
    apiFetch<{ expense: Expense }>("/expenses", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.expense),

  updateExpense: (id: string, input: Partial<ExpenseInput>) =>
    apiFetch<{ expense: Expense }>(`/expense?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((r) => r.expense),

  deleteExpense: (id: string) =>
    apiFetch<{ success: boolean }>(`/expense?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
