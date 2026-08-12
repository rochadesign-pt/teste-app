import { defineField, defineType } from "sanity";

// Definições pessoais do utilizador (uma por utilizador). Guarda o
// rendimento mensal para a Análise do mês ser fidedigna.
export const profile = defineType({
  name: "profile",
  title: "Perfil",
  type: "document",
  fields: [
    defineField({
      name: "monthlyIncome",
      title: "Salário líquido (€)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "mealAllowance",
      title: "Subsídio de alimentação (€/mês)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "ownerId",
      title: "ID do proprietário (Supabase)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { income: "monthlyIncome", meal: "mealAllowance", owner: "ownerId" },
    prepare({ income, meal, owner }) {
      return {
        title: `${(income ?? 0) + (meal ?? 0)} €/mês`,
        subtitle: owner,
      };
    },
  },
});
