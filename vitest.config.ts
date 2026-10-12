import { defineConfig } from 'vitest/config'

// @fluentui je CJS i named-importuje iz 'tabster', koji je takodje CJS. Bez predbundlovanja
// Vite ne odradi interop i import pukne na 'createTabster'. Vazi za oba okruzenja: `ssr` za
// podrazumevano node, `web` za fajlove koji trazе happy-dom.
const CJS_PAKETI = [
  '@fluentui/react-components',
  '@fluentui/react-datepicker-compat',
  '@fluentui/react-calendar-compat',
  '@fluentui/react-icons',
  '@fluentui/react-tabster',
  'tabster',
]

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
        ssr: { enabled: true, include: CJS_PAKETI },
        web: { enabled: true, include: CJS_PAKETI },
      },
    },
  },
})
