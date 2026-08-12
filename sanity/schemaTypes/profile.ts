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
      title: "Rendimento mensal (€)",
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
    select: { income: "monthlyIncome", owner: "ownerId" },
    prepare({ income, owner }) {
      return {
        title: `${income ?? 0} €/mês`,
        subtitle: owner,
      };
    },
  },
});
