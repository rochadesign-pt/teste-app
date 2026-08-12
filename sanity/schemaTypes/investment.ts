import { defineField, defineType } from "sanity";

// Um investimento com depósitos recorrentes. A app projeta o valor
// acumulado até hoje a partir do capital inicial, do depósito mensal,
// da taxa esperada e da data de início.
export const investment = defineType({
  name: "investment",
  title: "Investimento",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "initialValue",
      title: "Capital inicial (€)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "monthlyDeposit",
      title: "Depósito mensal (€)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "annualRate",
      title: "Retorno anual esperado (%)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "startDate",
      title: "Data de início",
      type: "string",
      description: "AAAA-MM-DD",
    }),
    defineField({ name: "icon", title: "Ícone (emoji)", type: "string" }),
    defineField({ name: "color", title: "Cor", type: "string" }),
    defineField({
      name: "ownerId",
      title: "ID do proprietário (Supabase)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      deposit: "monthlyDeposit",
      icon: "icon",
    },
    prepare({ title, deposit, icon }) {
      return {
        title: `${icon ? icon + " " : ""}${title}`,
        subtitle: `${deposit ?? 0} €/mês`,
      };
    },
  },
});
