import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";

// Estes valores vêm do teu projeto Sanity (sanity.io/manage).
// Podes defini-los em .env com o prefixo SANITY_STUDIO_.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

export default defineConfig({
  name: "default",
  title: "Controlo de Custos",

  projectId,
  dataset,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
