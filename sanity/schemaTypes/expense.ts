import { defineField, defineType } from "sanity";

export const expense = defineType({
  name: "expense",
  title: "Despesa",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Descrição",
      type: "string",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "amount",
      title: "Valor",
      type: "number",
      description: "Valor da despesa (na moeda escolhida).",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "currency",
      title: "Moeda",
      type: "string",
      initialValue: "EUR",
      options: {
        list: [
          { title: "Euro (€)", value: "EUR" },
          { title: "Dólar ($)", value: "USD" },
          { title: "Libra (£)", value: "GBP" },
        ],
      },
    }),
    defineField({
      name: "category",
      title: "Categoria",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "date",
      title: "Data",
      type: "date",
      options: { dateFormat: "YYYY-MM-DD" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "paymentMethod",
      title: "Método de pagamento",
      type: "string",
      options: {
        list: [
          { title: "Cartão", value: "card" },
          { title: "Dinheiro", value: "cash" },
          { title: "Transferência", value: "transfer" },
          { title: "MB Way", value: "mbway" },
          { title: "Outro", value: "other" },
        ],
      },
    }),
    defineField({
      name: "note",
      title: "Nota",
      type: "text",
      rows: 3,
    }),
    defineField({
      // Chave do isolamento de dados: o ID do utilizador Supabase.
      // É preenchido SEMPRE pela camada API (edge function), nunca à mão.
      name: "ownerId",
      title: "ID do proprietário (Supabase)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Data (mais recente)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      amount: "amount",
      currency: "currency",
      date: "date",
      category: "category.name",
    },
    prepare({ title, amount, currency, date, category }) {
      return {
        title: `${title} — ${amount} ${currency || "EUR"}`,
        subtitle: [date, category].filter(Boolean).join(" · "),
      };
    },
  },
});
