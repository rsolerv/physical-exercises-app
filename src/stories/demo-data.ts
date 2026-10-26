import type { Provider } from '@angular/core';
import { signal } from '@angular/core';
import { AjustesRepositoryPort } from '../app/application/ports/ajustes-repository.port';
import type { AjustesAplicacion } from '../app/application/ports/ajustes-repository.port';
import { CategoriaRepositoryPort } from '../app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../app/application/ports/ejercicio-repository.port';
import { PlanificacionRepositoryPort } from '../app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../app/application/ports/progreso-diario-repository.port';
import { BuscarEjerciciosUseCase } from '../app/application/casos-uso/buscar-ejercicios.use-case';
import { ConsultarPlanificacionUseCase } from '../app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarCategoriaUseCase } from '../app/application/casos-uso/gestionar-categoria.use-case';
import { GestionarEjercicioUseCase } from '../app/application/casos-uso/gestionar-ejercicio.use-case';
import { GestionarPlanificacionUseCase } from '../app/application/casos-uso/gestionar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../app/application/casos-uso/gestionar-progreso-diario.use-case';
import { SincronizarUseCase } from '../app/application/casos-uso/sincronizar.use-case';
import { GestionarConexionSincronizacionUseCase } from '../app/application/casos-uso/gestionar-conexion-sincronizacion.use-case';
import { CopiaManualUseCase } from '../app/application/casos-uso/copia-manual.use-case';
import type { Categoria } from '../app/domain/categoria/categoria.entity';
import type { Ejercicio } from '../app/domain/ejercicio/ejercicio.entity';
import type { DiaSemana, Planificacion } from '../app/domain/planificacion/planificacion.entity';
import { DIAS_SEMANA_ORDENADOS, crearDiasVacios } from '../app/domain/planificacion/planificacion.entity';
import { ConflictoSincronizacionEstadoService } from '../app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { MensajeFeedbackService } from '../app/presentation/compartido/ui/mensaje-feedback.service';
import { DescargaArchivoService } from '../app/presentation/sincronizacion/copia-manual/descarga-archivo.service';

export const CATEGORIAS_DEMO: Categoria[] = [
  { id: 'fuerza', nombre: 'Fuerza', descripcion: 'Ejercicios de fuerza' },
  { id: 'movilidad', nombre: 'Movilidad', descripcion: 'Movilidad y flexibilidad' },
];

export const EJERCICIOS_DEMO: Ejercicio[] = [
  {
    id: 'sentadilla',
    nombre: 'Sentadilla con peso corporal',
    descripcion: 'Desciende con control manteniendo el pecho erguido y las rodillas alineadas.',
    categoriaIds: ['fuerza'],
    enlaces: [],
    imagenes: [],
    observaciones: '3 series de 12 repeticiones. Descansa 60 segundos entre series.',
  },
  {
    id: 'flexion',
    nombre: 'Flexión de brazos',
    descripcion: 'Mantén el cuerpo alineado y baja hasta acercar el pecho al suelo.',
    categoriaIds: ['fuerza'],
    enlaces: [],
    imagenes: [],
    observaciones: '3 series de 10 repeticiones.',
  },
  {
    id: 'movilidad-cadera',
    nombre: 'Movilidad de cadera',
    descripcion: 'Realiza círculos lentos y controlados para preparar la articulación.',
    categoriaIds: ['movilidad'],
    enlaces: [],
    imagenes: [],
  },
];

const DIAS_POR_NUMERO: DiaSemana[] = ['domingo', ...DIAS_SEMANA_ORDENADOS.slice(0, 6)];
const diaActual = DIAS_POR_NUMERO[new Date().getDay()];
const fechaInicio = lunesDeEstaSemana();

export const PLANIFICACION_DEMO: Planificacion = {
  id: 'planificacion-fuerza',
  nombre: 'Fuerza y movilidad',
  fechaInicio,
  dias: crearDiasVacios().map((dia) => ({
    ...dia,
    ejercicioIds:
      dia.diaSemana === diaActual
        ? ['sentadilla', 'flexion']
        : dia.diaSemana === 'miercoles'
          ? ['movilidad-cadera']
          : dia.diaSemana === 'viernes'
            ? ['sentadilla', 'movilidad-cadera']
            : [],
  })),
};

export const CONFLICTO_DEMO = {
  opcionPorDefecto: 'conservar_remoto' as const,
  datosRemotos: {
    version: 1,
    ejercicios: [],
    categorias: [],
    planificaciones: [],
    progresoDiario: [],
  },
  version: 'storybook-demo-version',
};

export const AJUSTES_SINCRONIZACION_DEMO: AjustesAplicacion = {
  tokenGitHub: null,
  repositorioGitHub: null,
  ultimaVersionSincronizada: null,
  ultimaSincronizacionCorrecta: null,
  cambiosLocalesPendientes: false,
  catalogoPredefinidoCargado: true,
  metodoSincronizacion: null,
  cuentaGoogle: null,
  destinoUltimaSincronizacion: null,
};

export function ajustesSincronizacionDemo(cambios: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  return { ...AJUSTES_SINCRONIZACION_DEMO, ...cambios };
}

const conflictoEstado = new ConflictoSincronizacionEstadoService();
conflictoEstado.conflictoActual.set(CONFLICTO_DEMO);

export const DEMO_PROVIDERS: Provider[] = [
  {
    provide: EjercicioRepositoryPort,
    useValue: {
      obtenerPorId: async (id: string) => EJERCICIOS_DEMO.find((ejercicio) => ejercicio.id === id) ?? null,
      listarTodos: async () => EJERCICIOS_DEMO,
      buscarPorTexto: async (texto: string) =>
        EJERCICIOS_DEMO.filter((ejercicio) => `${ejercicio.nombre} ${ejercicio.descripcion}`.toLowerCase().includes(texto.toLowerCase())),
      buscarPorCategorias: async (ids: string[]) =>
        EJERCICIOS_DEMO.filter((ejercicio) => ejercicio.categoriaIds.some((id) => ids.includes(id))),
      crear: async (datos: Omit<Ejercicio, 'id'>) => ({ ...datos, id: 'nuevo-ejercicio' }),
      actualizar: async (id: string, cambios: Partial<Ejercicio>) => ({
        ...EJERCICIOS_DEMO.find((ejercicio) => ejercicio.id === id)!,
        ...cambios,
      }),
      eliminar: async () => undefined,
      restaurar: async () => undefined,
      quitarCategoriaDeTodos: async () => undefined,
    },
  },
  {
    provide: CategoriaRepositoryPort,
    useValue: {
      listarTodas: async () => CATEGORIAS_DEMO,
      obtenerPorId: async (id: string) => CATEGORIAS_DEMO.find((categoria) => categoria.id === id) ?? null,
      crear: async (nombre: string) => ({ id: 'nueva-categoria', nombre }),
      actualizar: async (id: string, cambios: { nombre?: string }) => ({
        ...CATEGORIAS_DEMO.find((categoria) => categoria.id === id)!,
        ...cambios,
      }),
      eliminar: async () => undefined,
      restaurar: async () => undefined,
    },
  },
  {
    provide: PlanificacionRepositoryPort,
    useValue: {
      obtenerPorId: async (id: string) => (id === PLANIFICACION_DEMO.id ? PLANIFICACION_DEMO : null),
      listarTodas: async () => [PLANIFICACION_DEMO],
      obtenerActiva: async () => PLANIFICACION_DEMO,
      crear: async (datos: Omit<Planificacion, 'id'>) => ({ ...datos, id: 'nueva-planificacion' }),
      actualizar: async (id: string, cambios: Partial<Planificacion>) => ({
        ...PLANIFICACION_DEMO,
        id,
        ...cambios,
      }),
      duplicar: async (_id: string, nombre: string) => ({ ...PLANIFICACION_DEMO, id: 'planificacion-copia', nombre }),
      asignarEjercicioADia: async () => undefined,
      quitarEjercicioDeDia: async () => undefined,
      listarPorEjercicio: async () => [PLANIFICACION_DEMO],
      eliminar: async () => undefined,
    },
  },
  {
    provide: ProgresoDiarioRepositoryPort,
    useValue: {
      obtenerPorFecha: async () => [
        { fecha: new Date().toISOString().slice(0, 10), ejercicioId: 'sentadilla', realizado: true },
      ],
      marcar: async () => undefined,
    },
  },
  {
    provide: AjustesRepositoryPort,
    useValue: {
      obtener: async () => AJUSTES_SINCRONIZACION_DEMO,
      guardarCredencialesGitHub: async () => undefined,
      olvidarCredencialesGitHub: async () => undefined,
      actualizarUltimaVersionSincronizada: async () => undefined,
      conectarGoogle: async () => undefined,
      desconectarGoogle: async () => undefined,
      registrarDestinoSincronizado: async () => undefined,
      registrarSincronizacionCorrecta: async () => undefined,
      marcarCambiosLocalesPendientes: async () => undefined,
      estaCatalogoPredefinidoCargado: async () => true,
      marcarCatalogoPredefinidoCargado: async () => undefined,
    },
  },
  { provide: BuscarEjerciciosUseCase, useValue: { buscar: async () => EJERCICIOS_DEMO } },
  { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: async () => PLANIFICACION_DEMO } },
  {
    provide: GestionarCategoriaUseCase,
    useValue: {
      crear: async (nombre: string) => ({ id: 'nueva-categoria', nombre }),
      actualizar: async (id: string, cambios: { nombre?: string }) => ({
        ...CATEGORIAS_DEMO.find((categoria) => categoria.id === id)!,
        ...cambios,
      }),
      eliminar: async (id: string) => ({
        categoria: CATEGORIAS_DEMO.find((categoria) => categoria.id === id)!,
        ejercicios: [],
      }),
      restaurarEliminacion: async () => undefined,
    },
  },
  {
    provide: GestionarEjercicioUseCase,
    useValue: {
      crear: async (datos: Omit<Ejercicio, 'id'>) => ({ ...datos, id: 'nuevo-ejercicio' }),
      actualizar: async (id: string) => EJERCICIOS_DEMO.find((ejercicio) => ejercicio.id === id)!,
      eliminar: async (id: string) => ({ ejercicio: EJERCICIOS_DEMO.find((ejercicio) => ejercicio.id === id)!, asignaciones: [] }),
      restaurarEliminacion: async () => undefined,
    },
  },
  {
    provide: GestionarPlanificacionUseCase,
    useValue: {
      crear: async (datos: Omit<Planificacion, 'id'>) => ({ ...datos, id: 'nueva-planificacion' }),
      actualizar: async (id: string, cambios: Partial<Planificacion>) => ({ ...PLANIFICACION_DEMO, id, ...cambios }),
      duplicar: async (_id: string, nombre: string) => ({ ...PLANIFICACION_DEMO, id: 'planificacion-copia', nombre }),
      asignarEjercicioADia: async () => undefined,
      quitarEjercicioDeDia: async () => undefined,
      crearDesdeTemplate: async (_id: string, nombre: string) => ({ ...PLANIFICACION_DEMO, id: 'nueva-planificacion', nombre }),
    },
  },
  {
    provide: GestionarProgresoDiarioUseCase,
    useValue: {
      marcar: async (fecha: Date, ejercicioId: string, realizado: boolean) => ({
        fecha,
        ejercicioId,
        realizadoAnterior: !realizado,
      }),
      restaurarCambio: async () => undefined,
      obtenerProgresoDeFecha: async () => ({ porcentaje: 50, realizados: 1, total: 2 }),
    },
  },
  { provide: SincronizarUseCase, useValue: { sincronizar: async () => ({ tipo: 'completada', accion: 'nada' }) } },
  {
    provide: GestionarConexionSincronizacionUseCase,
    useValue: {
      conectarGoogle: async () => ({ correo: 'raquel@example.com', nombre: 'Raquel' }),
      desconectar: async () => undefined,
    },
  },
  {
    provide: CopiaManualUseCase,
    useValue: {
      exportar: async () => ({
        nombreSugerido: 'copia-ejercicios-demo.zip',
        archivos: {
          'datos.json': JSON.stringify({
            version: 1,
            ejercicios: [],
            categorias: [],
            planificaciones: [],
            progresoDiario: [],
          }),
        },
      }),
      importar: async () => undefined,
    },
  },
  { provide: DescargaArchivoService, useValue: { descargar: () => undefined } },
  {
    provide: MensajeFeedbackService,
    useValue: {
      mostrarExito: () => undefined,
      mostrarExitoConAccion: () => undefined,
      mostrarError: () => undefined,
    },
  },
  { provide: ConflictoSincronizacionEstadoService, useValue: conflictoEstado },
];

export function estadoConflictoDemo() {
  const estado = new ConflictoSincronizacionEstadoService();
  estado.conflictoActual.set(CONFLICTO_DEMO);
  return estado;
}

export function estadoSinConflicto() {
  return { conflictoActual: signal(null) };
}

function lunesDeEstaSemana(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
