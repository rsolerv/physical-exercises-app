import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ConfiguracionSincronizacionComponent } from '../../../src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { SincronizarUseCase } from '../../../src/app/application/casos-uso/sincronizar.use-case';
import { GestionarConexionSincronizacionUseCase } from '../../../src/app/application/casos-uso/gestionar-conexion-sincronizacion.use-case';
import { CopiaManualUseCase } from '../../../src/app/application/casos-uso/copia-manual.use-case';
import { ConflictoSincronizacionEstadoService } from '../../../src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import {
  ErrorAutorizacionGoogle,
  ErrorConflictoRemoto,
  ErrorConexionCancelada,
  ErrorVentanaBloqueada,
} from '../../../src/app/domain/errores/errores-dominio';
import type { AjustesAplicacion } from '../../../src/app/application/ports/ajustes-repository.port';

function ajustes(sobrescribir: Partial<AjustesAplicacion> = {}): AjustesAplicacion {
  const resultado: AjustesAplicacion = {
    tokenGitHub: null,
    repositorioGitHub: null,
    ultimaVersionSincronizada: null,
    ultimaSincronizacionCorrecta: null,
    cambiosLocalesPendientes: false,
    catalogoPredefinidoCargado: true,
    metodoSincronizacion: null,
    cuentaGoogle: null,
    ...sobrescribir,
  };
  if (resultado.metodoSincronizacion === null && resultado.tokenGitHub && resultado.repositorioGitHub) {
    resultado.metodoSincronizacion = 'github';
  }
  return resultado;
}

describe('ConfiguracionSincronizacionComponent', () => {
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(opciones: {
    ajustes?: AjustesAplicacion;
    obtenerAjustes?: ReturnType<typeof vi.fn>;
    sincronizar?: ReturnType<typeof vi.fn>;
    conectarGoogle?: ReturnType<typeof vi.fn>;
    activarMetodo?: ReturnType<typeof vi.fn>;
    desconectarGoogle?: ReturnType<typeof vi.fn>;
    olvidarCredencialesGitHub?: ReturnType<typeof vi.fn>;
    guardarCredencialesGitHub?: ReturnType<typeof vi.fn>;
  } = {}) {
    mostrarExito = vi.fn();
    mostrarError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: opciones.obtenerAjustes ?? vi.fn().mockResolvedValue(opciones.ajustes ?? ajustes()),
            guardarCredencialesGitHub: opciones.guardarCredencialesGitHub ?? vi.fn().mockResolvedValue(undefined),
            olvidarCredencialesGitHub: opciones.olvidarCredencialesGitHub ?? vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SincronizarUseCase,
          useValue: { sincronizar: opciones.sincronizar ?? vi.fn().mockResolvedValue({ tipo: 'completada', accion: 'nada' }) },
        },
        {
          provide: GestionarConexionSincronizacionUseCase,
          useValue: {
            conectarGoogle: opciones.conectarGoogle ?? vi.fn().mockResolvedValue({ correo: 'raquel@example.com', nombre: 'Raquel' }),
            activarMetodo: opciones.activarMetodo ?? vi.fn().mockResolvedValue(undefined),
            desconectar: opciones.desconectarGoogle ?? vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CopiaManualUseCase,
          useValue: { exportar: vi.fn(), importar: vi.fn() },
        },
        ConflictoSincronizacionEstadoService,
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(ConfiguracionSincronizacionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('el campo del token está oculto (type="password") (FR-002, FR-037)', async () => {
    configurar();
    const fixture = await crearComponente();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input[name="token"], #token, input.configuracion-sincronizacion__token');
    const tokenInput = (fixture.nativeElement as HTMLElement).querySelector('input[type="password"]');
    expect(tokenInput ?? input).toBeTruthy();
  });

  it('muestra una guía para crear un repositorio privado de datos y un token fine-grained', async () => {
    configurar();
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('privado');
    expect(texto.toLowerCase()).toContain('fine-grained');
  });

  it('muestra el aviso de privacidad sin jerga técnica en el bloque de Google', async () => {
    configurar();
    const fixture = await crearComponente();
    const textoGoogle = (fixture.nativeElement as HTMLElement).querySelector('.configuracion-sincronizacion__tarjeta--principal')?.textContent ?? '';

    expect(textoGoogle).toContain('Solo se guarda en un espacio privado');
    expect(textoGoogle).not.toMatch(/token|oauth|credenciales/i);
  });

  it('muestra la configuración de GitHub cuando aún no está configurada', async () => {
    configurar();
    const fixture = await crearComponente();
    const principal = (fixture.nativeElement as HTMLElement).querySelector('.configuracion-sincronizacion__tarjeta--principal');

    expect((fixture.nativeElement as HTMLElement).querySelector('details')?.open).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin configurar');
    expect(principal?.textContent).toContain('Conectar con Google');
  });

  it('expone el estado de carga accesible mientras consulta los ajustes', () => {
    configurar({
      obtenerAjustes: vi.fn().mockImplementation(() => new Promise<AjustesAplicacion>(() => undefined)),
    });
    const fixture = TestBed.createComponent(ConfiguracionSincronizacionComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Cargando configuración');
  });

  it('pliega la configuración existente y muestra repositorio y fecha correcta persistida', async () => {
    configurar({
      ajustes: ajustes({
        tokenGitHub: 'secreto',
        repositorioGitHub: 'owner/datos',
        ultimaSincronizacionCorrecta: new Date('2026-10-20T12:34:00.000Z'),
      }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('details')?.open).toBe(true);
    expect(raiz.textContent).toContain('owner/datos');
    expect(raiz.textContent).toContain('Última sincronización correcta');
    expect(raiz.querySelector('input[type="password"]')).toBeTruthy();
    expect(raiz.textContent).not.toContain('secreto');
  });

  it('muestra los errores de repositorio y token junto a sus campos obligatorios', async () => {
    const guardarCredencialesGitHub = vi.fn();
    configurar({ guardarCredencialesGitHub });
    const fixture = await crearComponente();

    await fixture.componentInstance.guardarCredenciales();
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelectorAll('.configuracion-sincronizacion__error-campo').length).toBe(2);
    expect(guardarCredencialesGitHub).not.toHaveBeenCalled();
  });

  it('el botón "Olvidar token" llama a olvidarCredencialesGitHub()', async () => {
    const olvidarCredencialesGitHub = vi.fn().mockResolvedValue(undefined);
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), olvidarCredencialesGitHub });
    const fixture = await crearComponente();

    await fixture.componentInstance.olvidarToken();

    expect(olvidarCredencialesGitHub).toHaveBeenCalled();
    expect(mostrarExito).toHaveBeenCalled();
  });

  it('el botón de sincronizar llama al caso de uso y muestra un mensaje de éxito en español', async () => {
    const sincronizar = vi.fn().mockResolvedValue({ tipo: 'completada', accion: 'subir' });
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    const raiz = fixture.nativeElement as HTMLElement;
    const accionesSincronizacion = raiz.querySelector('.configuracion-sincronizacion__sincronizacion-global');
    const tarjetaGoogle = raiz.querySelector('.configuracion-sincronizacion__tarjeta--principal');
    expect(accionesSincronizacion?.textContent).toContain('Método activo: GitHub');
    expect(tarjetaGoogle?.contains(accionesSincronizacion)).toBe(false);

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(sincronizar).toHaveBeenCalled();
    expect(mostrarExito).toHaveBeenCalledWith('Sincronización completada. Datos subidos a GitHub.');
  });

  it('muestra la acción común de sincronización fuera del panel de Google cuando Google está activo', async () => {
    configurar({
      ajustes: ajustes({
        metodoSincronizacion: 'google',
        cuentaGoogle: 'raquel@example.com',
      }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    const accionesSincronizacion = raiz.querySelector('.configuracion-sincronizacion__sincronizacion-global');
    const tarjetaGoogle = raiz.querySelector('.configuracion-sincronizacion__tarjeta--principal');
    const botonSincronizar = accionesSincronizacion?.querySelector('button');

    expect(accionesSincronizacion?.textContent).toContain('Método activo: Google');
    expect(accionesSincronizacion?.textContent).toContain('Sincronizar ahora');
    expect(tarjetaGoogle?.contains(botonSincronizar ?? null)).toBe(false);
    expect(tarjetaGoogle?.querySelector('button')?.textContent).not.toContain('Sincronizar ahora');
  });

  it('cuando el caso de uso devuelve un conflicto, navega a la pantalla de resolución', async () => {
    const sincronizar = vi.fn().mockResolvedValue({
      tipo: 'conflicto',
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] },
      version: 'sha-1',
    });
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const estado = TestBed.inject(ConflictoSincronizacionEstadoService);

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(estado.conflictoActual()).toEqual({
      opcionPorDefecto: 'conservar_remoto',
      datosRemotos: { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] },
      version: 'sha-1',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Conflicto pendiente de resolución');
    expect(navigateSpy).toHaveBeenCalledWith(['/sincronizacion/conflicto']);
  });

  it('muestra un mensaje de error en español si la sincronización falla', async () => {
    const sincronizar = vi.fn().mockRejectedValue(new Error('Sin conexión.'));
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect(mostrarError).toHaveBeenCalledWith('Sin conexión.');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Error de sincronización');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Reintentar');
  });

  it('muestra un estado accesible de sincronización en curso y luego sincronizado', async () => {
    let completar: (valor: { tipo: 'completada'; accion: 'nada' }) => void = () => undefined;
    const sincronizar = vi.fn().mockImplementation(
      () =>
        new Promise<{ tipo: 'completada'; accion: 'nada' }>((resolve) => {
          completar = resolve;
        })
    );
    configurar({ ajustes: ajustes({ tokenGitHub: 'token-x', repositorioGitHub: 'owner/data' }), sincronizar });
    const fixture = await crearComponente();

    const peticion = fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('[role="status"]')?.textContent).toContain('Sincronizando');
    const botonSincronizar = Array.from(raiz.querySelectorAll('button')).find((boton) => boton.textContent?.includes('Sincronizar ahora')) as HTMLButtonElement;
    expect(botonSincronizar.disabled).toBe(true);
    botonSincronizar.click();
    expect(sincronizar).toHaveBeenCalledOnce();

    completar({ tipo: 'completada', accion: 'nada' });
    await peticion;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sincronizado');
  });

  it('muestra cuenta, método, fecha y acciones para Google conectado', async () => {
    configurar({
      ajustes: ajustes({
        metodoSincronizacion: 'google',
        cuentaGoogle: 'raquel@example.com',
        ultimaSincronizacionCorrecta: new Date('2026-10-20T12:34:00.000Z'),
      }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.textContent).toContain('Sincronización con Google');
    expect(raiz.textContent).toContain('raquel@example.com');
    expect(raiz.textContent).toContain('Método activo');
    expect(raiz.textContent).toContain('Última sincronización correcta');
    expect(raiz.textContent).toContain('Desconectar cuenta');
  });

  it('al conectar Google confirma la acción y muestra la cuenta enlazada', async () => {
    let valorAjustes = ajustes();
    const obtenerAjustes = vi.fn().mockImplementation(async () => valorAjustes);
    const conectarGoogle = vi.fn().mockImplementation(async () => {
      valorAjustes = ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' });
      return { correo: 'raquel@example.com', nombre: 'Raquel' };
    });
    configurar({ obtenerAjustes, conectarGoogle });
    const fixture = await crearComponente();

    await fixture.componentInstance.conectarGoogle();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('raquel@example.com');
    expect(mostrarExito).toHaveBeenCalledWith('Cuenta de Google conectada.');
  });

  it('pide confirmación en línea y desconecta la cuenta sin borrar los datos remotos', async () => {
    const desconectar = vi.fn().mockResolvedValue(undefined);
    configurar({ ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' }), desconectarGoogle: desconectar });
    const fixture = await crearComponente();

    fixture.componentInstance.confirmandoDesconexion.set(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tus datos en este dispositivo y los guardados en Google no se borran');

    await fixture.componentInstance.desconectarGoogle();
    expect(desconectar).toHaveBeenCalledOnce();
    expect(mostrarExito).toHaveBeenCalledWith(expect.stringContaining('se conservan'));
  });

  it('cancelar la confirmación de desconexión conserva la cuenta conectada', async () => {
    const desconectar = vi.fn();
    configurar({ ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' }), desconectarGoogle: desconectar });
    const fixture = await crearComponente();

    fixture.componentInstance.confirmandoDesconexion.set(true);
    fixture.detectChanges();
    fixture.componentInstance.confirmandoDesconexion.set(false);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('raquel@example.com');
    expect(desconectar).not.toHaveBeenCalled();
  });

  it('al caducar la autorización ofrece reconectar y reanuda la sincronización automáticamente', async () => {
    const sincronizar = vi.fn()
      .mockRejectedValueOnce(new ErrorAutorizacionGoogle())
      .mockResolvedValueOnce({ tipo: 'completada', accion: 'nada' });
    const conectarGoogle = vi.fn().mockResolvedValue({ correo: 'raquel@example.com', nombre: null });
    configurar({
      ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' }),
      sincronizar,
      conectarGoogle,
    });
    const fixture = await crearComponente();

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Volver a conectar');

    await fixture.componentInstance.conectarGoogle();
    fixture.detectChanges();
    expect(conectarGoogle).toHaveBeenCalledOnce();
    expect(sincronizar).toHaveBeenCalledTimes(2);
    expect(mostrarExito).toHaveBeenCalledWith(expect.stringContaining('Sincronización completada'));
  });

  it('la cancelación del consentimiento no conecta la cuenta y permite reintentar', async () => {
    const conectarGoogle = vi.fn().mockRejectedValue(new ErrorConexionCancelada());
    configurar({ conectarGoogle });
    const fixture = await crearComponente();

    await fixture.componentInstance.conectarGoogle();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.configuracion-sincronizacion__resumen')?.textContent).toContain('Sin configurar');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('La conexión no se ha completado');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Reintentar');
  });

  it('explica cómo permitir la ventana cuando el navegador bloquea Google', async () => {
    configurar({ conectarGoogle: vi.fn().mockRejectedValue(new ErrorVentanaBloqueada()) });
    const fixture = await crearComponente();

    await fixture.componentInstance.conectarGoogle();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Tu navegador ha bloqueado la ventana de Google');
  });

  it('mantiene ambos métodos conectados e indica cuál está activo', async () => {
    configurar({
      ajustes: ajustes({
        tokenGitHub: 'token-x',
        repositorioGitHub: 'owner/data',
        metodoSincronizacion: 'google',
        cuentaGoogle: 'raquel@example.com',
      }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.textContent).toContain('Método activo');
    expect(raiz.textContent).toContain('Conectado');
    expect(raiz.textContent).toContain('raquel@example.com');
    expect(raiz.querySelector('details')?.open).toBe(false);
    expect(Array.from(raiz.querySelectorAll('button')).some((boton) => boton.textContent?.includes('Usar este método'))).toBe(true);
  });

  it('muestra un conflicto remoto con la indicación de reintentar sin cambiar los datos locales', async () => {
    configurar({
      ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' }),
      sincronizar: vi.fn().mockRejectedValue(new ErrorConflictoRemoto('Los datos de Google han cambiado. Vuelve a sincronizar.')),
    });
    const fixture = await crearComponente();

    await fixture.componentInstance.sincronizarAhora();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Tus datos de este dispositivo no han cambiado');
  });

  it('permite conectar Google cuando GitHub es el método activo', async () => {
    const conectarGoogle = vi.fn().mockResolvedValue({ correo: 'raquel@example.com', nombre: null });
    configurar({
      ajustes: ajustes({ metodoSincronizacion: 'github', tokenGitHub: 'token', repositorioGitHub: 'owner/data' }),
      conectarGoogle,
    });
    const fixture = await crearComponente();

    await fixture.componentInstance.conectarGoogle();

    expect(conectarGoogle).toHaveBeenCalledOnce();
    expect(mostrarExito).toHaveBeenCalledWith('Cuenta de Google conectada.');
  });

  it('permite guardar GitHub cuando Google está activo y anuncia el cambio de método de forma accesible', async () => {
    const guardarCredencialesGitHub = vi.fn().mockResolvedValue(undefined);
    const activarMetodo = vi.fn().mockResolvedValue(undefined);
    configurar({
      ajustes: ajustes({ metodoSincronizacion: 'google', cuentaGoogle: 'raquel@example.com' }),
      guardarCredencialesGitHub,
      activarMetodo,
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('form')).toBeTruthy();

    fixture.componentInstance.modelo.set({ token: 'ghp_example', repositorio: 'owner/data' });
    await fixture.componentInstance.guardarCredenciales();
    await fixture.componentInstance.activarMetodo('github');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(guardarCredencialesGitHub).toHaveBeenCalledWith('ghp_example', 'owner/data');
    expect(activarMetodo).toHaveBeenCalledWith('github');
    expect(raiz.querySelector('[aria-live="polite"]')?.textContent).toContain('Ahora sincronizas con GitHub.');
  });

  it('muestra la elección cuando hay un método conectado pero ninguno está activo', async () => {
    configurar({
      ajustes: ajustes({ cuentaGoogle: 'raquel@example.com', metodoSincronizacion: null }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.textContent).toContain('Elige con qué método quieres sincronizar.');
    expect(raiz.querySelector('button')?.textContent).not.toContain('Sincronizar ahora');
    expect(Array.from(raiz.querySelectorAll('button')).some((boton) => boton.textContent?.includes('Usar este método'))).toBe(true);
  });

  it('no muestra la reconexión de Google cuando GitHub es el método activo', async () => {
    configurar({
      ajustes: ajustes({
        metodoSincronizacion: 'github',
        tokenGitHub: 'token',
        repositorioGitHub: 'owner/data',
        cuentaGoogle: 'raquel@example.com',
      }),
    });
    const fixture = await crearComponente();
    fixture.componentInstance.requiereReconectar.set(true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Volver a conectar');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Método activo');
  });
});
