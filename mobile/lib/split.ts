import type { Trip, TripMember } from "./api";

export type Balance = {
  member: TripMember;
  paid: number; // quanto adiantou
  owed: number; // quota que lhe cabe
  net: number; // paid - owed  (>0 tem a receber, <0 deve)
};

export type Settlement = { from: TripMember; to: TripMember; amount: number };

export type TripStats = {
  total: number;
  perHead: number; // média por pessoa (total / nº membros)
  balances: Balance[];
  settlements: Settlement[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Calcula, para uma viagem, quanto cada membro adiantou e a quota que lhe
 * cabe (divisão igual por despesa entre quem partilha), o saldo líquido de
 * cada um e o conjunto mínimo de transferências para acertar contas.
 */
export function tripStats(trip: Trip): TripStats {
  const members = trip.members ?? [];
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const m of members) {
    paid[m.id] = 0;
    owed[m.id] = 0;
  }

  let total = 0;
  for (const e of trip.expenses ?? []) {
    const amount = e.amount || 0;
    total += amount;
    if (paid[e.paidBy] !== undefined) paid[e.paidBy] += amount;
    const split = e.split && e.split.length ? e.split : members.map((m) => m.id);
    const share = amount / split.length;
    for (const id of split) if (owed[id] !== undefined) owed[id] += share;
  }

  // Acertos já feitos: quem paga um acerto fica com menos dívida (net sobe),
  // quem recebe fica com menos a receber (net desce).
  const settledAdj: Record<string, number> = {};
  for (const m of members) settledAdj[m.id] = 0;
  for (const p of trip.payments ?? []) {
    if (settledAdj[p.from] !== undefined) settledAdj[p.from] += p.amount;
    if (settledAdj[p.to] !== undefined) settledAdj[p.to] -= p.amount;
  }

  const balances: Balance[] = members.map((m) => ({
    member: m,
    paid: round2(paid[m.id]),
    owed: round2(owed[m.id]),
    net: round2(paid[m.id] - owed[m.id] + settledAdj[m.id]),
  }));

  return {
    total: round2(total),
    perHead: members.length ? round2(total / members.length) : 0,
    balances,
    settlements: settle(balances),
  };
}

/**
 * Minimiza o número de transferências: empurra do maior devedor para o
 * maior credor até tudo ficar a zero. Cêntimo de tolerância para evitar
 * transferências fantasma por erros de arredondamento.
 */
function settle(balances: Balance[]): Settlement[] {
  const debtors = balances
    .filter((b) => b.net < -0.01)
    .map((b) => ({ m: b.member, amt: -b.net }))
    .sort((a, b) => b.amt - a.amt);
  const creditors = balances
    .filter((b) => b.net > 0.01)
    .map((b) => ({ m: b.member, amt: b.net }))
    .sort((a, b) => b.amt - a.amt);

  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0.01) {
      out.push({ from: debtors[i].m, to: creditors[j].m, amount: round2(pay) });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt <= 0.01) i++;
    if (creditors[j].amt <= 0.01) j++;
  }
  return out;
}
