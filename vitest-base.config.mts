import { defineConfig } from 'vitest/config';

/**
 * Configuración adicional de Vitest cargada por el builder de pruebas de Angular
 * (`runnerConfig: true` en angular.json). Aquí se define el 100% de cobertura
 * obligatorio para los casos de uso puros de Domain (constitución § Calidad de
 * Código y Pruebas), además del 80% global ya fijado en angular.json.
 */
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        'src/app/domain/**': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
