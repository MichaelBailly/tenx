import tailwindcss from "@tailwindcss/vite";
import { Config } from "./server/utils/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: !Config.env.isProduction },
  css: ["~/assets/css/tailwind.css"],
  modules: ["@nuxt/eslint", "@nuxt/fonts", "@nuxt/icon", "@nuxt/image"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    mongodbUri: Config.mongodb.uri,
    mongodbDatabase: Config.mongodb.database,
    mongodbOptions: Config.mongodb.options,
  },
  nitro: {
    plugins: ["~/server/plugins/mongodb.ts"],
  },
});
