import type { Investment } from "./api";

/**
 * Projeta um investimento com depósitos recorrentes até "hoje": a partir
 * do capital inicial, do depósito mensal, da taxa esperada e da data de
 * início, calcula o valor acumulado, o total depositado e os juros.
 * É isto que faz a app "acompanhar" os depósitos ao longo do tempo.
 */
export function projectInvestment(inv: Investment, now = new Date()) {
  const P = Math.max(0, inv.initialValue || 0);
  const PMT = Math.max(0, inv.monthlyDeposit || 0);
  const r = (inv.annualRate || 0) / 100 / 12;

  const start = inv.startDate ? new Date(inv.startDate + "T00:00:00") : now;
  const startDay = start.getDate();

  // Meses completos decorridos desde o início.
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < startDay) months -= 1;
  months = Math.max(0, months);

  const grow = (m: number) =>
    r === 0 ? P + PMT * m : P * Math.pow(1 + r, m) + PMT * ((Math.pow(1 + r, m) - 1) / r);

  const value = grow(months);
  const contributed = P + PMT * months;
  const growth = value - contributed;

  // Próximo depósito: mesmo dia do mês, a seguir a hoje.
  let next = new Date(now.getFullYear(), now.getMonth(), startDay);
  if (next <= now) next = new Date(now.getFullYear(), now.getMonth() + 1, startDay);

  // Série mensal (valor acumulado) para o mini-gráfico.
  const series: number[] = [];
  const points = Math.min(months, 24);
  for (let i = 0; i <= points; i++) {
    const m = Math.round((months * i) / Math.max(1, points));
    series.push(grow(m));
  }

  return {
    months,
    value,
    contributed,
    growth,
    nextDeposit: next,
    series: series.length >= 2 ? series : [P, value],
  };
}

export function formatNextDeposit(d: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
  }).format(d);
}
