import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Categoria",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (rule) => rule.required().max(60),
    }),
    defineField({
      name: "icon",
      title: "Ícone (emoji)",
      type: "string",
      description: "Um emoji para representar a categoria (ex.: 🍔, 🚗, 🏠).",
    }),
    defineField({
      name: "color",
      title: "Cor",
      type: "string",
      description: "Cor em hexadecimal (ex.: #FF6B6B).",
    }),
  ],
  preview: {
    select: { title: "name", icon: "icon" },
    prepare({ title, icon }) {
      return { title: `${icon ? icon + " " : ""}${title}` };
    },
  },
});
