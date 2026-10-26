import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, InjectionToken } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GoogleAutorizacionPort } from '../../application/ports/google-autorizacion.port';
import {
  ErrorAutorizacionGoogle,
  ErrorConexionCancelada,
  ErrorRedSincronizacion,
  ErrorVentanaBloqueada,
} from '../../domain/errores/errores-dominio';
import { GOOGLE_CLIENT_ID_CONFIG, GOOGLE_DRIVE_APP_DATA_SCOPE } from './google-drive.config';
import { GoogleIdentityCargador, type GoogleIdentityApi, type GoogleTokenResponse } from './google-identity.cargador';

const MARGEN_RENOVACION_MS = 60_000;
const ABOUT_URL = 'https://www.googleapis.com/drive/v3/about';

export const GOOGLE_IDENTITY_CARGADOR = new InjectionToken<GoogleIdentityCargador>(
  'GOOGLE_IDENTITY_CARGADOR',
  { providedIn: 'root', factory: () => inject(GoogleIdentityCargador) },
);

@Injectable({ providedIn: 'root' })
export class GoogleIdentityAutorizacion extends GoogleAutorizacionPort {
  private readonly http = inject(HttpClient);
  private readonly cargador = inject(GOOGLE_IDENTITY_CARGADOR);
  private readonly clientId = inject(GOOGLE_CLIENT_ID_CONFIG);
  private tokenAcceso: string | null = null;
  private caducaEn = 0;
  private correoConectado: string | null = null;

  async conectar(): Promise<{ correo: string; nombre: string | null }> {
    this.comprobarClientId();
    const api = await this.cargarApi();
    const respuesta = await this.solicitarToken(api, 'select_account');
    this.guardarToken(respuesta);

    try {
      const resultado = await firstValueFrom(
        this.http.get<{ user?: { displayName?: string; emailAddress?: string } }>(ABOUT_URL, {
          params: { fields: 'user(displayName,emailAddress)' },
          headers: { Authorization: `Bearer ${this.tokenAcceso}` },
        }),
      );
      const correo = resultado.user?.emailAddress?.trim();
      if (!correo) throw new ErrorAutorizacionGoogle('Google no ha devuelto una cuenta válida.');
      this.correoConectado = correo;
      return { correo, nombre: resultado.user?.displayName ?? null };
    } catch (error) {
      this.limpiarSesion();
      throw this.traducirErrorHttp(error);
    }
  }

  async obtenerTokenAcceso(): Promise<string> {
    if (!this.correoConectado) throw new ErrorAutorizacionGoogle();
    if (this.tokenAcceso && this.caducaEn - Date.now() > MARGEN_RENOVACION_MS) return this.tokenAcceso;

    this.comprobarClientId();
    const api = await this.cargarApi();
    try {
      const respuesta = await this.solicitarToken(api, '', this.correoConectado);
      this.guardarToken(respuesta);
      return this.tokenAcceso!;
    } catch {
      this.limpiarToken();
      throw new ErrorAutorizacionGoogle();
    }
  }

  async desconectar(): Promise<void> {
    const token = this.tokenAcceso;
    this.limpiarSesion();
    if (!token) return;

    try {
      const api = await this.cargarApi();
      api.accounts.oauth2.revoke(token, () => undefined);
    } catch {
      // La revocación remota es de mejor esfuerzo; el token local ya se ha descartado.
    }
  }

  private comprobarClientId(): void {
    if (!this.clientId.trim()) throw new ErrorAutorizacionGoogle('Falta configurar la conexión con Google.');
  }

  private async cargarApi(): Promise<GoogleIdentityApi> {
    try {
      return await this.cargador.cargar();
    } catch {
      throw new ErrorRedSincronizacion('No se ha podido cargar la conexión con Google.');
    }
  }

  private solicitarToken(
    api: GoogleIdentityApi,
    prompt: string,
    loginHint?: string,
  ): Promise<GoogleTokenResponse> {
    return new Promise((resolve, reject) => {
      const client = api.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: GOOGLE_DRIVE_APP_DATA_SCOPE,
        ...(loginHint ? { login_hint: loginHint } : {}),
        callback: (respuesta) => {
          if (respuesta.error) {
            reject(this.traducirErrorVentana(respuesta.error));
            return;
          }
          if (
            !respuesta.access_token ||
            !api.accounts.oauth2.hasGrantedAllScopes(respuesta, GOOGLE_DRIVE_APP_DATA_SCOPE)
          ) {
            reject(new ErrorConexionCancelada());
            return;
          }
          resolve(respuesta);
        },
        error_callback: (error) => reject(this.traducirErrorVentana(error.type)),
      });

      try {
        client.requestAccessToken({ prompt });
      } catch (error) {
        const tipo = error instanceof Error ? error.message : '';
        reject(this.traducirErrorVentana(tipo));
      }
    });
  }

  private traducirErrorVentana(tipo: string): Error {
    if (tipo === 'popup_closed' || tipo === 'access_denied') return new ErrorConexionCancelada();
    if (tipo === 'popup_failed_to_open') return new ErrorVentanaBloqueada();
    return new ErrorAutorizacionGoogle();
  }

  private guardarToken(respuesta: GoogleTokenResponse): void {
    const segundos = Number(respuesta.expires_in);
    if (!respuesta.access_token || !Number.isFinite(segundos) || segundos <= 0) {
      throw new ErrorAutorizacionGoogle();
    }
    this.tokenAcceso = respuesta.access_token;
    this.caducaEn = Date.now() + segundos * 1000;
  }

  private limpiarToken(): void {
    this.tokenAcceso = null;
    this.caducaEn = 0;
  }

  private limpiarSesion(): void {
    this.limpiarToken();
    this.correoConectado = null;
  }

  private traducirErrorHttp(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error : new ErrorAutorizacionGoogle();
    }
    if (error.status === 0 || error.status === 429 || error.status >= 500) {
      return new ErrorRedSincronizacion('No se ha podido conectar con Google. Comprueba la conexión e inténtalo de nuevo.');
    }
    return new ErrorAutorizacionGoogle();
  }
}
