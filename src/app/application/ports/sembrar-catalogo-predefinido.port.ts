/**
 * Puerto de aplicación para sembrar el catálogo de ejercicios predefinidos en
 * el primer arranque (FR-034). Lo define Foundational (porque el caso de uso
 * "arrancar aplicación" necesita invocarlo), pero su implementación concreta
 * la aporta la Historia de Usuario 1 (ver sembrar-catalogo-predefinido.use-case.ts).
 */
export abstract class SembrarCatalogoPredefinidoPort {
  abstract sembrarSiNecesario(): Promise<void>;
}
