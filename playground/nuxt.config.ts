export default defineNuxtConfig({
  compatibilityDate: "2025-04-20",

  nitro: {
    preset: 'cloudflare_module'
  },

  runtimeConfig: {
    permacc: {
      apiKey: '',
    },
  }
})
