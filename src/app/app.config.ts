import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { AjustesRepositoryPort } from './application/ports/ajustes-repository.port';
import { AjustesRepositorySqlite } from './infrastructure/persistencia-sqlite/ajustes-repository.sqlite';
import { EjercicioRepositoryPort } from './application/ports/ejercicio-repository.port';
import { EjercicioRepositorySqlite } from './infrastructure/persistencia-sqlite/ejercicio-repository.sqlite';
import { CategoriaRepositoryPort } from './application/ports/categoria-repository.port';
import { CategoriaRepositorySqlite } from './infrastructure/persistencia-sqlite/categoria-repository.sqlite';
import { PlanificacionRepositoryPort } from './application/ports/planificacion-repository.port';
import { PlanificacionRepositorySqlite } from './infrastructure/persistencia-sqlite/planificacion-repository.sqlite';
import { ProgresoDiarioRepositoryPort } from './application/ports/progreso-diario-repository.port';
import { ProgresoDiarioRepositorySqlite } from './infrastructure/persistencia-sqlite/progreso-diario-repository.sqlite';
import { GitHubSyncPort } from './application/ports/github-sync.port';
import { GithubSyncAdapter } from './infrastructure/github-sync/github-sync.adapter';
import { SembrarCatalogoPredefinidoPort } from './application/ports/sembrar-catalogo-predefinido.port';
import { SembrarCatalogoPredefinidoUseCase } from './application/casos-uso/sembrar-catalogo-predefinido.use-case';
import { ArrancarAplicacionUseCase } from './application/casos-uso/arrancar-aplicacion.use-case';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    // Cableado de los puertos de Application con sus adaptadores concretos de Infrastructure.
    { provide: AjustesRepositoryPort, useExisting: AjustesRepositorySqlite },
    { provide: EjercicioRepositoryPort, useExisting: EjercicioRepositorySqlite },
    { provide: CategoriaRepositoryPort, useExisting: CategoriaRepositorySqlite },
    { provide: PlanificacionRepositoryPort, useExisting: PlanificacionRepositorySqlite },
    { provide: ProgresoDiarioRepositoryPort, useExisting: ProgresoDiarioRepositorySqlite },
    { provide: GitHubSyncPort, useExisting: GithubSyncAdapter },
    { provide: SembrarCatalogoPredefinidoPort, useExisting: SembrarCatalogoPredefinidoUseCase },
    // Carga toda la información almacenada y siembra el catálogo predefinido al abrir la app (FR-001, FR-034).
    provideAppInitializer(() => inject(ArrancarAplicacionUseCase).ejecutar()),
  ],
};
