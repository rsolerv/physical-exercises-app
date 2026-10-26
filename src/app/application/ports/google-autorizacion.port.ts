export abstract class GoogleAutorizacionPort {
  abstract conectar(): Promise<{ correo: string; nombre: string | null }>;

  abstract obtenerTokenAcceso(): Promise<string>;

  abstract desconectar(): Promise<void>;
}
