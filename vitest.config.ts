import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Bez ovoga bi datumski testovi na UTC masini prolazili i sa pogresnom implementacijom.
    env: { TZ: 'Europe/Belgrade' },
    server: {
      // effect-form/Fluent je ESM i named-importuje iz @fluentui, koji je CJS.
      // Inline-ovanje pusta Vite da odradi interop, kao i za nas .tsx izvor.
      deps: { inline: ['effect-form'] },
    },
    deps: {
      optimizer: {
        ssr: {
          enabled: true,
          include: [
            '@fluentui/react-components',
            '@fluentui/react-datepicker-compat',
            '@fluentui/react-calendar-compat',
            '@fluentui/react-icons',
            '@fluentui/react-tabster',
            'tabster',
          ],
        },
      },
    },
  },
})
