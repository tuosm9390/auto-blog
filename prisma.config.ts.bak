import { defineConfig } from "@prisma/config";

export default defineConfig({
  dataset: {
    // This is optional for Sqlite/Postgres/MySQL etc but might be needed? 
    // Actually standard config structure for v7 (if using config file)
  },
  // Wait, I need to check exact syntax for v7 config.
  // The error message linked to https://pris.ly/d/config-datasource
  // Assuming it follows standard pattern:
  datasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  }
});
