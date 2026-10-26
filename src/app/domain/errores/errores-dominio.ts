/**
 * Errores de dominio compartidos por todas las historias de usuario.
 * Son lanzados por los casos de uso puros de Domain y por los adaptadores
 * de Infrastructure que implementan los puertos definidos en contracts/*.port.md.
 */
export abstract class ErrorDominio extends Error {
  protected constructor(mensaje: string, nombre: string) {
    super(mensaje);
    this.name = nombre;
  }
}

/** Datos incompletos o con formato no válido (p. ej. nombre vacío, URL inválida). */
export class ErrorValidacion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorValidacion');
  }
}

/** El identificador solicitado no existe. */
export class ErrorNoEncontrado extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorNoEncontrado');
  }
}

/** Ya existe otro elemento con el mismo nombre único (p. ej. categoría duplicada). */
export class ErrorNombreDuplicado extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorNombreDuplicado');
  }
}

/** La operación solicitada no está permitida (p. ej. eliminar la última categoría de un ejercicio). */
export class ErrorOperacionNoPermitida extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorOperacionNoPermitida');
  }
}

/** Ya existe una planificación concreta con la misma fecha de inicio (FR-017, FR-022). */
export class ErrorPlanificacionActivaDuplicada extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorPlanificacionActivaDuplicada');
  }
}

/** Un ejercicio ya está asignado al mismo día de la misma planificación (FR-021). */
export class ErrorEjercicioDuplicadoEnDia extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorEjercicioDuplicadoEnDia');
  }
}

/** GitHub no está disponible o no hay conexión durante una sincronización (CL4, FR-032). */
export class ErrorRedSincronizacion extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorRedSincronizacion');
  }
}

/** El token de GitHub no es válido o no tiene permisos suficientes. */
export class ErrorAutenticacionGitHub extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorAutenticacionGitHub');
  }
}

/** El SHA remoto cambió entre la lectura y la escritura durante una sincronización. */
export class ErrorConflictoRemoto extends ErrorDominio {
  constructor(mensaje: string) {
    super(mensaje, 'ErrorConflictoRemoto');
  }
}

/** La autorización de Google ha caducado, se ha revocado o no se ha concedido. */
export class ErrorAutorizacionGoogle extends ErrorDominio {
  constructor(mensaje = 'La conexión con Google requiere que vuelvas a conectar tu cuenta.') {
    super(mensaje, 'ErrorAutorizacionGoogle');
  }
}

/** La persona cerró la ventana de Google o no concedió el permiso solicitado. */
export class ErrorConexionCancelada extends ErrorDominio {
  constructor(mensaje = 'La conexión no se ha completado. Tus datos no han cambiado. Puedes volver a intentarlo.') {
    super(mensaje, 'ErrorConexionCancelada');
  }
}

/** El navegador impidió abrir la ventana de autorización de Google. */
export class ErrorVentanaBloqueada extends ErrorDominio {
  constructor(mensaje = 'Tu navegador ha bloqueado la ventana de Google. Permítela e inténtalo de nuevo.') {
    super(mensaje, 'ErrorVentanaBloqueada');
  }
}
