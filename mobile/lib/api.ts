import { supabase } from "./supabase";

// URL da camada API (edge functions). Se EXPO_PUBLIC_API_URL não estiver
// definido, deriva-o do URL do Supabase — assim basta ter o SUPABASE_URL.
const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").replace(
  /\/+$/,
  "",
);
const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  `${SUPABASE_URL}/functions/v1`;

export type Category = {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  budget?: number;
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

export type Goal = {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  target: number;
  saved: number;
  monthly?: number;
};

export type GoalInput = {
  name: string;
  target: number;
  saved?: number;
  monthly?: number;
  icon?: string;
  color?: string;
};

export const api = {
  listGoals: () =>
    apiFetch<{ goals: Goal[] }>("/goals").then((r) => r.goals),

  createGoal: (input: GoalInput) =>
    apiFetch<{ goal: Goal }>("/goals", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.goal),

  updateGoal: (
    id: string,
    input: Partial<GoalInput> & { addSaved?: number },
  ) =>
    apiFetch<{ goal: Goal }>(`/goal?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((r) => r.goal),

  deleteGoal: (id: string) =>
    apiFetch<{ success: boolean }>(`/goal?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  listCategories: () =>
    apiFetch<{ categories: Category[] }>("/categories").then(
      (r) => r.categories,
    ),

  createCategory: (input: {
    name: string;
    icon?: string;
    color?: string;
    budget?: number;
  }) =>
    apiFetch<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.category),

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
