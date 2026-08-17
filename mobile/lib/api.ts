import { supabase } from "./supabase";
import { localGet, localSet, localId } from "./localStore";

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

export type CategoryInput = {
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

export type Subscription = {
  _id: string;
  name: string;
  amount: number;
  icon?: string;
  color?: string;
  dueDay?: number; // dia do mês em que é debitada (1-31)
};

export type Investment = {
  _id: string;
  name: string;
  initialValue: number;
  monthlyDeposit: number;
  annualRate: number;
  startDate?: string;
  icon?: string;
  color?: string;
};

export type InvestmentInput = {
  name: string;
  initialValue: number;
  monthlyDeposit: number;
  annualRate: number;
  startDate?: string;
  icon?: string;
  color?: string;
};

export type Profile = {
  monthlyIncome: number;
  mealAllowance: number;
  // Foto de perfil (data URI / uri local). Guardada só no dispositivo —
  // não é enviada para o servidor.
  photoUrl?: string;
};

// --- Viagens / despesas partilhadas em grupo ---
export type TripMember = { id: string; name: string };
export type TripExpense = {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // id do membro que pagou
  split: string[]; // ids dos membros que partilham (divisão igual)
  date: string;
};
export type TripPayment = {
  id: string;
  from: string; // id do membro que pagou o acerto
  to: string; // id do membro que recebeu
  amount: number;
};
export type Trip = {
  _id: string;
  name: string;
  emoji: string;
  currency: string;
  members: TripMember[];
  expenses: TripExpense[];
  payments?: TripPayment[]; // acertos já feitos entre membros
  createdAt: string;
};

// --- Categorias: overlay local (edições/eliminações por sincronizar) ---
type CatEdits = Record<string, Partial<CategoryInput>>;

async function applyCatOverrides(server: Category[]): Promise<Category[]> {
  const edits = await localGet<CatEdits>("catEdits", {});
  const deletes = await localGet<string[]>("catDeletes", []);
  const del = new Set(deletes);
  return server
    .filter((c) => !del.has(c._id))
    .map((c) => (edits[c._id] ? { ...c, ...edits[c._id] } : c));
}

async function flushCatOverrides() {
  const deletes = await localGet<string[]>("catDeletes", []);
  for (const id of deletes) {
    if (id.startsWith("local-")) continue;
    try {
      await apiFetch(`/category?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await localGet<string[]>("catDeletes", []);
      await localSet("catDeletes", d.filter((x) => x !== id));
    } catch {
      /* tenta na próxima */
    }
  }
  const edits = await localGet<CatEdits>("catEdits", {});
  for (const [id, patch] of Object.entries(edits)) {
    if (id.startsWith("local-")) continue;
    try {
      await apiFetch(`/category?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const e = await localGet<CatEdits>("catEdits", {});
      delete e[id];
      await localSet("catEdits", e);
    } catch {
      /* tenta na próxima */
    }
  }
}

export const api = {
  listSubscriptions: () =>
    apiFetch<{ subscriptions: Subscription[] }>("/subscriptions").then(
      (r) => r.subscriptions ?? [],
    ),

  createSubscription: (input: {
    name: string;
    amount: number;
    icon?: string;
    color?: string;
    dueDay?: number;
  }) =>
    apiFetch<{ subscription: Subscription }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.subscription),

  deleteSubscription: (id: string) =>
    apiFetch<{ success: boolean }>(
      `/subscription?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),

  // Investimentos — local-first: se a edge function ainda não estiver
  // publicada, funciona na mesma no dispositivo (o acompanhamento é
  // calculado no cliente) e sincroniza quando o servidor estiver disponível.
  listInvestments: async () => {
    try {
      const r = await apiFetch<{ investments: Investment[] }>("/investments");
      // Junta itens criados localmente que ainda não foram para o servidor.
      const local = await localGet<Investment[]>("investments", []);
      const pending = local.filter((i) => i._id.startsWith("local-"));
      const merged = [...r.investments, ...pending];
      await localSet("investments", merged);
      return merged;
    } catch {
      return localGet<Investment[]>("investments", []);
    }
  },

  createInvestment: async (input: InvestmentInput) => {
    try {
      const r = await apiFetch<{ investment: Investment }>("/investments", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const list = await localGet<Investment[]>("investments", []);
      await localSet("investments", [...list, r.investment]);
      return r.investment;
    } catch {
      const inv: Investment = { _id: localId(), ...input };
      const list = await localGet<Investment[]>("investments", []);
      await localSet("investments", [...list, inv]);
      return inv;
    }
  },

  updateInvestment: async (id: string, input: Partial<InvestmentInput>) => {
    const patchLocal = async () => {
      const list = await localGet<Investment[]>("investments", []);
      const next = list.map((i) => (i._id === id ? { ...i, ...input } : i));
      await localSet("investments", next);
      return next.find((i) => i._id === id) as Investment;
    };
    if (id.startsWith("local-")) return patchLocal();
    try {
      const r = await apiFetch<{ investment: Investment }>(
        `/investment?id=${encodeURIComponent(id)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      );
      await patchLocal();
      return r.investment;
    } catch {
      return patchLocal();
    }
  },

  deleteInvestment: async (id: string) => {
    const removeLocal = async () => {
      const list = await localGet<Investment[]>("investments", []);
      await localSet("investments", list.filter((i) => i._id !== id));
    };
    if (!id.startsWith("local-")) {
      try {
        await apiFetch<{ success: boolean }>(
          `/investment?id=${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
      } catch {
        /* remove local na mesma */
      }
    }
    await removeLocal();
    return { success: true };
  },

  // Rendimento — local-first e robusto: um servidor vazio nunca apaga um
  // valor local. Se o local tem valor e o servidor não, reenvia (auto-cura).
  getProfile: async () => {
    const empty: Profile = { monthlyIncome: 0, mealAllowance: 0 };
    const local = await localGet<Profile>("profile", empty);
    const has = (p: Profile) =>
      (p?.monthlyIncome || 0) > 0 || (p?.mealAllowance || 0) > 0;
    try {
      const r = await apiFetch<{ profile: Profile }>("/profile");
      // A foto vive só no dispositivo — preserva-a ao adotar dados do servidor.
      const srv = { ...(r.profile ?? empty), photoUrl: local?.photoUrl };
      if (has(srv)) {
        await localSet("profile", srv);
        return srv;
      }
      // Servidor vazio: mantém o valor local e tenta reenviá-lo.
      if (has(local)) {
        apiFetch("/profile", {
          method: "PUT",
          body: JSON.stringify(local),
        }).catch(() => {});
        return local;
      }
      return empty;
    } catch {
      return local;
    }
  },

  updateProfile: async (input: Partial<Profile>) => {
    // Faz merge com o que já existe para atualizações parciais (ex.: só a
    // foto, ou só o rendimento) não apagarem os restantes campos.
    const prev = await localGet<Profile>("profile", {
      monthlyIncome: 0,
      mealAllowance: 0,
    });
    const merged: Profile = { ...prev, ...input };
    await localSet("profile", merged); // guarda já no dispositivo
    try {
      // A foto não vai para o servidor (data URI grande / schema não a tem).
      const { photoUrl, ...serverPayload } = merged;
      await apiFetch<{ profile: Profile }>("/profile", {
        method: "PUT",
        body: JSON.stringify(serverPayload),
      });
    } catch {
      /* fica guardado localmente; sincroniza quando a função existir */
    }
    return merged;
  },

  listGoals: () =>
    apiFetch<{ goals: Goal[] }>("/goals").then((r) => r.goals ?? []),

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

  listCategories: async () => {
    try {
      const r = await apiFetch<{ categories: Category[] }>("/categories");
      const withOverrides = await applyCatOverrides(r.categories);
      // Preserva categorias criadas localmente (ainda não no servidor).
      const cache = await localGet<Category[]>("categories", []);
      const serverIds = new Set(r.categories.map((c) => c._id));
      const localOnly = cache.filter(
        (c) => c._id.startsWith("local-") && !serverIds.has(c._id),
      );
      const list = [...withOverrides, ...localOnly];
      await localSet("categories", list);
      void flushCatOverrides();
      return list;
    } catch {
      return localGet<Category[]>("categories", []);
    }
  },

  createCategory: async (input: CategoryInput) => {
    try {
      const r = await apiFetch<{ category: Category }>("/categories", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const list = await localGet<Category[]>("categories", []);
      await localSet("categories", [...list, r.category]);
      return r.category;
    } catch {
      const cat: Category = { _id: localId(), ...input };
      const list = await localGet<Category[]>("categories", []);
      await localSet("categories", [...list, cat]);
      return cat;
    }
  },

  updateCategory: async (id: string, input: Partial<CategoryInput>) => {
    const list = await localGet<Category[]>("categories", []);
    const next = list.map((c) => (c._id === id ? { ...c, ...input } : c));
    await localSet("categories", next);
    const updated = (next.find((c) => c._id === id) ?? { _id: id, ...input }) as Category;
    if (!id.startsWith("local-")) {
      try {
        await apiFetch(`/category?id=${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });
      } catch {
        const edits = await localGet<CatEdits>("catEdits", {});
        edits[id] = { ...(edits[id] || {}), ...input };
        await localSet("catEdits", edits);
      }
    }
    return updated;
  },

  deleteCategory: async (id: string) => {
    const list = await localGet<Category[]>("categories", []);
    await localSet("categories", list.filter((c) => c._id !== id));
    if (id.startsWith("local-")) {
      const edits = await localGet<CatEdits>("catEdits", {});
      delete edits[id];
      await localSet("catEdits", edits);
    } else {
      try {
        await apiFetch(`/category?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch {
        const deletes = await localGet<string[]>("catDeletes", []);
        if (!deletes.includes(id)) await localSet("catDeletes", [...deletes, id]);
      }
    }
    return { success: true };
  },

  listExpenses: () =>
    apiFetch<{ expenses: Expense[] }>("/expenses").then((r) => r.expenses ?? []),

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

  // --- Viagens / despesas partilhadas (só local, por agora) ---
  listTrips: () => localGet<Trip[]>("trips", []),

  getTrip: async (id: string) => {
    const list = await localGet<Trip[]>("trips", []);
    return list.find((t) => t._id === id) ?? null;
  },

  createTrip: async (input: {
    name: string;
    emoji?: string;
    currency?: string;
    members: TripMember[];
  }) => {
    const trip: Trip = {
      _id: localId(),
      name: input.name,
      emoji: input.emoji ?? "beach",
      currency: input.currency ?? "EUR",
      members: input.members,
      expenses: [],
      createdAt: new Date().toISOString(),
    };
    const list = await localGet<Trip[]>("trips", []);
    await localSet("trips", [trip, ...list]);
    return trip;
  },

  updateTrip: async (id: string, patch: Partial<Trip>) => {
    const list = await localGet<Trip[]>("trips", []);
    const next = list.map((t) => (t._id === id ? { ...t, ...patch } : t));
    await localSet("trips", next);
    return next.find((t) => t._id === id)!;
  },

  deleteTrip: async (id: string) => {
    const list = await localGet<Trip[]>("trips", []);
    await localSet(
      "trips",
      list.filter((t) => t._id !== id),
    );
  },

  addTripExpense: async (
    tripId: string,
    input: Omit<TripExpense, "id">,
  ) => {
    const list = await localGet<Trip[]>("trips", []);
    const exp: TripExpense = { id: localId(), ...input };
    const next = list.map((t) =>
      t._id === tripId ? { ...t, expenses: [exp, ...t.expenses] } : t,
    );
    await localSet("trips", next);
    return exp;
  },

  deleteTripExpense: async (tripId: string, expenseId: string) => {
    const list = await localGet<Trip[]>("trips", []);
    const next = list.map((t) =>
      t._id === tripId
        ? { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) }
        : t,
    );
    await localSet("trips", next);
  },

  addTripPayment: async (
    tripId: string,
    input: Omit<TripPayment, "id">,
  ) => {
    const list = await localGet<Trip[]>("trips", []);
    const pay: TripPayment = { id: localId(), ...input };
    const next = list.map((t) =>
      t._id === tripId
        ? { ...t, payments: [...(t.payments ?? []), pay] }
        : t,
    );
    await localSet("trips", next);
    return pay;
  },

  deleteTripPayment: async (tripId: string, paymentId: string) => {
    const list = await localGet<Trip[]>("trips", []);
    const next = list.map((t) =>
      t._id === tripId
        ? { ...t, payments: (t.payments ?? []).filter((p) => p.id !== paymentId) }
        : t,
    );
    await localSet("trips", next);
  },
};
