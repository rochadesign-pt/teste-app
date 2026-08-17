import { defineField, defineType } from "sanity";

/**
 * Guarda TODAS as viagens de um utilizador como um único documento (o array
 * serializado em JSON). É gerido pela edge function `trips`; não é editado à
 * mão no Studio.
 */
export const tripStore = defineType({
  name: "tripStore",
  title: "Viagens (por utilizador)",
  type: "document",
  fields: [
    defineField({
      name: "ownerId",
      title: "ID do proprietário (Supabase)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dataJson",
      title: "Dados (JSON)",
      type: "text",
      rows: 10,
      readOnly: true,
    }),
  ],
  preview: {
    select: { owner: "ownerId" },
    prepare({ owner }) {
      return { title: "Viagens", subtitle: owner };
    },
  },
});
