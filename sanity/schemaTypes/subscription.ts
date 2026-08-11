import { defineField, defineType } from "sanity";

export const subscription = defineType({
  name: "subscription",
  title: "Recorrência",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "amount",
      title: "Valor mensal (€)",
      type: "number",
      validation: (rule) => rule.required().positive(),
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
    select: { title: "name", amount: "amount", icon: "icon" },
    prepare({ title, amount, icon }) {
      return {
        title: `${icon ? icon + " " : ""}${title}`,
        subtitle: `${amount} €/mês`,
      };
    },
  },
});
