import { defineField, defineType } from "sanity";

export const goal = defineType({
  name: "goal",
  title: "Objetivo",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "icon",
      title: "Ícone (emoji)",
      type: "string",
    }),
    defineField({
      name: "color",
      title: "Cor",
      type: "string",
    }),
    defineField({
      name: "target",
      title: "Meta (€)",
      type: "number",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "saved",
      title: "Já poupado (€)",
      type: "number",
      initialValue: 0,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "monthly",
      title: "Reforço mensal (€)",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      // Isolamento por utilizador — imposto pela edge function.
      name: "ownerId",
      title: "ID do proprietário (Supabase)",
      type: "string",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "name", saved: "saved", target: "target", icon: "icon" },
    prepare({ title, saved, target, icon }) {
      return {
        title: `${icon ? icon + " " : ""}${title}`,
        subtitle: `${saved ?? 0} / ${target} €`,
      };
    },
  },
});
