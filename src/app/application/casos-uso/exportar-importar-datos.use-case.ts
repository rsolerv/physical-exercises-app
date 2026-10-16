import { Injectable, inject } from '@angular/core';
import type { DatosNuevoEjercicio, ImagenEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import { crearDiasVacios } from '../../domain/planificacion/planificacion.entity';
import { parsearFechaIsoLocal, sumarDiasFechaIso } from '../../domain/planificacion/fecha-semana';
import { EjercicioRepositoryPort } from '../ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../ports/progreso-diario-repository.port';
import {
  GitHubSyncPort,
  type CredencialesGitHub,
  type EjercicioExportado,
  type ExportacionJSON,
  type ImagenArchivoJSON,
  type ImagenEjercicioExportada,
} from '../ports/github-sync.port';

interface ResultadoExportacion {
  datos: ExportacionJSON;
  imagenesParaSubir: ImagenArchivoJSON[];
}

/**
 * Caso de uso de orquestación para la Historia de Usuario 5: construir el
 * documento `ExportacionJSON` a partir de los datos locales y, a la inversa,
 * reemplazar los datos locales por un documento importado (FR-032, FR-036,
 * FR-037). Los Observables de GitHub quedan confinados al adaptador; este
 * caso de uso solo ve `Promise`s a través de los puertos.
 */
@Injectable({ providedIn: 'root' })
export class ExportarImportarDatosUseCase {
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly planificacionRepository = inject(PlanificacionRepositoryPort);
  private readonly progresoDiarioRepository = inject(ProgresoDiarioRepositoryPort);
  private readonly githubSync = inject(GitHubSyncPort);

  async exportar(): Promise<ResultadoExportacion> {
    const ejercicios = await this.ejercicioRepository.listarTodos();
    const categorias = await this.categoriaRepository.listarTodas();
    const planificaciones = await this.planificacionRepository.listarTodas();

    const imagenesParaSubir: ImagenArchivoJSON[] = [];
    const ejerciciosExportados: EjercicioExportado[] = ejercicios.map((ejercicio) => ({
      id: ejercicio.id,
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion,
      categoriaIds: ejercicio.categoriaIds,
      enlaces: ejercicio.enlaces,
      observaciones: ejercicio.observaciones,
      imagenes: ejercicio.imagenes.map((imagen): ImagenEjercicioExportada => {
        if (imagen.tipo === 'url') {
          return { id: imagen.id, tipo: 'url', valorUrl: imagen.valorUrl };
        }
        imagenesParaSubir.push({
          id: imagen.id,
          nombreArchivo: imagen.nombreArchivo ?? imagen.id,
          tipoMime: imagen.tipoMime ?? 'application/octet-stream',
          contenidoBase64: imagen.contenidoBase64 ?? '',
        });
        return { id: imagen.id, tipo: 'archivo', ruta: `imagenes/${imagen.id}.json` };
      }),
    }));

    // El progreso diario solo existe para fechas dentro de la semana de una planificación concreta
    // (ProgresoDiarioRepositoryPort no expone un listado global, por diseño de contracts/progreso-diario-repository.port.md).
    const progresoDiario = await this.recopilarProgresoDiario(planificaciones);

    const datos: ExportacionJSON = {
      version: 1,
      ejercicios: ejerciciosExportados,
      categorias: categorias.map((categoria) => ({
        id: categoria.id,
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        esGenerica: categoria.esGenerica,
      })),
      planificaciones: planificaciones.map((planificacion) => ({
        id: planificacion.id,
        nombre: planificacion.nombre,
        fechaInicio: planificacion.fechaInicio,
        dias: planificacion.dias,
      })),
      progresoDiario,
    };

    return { datos, imagenesParaSubir };
  }

  private async recopilarProgresoDiario(
    planificaciones: Awaited<ReturnType<PlanificacionRepositoryPort['listarTodas']>>
  ): Promise<ExportacionJSON['progresoDiario']> {
    const registros: ExportacionJSON['progresoDiario'] = [];
    for (const planificacion of planificaciones) {
      if (!planificacion.fechaInicio) continue;
      for (let offset = 0; offset < 7; offset++) {
        const fechaIso = sumarDiasFechaIso(planificacion.fechaInicio, offset);
        const delDia = await this.progresoDiarioRepository.obtenerPorFecha(parsearFechaIsoLocal(fechaIso));
        registros.push(...delDia);
      }
    }
    return registros;
  }

  /**
   * Reemplaza por completo los datos locales con los de `datos` (FR-032).
   * Primero elimina ejercicios, planificaciones y categorías (en ese orden,
   * para no violar las claves foráneas) y después recrea todo con nuevos
   * identificadores locales, remapeando las referencias cruzadas.
   */
  async importar(datos: ExportacionJSON, credenciales: CredencialesGitHub): Promise<void> {
    const ejerciciosActuales = await this.ejercicioRepository.listarTodos();
    for (const ejercicio of ejerciciosActuales) {
      await this.ejercicioRepository.eliminar(ejercicio.id);
    }
    const planificacionesActuales = await this.planificacionRepository.listarTodas();
    for (const planificacion of planificacionesActuales) {
      await this.planificacionRepository.eliminar(planificacion.id);
    }
    const categoriasActuales = await this.categoriaRepository.listarTodas();
    for (const categoria of categoriasActuales) {
      if (!categoria.esGenerica) await this.categoriaRepository.eliminar(categoria.id);
    }

    const categoriaGenericaLocal = await this.categoriaRepository.obtenerGenerica();
    const idsCategorias = new Map<string, string>();
    for (const categoria of datos.categorias) {
      if (categoria.esGenerica) {
        idsCategorias.set(categoria.id, categoriaGenericaLocal.id);
        continue;
      }
      const creada = await this.categoriaRepository.crear(categoria.nombre, categoria.descripcion);
      idsCategorias.set(categoria.id, creada.id);
    }

    const idsEjercicios = new Map<string, string>();
    for (const ejercicio of datos.ejercicios) {
      const imagenes = await this.resolverImagenes(ejercicio.imagenes, credenciales);
      const datosCreacion: DatosNuevoEjercicio = {
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion,
        categoriaIds: ejercicio.categoriaIds.map((id) => idsCategorias.get(id) ?? id),
        enlaces: ejercicio.enlaces,
        imagenes,
        observaciones: ejercicio.observaciones,
      };
      const creado = await this.ejercicioRepository.crear(datosCreacion);
      idsEjercicios.set(ejercicio.id, creado.id);
    }

    for (const planificacion of datos.planificaciones) {
      const creada = await this.planificacionRepository.crear({
        nombre: planificacion.nombre,
        fechaInicio: planificacion.fechaInicio,
        dias: crearDiasVacios(),
      });
      for (const dia of planificacion.dias) {
        for (const ejercicioIdAntiguo of dia.ejercicioIds) {
          const ejercicioIdNuevo = idsEjercicios.get(ejercicioIdAntiguo);
          if (ejercicioIdNuevo) {
            await this.planificacionRepository.asignarEjercicioADia(creada.id, dia.diaSemana, ejercicioIdNuevo);
          }
        }
      }
    }

    for (const registro of datos.progresoDiario) {
      const ejercicioIdNuevo = idsEjercicios.get(registro.ejercicioId);
      if (ejercicioIdNuevo) {
        await this.progresoDiarioRepository.marcar(parsearFechaIsoLocal(registro.fecha), ejercicioIdNuevo, registro.realizado);
      }
    }
  }

  private async resolverImagenes(
    imagenes: EjercicioExportado['imagenes'],
    credenciales: CredencialesGitHub
  ): Promise<ImagenEjercicio[]> {
    const resueltas: ImagenEjercicio[] = [];
    for (const imagen of imagenes) {
      if (imagen.tipo === 'url') {
        resueltas.push({ id: imagen.id, tipo: 'url', valorUrl: imagen.valorUrl });
        continue;
      }
      const archivo = await this.githubSync.leerImagen(credenciales, imagen.ruta ?? `imagenes/${imagen.id}.json`);
      resueltas.push({
        id: imagen.id,
        tipo: 'archivo',
        contenidoBase64: archivo.contenidoBase64,
        tipoMime: archivo.tipoMime,
        nombreArchivo: archivo.nombreArchivo,
      });
    }
    return resueltas;
  }
}
